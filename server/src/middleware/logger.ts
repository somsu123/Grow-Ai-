/**
 * Winston logger configuration
 * Structured logging for production debugging and monitoring
 */

import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Development format: human-readable with colors
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Production format: structured JSON for log aggregation
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: config.server.isDev ? 'debug' : 'info',
  defaultMeta: { service: 'groweasy-csv-importer' },
  transports: [
    new winston.transports.Console({
      format: config.server.isDev
        ? combine(colorize(), timestamp(), devFormat)
        : prodFormat,
    }),
  ],
  // In production, you might add file transports:
  // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  // new winston.transports.File({ filename: 'logs/combined.log' }),
});

/**
 * Express request logger middleware
 */
export function requestLogger(req: any, res: any, next: any): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
