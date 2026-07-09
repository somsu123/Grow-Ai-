/**
 * AI Extractor Service — DETERMINISTIC-FIRST architecture
 *
 * Flow:
 *  1. extractFromRawRow() runs on EVERY row in pure code → finds email/phone/date/status/source
 *  2. Rows with neither email nor mobile are skipped immediately (no AI needed)
 *  3. AI is called ONLY for processable rows → semantic fields (name, company, city, notes)
 *  4. normalizeRecord() merges AI output with deterministic values
 *     (deterministic ALWAYS wins for phone, email, date, status, source)
 *  5. AI's "skipped" output is COMPLETELY IGNORED
 */

import OpenAI from 'openai';
import { config } from '../config/env';
import { getOpenAIClient } from '../config/openai';
import {
  CSVRow,
  CRMRecord,
  AIExtractionResult,
} from '../types';
import { withRetry } from '../utils/retry';
import {
  normalizeCRMStatus,
  normalizeDataSource,
  normalizeDate,
  getCurrentDateTime,
} from '../utils/csvHelpers';
import { logger } from '../middleware/logger';

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a CSV-to-CRM data extraction engine for GrowEasy CRM.

## INPUT
A JSON object with a "records" array. Each element is a CSV row object with unpredictable column names.

## OUTPUT
Return ONLY valid JSON (no markdown, no explanation, no code fences):
{
  "results": [
    {
      "created_at": "YYYY-MM-DD HH:mm:ss or null",
      "name": "string or null",
      "email": "lowercase string or null",
      "country_code": "+91 style or null",
      "mobile_without_country_code": "10 digits only or null",
      "company": "string or null",
      "city": "string or null",
      "state": "string or null",
      "country": "string or null",
      "lead_owner": "string or null",
      "crm_status": "GOOD_LEAD_FOLLOW_UP|DID_NOT_CONNECT|BAD_LEAD|SALE_DONE or null",
      "crm_note": "string or empty string",
      "data_source": "leads_on_demand|meridian_tower|eden_park|varah_swamy|sarjapur_plots or empty string",
      "possession_time": "string or empty string",
      "description": "string or empty string"
    }
  ],
  "skipped": []
}

## CRITICAL RULES
1. Return EXACTLY one object in "results" for EVERY row in "records", in the same order.
2. "skipped" MUST always be an empty array [].
3. name: Combine first+last name. Title-case. null if not found.
4. email: Lowercase. If multiple emails separated by ; or , take FIRST only.
5. crm_status: ONLY: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE, or null.
6. data_source: ONLY: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, or "".
7. created_at: Format "YYYY-MM-DD HH:mm:ss". Use "${getCurrentDateTime()}" if unknown.
8. crm_note: Aggregate remarks, comments, notes, extra phones, extra emails.
9. Inspect EVERY key-value pair in EVERY row — column names are unpredictable.

Return ONLY the JSON object.`;
}

function buildUserPrompt(rows: CSVRow[]): string {
  return `INPUT: ${JSON.stringify({ records: rows })}

