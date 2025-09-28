import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Language, availableLanguages, translations } from "@/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (
    key: keyof (typeof translations)[Language.EN],
    params?: Record<string, string>,
  ) => string;
  availableLanguages: typeof availableLanguages;
};

const LanguageContext = createContext<LanguageContextType>({
  language: Language.EN,
  setLanguage: () => {},
  t: (key) => key,
  availableLanguages,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(Language.EN);

  // Get user's browser language on first load
  useEffect(() => {
    const browserLang = navigator.language as Language;
    if (availableLanguages.some((lang) => lang.code === browserLang)) {
      setLanguage(browserLang);
    }
  }, []);

  // Translation function
  const t = useCallback(
    (
      key: keyof (typeof translations)[Language.EN],
      params?: Record<string, string>,
    ) => {
      const translation =
        translations[language]?.[key] || translations.en[key] || key;

      if (params) {
        return Object.entries(params).reduce((acc, [param, value]) => {
          return acc.replace(new RegExp(`{${param}}`, "g"), value);
        }, translation);
      }

      return translation;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      availableLanguages,
    }),
    [language, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export { Language };
