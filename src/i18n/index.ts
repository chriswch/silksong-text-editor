import { en } from "./en";
import { zh } from "./zh";

enum Language {
  EN = "en",
  ZH = "zh",
}

const translations = {
  en,
  zh,
};

const availableLanguages = [
  { code: Language.EN, name: "English", flag: "🇺🇸" },
  { code: Language.ZH, name: "繁體中文（台灣）", flag: "🇹🇼" },
];

export { translations, availableLanguages, Language };
