/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

import { config } from './config/env';
import { logger, requestLogger } from './middleware/logger';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import uploadRoutes from './routes/upload.routes';
import historyRoutes from './routes/history.routes';

const app = express();

// Ensure upload directory exists
if (!existsSync(config.upload.uploadDir)) {
  mkdirSync(config.upload.uploadDir, { recursive: true });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
}));

// CORS - allow frontend origin
app.use(cors({
  origin: config.server.isDev
    ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173']
    : true, // In production, configure specific origins
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for AI extraction (expensive operation)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 AI extractions per 15 minutes
  message: {
    success: false,
    error: 'AI extraction limit reached. Please try again later.',
  },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API routes
app.use('/api', uploadRoutes);
app.use('/api/history', historyRoutes);
// Apply AI limiter to extract endpoint
app.use('/api/extract', aiLimiter);

// Health check at root
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'GrowEasy AI CSV Importer API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
