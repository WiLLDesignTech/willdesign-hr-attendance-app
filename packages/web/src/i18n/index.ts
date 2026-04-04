import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ja from "./ja.json";
import ne from "./ne.json";

const LANGUAGE_STORAGE_KEY = "hr-app-language";
const SUPPORTED_LANGUAGES = ["en", "ja", "ne"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const getSavedLanguage = (): string => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) return saved;
  } catch { /* SSR or localStorage unavailable */ }
  return "en";
};

export const saveLanguage = (lng: string): void => {
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, lng); } catch { /* noop */ }
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
    ne: { translation: ne },
  },
  lng: getSavedLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", saveLanguage);

export default i18n;
