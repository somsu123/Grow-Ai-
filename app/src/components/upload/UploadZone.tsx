/**
 * Upload Zone Component
 * Drag and drop file upload with visual feedback
 * Shows file info when a file is selected
 */

import { Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import { type UseFileUploadReturn } from '@/hooks/useFileUpload';

interface UploadZoneProps {
  fileUpload: UseFileUploadReturn;
  onDrop: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: () => void;
  isVisible: boolean;
}

export function UploadZone({
  fileUpload,
  onDrop,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onFileSelect,
  onClick,
  isVisible,
}: UploadZoneProps) {
  if (!isVisible) return null;

  const { file, isDragging, error, inputRef } = fileUpload;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
          Import Your Leads
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Upload any CSV and let AI map it to your CRM
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onClick={!file ? onClick : undefined}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.02] shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20'
            : error
            ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
            : file
            ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
        style={{ minHeight: '320px' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        }}
        aria-label="Upload CSV file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          onChange={onFileSelect}
          className="hidden"
          aria-label="File input"
        />

        <div className="flex flex-col items-center justify-center p-8 sm:p-12 h-full">
          {file ? (
            <FileSelectedView file={file} onClear={fileUpload.clearFile} />
          ) : (
            <EmptyStateView isDragging={isDragging} error={error} />
          )}
        </div>
      </div>

      {/* Supported formats hint */}
      <div className="mt-4 text-center">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Supports: Facebook Leads, Google Ads, Excel exports, Real Estate CRMs, and any CSV format
        </p>
      </div>
    </div>
  );
}

/**
 * Empty state - no file selected
 */
function EmptyStateView({ isDragging, error }: { isDragging: boolean; error: string | null }) {
  return (
    <>
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
          isDragging
            ? 'bg-indigo-100 dark:bg-indigo-900 scale-110'
            : error
            ? 'bg-red-100 dark:bg-red-900'
            : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30'
        }`}
      >
        {error ? (
          <AlertCircle className="w-8 h-8 text-red-500" />
        ) : (
          <Upload
            className={`w-8 h-8 transition-colors duration-300 ${
              isDragging ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'
            }`}
          />
        )}
      </div>

      {error ? (
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-medium mb-1">{error}</p>
          <p className="text-sm text-slate-400">Click to try again</p>
        </div>
      ) : (
        <>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">
            {isDragging ? 'Drop your CSV file here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            CSV files up to 10MB
          </p>
        </>
      )}
    </>
  );
}

/**
 * File selected state - show file info
 */
function FileSelectedView({ file, onClear }: { file: File; onClear: () => void }) {
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);

  return (
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-2xl flex items-center justify-center mb-4 mx-auto">
        <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>

      <p className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">{file.name}</p>
      <p className="text-sm text-slate-400 mb-4">{sizeMB} MB</p>

      <div className="flex items-center gap-3 justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // The parent will handle upload via the file state
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          Upload File
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Remove file"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
