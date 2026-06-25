import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, ArrowLeftRight } from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES } from '../services/translateService';

interface LanguageSelectorProps {
  sourceLang: string;
  targetLang: string;
  setSourceLang: (code: string) => void;
  setTargetLang: (code: string) => void;
  onSwap: () => void;
}

export default function LanguageSelector({
  sourceLang,
  targetLang,
  setSourceLang,
  setTargetLang,
  onSwap
}: LanguageSelectorProps) {
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isTargetOpen, setIsTargetOpen] = useState(false);

  const sourceRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setIsSourceOpen(false);
      }
      if (targetRef.current && !targetRef.current.contains(event.target as Node)) {
        setIsTargetOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSource = SUPPORTED_LANGUAGES.find(lang => lang.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  const selectedTarget = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLang) || SUPPORTED_LANGUAGES[1];

  // Filters languages, preventing source 'auto' to be in targeted languages
  const filteredSourceLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
    (lang.nativeName && lang.nativeName.toLowerCase().includes(sourceSearch.toLowerCase()))
  );

  const filteredTargetLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.code !== 'auto' && (
      lang.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
      (lang.nativeName && lang.nativeName.toLowerCase().includes(targetSearch.toLowerCase()))
    )
  );

  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-3 md:gap-4 select-none">
      {/* Source Language Selector */}
      <div className="w-full relative" ref={sourceRef} id="source-language-dropdown">
        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
          Source Language
        </label>
        <button
          onClick={() => {
            setIsSourceOpen(!isSourceOpen);
            setIsTargetOpen(false);
            setSourceSearch('');
          }}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl border border-slate-250/20 dark:border-white/10 backdrop-blur-md bg-white/35 dark:bg-white/5 hover:bg-white/55 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-sm active:scale-[0.99] transition-all duration-200"
        >
          <span className="flex items-center gap-2.5 font-medium text-zinc-800 dark:text-zinc-200">
            <span className="text-xl leading-none">{selectedSource.flag || '🌐'}</span>
            <span>{selectedSource.name} {selectedSource.nativeName && selectedSource.nativeName !== selectedSource.name && (
              <span className="text-xs text-zinc-400 font-normal">({selectedSource.nativeName})</span>
            )}</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isSourceOpen ? 'rotate-180' : ''}`} />
        </button>

        {isSourceOpen && (
          <div className="absolute z-30 left-0 right-0 mt-2 p-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl max-h-72 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative mb-2 flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                placeholder="Search languages..."
                className="w-full py-2.5 pl-9 pr-4 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800/70 border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-zinc-800 dark:text-zinc-200"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-48 pr-1 space-y-0.5">
              {filteredSourceLanguages.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-400 font-medium">
                  No languages found
                </div>
              ) : (
                filteredSourceLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSourceLang(lang.code);
                      setIsSourceOpen(false);
                    }}
                    className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                      sourceLang === lang.code
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-lg leading-none">{lang.flag || '🌐'}</span>
                      <span>{lang.name}</span>
                    </span>
                    {sourceLang === lang.code && <Check className="w-4 h-4 text-indigo-500" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Swap Button */}
      <div className="relative mt-2.5 md:mt-5">
        <button
          onClick={onSwap}
          id="swap-languages-btn"
          disabled={sourceLang === 'auto'}
          aria-label="Swap core translation languages"
          className={`p-3.5 rounded-xl border backdrop-blur-md cursor-pointer flex items-center justify-center transition-all duration-200 ${
            sourceLang === 'auto'
              ? 'bg-zinc-200/50 dark:bg-white/5 border-zinc-200/20 dark:border-white/5 text-zinc-350 dark:text-zinc-650 cursor-not-allowed scale-90'
              : 'border-slate-200/30 dark:border-white/10 bg-indigo-500 hover:bg-indigo-600 hover:shadow-indigo-500/20 hover:shadow-lg text-white hover:rotate-180 active:scale-90 scale-100'
          }`}
          title={sourceLang === 'auto' ? "Can't swap with 'Auto Detect'" : "Swap languages"}
        >
          <ArrowLeftRight className="w-4.5 h-4.5 rotate-90 md:rotate-0" />
        </button>
      </div>

      {/* Target Language Selector */}
      <div className="w-full relative" ref={targetRef} id="target-language-dropdown">
        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
          Target Language
        </label>
        <button
          onClick={() => {
            setIsTargetOpen(!isTargetOpen);
            setIsSourceOpen(false);
            setTargetSearch('');
          }}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl border border-slate-250/20 dark:border-white/10 backdrop-blur-md bg-white/35 dark:bg-white/5 hover:bg-white/55 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-sm active:scale-[0.99] transition-all duration-200"
        >
          <span className="flex items-center gap-2.5 font-medium text-zinc-800 dark:text-zinc-200">
            <span className="text-xl leading-none">{selectedTarget.flag || '🌐'}</span>
            <span>{selectedTarget.name} {selectedTarget.nativeName && selectedTarget.nativeName !== selectedTarget.name && (
              <span className="text-xs text-zinc-400 font-normal">({selectedTarget.nativeName})</span>
            )}</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isTargetOpen ? 'rotate-180' : ''}`} />
        </button>

        {isTargetOpen && (
          <div className="absolute z-30 left-0 right-0 mt-2 p-2 rounded-xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl max-h-72 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative mb-2 flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
                placeholder="Search languages..."
                className="w-full py-2.5 pl-9 pr-4 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800/70 border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-zinc-800 dark:text-zinc-200"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 max-h-48 pr-1 space-y-0.5">
              {filteredTargetLanguages.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-400 font-medium">
                  No languages found
                </div>
              ) : (
                filteredTargetLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setTargetLang(lang.code);
                      setIsTargetOpen(false);
                    }}
                    className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                      targetLang === lang.code
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-lg leading-none">{lang.flag || '🌐'}</span>
                      <span>{lang.name}</span>
                    </span>
                    {targetLang === lang.code && <Check className="w-4 h-4 text-indigo-500" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
