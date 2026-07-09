/**
 * GrowEasy AI CSV Importer - Main Application
 * 3-step state machine: Upload → Preview → Results
 * Features: Drag & drop, dark mode, CSV preview, AI extraction, responsive design
 */

import { useState, useCallback } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useFileUpload } from '@/hooks/useFileUpload';
import { uploadCSV, extractCRMData } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { UploadZone } from '@/components/upload/UploadZone';
import { PreviewPage } from '@/components/preview/PreviewPage';
import { ResultsPage } from '@/components/results/ResultsPage';
import { ProcessingOverlay } from '@/components/shared/ProcessingOverlay';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { AppStep, ParsedCSV, ExtractResponse } from '@/types';
import './App.css';

export default function App() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const fileUpload = useFileUpload();

  const [step, setStep] = useState<AppStep>('upload');
  const [previewData, setPreviewData] = useState<ParsedCSV | null>(null);
  const [resultsData, setResultsData] = useState<ExtractResponse | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Step 1: Upload file and get preview
  const handleUpload = useCallback(async (file: File) => {
    try {
      setStep('upload');
      setPreviewData(null);
      setResultsData(null);

      const response = await uploadCSV(file);
      setPreviewData(response.preview);
      setStep('preview');
      toast.success(`CSV loaded: ${response.preview.rowCount} rows, ${response.preview.columnCount} columns`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
      fileUpload.clearFile();
    }
  }, [fileUpload]);

  // Step 2: Confirm and process with AI
  const handleConfirmImport = useCallback(async () => {
    if (!previewData) return;

    try {
      setProcessingProgress(0);
      setStep('processing');

      // Simulate progress (since we don't have real-time streaming)
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);

      const response = await extractCRMData(previewData.rows);

      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Small delay to show 100% completion
      setTimeout(() => {
        setResultsData(response);
        setStep('results');

        if (response.totalImported > 0) {
          toast.success(`Successfully imported ${response.totalImported} leads!`);
        }
        if (response.totalSkipped > 0) {
          toast.warning(`${response.totalSkipped} rows were skipped`);
        }
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI extraction failed';
      toast.error(message);
      setStep('preview');
    }
  }, [previewData]);

  // Reset to upload new file
  const handleReset = useCallback(() => {
    setStep('upload');
    setPreviewData(null);
    setResultsData(null);
    setProcessingProgress(0);
    fileUpload.clearFile();
  }, [fileUpload]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    const file = fileUpload.handleDrop(e);
    if (file) {
      handleUpload(file);
    }
  }, [fileUpload, handleUpload]);

  // Handle file select
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = fileUpload.handleFileSelect(e);
    if (file) {
      handleUpload(file);
    }
  }, [fileUpload, handleUpload]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Step Indicator */}
          {step !== 'upload' && (
            <StepIndicator step={step} onReset={handleReset} />
          )}

          {/* Upload Step */}
          {(step === 'upload' || step === 'preview') && (
            <UploadZone
              fileUpload={fileUpload}
              onDrop={handleDrop}
              onDragEnter={fileUpload.handleDragEnter}
              onDragLeave={fileUpload.handleDragLeave}
              onDragOver={fileUpload.handleDragOver}
              onFileSelect={handleFileSelect}
              onClick={fileUpload.handleClick}
              isVisible={step === 'upload'}
            />
          )}

          {/* Preview Step */}
          {step === 'preview' && previewData && (
            <PreviewPage
              data={previewData}
              onConfirm={handleConfirmImport}
              onReset={handleReset}
            />
          )}

          {/* Processing Overlay */}
          {step === 'processing' && (
            <ProcessingOverlay progress={processingProgress} />
          )}

          {/* Results Step */}
          {step === 'results' && resultsData && (
            <ResultsPage
              data={resultsData}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      <Toaster
        position="top-right"
        richColors
        closeButton
        theme={darkMode ? 'dark' : 'light'}
      />
    </div>
  );
}

/**
 * Step indicator showing current progress
 */
function StepIndicator({ step, onReset }: { step: AppStep; onReset: () => void }) {
  const steps: { key: AppStep; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'preview', label: 'Preview' },
    { key: 'processing', label: 'Processing' },
    { key: 'results', label: 'Results' },
  ];

  const currentIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  index <= currentIndex
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {index < currentIndex ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  index <= currentIndex
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 -mt-5 transition-all duration-500 ${
                  index < currentIndex
                    ? 'bg-indigo-600'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Start over with a new file
        </button>
      </div>
    </div>
  );
}
