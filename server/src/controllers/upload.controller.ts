/**
 * Upload Controller
 * Handles file upload and AI extraction endpoints
 * Clean separation: controller handles HTTP, delegates to services
 */

import { Request, Response } from 'express';
import { parseCSVFile } from '../services/csvParser.service';
import { extractCRMRecords } from '../services/aiExtractor.service';
import { saveImportSession } from '../services/db.service';
import { ExtractRequest, ExtractResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

/**
 * POST /api/upload
 * Accepts a CSV file upload and returns parsed preview data
 */
export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
    return;
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  logger.info('Processing uploaded file', { originalName, size: req.file.size });

  const startTime = Date.now();
  const parsed = parseCSVFile(filePath);
  const parseTime = Date.now() - startTime;

  logger.info('File parsed successfully', {
    originalName,
    rows: parsed.rowCount,
    columns: parsed.columnCount,
    parseTimeMs: parseTime,
  });

  res.status(200).json({
    success: true,
    data: {
      preview: parsed,
      fileId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    },
  });
});

/**
 * POST /api/extract
 * Accepts parsed CSV data and returns AI-extracted CRM records
 */
export const extractData = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ExtractRequest;

  // Validation
  if (!body.csvData || !Array.isArray(body.csvData) || body.csvData.length === 0) {
    res.status(422).json({
      success: false,
      error: 'Invalid request: csvData must be a non-empty array',
    });
    return;
  }

  // Reasonable limit to prevent abuse
  const MAX_ROWS = 5000;
  if (body.csvData.length > MAX_ROWS) {
    res.status(422).json({
      success: false,
      error: `Too many rows. Maximum allowed is ${MAX_ROWS}. Consider splitting your CSV.`,
    });
    return;
  }

  logger.info('Starting AI extraction', { rowCount: body.csvData.length });

  const startTime = Date.now();

  // Extract records with progress callback
  const result = await extractCRMRecords(body.csvData, (completed, total) => {
    logger.debug('Extraction progress', { completed, total, percent: Math.round((completed / total) * 100) });
  });

  const processingTime = Date.now() - startTime;

  // Persist to SQLite
  const filename = body.filename || 'unknown.csv';
  const sessionId = saveImportSession(
    filename,
    result.records,
    body.csvData.length,
    result.skipped.length,
    processingTime
  );

  const response: ExtractResponse = {
    records: result.records,
    skipped: result.skipped,
    totalImported: result.records.length,
    totalSkipped: result.skipped.length,
    processingTimeMs: processingTime,
    sessionId,
  };

  logger.info('Extraction complete', {
    totalImported: response.totalImported,
    totalSkipped: response.totalSkipped,
    processingTimeMs: processingTime,
    sessionId,
  });

  res.status(200).json({
    success: true,
    data: response,
  });
});

/**
 * POST /api/extract/stream
 * Streams AI extraction progress via Server-Sent Events (SSE).
 * Client receives real-time events per batch:
 *   - { type: 'progress', batchIndex, totalBatches, records, skipped, totalImported, totalSkipped }
 *   - { type: 'done', records, skipped, totalImported, totalSkipped, processingTimeMs }
 *   - { type: 'error', message }
 */
export const extractDataStream = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as ExtractRequest;

  if (!body.csvData || !Array.isArray(body.csvData) || body.csvData.length === 0) {
    res.status(422).json({ success: false, error: 'Invalid request: csvData must be a non-empty array' });
    return;
  }

  const MAX_ROWS = 5000;
  if (body.csvData.length > MAX_ROWS) {
    res.status(422).json({ success: false, error: `Too many rows. Maximum is ${MAX_ROWS}.` });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  logger.info('Starting SSE AI extraction', { rowCount: body.csvData.length });
  const startTime = Date.now();
  const allRecords: import('../types').CRMRecord[] = [];
  const allSkipped: import('../types').AIExtractionResult['skipped'] = [];

  try {
    const { extractCRMRecordsStreaming } = await import('../services/aiExtractor.service');

    await extractCRMRecordsStreaming(
      body.csvData,
      (batchResult, batchIndex, totalBatches) => {
        allRecords.push(...batchResult.records);
        allSkipped.push(...batchResult.skipped);

        sendEvent({
          type: 'progress',
          batchIndex,
          totalBatches,
          totalImported: allRecords.length,
          totalSkipped: allSkipped.length,
          batchRecords: batchResult.records,
          batchSkipped: batchResult.skipped,
        });
      }
    );

    const processingTimeMs = Date.now() - startTime;

    // Persist to SQLite
    const filename = body.filename || 'unknown.csv';
    const sessionId = saveImportSession(
      filename,
      allRecords,
      body.csvData.length,
      allSkipped.length,
      processingTimeMs
    );

    sendEvent({
      type: 'done',
      records: allRecords,
      skipped: allSkipped,
      totalImported: allRecords.length,
      totalSkipped: allSkipped.length,
      processingTimeMs,
      sessionId,
    });

    logger.info('SSE extraction complete', { totalImported: allRecords.length, totalSkipped: allSkipped.length, sessionId });
  } catch (error) {
    logger.error('SSE extraction failed', { error: (error as Error).message });
    sendEvent({ type: 'error', message: (error as Error).message });
  } finally {
    res.end();
  }
};

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});
