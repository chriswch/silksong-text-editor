import { create } from "zustand";

import { i18n } from "@/i18n";

enum Language {
  EN = "en",
  ZH = "zh",
}

type AvailableLanguage = {
  code: Language;
  name: string;
};

type AvailableLanguages = AvailableLanguage[];

const availableLanguages: AvailableLanguages = [
  { code: Language.ZH, name: "繁體中文（台灣）" },
  { code: Language.EN, name: "English" },
];

const translations = {
  [Language.EN]: i18n.en,
  [Language.ZH]: i18n.zh,
};

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  availableLanguages: AvailableLanguages;
  t: (key: string) => string;
}

const useLanguageStore = create<LanguageStore>((set, get) => ({
  language: Language.ZH,
  setLanguage: (language) => set({ language }),
  availableLanguages: availableLanguages,
  t: (key: string) => {
    const state = get();
    return translations[state.language][key] || key;
  },
}));

export { Language, availableLanguages, useLanguageStore };
