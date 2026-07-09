/**
 * History Controller
 * Endpoints for browsing past imports, exporting merged CSVs, and clearing the DB.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';
import {
  getAllSessions,
  getSession,
  getRecordsForSession,
  getRecordsForSessions,
  getAllRecords,
  deleteSession,
  clearAllData,
  getTotalRecordCount,
} from '../services/db.service';

// CSV column order (matches assignment spec exactly)
const CSV_HEADERS = [
  'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
  'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
  'crm_note', 'data_source', 'possession_time', 'description',
];

function escapeCSVField(val: string): string {
  if (!val) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function recordsToCSV(records: Record<string, string>[]): string {
  const rows = records.map(r =>
    CSV_HEADERS.map(h => escapeCSVField(r[h] || '')).join(',')
  );
  return [CSV_HEADERS.join(','), ...rows].join('\n');
}

/**
 * GET /api/history
 * Returns all import sessions (newest first) + total record count.
 */
export const listSessions = asyncHandler(async (_req: Request, res: Response) => {
  const sessions = getAllSessions();
  const totalRecords = getTotalRecordCount();

  res.json({
    success: true,
    data: { sessions, totalRecords },
  });
});

/**
 * GET /api/history/:id/records
 * Returns all CRM records for a specific session, in original row order.
 */
export const getSessionRecords = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid session ID' });
    return;
  }

  const session = getSession(id);
  if (!session) {
    res.status(404).json({ success: false, error: `Session ${id} not found` });
    return;
  }

  const records = getRecordsForSession(id);
  res.json({ success: true, data: { session, records } });
});

/**
 * GET /api/history/export
 * Query params:
 *   - sessions=1,2,3  → export specific sessions merged
 *   - all=true        → export everything
 * Returns a downloadable CSV file.
 */
export const exportRecords = asyncHandler(async (req: Request, res: Response) => {
  const { sessions: sessionsParam, all } = req.query as { sessions?: string; all?: string };

  let records: Record<string, string>[];
  let filename: string;

  if (all === 'true') {
    records = getAllRecords() as unknown as Record<string, string>[];
    filename = `groweasy_all_exports_${new Date().toISOString().split('T')[0]}.csv`;
  } else if (sessionsParam) {
    const ids = sessionsParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (ids.length === 0) {
      res.status(400).json({ success: false, error: 'No valid session IDs provided' });
      return;
    }
    records = getRecordsForSessions(ids) as unknown as Record<string, string>[];
    filename = `groweasy_export_sessions_${ids.join('-')}_${new Date().toISOString().split('T')[0]}.csv`;
  } else {
    res.status(400).json({ success: false, error: 'Provide ?sessions=1,2,3 or ?all=true' });
    return;
  }

  if (records.length === 0) {
    res.status(404).json({ success: false, error: 'No records found for the specified sessions' });
    return;
  }

  const csv = recordsToCSV(records);

  logger.info('Exporting records as CSV', { filename, rowCount: records.length });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

/**
 * DELETE /api/history/:id
 * Delete a specific import session (and its records via CASCADE).
 */
export const deleteImportSession = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: 'Invalid session ID' });
    return;
  }

  const deleted = deleteSession(id);
  if (!deleted) {
    res.status(404).json({ success: false, error: `Session ${id} not found` });
    return;
  }

  logger.info('Deleted import session', { sessionId: id });
  res.json({ success: true, message: `Session ${id} deleted` });
});

/**
 * DELETE /api/history
 * Clear ALL sessions and records from the database.
 */
export const clearDatabase = asyncHandler(async (_req: Request, res: Response) => {
  clearAllData();
  res.json({ success: true, message: 'All import history cleared' });
});
