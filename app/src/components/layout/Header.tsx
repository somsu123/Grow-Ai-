/**
 * Header Component
 * Fixed header with logo and theme toggle
 */

import { FileSpreadsheet, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Header({ darkMode, toggleDarkMode }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              GrowEasy
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              AI CSV Importer
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="relative w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Sun className={`w-5 h-5 text-amber-500 absolute transition-all duration-300 ${darkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
            <Moon className={`w-5 h-5 text-indigo-400 absolute transition-all duration-300 ${darkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
