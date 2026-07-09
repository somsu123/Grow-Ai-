/**
 * Frontend TypeScript Types
 * Mirror of backend types for type-safe API communication
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

export type CSVRow = Record<string, string>;

export interface ParsedCSV {
  headers: string[];
  rows: CSVRow[];
  rowCount: number;
  columnCount: number;
}

export interface UploadResponse {
  preview: ParsedCSV;
  fileId: string;
}

export interface ExtractResponse {
  records: CRMRecord[];
  skipped: Array<{ rowIndex: number; reason: string; rawData: CSVRow }>;
  totalImported: number;
  totalSkipped: number;
  processingTimeMs: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface UploadState {
  file: File | null;
  isDragging: boolean;
  isUploading: boolean;
  error: string | null;
}

export interface PreviewState {
  data: ParsedCSV | null;
  isConfirming: boolean;
}

export interface ResultsState {
  data: ExtractResponse | null;
  activeTab: 'imported' | 'skipped';
}

export type AppStep = 'upload' | 'preview' | 'processing' | 'results';

export interface AppState {
  step: AppStep;
  upload: UploadState;
  preview: PreviewState;
  results: ResultsState;
  darkMode: boolean;
}
