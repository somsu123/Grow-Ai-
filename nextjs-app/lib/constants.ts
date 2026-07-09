/**
 * Application Constants
 */

// API Configuration — Next.js uses NEXT_PUBLIC_ prefix for client-side env vars
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// File upload limits
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/plain'];
export const ALLOWED_FILE_EXTENSIONS = ['.csv', '.txt'];

// UI Configuration
export const PREVIEW_ROW_LIMIT = 100;
export const TABLE_PAGE_SIZE = 50;

// Animation timings
export const ANIMATION_DURATION = 300;
export const STAGGER_DELAY = 20;

// CRM Status colors for badges
export const CRM_STATUS_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  GOOD_LEAD_FOLLOW_UP: { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-950', darkText: 'dark:text-emerald-400' },
  DID_NOT_CONNECT:     { bg: 'bg-amber-50',   text: 'text-amber-700',   darkBg: 'dark:bg-amber-950',   darkText: 'dark:text-amber-400'   },
  BAD_LEAD:            { bg: 'bg-red-50',      text: 'text-red-700',     darkBg: 'dark:bg-red-950',     darkText: 'dark:text-red-400'     },
  SALE_DONE:           { bg: 'bg-blue-50',     text: 'text-blue-700',    darkBg: 'dark:bg-blue-950',    darkText: 'dark:text-blue-400'    },
  '':                  { bg: 'bg-slate-50',    text: 'text-slate-500',   darkBg: 'dark:bg-slate-800',   darkText: 'dark:text-slate-400'   },
};

// CRM Status labels
export const CRM_STATUS_LABELS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: 'Good Lead - Follow Up',
  DID_NOT_CONNECT:     'Did Not Connect',
  BAD_LEAD:            'Bad Lead',
  SALE_DONE:           'Sale Done',
  '':                  'Unknown',
};

// Data source labels
export const DATA_SOURCE_LABELS: Record<string, string> = {
  leads_on_demand: 'Leads On Demand',
  meridian_tower:  'Meridian Tower',
  eden_park:       'Eden Park',
  varah_swamy:     'Varah Swamy',
  sarjapur_plots:  'Sarjapur Plots',
  '':              'Unknown',
};
