import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LanguageSelector from './components/LanguageSelector';
import Translator from './components/Translator';
import History, { HistoryItem } from './components/History';
import { translateText, getBaseUrl } from './services/translateService';
import { AlertCircle, CheckCircle, Info, Sparkles, X, Info as InfoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [inputText, setInputText] = useState(() => {
    return localStorage.getItem('translator_active_input') || '';
  });
  const [translatedText, setTranslatedText] = useState(() => {
    return localStorage.getItem('translator_active_output') || '';
  });
  const [sourceLang, setSourceLang] = useState(() => {
    return localStorage.getItem('translator_source_lang') || 'auto';
  });
  const [targetLang, setTargetLang] = useState(() => {
    return localStorage.getItem('translator_target_lang') || 'es';
  });
  const [detectedLang, setDetectedLang] = useState<string | undefined>(undefined);
  const [isTranslating, setIsTranslating] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'fallback' | 'checking'>('checking');
  
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('translator_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('translator_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Base API configuration
  const apiUrl = getBaseUrl();

  // Sync state values to localStorage
  useEffect(() => {
    localStorage.setItem('translator_active_input', inputText);
  }, [inputText]);

  useEffect(() => {
    localStorage.setItem('translator_active_output', translatedText);
  }, [translatedText]);

  useEffect(() => {
    localStorage.setItem('translator_source_lang', sourceLang);
  }, [sourceLang]);

  useEffect(() => {
    localStorage.setItem('translator_target_lang', targetLang);
  }, [targetLang]);

  useEffect(() => {
    localStorage.setItem('translator_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check API Endpoint health on start
  useEffect(() => {
    const verifyApi = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s limit

        const res = await fetch('/api/health', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (err) {
        setApiStatus('offline');
      }
    };
    verifyApi();
  }, []);

  // Show Toast messaging function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Perform translation
  const handleTranslate = async () => {
    if (!inputText || !inputText.trim()) {
      showToast('Please type some text first.', 'info');
      return;
    }

    setIsTranslating(true);
    setDetectedLang(undefined);

    try {
      const response = await translateText(inputText, sourceLang, targetLang);
      
      setTranslatedText(response.text);
      if (response.detectedLanguage) {
        setDetectedLang(response.detectedLanguage);
      }

      if (response.isFallback) {
        setApiStatus('fallback');
        showToast('Running in demo mock mode (public API offline)', 'info');
      } else {
        showToast('Text translated successfully!', 'success');
      }

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        original: inputText,
        translated: response.text,
        source: sourceLang === 'auto' ? (response.detectedLanguage || 'en') : sourceLang,
        target: targetLang,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const updated = [newHistoryItem, ...prev].slice(0, 100); // Limit to 100 items
        localStorage.setItem('translator_history', JSON.stringify(updated));
        return updated;
      });

    } catch (e: any) {
      console.error(e);
      const errMsg = e.message || 'Translation request failed. Please check your connection.';
      showToast(errMsg, 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // Clear translation states
  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setDetectedLang(undefined);
    showToast('Input and output fields cleared.', 'info');
  };

  // Swap target and source languages
  const handleSwap = () => {
    if (sourceLang === 'auto') return;
    const tempSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempSource);
    
    // Also swap the texts if they exist
    if (translatedText) {
      const tempText = inputText;
      setInputText(translatedText);
      setTranslatedText(tempText);
    }
    showToast('Languages swapped successfully.', 'success');
  };

  // Load a translation from history list
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setInputText(item.original);
    setTranslatedText(item.translated);
    setSourceLang(item.source);
    setTargetLang(item.target);
  };

  // Delete a translation from history list
  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('translator_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear entire translation history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('translator_history');
    showToast('Translation history cleared.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-zinc-800 dark:text-zinc-100 font-sans antialiased flex flex-col transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/15 dark:bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/15 dark:bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-6 md:py-10 z-10 flex flex-col gap-6 md:gap-8">
        
        {/* Navigation / Header Row */}
        <Header 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          apiStatus={apiStatus}
          apiUrl={apiUrl}
        />

        {/* Translation Widget Frame */}
        <div className="w-full flex flex-col gap-6 p-5 md:p-8 rounded-3xl border border-slate-200/40 dark:border-white/10 backdrop-blur-xl bg-white/40 dark:bg-white/5 shadow-xl shadow-indigo-500/5">
          
          {/* Top Selection Row */}
          <LanguageSelector 
            sourceLang={sourceLang}
            targetLang={targetLang}
            setSourceLang={setSourceLang}
            setTargetLang={setTargetLang}
            onSwap={handleSwap}
          />

          {/* Textareas Card Row */}
          <Translator 
            inputText={inputText}
            setInputText={setInputText}
            translatedText={translatedText}
            isTranslating={isTranslating}
            onTranslate={handleTranslate}
            onClear={handleClear}
            sourceLang={sourceLang}
            targetLang={targetLang}
            detectedLang={detectedLang}
            onShowToast={showToast}
          />
        </div>

        {/* Recent List Section */}
        <div className="w-full">
          <History 
            items={history}
            onSelectItem={handleSelectHistoryItem}
            onDeleteItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onShowToast={showToast}
          />
        </div>

        {/* Desktop-oriented footer tip line */}
        <footer className="text-center text-xs text-zinc-400 dark:text-zinc-600 font-medium py-4">
          <p>Powered by LibreTranslate Engine • Styled using Glassmorphism Architecture</p>
        </footer>
      </main>

      {/* Modern High-Quality Toast Notifications Tray */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-3rem)]">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-shadow duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-50/90 dark:bg-emerald-900/25 border-emerald-200/50 dark:border-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                  : toast.type === 'error'
                  ? 'bg-rose-50/90 dark:bg-rose-900/25 border-rose-200/50 dark:border-rose-500/10 text-rose-800 dark:text-rose-300'
                  : 'bg-indigo-50/90 dark:bg-indigo-900/25 border-indigo-200/50 dark:border-indigo-500/10 text-indigo-800 dark:text-indigo-300'
              }`}
            >
              <div className="flex-shrink-0">
                {toast.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                ) : (
                  <Info className="w-5 h-5 text-indigo-500" />
                )}
              </div>
              <p className="text-xs font-semibold flex-1 leading-relaxed">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:backdrop-blur-sm hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors active:scale-90"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
