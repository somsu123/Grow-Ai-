'use client';

import { useState, useCallback } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useFileUpload } from '@/hooks/useFileUpload';
import { uploadCSV, extractCRMDataStreaming } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { UploadZone } from '@/components/upload/UploadZone';
import { PreviewPage } from '@/components/preview/PreviewPage';
import { ResultsPage } from '@/components/results/ResultsPage';
import { ProcessingOverlay } from '@/components/shared/ProcessingOverlay';
import { HistoryPage } from '@/components/history/HistoryPage';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { AppStep, ParsedCSV, ExtractResponse } from '@/types';

export default function Home() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const fileUpload = useFileUpload();

  const [step, setStep] = useState<AppStep>('upload');
  const [previewData, setPreviewData] = useState<ParsedCSV | null>(null);
  const [resultsData, setResultsData] = useState<ExtractResponse | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  // Step 1: Upload file and get preview
  const handleUpload = useCallback(async (file: File) => {
    try {
      setStep('upload');
      setPreviewData(null);
      setResultsData(null);
      setCurrentFilename(file.name);

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

  // Step 2: Confirm and process with AI (streaming — real per-batch progress)
  const handleConfirmImport = useCallback(async () => {
    if (!previewData) return;

    try {
      setProcessingProgress(5);
      setStep('processing');

      const response = await extractCRMDataStreaming(
        previewData.rows,
        (batchIndex, totalBatches) => {
          const pct = Math.round(((batchIndex + 1) / totalBatches) * 95);
          setProcessingProgress(pct);
        },
        currentFilename  // pass filename so backend saves it in DB
      );

      setProcessingProgress(100);

      setTimeout(() => {
        setResultsData(response);
        setStep('results');
        if (response.totalImported > 0) {
          const savedMsg = response.sessionId ? ` (Session #${response.sessionId} saved)` : '';
          toast.success(`Successfully imported ${response.totalImported} leads!${savedMsg}`);
        }
        if (response.totalSkipped > 0) {
          toast.warning(`${response.totalSkipped} rows were skipped`);
        }
      }, 400);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI extraction failed';
      toast.error(message);
      setStep('preview');
    }
  }, [previewData, currentFilename]);

  // Reset to upload new file
  const handleReset = useCallback(() => {
    setStep('upload');
    setPreviewData(null);
    setResultsData(null);
    setProcessingProgress(0);
    setCurrentFilename('');
    setShowHistory(false);
    fileUpload.clearFile();
  }, [fileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    const file = fileUpload.handleDrop(e);
    if (file) handleUpload(file);
  }, [fileUpload, handleUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = fileUpload.handleFileSelect(e);
    if (file) handleUpload(file);
  }, [fileUpload, handleUpload]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onHistory={() => setShowHistory(true)}
        onHome={handleReset}
        showingHistory={showHistory}
      />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* History view */}
          {showHistory ? (
            <HistoryPage onBack={handleReset} />
          ) : (
            <>
              {step !== 'upload' && (
                <StepIndicator step={step} onReset={handleReset} />
              )}

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

              {step === 'preview' && previewData && (
                <PreviewPage
                  data={previewData}
                  onConfirm={handleConfirmImport}
                  onReset={handleReset}
                />
              )}

              {step === 'processing' && (
                <ProcessingOverlay progress={processingProgress} />
              )}

              {step === 'results' && resultsData && (
                <ResultsPage data={resultsData} onReset={handleReset} />
              )}
            </>
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                index <= currentIndex
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {index < currentIndex ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : index + 1}
              </div>
              <span className={`mt-2 text-xs font-medium ${
                index <= currentIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`}>{s.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-2 -mt-5 transition-all duration-500 ${
                index < currentIndex ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button onClick={onReset} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          Start over with a new file
        </button>
      </div>
    </div>
  );
}
