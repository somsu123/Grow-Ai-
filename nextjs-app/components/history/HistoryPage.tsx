'use client';

/**
 * History Page Component
 * Shows all past import sessions with:
 * - Session list with checkboxes for selection
 * - Export Selected / Export All CSV buttons
 * - Delete individual session
 * - Clear All database button
 */

import { useState, useEffect, useCallback } from 'react';
import {
  History,
  Download,
  Trash2,
  RefreshCw,
  CheckSquare,
  Square,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Database,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ImportSession {
  id: number;
  filename: string;
  imported_at: string;
  total_rows: number;
  total_imported: number;
  total_skipped: number;
  processing_time_ms: number;
}

interface HistoryPageProps {
  onBack: () => void;
}

export function HistoryPage({ onBack }: HistoryPageProps) {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history`);
      const json = await res.json();
      if (json.success) {
        setSessions(json.data.sessions);
        setTotalRecords(json.data.totalRecords);
      }
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s => s.id)));
    }
  };

  const exportSelected = () => {
    if (selectedIds.size === 0) { toast.warning('Select at least one session'); return; }
    const ids = Array.from(selectedIds).join(',');
    window.open(`${API_BASE}/history/export?sessions=${ids}`, '_blank');
  };

  const exportAll = () => {
    if (sessions.length === 0) { toast.warning('No sessions to export'); return; }
    window.open(`${API_BASE}/history/export?all=true`, '_blank');
  };

  const deleteSession = async (id: number, filename: string) => {
    if (!confirm(`Delete import session "${filename}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Session deleted');
        setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        fetchHistory();
      } else {
        toast.error(json.error || 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear ALL import history? All records will be permanently deleted.')) return;
    setClearing(true);
    try {
      const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('All history cleared');
        setSessions([]);
        setTotalRecords(0);
        setSelectedIds(new Set());
      } else {
        toast.error(json.error || 'Failed to clear');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return isoStr; }
  };

  const allSelected = sessions.length > 0 && selectedIds.size === sessions.length;

  return (
    <div className="animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import History</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} · {totalRecords.toLocaleString()} total records saved
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchHistory} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportSelected} className="gap-1.5"
            disabled={selectedIds.size === 0}>
            <Download className="w-3.5 h-3.5" />
            Export Selected ({selectedIds.size})
          </Button>
          <Button variant="outline" size="sm" onClick={exportAll} className="gap-1.5 text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
            disabled={sessions.length === 0}>
            <Download className="w-3.5 h-3.5" />
            Export All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}
            disabled={sessions.length === 0 || clearing}
            className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Clear All
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Database className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">No import history yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Upload and process a CSV file to see it here.
          </p>
          <Button onClick={onBack} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white">
            Import a CSV
          </Button>
        </div>
      ) : (
        /* Sessions table */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Select-all header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              {allSelected
                ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                : <Square className="w-4 h-4" />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {selectedIds.size} selected
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map(session => (
              <SessionRow
                key={session.id}
                session={session}
                selected={selectedIds.has(session.id)}
                onToggle={() => toggleSelect(session.id)}
                onDelete={() => deleteSession(session.id, session.filename)}
                onExport={() => window.open(`${API_BASE}/history/export?sessions=${session.id}`, '_blank')}
                expanded={expandedId === session.id}
                onExpand={() => setExpandedId(expandedId === session.id ? null : session.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Single session row with expand, select, export, delete */
function SessionRow({
  session, selected, onToggle, onDelete, onExport, expanded, onExpand, formatDate,
}: {
  session: ImportSession;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onExport: () => void;
  expanded: boolean;
  onExpand: () => void;
  formatDate: (s: string) => string;
}) {
  const successRate = session.total_rows > 0
    ? Math.round((session.total_imported / session.total_rows) * 100)
    : 0;

  return (
    <div className={`transition-colors ${selected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <button onClick={onToggle} className="shrink-0 text-slate-400 hover:text-indigo-600 transition-colors">
          {selected
            ? <CheckSquare className="w-4 h-4 text-indigo-600" />
            : <Square className="w-4 h-4" />}
        </button>

        {/* Expand toggle */}
        <button onClick={onExpand} className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* File icon + name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {session.filename}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(session.imported_at)}
              </span>
              <span className="text-xs text-slate-400">
                {(session.processing_time_ms / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-center">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{session.total_imported}</p>
            <p className="text-xs text-slate-400">Imported</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-red-500 dark:text-red-400">{session.total_skipped}</p>
            <p className="text-xs text-slate-400">Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{successRate}%</p>
            <p className="text-xs text-slate-400">Success</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onExport}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
            title="Export this session as CSV">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            title="Delete this session">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Expanded: record preview */}
      {expanded && (
        <SessionRecordsPreview sessionId={session.id} />
      )}
    </div>
  );
}

/** Lazy-loaded record preview for an expanded session */
function SessionRecordsPreview({ sessionId }: { sessionId: number }) {
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/history/${sessionId}/records`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setRecords(json.data.records);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const SHOW_COLS = ['name', 'email', 'mobile_without_country_code', 'company', 'city', 'crm_status', 'data_source'];

  return (
    <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 mt-1 pt-3">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">No records in this session</p>
      ) : (
        <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap">#</th>
                {SHOW_COLS.map(col => (
                  <th key={col} className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap uppercase tracking-wider">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {records.map((rec, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
                  <td className="px-3 py-1.5 text-slate-400">{rec.row_order}</td>
                  {SHOW_COLS.map(col => (
                    <td key={col} className="px-3 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[160px] truncate">
                      {col === 'crm_status' && rec[col] ? (
                        <StatusPill status={rec[col]} />
                      ) : (
                        rec[col] || <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    GOOD_LEAD_FOLLOW_UP: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    DID_NOT_CONNECT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    BAD_LEAD: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    SALE_DONE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  };
  const label: Record<string, string> = {
    GOOD_LEAD_FOLLOW_UP: 'Follow Up',
    DID_NOT_CONNECT: 'DNC',
    BAD_LEAD: 'Bad Lead',
    SALE_DONE: 'Sale Done',
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {label[status] || status}
    </span>
  );
}
