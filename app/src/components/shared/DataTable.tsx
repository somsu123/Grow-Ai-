/**
 * Data Table Component
 * Responsive table with sticky headers, horizontal/vertical scrolling
 * Used for both CSV preview and results display
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TABLE_PAGE_SIZE } from '@/lib/constants';

interface DataTableProps {
  headers: string[];
  rows: Record<string, string>[];
  pageSize?: number;
  enableSearch?: boolean;
  enablePagination?: boolean;
  rowClassName?: (row: Record<string, string>, index: number) => string;
}

export function DataTable({
  headers,
  rows,
  pageSize = TABLE_PAGE_SIZE,
  enableSearch = true,
  enablePagination = true,
  rowClassName,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter rows based on search
  const filteredRows = searchQuery
    ? rows.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : rows;

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = enablePagination
    ? filteredRows.slice(startIndex, startIndex + pageSize)
    : filteredRows;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      {/* Search Bar */}
      {enableSearch && rows.length > 10 && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search rows..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 dark:bg-slate-800">
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap border-b border-slate-200 dark:border-slate-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-12 text-center text-slate-400 dark:text-slate-500"
                >
                  {searchQuery ? 'No matching rows found' : 'No data available'}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`${
                    rowIndex % 2 === 0
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/50 dark:bg-slate-800/30'
                  } hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    rowClassName ? rowClassName(row, startIndex + rowIndex) : ''
                  }`}
                >
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
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

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredRows.length)} of{' '}
            {filteredRows.length.toLocaleString()} rows
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
