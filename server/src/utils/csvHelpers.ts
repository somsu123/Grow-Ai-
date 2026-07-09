/**
 * CSV helper utilities for validation and sanitization
 */

import { VALID_CRM_STATUSES, VALID_DATA_SOURCES } from '../types';

/**
 * Validate that a string is a valid CRM status
 */
export function isValidCRMStatus(status: string): boolean {
  if (!status) return true; // Empty is allowed
  return VALID_CRM_STATUSES.includes(status as typeof VALID_CRM_STATUSES[number]);
}

/**
 * Normalize a CRM status value to a valid enum
 * Uses fuzzy matching to map common variations
 */
export function normalizeCRMStatus(status: string): string {
  if (!status) return '';
  const upper = status.toUpperCase().trim();

  // Exact match
  if (VALID_CRM_STATUSES.includes(upper as typeof VALID_CRM_STATUSES[number])) {
    return upper;
  }

  // Fuzzy mapping — covers all spec-required labels and real-world CRM status variations
  const statusMap: Record<string, string> = {
    // GOOD_LEAD_FOLLOW_UP variants
    'GOOD': 'GOOD_LEAD_FOLLOW_UP',
    'GOOD LEAD': 'GOOD_LEAD_FOLLOW_UP',
    'FOLLOW UP': 'GOOD_LEAD_FOLLOW_UP',
    'FOLLOWUP': 'GOOD_LEAD_FOLLOW_UP',
    'FOLLOW-UP': 'GOOD_LEAD_FOLLOW_UP',
    'HOT': 'GOOD_LEAD_FOLLOW_UP',
    'HOT LEAD': 'GOOD_LEAD_FOLLOW_UP',
    'WARM': 'GOOD_LEAD_FOLLOW_UP',
    'WARM LEAD': 'GOOD_LEAD_FOLLOW_UP',
    'INTERESTED': 'GOOD_LEAD_FOLLOW_UP',
    'QUALIFIED': 'GOOD_LEAD_FOLLOW_UP',
    'OPEN': 'GOOD_LEAD_FOLLOW_UP',
    'NEW': 'GOOD_LEAD_FOLLOW_UP',
    'ACTIVE': 'GOOD_LEAD_FOLLOW_UP',
    'IN PROGRESS': 'GOOD_LEAD_FOLLOW_UP',
    'MEETING SCHEDULED': 'GOOD_LEAD_FOLLOW_UP',
    'MEETING DONE': 'GOOD_LEAD_FOLLOW_UP',
    'SITE VISIT': 'GOOD_LEAD_FOLLOW_UP',
    'PROPOSAL SENT': 'GOOD_LEAD_FOLLOW_UP',
    'NEGOTIATION': 'GOOD_LEAD_FOLLOW_UP',
    'CALLBACK': 'GOOD_LEAD_FOLLOW_UP',
    'CALL BACK': 'GOOD_LEAD_FOLLOW_UP',
    'DEMO SCHEDULED': 'GOOD_LEAD_FOLLOW_UP',
    'DEMO DONE': 'GOOD_LEAD_FOLLOW_UP',
    'MEETING FIXED': 'GOOD_LEAD_FOLLOW_UP',
    'POSITIVE': 'GOOD_LEAD_FOLLOW_UP',
    'ENGAGED': 'GOOD_LEAD_FOLLOW_UP',
    'PROSPECT': 'GOOD_LEAD_FOLLOW_UP',

    // DID_NOT_CONNECT variants
    'DNC': 'DID_NOT_CONNECT',
    'DID NOT CONNECT': 'DID_NOT_CONNECT',
    'NO ANSWER': 'DID_NOT_CONNECT',
    'NOT REACHABLE': 'DID_NOT_CONNECT',
    'UNREACHABLE': 'DID_NOT_CONNECT',
    'BUSY': 'DID_NOT_CONNECT',
    'CALLBACK REQUESTED': 'DID_NOT_CONNECT',
    'CALL LATER': 'DID_NOT_CONNECT',
    'NUMBER NOT REACHABLE': 'DID_NOT_CONNECT',
    'SWITCHED OFF': 'DID_NOT_CONNECT',
    'NOT PICKED': 'DID_NOT_CONNECT',
    'RNR': 'DID_NOT_CONNECT',
    'VOICEMAIL': 'DID_NOT_CONNECT',
    'NO RESPONSE': 'DID_NOT_CONNECT',
    'UNAVAILABLE': 'DID_NOT_CONNECT',

    // BAD_LEAD variants
    'BAD': 'BAD_LEAD',
    'BAD LEAD': 'BAD_LEAD',
    'NOT INTERESTED': 'BAD_LEAD',
    'COLD LEAD': 'BAD_LEAD',
    'REJECTED': 'BAD_LEAD',
    'JUNK': 'BAD_LEAD',
    'INVALID': 'BAD_LEAD',
    'DISQUALIFIED': 'BAD_LEAD',
    'LOST': 'BAD_LEAD',
    'SPAM': 'BAD_LEAD',
    'DND': 'BAD_LEAD',
    'DO NOT CALL': 'BAD_LEAD',
    'DO NOT DISTURB': 'BAD_LEAD',
    'WRONG NUMBER': 'BAD_LEAD',
    'DISCONNECTED': 'BAD_LEAD',
    'UNSUBSCRIBED': 'BAD_LEAD',
    'CANCELLED': 'BAD_LEAD',
    'COLD': 'BAD_LEAD',

    // SALE_DONE variants
    'SALE': 'SALE_DONE',
    'SOLD': 'SALE_DONE',
    'CLOSED': 'SALE_DONE',
    'CLOSED WON': 'SALE_DONE',
    'WON': 'SALE_DONE',
    'DEAL CLOSED': 'SALE_DONE',
    'DEAL DONE': 'SALE_DONE',
    'CONVERTED': 'SALE_DONE',
    'BOOKED': 'SALE_DONE',
    'AGREEMENT DONE': 'SALE_DONE',
    'REGISTRATION DONE': 'SALE_DONE',
    'PAYMENT RECEIVED': 'SALE_DONE',
  };

  // Exact map lookup
  if (statusMap[upper]) return statusMap[upper];

  // Substring / keyword fallback — ORDER MATTERS: more specific patterns first
  // BAD_LEAD: check "NOT INTEREST" before "INTEREST" to avoid false GOOD_LEAD match
  if (upper.includes('NOT INTEREST') || upper.includes('JUNK') || upper.includes('WRONG') ||
      upper.includes('DND') || upper.includes('DO NOT') || upper.includes('SPAM') ||
      upper.includes('UNSUB') || upper.includes('LOST') || upper.includes('DISQUALIF') ||
      upper.includes('REJECT')) {
    return 'BAD_LEAD';
  }
  if (upper.includes('NOT CONNECT') || upper.includes('NOT REACH') || upper.includes('NO ANSWER') ||
      upper.includes('BUSY') || upper.includes('SWITCH') || upper.includes('RNR') ||
      upper.includes('VOICEMAIL') || upper.includes('NO RESPONSE')) {
    return 'DID_NOT_CONNECT';
  }
  if (upper.includes('FOLLOW') || upper.includes('HOT') || upper.includes('WARM') ||
      upper.includes('INTERESTED') || upper.includes('CALLBACK') || upper.includes('DEMO') ||
      upper.includes('POSITIVE') || upper.includes('ENGAGED') || upper.includes('PROSPECT')) {
    return 'GOOD_LEAD_FOLLOW_UP';
  }
  if (upper.includes('SALE') || upper.includes('SOLD') || upper.includes('BOOK') ||
      upper.includes('CLOSE') || upper.includes('WON') || upper.includes('CONVERT') ||
      upper.includes('PAYMENT') || upper.includes('AGREEMENT')) {
    return 'SALE_DONE';
  }

  return '';
}

