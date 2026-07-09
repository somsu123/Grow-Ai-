/**
 * CSV Parser Service
 * Handles parsing of uploaded CSV files with support for:
 * - Multiple delimiters (comma, tab, semicolon, pipe)
 * - Various encodings (UTF-8, UTF-16)
 * - Empty files and malformed data
 * - Large file streaming
 */

import { parse } from 'csv-parse/lib/sync';
import { readFileSync, unlinkSync } from 'fs';
import { ParsedCSV, CSVRow } from '../types';
import { detectEncoding, sanitizeForCSV } from '../utils/csvHelpers';
import { logger } from '../middleware/logger';

/**
 * Detect the delimiter used in a CSV file by sampling the first few lines
 */
function detectDelimiter(content: string): string {
  const sample = content.split('\n').slice(0, 5).join('\n');
  const delimiters = [',', '\t', ';', '|'];
  let bestDelimiter = ',';
  let maxCount = 0;

  for (const delimiter of delimiters) {
    const lines = sample.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    // Count occurrences in each line
    const counts = lines.map(line => (line.match(new RegExp(delimiter, 'g')) || []).length);
    const minCount = Math.min(...counts);
    const consistent = counts.every(c => c === counts[0]);

    // Prefer delimiters that appear consistently and frequently
    if (consistent && minCount > maxCount && minCount > 0) {
      maxCount = minCount;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Parse a CSV file and return structured data
 */
export function parseCSVFile(filePath: string): ParsedCSV {
  let rawContent: string;

  try {
    const buffer = readFileSync(filePath);
    const encoding = detectEncoding(buffer);

    // Handle BOM
    let content = buffer.toString(encoding as BufferEncoding);
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.substring(1);
    }

    rawContent = content;
  } catch (error) {
    logger.error('Failed to read CSV file', { filePath, error: (error as Error).message });
    throw new Error(`Failed to read CSV file: ${(error as Error).message}`);
  }

  // Detect delimiter
  const delimiter = detectDelimiter(rawContent);
  logger.debug('Detected CSV delimiter', { delimiter: delimiter === '\t' ? 'TAB' : delimiter });

  // Parse CSV
  let records: CSVRow[];
  let headers: string[];

  try {
    const parseResult = parse(rawContent, {
      delimiter,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      cast: false,                  // Keep everything as strings
      relax_column_count: true,     // Allow rows with fewer/more columns than header
      on_record: (record: CSVRow) => {
        // Remove empty keys and normalize keys
        const cleaned: CSVRow = {};
        for (const [key, value] of Object.entries(record)) {
          const normalizedKey = key.trim().replace(/^\ufeff/, ''); // Remove BOM from key names
          if (normalizedKey) {
            cleaned[normalizedKey] = typeof value === 'string' ? value.trim() : String(value);
          }
        }
        return cleaned;
      },
    });

    records = parseResult;

    // Extract headers from first record
    if (records.length > 0) {
      headers = Object.keys(records[0]);
    } else {
      // Try to get headers from the raw content
      const firstLine = rawContent.split('\n')[0];
      headers = firstLine.split(delimiter).map(h => h.trim().replace(/^\ufeff/, ''));
    }
  } catch (error) {
    logger.error('CSV parse error', { error: (error as Error).message });
    throw new Error(`Failed to parse CSV: ${(error as Error).message}`);
  }

  // Filter out completely empty rows
  const nonEmptyRows = records.filter(row => {
    return Object.values(row).some(v => v && v.trim().length > 0);
  });

  logger.info('CSV parsed successfully', {
    totalRows: nonEmptyRows.length,
    columns: headers.length,
    columnNames: headers,
  });

  // Clean up uploaded file
  try {
    unlinkSync(filePath);
  } catch {
    // Ignore cleanup errors
  }

  return {
    headers,
    rows: nonEmptyRows,
    rowCount: nonEmptyRows.length,
    columnCount: headers.length,
  };
}

/**
 * Parse CSV data directly from a string (used for re-parsing after upload)
 */
export function parseCSVString(content: string): ParsedCSV {
  const delimiter = detectDelimiter(content);

  const records: CSVRow[] = parse(content, {
    delimiter,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: false,
  });

  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  const nonEmptyRows = records.filter(row =>
    Object.values(row).some(v => v && v.trim().length > 0)
  );

  return {
    headers,
    rows: nonEmptyRows,
    rowCount: nonEmptyRows.length,
    columnCount: headers.length,
  };
}

/**
 * Convert CRM records back to CSV string
 */
export function convertToCSV(records: CSVRow[]): string {
  if (records.length === 0) return '';

  const headers = Object.keys(records[0]);
  const csvHeaders = headers.join(',');

  const csvRows = records.map(record => {
    return headers.map(header => {
      const value = record[header] || '';
      const sanitized = sanitizeForCSV(value);
      // Quote values that contain commas, quotes, or newlines
      if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\\n')) {
        return `"${sanitized}"`;
      }
      return sanitized;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}
