import React, { useState } from 'react';
import { 
  History as HistoryIcon, Trash, Trash2, ArrowRight, 
  Calendar, Check, Copy, RefreshCw, Search
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../services/translateService';

export interface HistoryItem {
  id: string;
  original: string;
  translated: string;
  source: string;
  target: string;
  timestamp: number;
}

interface HistoryProps {
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function History({
  items,
  onSelectItem,
  onDeleteItem,
  onClearHistory,
  onShowToast
}: HistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  // Handle single item clipboard copy
  const handleCopy = async (e: React.MouseEvent, id: string, text: string) => {
    e.stopPropagation(); // Avoid selecting/triggering item load
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
      onShowToast('Translation copied!', 'success');
    } catch (err) {
      onShowToast('Could not copy text.', 'error');
    }
  };

  const getLanguageName = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.flag || ''} ${lang.name}` : code.toUpperCase();
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return 'Recently';
    }
  };

  // Filter history items by query
  const filteredItems = items.filter(item => 
    item.original.toLowerCase().includes(historySearch.toLowerCase()) ||
    item.translated.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col rounded-2xl border border-slate-200/40 dark:border-white/10 backdrop-blur-xl bg-white/40 dark:bg-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      
      {/* Header bar */}
      <div className="py-4 px-5 flex items-center justify-between border-b border-slate-200/40 dark:border-white/10 bg-white/20 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-purple-500 animate-spin-slow" />
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide uppercase">
            Recent Translations ({items.length})
          </h2>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear all translation history items?')) {
                onClearHistory();
              }
            }}
            id="clear-all-history-btn"
            className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase cursor-pointer tracking-wider flex items-center gap-1 hover:underline"
          >
            <Trash className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center space-y-2">
          <div className="p-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800/50">
            <HistoryIcon className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium">No recent translations</p>
          <p className="text-xs">Your translation history will appear here.</p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-3">
          
          {/* History Search */}
          <div className="relative flex items-center" id="history-search-container">
            <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search history content..."
              className="w-full py-2 pl-9 pr-4 rounded-lg text-xs bg-white/40 dark:bg-zinc-800/40 border border-white/10 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-zinc-700 dark:text-zinc-300"
            />
          </div>

          {/* List area */}
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                No matching history found
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectItem(item);
                    onShowToast('Restored translation from history!', 'info');
                  }}
                  id={`history-item-${item.id}`}
                  className="group relative p-3 rounded-xl border border-slate-200/30 dark:border-white/5 bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 cursor-pointer flex flex-col gap-1.5 transition-all duration-200 hover:scale-[1.005] select-none"
                >
                  {/* Top indicators */}
                  <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1 pr-3 bg-zinc-150/50 dark:bg-zinc-850/50 rounded">
                      <span>{getLanguageName(item.source)}</span>
                      <ArrowRight className="w-2.5 h-2.5 mx-0.5 text-zinc-400" />
                      <span>{getLanguageName(item.target)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[9px]">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  {/* Original text block */}
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium line-clamp-1 break-all pr-12">
                    {item.original}
                  </p>

                  {/* Translated text block */}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic line-clamp-1 break-all pr-12">
                    {item.translated}
                  </p>

                  {/* Inline quick operational side-buttons */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-inherit pl-2">
                    <button
                      onClick={(e) => handleCopy(e, item.id, item.translated)}
                      id={`copy-history-item-btn-${item.id}`}
                      title="Copy result"
                      className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer transition-colors active:scale-90"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                        onShowToast('Removed from history.', 'info');
                      }}
                      id={`delete-history-item-btn-${item.id}`}
                      title="Remove item"
                      className="p-1.5 rounded-lg hover:bg-rose-50/70 dark:hover:bg-rose-950/20 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
