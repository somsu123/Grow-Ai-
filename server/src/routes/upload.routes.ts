/**
 * Upload Routes
 * Defines all API endpoints for the CSV importer
 */

import { Router } from 'express';
import multer from 'multer';
import { extname } from 'path';
import { uploadFile, extractData, extractDataStream, healthCheck } from '../controllers/upload.controller';
import { config } from '../config/env';
import { Errors } from '../middleware/errorHandler';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    // Accept CSV files and common variations
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/csv',
      'text/plain',
      'text/x-csv',
    ];
    const allowedExts = ['.csv', '.txt'];

    const ext = extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(Errors.unsupported(`File type "${file.mimetype}" not supported. Please upload a CSV file.`));
    }
  },
});

// Health check
router.get('/health', healthCheck);

// Upload CSV file
router.post('/upload', upload.single('file'), uploadFile);

// Extract CRM data using AI
router.post('/extract', extractData);

// Extract CRM data with SSE streaming (real-time progress per batch)
router.post('/extract/stream', extractDataStream);

export default router;
