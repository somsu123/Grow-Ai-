/**
 * API Client
 * Handles all HTTP communication with the backend
 * Includes error handling, request/response types
 */

import { API_BASE_URL } from './constants';
import type { ApiResponse, UploadResponse, ExtractResponse, CSVRow } from '@/types';

/**
 * Generic API error
 */
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

/**
 * Parse API response and handle errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails: unknown;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      errorDetails = errorData.details;
    } catch {
      // If JSON parsing fails, use status text
    }

    throw new ApiError(errorMessage, response.status, errorDetails);
  }

  const data = await response.json() as ApiResponse<T>;

  if (!data.success) {
    throw new ApiError(data.error || 'Request failed', 500, data.details);
  }

  return data.data as T;
}

/**
 * Upload a CSV file to the server
 */
export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

/**
 * Extract CRM records from parsed CSV data using AI
 */
export async function extractCRMData(csvData: CSVRow[]): Promise<ExtractResponse> {
  const response = await fetch(`${API_BASE_URL}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ csvData }),
  });

  return handleResponse<ExtractResponse>(response);
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
}
