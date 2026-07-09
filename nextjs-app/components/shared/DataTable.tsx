'use client';

/**
 * Data Table Component
 * Simple scrollable table with sticky headers, horizontal + vertical scroll, live search.
 * Replaced @tanstack/react-virtual (layout conflicts with thead column widths)
 * with a regular overflow container — works perfectly for CSV previews up to ~5000 rows.
 */

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface DataTableProps {
  headers: string[];
  rows: Record<string, string>[];
  enableSearch?: boolean;
  maxHeight?: number;
}

export function DataTable({
  headers,
  rows,
  enableSearch = true,
  maxHeight = 520,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter rows based on search
  const filteredRows = searchQuery
    ? rows.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : rows;

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  return (
    <div>
      {/* Search bar */}
      {enableSearch && (
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rows..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-slate-400 mt-1 ml-1">
              {filteredRows.length.toLocaleString()} of {rows.length.toLocaleString()} rows
            </p>
          )}
        </div>
      )}

      {/* Scrollable table wrapper */}
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <table
          className="w-full text-left border-collapse"
          style={{ minWidth: 'max-content' }}
        >
          {/* Sticky header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 dark:bg-slate-800">
              {headers.map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 dark:border-slate-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body — all matching rows */}
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  {searchQuery ? 'No rows match your search.' : 'No data available.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${
                    rowIndex % 2 === 0
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/60 dark:bg-slate-800/40'
                  } hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors`}
                >
                  {headers.map(header => (
                    <td
                      key={header}
                      className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ maxWidth: '280px' }}
                      title={row[header] || ''}
                    >
                      {row[header] || (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {searchQuery
            ? `${filteredRows.length.toLocaleString()} of ${rows.length.toLocaleString()} rows`
            : `${rows.length.toLocaleString()} rows total`}
        </p>
      </div>
    </div>
  );
}