/**
 * Validate that a string is a valid data source
 */
export function isValidDataSource(source: string): boolean {
  if (!source) return true; // Empty is allowed
  return VALID_DATA_SOURCES.includes(source as typeof VALID_DATA_SOURCES[number]);
}

/**
 * Normalize a data source value to a valid enum
 */
export function normalizeDataSource(source: string): string {
  if (!source) return '';
  const raw = source.toLowerCase().trim();
  const normalized = raw.replace(/\s+/g, '_');

  // Exact match after normalization
  if (VALID_DATA_SOURCES.includes(normalized as typeof VALID_DATA_SOURCES[number])) {
    return normalized;
  }

  // Keyword substring matching — per spec: "if text *contains* X"
  if (raw.includes('meridian') || raw.includes('tower')) return 'meridian_tower';
  if (raw.includes('eden') || raw.includes('park')) return 'eden_park';
  if (raw.includes('varah') || raw.includes('swamy')) return 'varah_swamy';
  if (raw.includes('sarjapur') || raw.includes('plots')) return 'sarjapur_plots';
  if (raw.includes('leads on demand') || raw.includes('lod') || raw.includes('leads_on_demand')) return 'leads_on_demand';

  return '';
}

/**
 * Normalize a date string to ISO format
 * Returns empty string if unparseable
 */
