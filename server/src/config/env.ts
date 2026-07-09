/**
 * Centralized environment configuration with validation
 * All env vars are read from here - no process.env scattered throughout the codebase
 */

import dotenv from 'dotenv';
import { join } from 'path';

// Load .env from server root
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
  }
  return parsed;
}

export const config = {
  server: {
    port: getEnvNumber('PORT', 3001),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    isDev: getEnvVar('NODE_ENV', 'development') === 'development',
    isProd: getEnvVar('NODE_ENV', 'development') === 'production',
  },
  ollama: {
    baseUrl: getEnvVar('OLLAMA_BASE_URL', 'http://localhost:11434/v1'),
    model: getEnvVar('AI_MODEL', 'llama3.2'),
    maxTokens: getEnvNumber('AI_MAX_TOKENS', 8000),
    batchSize: getEnvNumber('AI_BATCH_SIZE', 10),   // Smaller batches for local models
    maxRetries: getEnvNumber('AI_MAX_RETRIES', 3),
  },
  // Keep 'openai' alias so aiExtractor.service.ts needs no changes
  openai: {
    apiKey: 'ollama',
    model: getEnvVar('AI_MODEL', 'llama3.2'),
    maxTokens: getEnvNumber('AI_MAX_TOKENS', 8000),
    batchSize: getEnvNumber('AI_BATCH_SIZE', 10),
    maxRetries: getEnvNumber('AI_MAX_RETRIES', 3),
  },
  upload: {
    maxFileSizeMB: getEnvNumber('MAX_FILE_SIZE_MB', 10),
    uploadDir: getEnvVar('UPLOAD_DIR', 'uploads'),
  },
} as const;
