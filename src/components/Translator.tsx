import React, { useState, useEffect } from 'react';
import { 
  Volume2, Trash2, Copy, Check, Download, CornerDownLeft, 
  Sparkles, Globe, RefreshCcw, Loader2, ArrowRight
} from 'lucide-react';

interface TranslatorProps {
  inputText: string;
  setInputText: (text: string) => void;
  translatedText: string;
  isTranslating: boolean;
  onTranslate: () => void;
  onClear: () => void;
  targetLang: string;
  sourceLang: string;
  detectedLang?: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function Translator({
  inputText,
  setInputText,
  translatedText,
  isTranslating,
  onTranslate,
  onClear,
  targetLang,
  sourceLang,
  detectedLang,
  onShowToast
}: TranslatorProps) {
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Compute stats
  const charCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  // Handles copying text
  const handleCopy = async (text: string, isInput: boolean) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (isInput) {
        setCopiedInput(true);
        setTimeout(() => setCopiedInput(false), 2000);
      } else {
        setCopiedOutput(true);
        setTimeout(() => setCopiedOutput(false), 2000);
      }
      onShowToast('Text copied to clipboard!', 'success');
    } catch (err) {
      onShowToast('Could not copy text.', 'error');
    }
  };

  // Handles Text to Speech
  const handleSpeak = (text: string, langCode: string) => {
    if (!text || !('speechSynthesis' in window)) {
      onShowToast('Text-to-speech not supported on this browser.', 'error');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Find approximate matching voice lang
    utterance.lang = langCode === 'auto' ? 'en' : langCode;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Handles Downloading as TXT file
  const handleDownload = () => {
    if (!translatedText) return;
    try {
      const element = document.createElement('a');
      const file = new Blob([
        `Original Text (${sourceLang}):\n${inputText}\n\n=========================\n\nTranslated Text (${targetLang}):\n${translatedText}`
      ], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `translation-${sourceLang}-to-${targetLang}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      onShowToast('Downloaded as TXT file!', 'success');
    } catch (e) {
      onShowToast('Could not download file.', 'error');
    }
  };

  // Trigger translate on Ctrl + Enter keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onTranslate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, sourceLang, targetLang, onTranslate]);

  return (
    <div className="w-full flex flex-col gap-6" id="translator-dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Input Card Container */}
        <div className="flex flex-col rounded-2xl border border-slate-205/30 dark:border-white/10 backdrop-blur-xl bg-white/45 dark:bg-white/5 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
          {/* Card Top Header */}
          <div className="py-3 px-4 flex items-center justify-between border-b border-slate-205/20 dark:border-white/10 bg-white/20 dark:bg-white/5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5 uppercase">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              Source Input
            </span>
            {sourceLang === 'auto' && detectedLang && (
              <span className="text-[10px] font-bold py-1 px-2.5 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-455 border border-indigo-500/10 animate-fade-in flex items-center gap-1">
                <span>Detected:</span>
                <span className="uppercase">{detectedLang}</span>
              </span>
            )}
          </div>

          {/* Area Input */}
          <div className="relative p-5 flex-1 flex flex-col min-h-[220px]">
            <textarea
              id="source-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste text to translate here..."
              maxLength={5000}
              className="w-full flex-1 resize-none bg-transparent border-0 p-0 text-zinc-800 dark:text-zinc-105 placeholder-slate-400 dark:placeholder-slate-650 focus:ring-0 focus:outline-none text-base md:text-lg leading-relaxed font-sans custom-scrollbar"
            />
            
            {/* Input Action row */}
            <div className="mt-4 pt-3 flex items-center justify-between border-t border-zinc-150/50 dark:border-white/[0.05]">
              {/* Text metrics counter */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 dark:text-slate-500">
                <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <span className={charCount >= 4800 ? 'text-rose-500 font-bold' : ''}>
                  {charCount}/5000 chars
                </span>
              </div>

              {/* Manipulation mini-buttons */}
              <div className="flex items-center gap-1">
                {inputText && (
                  <>
                    <button
                      onClick={onClear}
                      id="clear-input-btn"
                      title="Clear content"
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 cursor-pointer transition-colors active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopy(inputText, true)}
                      id="copy-input-btn"
                      title="Copy content"
                      className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 cursor-pointer transition-colors active:scale-90"
                    >
                      {copiedInput ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Output Card Container */}
        <div className="flex flex-col rounded-2xl border border-slate-205/30 dark:border-white/10 backdrop-blur-xl bg-indigo-500/5 dark:bg-white/5 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
          {/* Card Top Header */}
          <div className="py-3 px-4 flex items-center justify-between border-b border-slate-205/20 dark:border-white/10 bg-indigo-500/[0.03] dark:bg-white/5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-cyan-400 tracking-wider flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              Translation Output
            </span>
          </div>

          {/* Area Output */}
          <div className="relative p-5 flex-1 flex flex-col min-h-[220px]">
            {isTranslating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400 dark:text-zinc-500 space-y-3 animate-pulse">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm font-medium">Translating input...</p>
              </div>
            ) : (
              <textarea
                id="translation-text-output"
                readOnly
                value={translatedText}
                placeholder="Translation will appear here..."
                className="w-full flex-1 resize-none bg-transparent border-0 p-0 text-zinc-800 dark:text-indigo-100/90 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-0 text-base md:text-lg leading-relaxed font-sans custom-scrollbar"
              />
            )}

            {/* Output Action row */}
            {!isTranslating && (
              <div className="mt-4 pt-3 flex items-center justify-between border-t border-zinc-150/50 dark:border-white/[0.05]">
                <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3 text-zinc-400" />
                    Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/10 text-[10px]">Ctrl + Enter</kbd> to translate
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {translatedText && (
                    <>
                      <button
                        onClick={() => handleSpeak(translatedText, targetLang)}
                        id="tts-output-btn"
                        title={isSpeaking ? "Stop sound" : "Listen to translation"}
                        className={`p-2 rounded-lg cursor-pointer transition-colors active:scale-95 ${
                          isSpeaking 
                            ? 'bg-indigo-50 dark:bg-indigo-550/10 text-indigo-600 dark:text-indigo-400' 
                            : 'hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-300'
                        }`}
                      >
                        <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
                      </button>
                      <button
                        onClick={handleDownload}
                        id="download-output-btn"
                        title="Download translation (.txt)"
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-300 cursor-pointer transition-colors active:scale-90"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(translatedText, false)}
                        id="copy-output-btn"
                        title="Copy translation"
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-300 cursor-pointer transition-colors active:scale-90"
                      >
                        {copiedOutput ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Main Translate Button */}
      <div className="w-full flex justify-center">
        <button
          onClick={onTranslate}
          id="translate-now-btn"
          disabled={!inputText.trim() || isTranslating}
          className={`group flex items-center justify-center gap-2.5 py-4 px-10 rounded-xl font-semibold shadow-md active:scale-95 select-none transition-all duration-305 cursor-pointer text-base ${
            !inputText.trim() || isTranslating
              ? 'bg-zinc-200 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 border border-zinc-300/10 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-white hover:shadow-indigo-500/20 hover:shadow-lg hover:scale-[1.015]'
          }`}
        >
          {isTranslating ? (
            <>
              <RefreshCcw className="w-5 h-5 animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              <span>Translate Text</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 duration-150 transition-transform" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}