/**
 * Format a Date object to "YYYY-MM-DD HH:mm:ss"
 */
function formatToSQLDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    ' ',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('');
}

/**
 * Get current date/time as "YYYY-MM-DD HH:mm:ss" fallback
 */
export function getCurrentDateTime(): string {
  return formatToSQLDateTime(new Date());
}

export function normalizeDate(dateStr: string): string {
  // If no date supplied, fall back to current date/time
  if (!dateStr || !dateStr.trim()) return getCurrentDateTime();

  const trimmed = dateStr.trim();

  // ── Pattern 1: YYYY/MM/DD or YYYY-MM-DD (year-first) ──────────────────────
  const ymdMatch = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (ymdMatch) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = ymdMatch;
    const date = new Date(
      parseInt(y), parseInt(m) - 1, parseInt(d),
      parseInt(hh), parseInt(mm), parseInt(ss)
    );
    if (!isNaN(date.getTime())) return formatToSQLDateTime(date);
  }

  // ── Pattern 2: DD/MM/YYYY or DD-MM-YYYY (day-first ambiguity rule) ─────────
  // Per spec: if first value > 12, it MUST be the day → DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const [, p1, p2, y, hh = '0', mm = '0', ss = '0'] = dmyMatch;
    const n1 = parseInt(p1);
    const n2 = parseInt(p2);
    let day: number, month: number;
    if (n1 > 12) {
      // Unambiguously DD/MM/YYYY
      day = n1; month = n2;
    } else if (n2 > 12) {
      // Unambiguously MM/DD/YYYY
      month = n1; day = n2;
    } else {
      // Ambiguous — default to DD/MM/YYYY per spec
      day = n1; month = n2;
    }
    const date = new Date(
      parseInt(y), month - 1, day,
      parseInt(hh), parseInt(mm), parseInt(ss)
    );
    if (!isNaN(date.getTime())) return formatToSQLDateTime(date);
  }

  // ── Pattern 3: Human-readable ("Jan 05 2025", "May 12, 2024", etc.) ────────
  const directDate = new Date(trimmed);
  if (!isNaN(directDate.getTime())) {
    return formatToSQLDateTime(directDate);
  }

  // ── Fallback: return current date/time ────────────────────────────────────
  return getCurrentDateTime();
}

/**
 * Extract email from a string - returns first valid email found
 */
export function extractEmail(text: string): string {
  if (!text) return '';
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : '';
}

/**
 * Extract phone numbers from text
 * Returns the first phone number and any extras
 */
export function extractPhoneNumbers(text: string): { primary: string; extras: string[] } {
  if (!text) return { primary: '', extras: [] };

  // Match various phone patterns
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex) || [];

  // Clean and deduplicate
  const cleaned = [...new Set(matches.map(p => p.replace(/\D/g, '')))].filter(p => p.length >= 7);

  return {
    primary: cleaned[0] || '',
    extras: cleaned.slice(1),
  };
}

/**
 * Sanitize a string value for CSV output
 * Escapes newlines and quotes
 */
export function sanitizeForCSV(value: string): string {
  if (!value) return '';
  return value
    .replace(/\r?\n/g, '\\n')
    .replace(/"/g, '""');
}

/**
 * Detect file encoding from buffer
 * Simple BOM detection for UTF-8, UTF-16LE, UTF-16BE
 */
export function detectEncoding(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf-8'; // UTF-8 BOM
  }
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'utf-16le';
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'utf-16be';
  }
  return 'utf-8';
}
