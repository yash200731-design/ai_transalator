/**
 * LibreTranslate API Service configuration and methods
 */

// Define standard languages supported by LibreTranslate
export interface Language {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'auto', name: 'Detect Language', nativeName: 'Auto Detect', flag: '🔍' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
];

// Offline/Fallback Phrase dictionary for demonstration/fail-safe mode
// This prevents the application from breaking if the public instances of LibreTranslate
// (which are run by volunteers and often heavily rate-limited or offline) are unreachable.
const FALLBACK_DICTIONARY: Record<string, Record<string, string>> = {
  'hello': {
    en: 'hello', es: 'hola', fr: 'bonjour', de: 'hallo', it: 'ciao',
    pt: 'olá', ru: 'привет', zh: '你好', ja: 'こんにちは', ko: '안녕하세요',
    ar: 'مرحبا', hi: 'नमस्ते', tr: 'merhaba', nl: 'hallo', pl: 'cześć', sv: 'hallå', vi: 'xin chào'
  },
  'good morning': {
    en: 'good morning', es: 'buenos días', fr: 'bonjour', de: 'guten morgen', it: 'buongiorno',
    pt: 'bom dia', ru: 'доброе утро', zh: '早上好', ja: 'おはようございます', ko: '좋은 아침',
    ar: 'صباح الخير', hi: 'सुप्रभात', tr: 'günaydın', nl: 'goedemorgen', pl: 'dzień dobry', sv: 'god morgon', vi: 'chào buổi sáng'
  },
  'thank you': {
    en: 'thank you', es: 'gracias', fr: 'merci', de: 'danke', it: 'grazie',
    pt: 'obrigado', ru: 'спасибо', zh: '谢谢', ja: 'ありがとう', ko: '감사합니다',
    ar: 'شكرا', hi: 'धन्यवाद', tr: 'teşekkür ederim', nl: 'dank je', pl: 'dziękuję', sv: 'tack', vi: 'cảm ơn'
  },
  'goodbye': {
    en: 'goodbye', es: 'adiós', fr: 'au revoir', de: 'auf wiedersehen', it: 'arrivederci',
    pt: 'adeus', ru: 'до свидания', zh: '再见', ja: 'さようなら', ko: '안녕히 가세요',
    ar: 'وداعا', hi: 'अलविदा', tr: 'hoşça kal', nl: 'tot ziens', pl: 'do widzenia', sv: 'hejdå', vi: 'tạm biệt'
  },
  'how are you?': {
    en: 'how are you?', es: '¿cómo estás?', fr: 'comment ça va?', de: 'wie geht es dir?', it: 'come stai?',
    pt: 'como você está?', ru: 'как дела?', zh: '你好吗？', ja: 'お元気ですか？', ko: '어떻게 지내세요?',
    ar: 'كيف حالك؟', hi: 'आप कैसे हैं?', tr: 'nasılsınız?', nl: 'hoe gaat het?', pl: 'jak się masz?', sv: 'hur mår du?', vi: 'bạn khỏe không?'
  },
  'i love you': {
    en: 'i love you', es: 'te amo', fr: 'je t\'aime', de: 'ich liebe dich', it: 'ti amo',
    pt: 'eu te amo', ru: 'я люблю тебя', zh: '我爱你', ja: '愛しています', ko: '사랑해요',
    ar: 'أحبك', hi: 'मैं तुमसे प्यार करता हूँ', tr: 'seni seviyorum', nl: 'ik hou van je', pl: 'kocham cię', sv: 'jag älskar dig', vi: 'tôi yêu bạn'
  },
};

// Configuration of API Endpoints
export const getBaseUrl = (): string => {
  return "";
};

/**
 * Perform translation using our secure server-side Gemini API translator
 */
export const translateText = async (
  text: string,
  source: string,
  target: string
): Promise<{ text: string; detectedLanguage?: string; isFallback: boolean }> => {
  if (!text || !text.trim()) {
    return { text: '', isFallback: false };
  }

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text.trim(),
      source,
      target,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to fetch translation from Gemini server");
  }

  const data = await response.json();
  return {
    text: data.translatedText,
    detectedLanguage: data.detectedLanguage,
    isFallback: false,
  };
};

/**
 * Language auto-detection using our secure server-side Gemini API translator
 */
export const detectLanguage = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return 'en';

  try {
    const data = await translateText(text, "auto", "en");
    return data.detectedLanguage || "en";
  } catch (e) {
    console.error("Language detection failed on backend, defaulting to 'en':", e);
    return "en";
  }
};

