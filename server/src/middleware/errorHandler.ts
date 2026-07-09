/**
 * Global error handling middleware
 * Catches all errors and returns structured JSON responses
 * Never leaks internal error details in production
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { config } from '../config/env';

/**
 * Custom application error with status code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error types for consistent error handling
 */
export const Errors = {
  badRequest: (message: string) => new AppError(message, 400),
  unauthorized: (message: string = 'Unauthorized') => new AppError(message, 401),
  forbidden: (message: string = 'Forbidden') => new AppError(message, 403),
  notFound: (message: string = 'Not found') => new AppError(message, 404),
  validation: (message: string) => new AppError(message, 422),
  tooLarge: (message: string = 'File too large') => new AppError(message, 413),
  unsupported: (message: string = 'Unsupported file type') => new AppError(message, 415),
  internal: (message: string = 'Internal server error') => new AppError(message, 500),
  aiError: (message: string = 'AI processing failed') => new AppError(message, 502),
  timeout: (message: string = 'Request timeout') => new AppError(message, 504),
};

/**
 * Global Express error handler
 * Must have 4 parameters to be recognized as error middleware
 */
export function globalErrorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // JSON parse error
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  }

  // Log the full error in development, log safely in production
  if (config.server.isDev) {
    logger.error('Request error', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  } else {
    logger.error('Request error', { message: err.message, statusCode });
  }

  // Don't leak internal details in production for non-operational errors
  if (config.server.isProd && !(err instanceof AppError && err.isOperational)) {
    message = 'Internal server error';
    details = undefined;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.server.isDev && err.stack ? { stack: err.stack } : {}),
    ...(details ? { details } : {}),
  });
}

/**
 * Async handler wrapper - catches errors in async route handlers
 * Eliminates need for try/catch in every route
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(Errors.notFound('Endpoint not found'));
}
