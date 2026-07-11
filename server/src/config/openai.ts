/**
 * Ollama AI client configuration (OpenAI-compatible local API)
 * Runs 100% locally - no API key required
 * Install Ollama from: https://ollama.com
 */

import OpenAI from 'openai';
import { config } from './env';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: 'ollama',            // Ollama accepts any non-empty string
      baseURL: config.ollama.baseUrl,
      maxRetries: 0,               // We handle retries manually
      defaultHeaders: {
        'ngrok-skip-browser-warning': 'true',  // Bypass ngrok interstitial page
      },
    });
  }
  return client;
}

export function resetOpenAIClient(): void {
  client = null;
}
