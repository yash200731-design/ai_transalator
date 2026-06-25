import React from 'react';
import { Languages, Sun, Moon, Sparkles, Cpu, Link2 } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  apiStatus: 'online' | 'offline' | 'fallback' | 'checking';
  apiUrl: string;
}

export default function Header({ darkMode, setDarkMode, apiStatus, apiUrl }: HeaderProps) {
  return (
    <header className="w-full flex items-center justify-between py-4 px-6 rounded-2xl border border-slate-200/40 dark:border-white/10 backdrop-blur-xl bg-white/40 dark:bg-white/5 shadow-md shadow-indigo-500/5 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20">
          <Languages className="w-6 h-6" />
          <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-650 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            Lumina AI
          </h1>
          <p className="text-[10px] text-zinc-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>Powering real-time translation</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* API Connection Indicator */}
        <div 
          className="hidden sm:flex items-center gap-2 py-1.5 px-3 rounded-full text-xs font-medium backdrop-blur-sm bg-white/20 dark:bg-black/20 border border-white/5"
          title={`Active API endpoint: ${apiUrl}`}
        >
          <span className={`w-2 h-2 rounded-full ${
            apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
            apiStatus === 'fallback' ? 'bg-amber-500' :
            apiStatus === 'offline' ? 'bg-rose-500' : 'bg-blue-400 animate-bounce'
          }`} />
          <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
            {apiStatus === 'online' ? 'API Active' :
             apiStatus === 'fallback' ? 'Demo Fallback' :
             apiStatus === 'offline' ? 'API Offline' : 'Checking API...'}
          </span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          id="theme-toggle-btn"
          className="p-3 rounded-xl backdrop-blur-md bg-white/40 dark:bg-zinc-800/40 border border-white/10 dark:border-white/5 text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-white/65 dark:hover:bg-zinc-800/75 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Toggle visual theme"
        >
          {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>
    </header>
  );
}
