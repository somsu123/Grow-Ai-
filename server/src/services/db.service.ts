/**
 * Database Service — SQLite via better-sqlite3
 * Persists import sessions and extracted CRM records.
 * Uses synchronous API (better-sqlite3 is sync by design).
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logger } from '../middleware/logger';
import type { CRMRecord } from '../types';

// ── DB file location ──────────────────────────────────────────────────────
const DATA_DIR = join(process.cwd(), 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = join(DATA_DIR, 'groweasy.db');

// ── Open / create database ────────────────────────────────────────────────
let _db: Database.Database | null = null;

function getDB(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');   // better concurrency
    _db.pragma('foreign_keys = ON');    // enforce FK constraints
    initSchema(_db);
    logger.info('SQLite database initialised', { path: DB_PATH });
  }
  return _db;
}

// ── Schema ────────────────────────────────────────────────────────────────
function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS import_sessions (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      filename            TEXT    NOT NULL,
      imported_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
      total_rows          INTEGER NOT NULL DEFAULT 0,
      total_imported      INTEGER NOT NULL DEFAULT 0,
      total_skipped       INTEGER NOT NULL DEFAULT 0,
      processing_time_ms  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS crm_records (
      id                            INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id                    INTEGER NOT NULL,
      row_order                     INTEGER NOT NULL,
      created_at                    TEXT    DEFAULT '',
      name                          TEXT    DEFAULT '',
      email                         TEXT    DEFAULT '',
      country_code                  TEXT    DEFAULT '',
      mobile_without_country_code   TEXT    DEFAULT '',
      company                       TEXT    DEFAULT '',
      city                          TEXT    DEFAULT '',
      state                         TEXT    DEFAULT '',
      country                       TEXT    DEFAULT '',
      lead_owner                    TEXT    DEFAULT '',
      crm_status                    TEXT    DEFAULT '',
      crm_note                      TEXT    DEFAULT '',
      data_source                   TEXT    DEFAULT '',
      possession_time               TEXT    DEFAULT '',
      description                   TEXT    DEFAULT '',
      FOREIGN KEY (session_id) REFERENCES import_sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_records_session ON crm_records(session_id, row_order);
  `);
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface ImportSession {
  id: number;
  filename: string;
  imported_at: string;
  total_rows: number;
  total_imported: number;
  total_skipped: number;
  processing_time_ms: number;
}

export interface DBRecord extends CRMRecord {
  id: number;
  session_id: number;
  row_order: number;
}

// ── Operations ────────────────────────────────────────────────────────────

/**
 * Create a new import session and insert all CRM records.
 * Returns the session ID.
 */
export function saveImportSession(
  filename: string,
  records: CRMRecord[],
  totalRows: number,
  totalSkipped: number,
  processingTimeMs: number
): number {
  const db = getDB();

  const insertSession = db.prepare(`
    INSERT INTO import_sessions (filename, total_rows, total_imported, total_skipped, processing_time_ms)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertRecord = db.prepare(`
    INSERT INTO crm_records (
      session_id, row_order,
      created_at, name, email, country_code, mobile_without_country_code,
      company, city, state, country, lead_owner, crm_status, crm_note,
      data_source, possession_time, description
    ) VALUES (
      ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  // Run as a transaction — all or nothing
  const transaction = db.transaction(() => {
    const result = insertSession.run(
      filename,
      totalRows,
      records.length,
      totalSkipped,
      processingTimeMs
    );
    const sessionId = result.lastInsertRowid as number;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      insertRecord.run(
        sessionId, i + 1,
        r.created_at, r.name, r.email, r.country_code, r.mobile_without_country_code,
        r.company, r.city, r.state, r.country, r.lead_owner, r.crm_status, r.crm_note,
        r.data_source, r.possession_time, r.description
      );
    }

    return sessionId;
  });

  const sessionId = transaction() as number;
  logger.info('Saved import session to DB', { sessionId, filename, totalImported: records.length });
  return sessionId;
}

/** Get all import sessions, newest first */
export function getAllSessions(): ImportSession[] {
  return getDB()
    .prepare('SELECT * FROM import_sessions ORDER BY id DESC')
    .all() as ImportSession[];
}

/** Get a single session by ID */
export function getSession(id: number): ImportSession | null {
  return (getDB()
    .prepare('SELECT * FROM import_sessions WHERE id = ?')
    .get(id) as ImportSession) ?? null;
}

/** Get all CRM records for a session, in original row order */
export function getRecordsForSession(sessionId: number): DBRecord[] {
  return getDB()
    .prepare('SELECT * FROM crm_records WHERE session_id = ? ORDER BY row_order ASC')
    .all(sessionId) as DBRecord[];
}

/** Get all records for multiple sessions (or all), preserving session+row order */
export function getRecordsForSessions(sessionIds: number[]): DBRecord[] {
  if (sessionIds.length === 0) return [];
  const placeholders = sessionIds.map(() => '?').join(',');
  return getDB()
    .prepare(`SELECT * FROM crm_records WHERE session_id IN (${placeholders}) ORDER BY session_id ASC, row_order ASC`)
    .all(...sessionIds) as DBRecord[];
}

/** Get ALL records across all sessions */
export function getAllRecords(): DBRecord[] {
  return getDB()
    .prepare('SELECT * FROM crm_records ORDER BY session_id ASC, row_order ASC')
    .all() as DBRecord[];
}

/** Delete a specific session (cascade deletes its records) */
export function deleteSession(id: number): boolean {
  const result = getDB().prepare('DELETE FROM import_sessions WHERE id = ?').run(id);
  return result.changes > 0;
}

/** Clear ALL sessions and records */
export function clearAllData(): void {
  const db = getDB();
  db.prepare('DELETE FROM crm_records').run();
  db.prepare('DELETE FROM import_sessions').run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('import_sessions','crm_records')").run();
  logger.info('Cleared all import sessions and records from DB');
}

/** Total record count across all sessions */
export function getTotalRecordCount(): number {
  const row = getDB().prepare('SELECT COUNT(*) as cnt FROM crm_records').get() as { cnt: number };
  return row.cnt;
}
