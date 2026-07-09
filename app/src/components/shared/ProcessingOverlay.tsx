/**
 * Processing Overlay Component
 * Full-screen overlay shown during AI extraction
 * Features animated progress bar and status messages
 */

import { Brain, Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: number;
}

export function ProcessingOverlay({ progress }: ProcessingOverlayProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Dynamic status message based on progress
  const getStatusMessage = () => {
    if (clampedProgress < 20) return 'Analyzing CSV structure...';
    if (clampedProgress < 40) return 'Detecting column mappings...';
    if (clampedProgress < 60) return 'Extracting lead data with AI...';
    if (clampedProgress < 80) return 'Validating CRM records...';
    if (clampedProgress < 100) return 'Finalizing results...';
    return 'Complete!';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 max-w-md w-full mx-4 animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
          AI is Mapping Your Leads
        </h2>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-8">
          {getStatusMessage()}
        </p>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 mt-2">
            {Math.round(clampedProgress)}%
          </p>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Processing in batches for optimal accuracy. Large files may take a few minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
