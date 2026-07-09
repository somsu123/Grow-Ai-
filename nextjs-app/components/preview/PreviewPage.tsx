'use client'

/**
 * Preview Page Component
 * Shows parsed CSV data in a responsive table
 * Includes summary cards and confirm action
 */

import { useState } from 'react';
import { Table2, Columns, Rows, ArrowRight, AlertTriangle } from 'lucide-react';
import type { ParsedCSV } from '@/types';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';

interface PreviewPageProps {
  data: ParsedCSV;
  onConfirm: () => void;
  onReset: () => void;
}

export function PreviewPage({ data, onConfirm, onReset }: PreviewPageProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [showLargeWarning, setShowLargeWarning] = useState(data.rowCount > 500);

  const handleConfirm = () => {
    setIsConfirming(true);
    onConfirm();
  };

  return (
    <div className="animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          icon={<Rows className="w-5 h-5" />}
          label="Total Rows"
          value={data.rowCount.toLocaleString()}
          color="indigo"
        />
        <SummaryCard
          icon={<Columns className="w-5 h-5" />}
          label="Columns Detected"
          value={data.columnCount.toString()}
          color="emerald"
        />
        <SummaryCard
          icon={<Table2 className="w-5 h-5" />}
          label="Detected Columns"
          value={data.headers.slice(0, 3).join(', ') + (data.headers.length > 3 ? ` +${data.headers.length - 3}` : '')}
          color="amber"
          truncate
        />
      </div>

      {/* Large file warning */}
      {showLargeWarning && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Large file detected ({data.rowCount.toLocaleString()} rows)
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              AI processing may take a few minutes. Please don&apos;t close this page.
            </p>
          </div>
          <button
            onClick={() => setShowLargeWarning(false)}
            className="text-amber-400 hover:text-amber-600 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            CSV Preview
          </h3>
          <span className="text-xs text-slate-400">
            Showing all {data.rowCount.toLocaleString()} rows
          </span>
        </div>
        <DataTable headers={data.headers} rows={data.rows} />
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <p>Review your data above. Click confirm to start AI mapping.</p>
          <p className="text-xs mt-1">AI will intelligently map columns to CRM fields.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onReset}
            className="rounded-lg"
          >
            Upload Different File
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                Confirm Import
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Summary card for stats display
 */
function SummaryCard({
  icon,
  label,
  value,
  color,
  truncate = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'indigo' | 'emerald' | 'amber';
  truncate?: boolean;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold text-slate-900 dark:text-white ${truncate ? 'truncate' : ''}`}>
        {value}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