Return ONLY the JSON. No markdown. No explanation. Start with { end with }`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_KW  = ['email', 'mail', 'e-mail', 'e_mail'];
const PHONE_KW  = ['phone', 'mobile', 'contact', 'whatsapp', 'cell', 'tel', 'number', 'numbers'];
const DATE_KW   = ['timestamp', 'created', 'date', 'time', 'follow_up', 'followup'];
const STATUS_KW = ['status', 'stage', 'disposition', 'progress', 'outcome', 'remarks', 'comments', 'notes'];
const SOURCE_KW = ['source', 'project', 'campaign', 'channel', 'medium', 'origin', 'referral'];

function extractAllEmails(raw: string): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(/[;,|]/)) {
    const m = part.trim().match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (m) out.push(m[0].toLowerCase());
  }
  return out;
}

function extractFirstEmail(raw: string): string {
  return extractAllEmails(raw)[0] || '';
}

function inferCC(digits: string): string {
  return /^[6-9]/.test(digits) ? '+91' : '+1';
}

function parsePhone(raw: string): { cc: string; mobile: string; extras: string[] } {
  if (!raw) return { cc: '', mobile: '', extras: [] };
  const segments = raw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  const results: Array<{ cc: string; mobile: string }> = [];

  for (const seg of segments) {
    const s = seg.replace(/[\s\-().]/g, '');
    if (!s) continue;
    let cc = '', digits = '';

    if (s.startsWith('+')) {
      const d = s.slice(1).replace(/\D/g, '');
      if      (d.length >= 12)                         { cc = `+${d.slice(0, 2)}`; digits = d.slice(2); }
      else if (d.length === 11 && d.startsWith('1'))   { cc = '+1';               digits = d.slice(1); }
      else if (d.length === 11)                         { cc = `+${d.slice(0, 2)}`; digits = d.slice(2); }
      else if (d.length === 10)                         { digits = d; cc = inferCC(d); }
      else if (d.length > 10)                          { cc = `+${d.slice(0, d.length-10)}`; digits = d.slice(-(10)); }
    } else if (s.startsWith('00')) {
      const d = s.slice(2).replace(/\D/g, '');
      if (d.length >= 10) { cc = `+${d.slice(0, d.length-10)}`; digits = d.slice(-(10)); }
    } else {
      const d = s.replace(/\D/g, '');
      if      (d.length > 10)  { cc = `+${d.slice(0, d.length-10)}`; digits = d.slice(-(10)); }
      else if (d.length === 10) { digits = d; cc = inferCC(d); }
    }

    if (digits.length === 10) results.push({ cc, mobile: digits });
  }

  if (!results.length) return { cc: '', mobile: '', extras: [] };
  return {
    cc: results[0].cc,
    mobile: results[0].mobile,
    extras: results.slice(1).map(r => r.cc ? `${r.cc}${r.mobile}` : r.mobile),
  };
}

interface DetResult {
  email:       string;
  extraEmails: string[];
  mobile:      string;
  cc:          string;
  extraPhones: string[];
  created_at:  string;
  crm_status:  CRMRecord['crm_status'];
  data_source: CRMRecord['data_source'];
}

function extractFromRawRow(row: CSVRow): DetResult {
  const result: DetResult = {
    email: '', extraEmails: [],
    mobile: '', cc: '', extraPhones: [],
    created_at: '',
    crm_status: '' as CRMRecord['crm_status'],
    data_source: '' as CRMRecord['data_source'],
  };

  // Emails
  const allEmails: string[] = [];
  for (const [k, v] of Object.entries(row)) {
    if (!v?.trim()) continue;
    if (EMAIL_KW.some(kw => k.toLowerCase().includes(kw))) allEmails.push(...extractAllEmails(v));
  }
  const uEmails = [...new Set(allEmails)];
  if (uEmails.length > 0) { result.email = uEmails[0]; result.extraEmails = uEmails.slice(1); }

  // Phones
  let primarySet = false;
  for (const [k, v] of Object.entries(row)) {
    if (!v?.trim()) continue;
    if (!PHONE_KW.some(kw => k.toLowerCase().includes(kw))) continue;
    const p = parsePhone(v);
    if (!p.mobile) continue;
    if (!primarySet) {
      result.mobile = p.mobile; result.cc = p.cc;
      result.extraPhones.push(...p.extras);
      primarySet = true;
    } else {
      result.extraPhones.push(p.cc ? `${p.cc}${p.mobile}` : p.mobile, ...p.extras);
    }
  }

  // Date
  for (const [k, v] of Object.entries(row)) {
    if (!v?.trim()) continue;
    if (DATE_KW.some(kw => k.toLowerCase().includes(kw)) && /\d{4}|\d{2}[\/\-]\d{2}|[A-Za-z]{3}/.test(v)) {
      const n = normalizeDate(v);
      if (n) { result.created_at = n; break; }
    }
  }

  // CRM Status
  for (const [k, v] of Object.entries(row)) {
    if (!v?.trim()) continue;
    if (STATUS_KW.some(kw => k.toLowerCase().includes(kw))) {
      const n = normalizeCRMStatus(v) as CRMRecord['crm_status'];
      if (n) { result.crm_status = n; break; }
    }
  }

  // Data Source
  for (const [k, v] of Object.entries(row)) {
    if (!v?.trim()) continue;
    if (SOURCE_KW.some(kw => k.toLowerCase().includes(kw))) {
      const n = normalizeDataSource(v) as CRMRecord['data_source'];
      if (n) { result.data_source = n; break; }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD NORMALIZATION — Merge AI + deterministic
// ─────────────────────────────────────────────────────────────────────────────

function normalizeRecord(ai: any, rawRow: CSVRow): CRMRecord {
  const det = extractFromRawRow(rawRow);

  // Deterministic wins for critical fields
  const email       = det.email || extractFirstEmail(String(ai.email ?? ''));
  const mobile      = det.mobile || '';
  const cc          = det.cc || '';
  const created_at  = det.created_at || normalizeDate(String(ai.created_at ?? '')) || getCurrentDateTime();
  const crm_status  = (det.crm_status || normalizeCRMStatus(String(ai.crm_status ?? ''))) as CRMRecord['crm_status'];
  const data_source = (det.data_source || normalizeDataSource(String(ai.data_source ?? ''))) as CRMRecord['data_source'];

  // Aggregate extras into crm_note
  const noteChunks: string[] = [];
  if (det.extraEmails.length > 0) noteChunks.push(`Extra emails: ${det.extraEmails.join(', ')}`);
  if (det.extraPhones.length > 0) noteChunks.push(`Extra numbers: ${det.extraPhones.join(', ')}`);
  const aiNote = ai.crm_note != null ? String(ai.crm_note).replace(/\r?\n/g, '\\n').trim() : '';
  if (aiNote) noteChunks.push(aiNote);

  return {
    created_at,
    name:        ai.name     != null ? String(ai.name).trim()    : '',
    email,
    country_code: cc,
    mobile_without_country_code: mobile,
    company:     ai.company  != null ? String(ai.company).trim() : '',
    city:        ai.city     != null ? String(ai.city).trim()    : '',
    state:       ai.state    != null ? String(ai.state).trim()   : '',
    country:     ai.country  != null ? String(ai.country).trim() : '',
    lead_owner:  ai.lead_owner != null ? String(ai.lead_owner).trim() : '',
    crm_status,
    crm_note: noteChunks.join(' | '),
    data_source,
    possession_time: ai.possession_time != null ? String(ai.possession_time).trim() : '',
    description: ai.description != null ? String(ai.description).replace(/\r?\n/g, '\\n').trim() : '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CALL HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function callAI(client: OpenAI, rows: CSVRow[]): Promise<any[]> {
  try {
    const response = await withRetry(
      async () => client.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user',   content: buildUserPrompt(rows) },
        ],
        temperature: 0.1,
        max_tokens: config.openai.maxTokens,
      }),
      { maxRetries: config.openai.maxRetries, baseDelayMs: 2000, maxDelayMs: 30000 }
    );

    const rawText = response.choices[0]?.message?.content || '';
    if (!rawText) return [];

    let content = rawText.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const fb = content.indexOf('{');
      const lb = content.lastIndexOf('}');
      if (fb !== -1 && lb > fb) parsed = JSON.parse(content.slice(fb, lb + 1));
      else return [];
    }

    const arr = parsed?.results ?? parsed?.records ?? [];
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    logger.warn('AI call failed — deterministic-only fallback', { error: (err as Error).message });
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH PROCESSOR
// ─────────────────────────────────────────────────────────────────────────────

async function processBatch(
  client: OpenAI,
  rows: CSVRow[],
  startIndex: number
): Promise<AIExtractionResult> {
  const validRecords: CRMRecord[] = [];
  const skippedRecords: AIExtractionResult['skipped'] = [];

  // Step 1 — Deterministic pre-screen: find rows with contact info
  const processable: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const det = extractFromRawRow(rows[i]);
    if (det.email || det.mobile) {
      processable.push(i);
    } else {
      skippedRecords.push({
        rowIndex: i + startIndex,
        reason: 'Missing both email and mobile number',
        rawData: rows[i],
      });
    }
  }

  if (processable.length === 0) return { records: [], skipped: skippedRecords };

  // Step 2 — AI call for processable rows only
  const aiRows = processable.map(i => rows[i]);
  const aiResults = await callAI(client, aiRows);
  while (aiResults.length < processable.length) aiResults.push({});

  // Step 3 — Build final records
  for (let j = 0; j < processable.length; j++) {
    const origIdx = processable[j];
    const rawRow  = rows[origIdx];
    try {
      const record = normalizeRecord(aiResults[j] ?? {}, rawRow);
      if (!record.email && !record.mobile_without_country_code) {
        skippedRecords.push({ rowIndex: origIdx + startIndex, reason: 'Missing both email and mobile number', rawData: rawRow });
      } else {
        validRecords.push(record);
      }
    } catch (err) {
      skippedRecords.push({
        rowIndex: origIdx + startIndex,
        reason: `Processing error: ${(err as Error).message}`,
        rawData: rawRow,
      });
    }
  }

  return { records: validRecords, skipped: skippedRecords };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function extractCRMRecords(
  csvData: CSVRow[],
  onProgress?: (completed: number, total: number) => void
): Promise<AIExtractionResult> {
  const client = getOpenAIClient();
  const batchSize = config.openai.batchSize;
  const totalRows = csvData.length;
  const totalBatches = Math.ceil(totalRows / batchSize);

  logger.info('Starting extraction', { totalRows, batchSize, totalBatches });

  const allRecords: CRMRecord[] = [];
  const allSkipped: AIExtractionResult['skipped'] = [];

  for (let b = 0; b < totalBatches; b++) {
    const start = b * batchSize;
    const end   = Math.min(start + batchSize, totalRows);
    const result = await processBatch(client, csvData.slice(start, end), start);
    allRecords.push(...result.records);
    allSkipped.push(...result.skipped);
    if (onProgress) onProgress(end, totalRows);
  }

  logger.info('Extraction complete', { extracted: allRecords.length, skipped: allSkipped.length });
  return { records: allRecords, skipped: allSkipped };
}

export async function extractCRMRecordsStreaming(
  csvData: CSVRow[],
  onBatch: (result: AIExtractionResult, batchIndex: number, totalBatches: number) => void
): Promise<AIExtractionResult> {
  const client = getOpenAIClient();
  const batchSize = config.openai.batchSize;
  const totalBatches = Math.ceil(csvData.length / batchSize);

  const allRecords: CRMRecord[] = [];
  const allSkipped: AIExtractionResult['skipped'] = [];

  for (let b = 0; b < totalBatches; b++) {
    const start = b * batchSize;
    const end   = Math.min(start + batchSize, csvData.length);
    const batchResult = await processBatch(client, csvData.slice(start, end), start);
    allRecords.push(...batchResult.records);
    allSkipped.push(...batchResult.skipped);
    onBatch(batchResult, b, totalBatches);
  }

  return { records: allRecords, skipped: allSkipped };
}


// ─────────────────────────────────────────────────────────────────────────────
// TEST EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robust JSON extractor from LLM output.
 * Handles plain JSON, ```json fenced blocks, JSON buried in prose, truncated fences.
 * Exported for unit testing.
 */
function extractJSONFromText(text: string): string {
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  try { JSON.parse(t); return t; } catch { /* not clean JSON */ }

  const fb = t.indexOf('{'), lb = t.lastIndexOf('}');
  if (fb !== -1 && lb > fb) {
    const c = t.slice(fb, lb + 1);
    try { JSON.parse(c); return c; } catch { /* continue */ }
  }

  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    try { JSON.parse(fenced[1].trim()); return fenced[1].trim(); } catch { /* continue */ }
  }

  return t;
}

export { extractJSONFromText as extractJSONFromTextForTest };
export { extractFromRawRow as extractFromRawRowForTest };

