/**
 * Results Page Component
 * Displays AI-extracted CRM records with metrics
 * Includes tabs for imported and skipped records
 */

import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Users,
  Clock,
  FileCheck,
  FileX,
} from 'lucide-react';
import type { ExtractResponse, CRMRecord } from '@/types';
import { CRM_STATUS_COLORS, CRM_STATUS_LABELS, DATA_SOURCE_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface ResultsPageProps {
  data: ExtractResponse;
  onReset: () => void;
}

type ResultsTab = 'imported' | 'skipped';

export function ResultsPage({ data, onReset }: ResultsPageProps) {
  const [activeTab, setActiveTab] = useState<ResultsTab>('imported');

  const handleExport = () => {
    // Export imported records as CSV
    const headers = [
      'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code',
      'company', 'city', 'state', 'country', 'lead_owner', 'crm_status',
      'crm_note', 'data_source', 'possession_time', 'description',
    ];

    const csvRows = data.records.map(record =>
      headers.map(h => {
        const val = record[h as keyof CRMRecord] || '';
        // Escape commas and quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    );

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `crm_import_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const processingTimeSec = (data.processingTimeMs / 1000).toFixed(1);

  return (
    <div className="animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<FileCheck className="w-5 h-5" />}
          label="Imported"
          value={data.totalImported}
          color="emerald"
        />
        <MetricCard
          icon={<FileX className="w-5 h-5" />}
          label="Skipped"
          value={data.totalSkipped}
          color="red"
        />
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Total Processed"
          value={data.totalImported + data.totalSkipped}
          color="indigo"
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Processing Time"
          value={`${processingTimeSec}s`}
          color="amber"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('imported')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'imported'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Imported ({data.totalImported.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveTab('skipped')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'skipped'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Skipped ({data.totalSkipped.toLocaleString()})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'imported' ? (
            <ImportedTable records={data.records} />
          ) : (
            <SkippedTable skipped={data.skipped} />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={onReset}
          className="rounded-lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Import Another File
        </Button>
        {data.totalImported > 0 && (
          <Button
            onClick={handleExport}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export as CSV
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Metric card for results summary
 */
function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'emerald' | 'red' | 'indigo' | 'amber';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
    amber: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

/**
 * Table showing imported CRM records
 */
function ImportedTable({ records }: { records: CRMRecord[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const totalPages = Math.ceil(records.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = records.slice(startIndex, startIndex + pageSize);

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <FileX className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">No records were imported</p>
      </div>
    );
  }

  const allHeaders: (keyof CRMRecord)[] = [
    'name', 'email', 'mobile_without_country_code', 'company',
    'city', 'state', 'country', 'crm_status', 'data_source',
  ];

  return (
    <div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 dark:bg-slate-800">
              {allHeaders.map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 dark:border-slate-700"
                >
                  {header.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRecords.map((record, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-slate-50/50 dark:bg-slate-800/30'
                } hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
              >
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                  {record.name || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {record.email || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {record.country_code} {record.mobile_without_country_code || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {record.company || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {record.city || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {record.state || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {record.country || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {record.crm_status ? (
                    <StatusBadge status={record.crm_status} />
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {record.data_source ? (
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {DATA_SOURCE_LABELS[record.data_source] || record.data_source}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, records.length)} of{' '}
            {records.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-400 px-3">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Status badge with appropriate colors
 */
function StatusBadge({ status }: { status: string }) {
  const colors = CRM_STATUS_COLORS[status] || CRM_STATUS_COLORS[''];
  const label = CRM_STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}
    >
      {label}
    </span>
  );
}

/**
 * Table showing skipped rows
 */
function SkippedTable({ skipped }: { skipped: Array<{ rowIndex: number; reason: string; rawData: Record<string, string> }> }) {
  if (skipped.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-12 h-12 text-emerald-300 dark:text-emerald-700 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">No rows were skipped. All records were imported successfully!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
      <table className="w-full text-left">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-100 dark:bg-slate-800">
            <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 dark:border-slate-700">
              Row #
            </th>
            <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 dark:border-slate-700">
              Reason
            </th>
            <th className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              Raw Data
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {skipped.map((item, index) => (
            <tr
              key={index}
              className={`${
                index % 2 === 0
                  ? 'bg-white dark:bg-slate-900'
                  : 'bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {item.rowIndex + 1}
              </td>
              <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 whitespace-nowrap">
                {item.reason}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                <pre className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded overflow-x-auto max-w-[400px]">
                  {JSON.stringify(item.rawData, null, 2)}
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
