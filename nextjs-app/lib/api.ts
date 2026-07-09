/**
 * API Client
 * Handles all HTTP communication with the backend
 */

import { API_BASE_URL } from './constants';
import type { ApiResponse, UploadResponse, ExtractResponse, CSVRow } from '@/types';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails: unknown;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      errorDetails = errorData.details;
    } catch { /* use status text fallback */ }
    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  const data = (await response.json()) as ApiResponse<T>;
  if (!data.success) {
    throw new ApiError(data.error || 'Request failed', 500, data.details);
  }
  return data.data as T;
}

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: formData });
  return handleResponse<UploadResponse>(response);
}

export async function extractCRMData(csvData: CSVRow[]): Promise<ExtractResponse> {
  const response = await fetch(`${API_BASE_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvData }),
  });
  return handleResponse<ExtractResponse>(response);
}

/**
 * SSE Streaming variant — receives incremental progress per batch.
 * @param onProgress called after each batch: (batchIndex, totalBatches, importedSoFar, skippedSoFar)
 */
export async function extractCRMDataStreaming(
  csvData: CSVRow[],
  onProgress: (batchIndex: number, totalBatches: number, importedSoFar: number, skippedSoFar: number) => void,
  filename?: string
): Promise<ExtractResponse> {
  const response = await fetch(`${API_BASE_URL}/extract/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvData, filename }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Stream request failed: ${response.status}`, response.status, text);
  }

  if (!response.body) throw new ApiError('No response body for streaming');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: ExtractResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events — each ends with \n\n
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const dataLine = part.split('\n').find(l => l.startsWith('data: '));
      if (!dataLine) continue;
      try {
        const event = JSON.parse(dataLine.slice(6)); // strip "data: "
        if (event.type === 'progress') {
          onProgress(event.batchIndex, event.totalBatches, event.totalImported, event.totalSkipped);
        } else if (event.type === 'done') {
          finalResult = {
            records: event.records,
            skipped: event.skipped,
            totalImported: event.totalImported,
            totalSkipped: event.totalSkipped,
            processingTimeMs: event.processingTimeMs,
          };
        } else if (event.type === 'error') {
          throw new ApiError(event.message || 'Streaming extraction failed');
        }
      } catch (parseErr) {
        // Skip malformed SSE lines
      }
    }
  }

  if (!finalResult) throw new ApiError('Stream ended without a done event');
  return finalResult;
}

export async function healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
}
