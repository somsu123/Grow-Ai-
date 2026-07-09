/**
 * CRM Lead Record - The standardized output format for GrowEasy CRM
 */
export interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' | '';
  crm_note: string;
  data_source: 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | '';
  possession_time: string;
  description: string;
}

/**
 * Raw CSV row - key-value pairs from the parsed CSV
 */
export type CSVRow = Record<string, string>;

/**
 * Parsed CSV result containing headers and data rows
 */
export interface ParsedCSV {
  headers: string[];
  rows: CSVRow[];
  rowCount: number;
  columnCount: number;
}

/**
 * AI Extraction result for a single batch
 */
export interface AIExtractionResult {
  records: CRMRecord[];
  skipped: Array<{ rowIndex: number; reason: string; rawData: CSVRow }>;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Upload response containing parsed CSV preview data
 */
export interface UploadResponse {
  preview: ParsedCSV;
  fileId: string;
}

/**
 * Extract request body
 */
export interface ExtractRequest {
  csvData: CSVRow[];
  filename?: string; // Original CSV filename — stored in DB session
}

/**
 * Extract response containing processed CRM records
 */
export interface ExtractResponse {
  records: CRMRecord[];
  skipped: Array<{ rowIndex: number; reason: string; rawData: CSVRow }>;
  totalImported: number;
  totalSkipped: number;
  processingTimeMs: number;
  sessionId?: number; // DB session ID — returned after saving to SQLite
}

/**
 * Valid CRM status values
 */
export const VALID_CRM_STATUSES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;

/**
 * Valid data source values
 */
export const VALID_DATA_SOURCES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
] as const;

/**
 * Target CRM schema fields for AI mapping
 */
export const CRM_TARGET_FIELDS = [
  { field: 'created_at', description: 'Lead creation date - must be convertible via new Date()' },
  { field: 'name', description: 'Full name of the lead person' },
  { field: 'email', description: 'Primary email address' },
  { field: 'country_code', description: 'Phone country code (e.g., +91, +1)' },
  { field: 'mobile_without_country_code', description: 'Mobile number without country code' },
  { field: 'company', description: 'Company or organization name' },
  { field: 'city', description: 'City name' },
  { field: 'state', description: 'State or province' },
  { field: 'country', description: 'Country name' },
  { field: 'lead_owner', description: 'Owner or assignee of the lead (email or name)' },
  { field: 'crm_status', description: 'Lead status - MUST be one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE' },
  { field: 'crm_note', description: 'Notes, remarks, follow-ups, extra emails/phones' },
  { field: 'data_source', description: 'Source - MUST be one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots' },
  { field: 'possession_time', description: 'Property possession timeline' },
  { field: 'description', description: 'Additional description or notes' },
] as const;
