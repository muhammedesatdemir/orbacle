import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Language } from '../types/language';
import { getDeviceLanguage } from '../utils/getDeviceLanguage';
import { getSavedLanguage, saveLanguage } from '../storage/settingsStorage';
import en from './en.json';
import tr from './tr.json';

const translations: Record<Language, Record<string, string>> = { en, tr };

interface I18nContextValue {
  language: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'en',
  t: (key: string) => key,
  setLanguage: () => {},
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getSavedLanguage();
      if (saved) {
        setLang(saved);
      } else {
        const device = getDeviceLanguage();
        setLang(device);
        await saveLanguage(device);
      }
      setReady(true);
    })();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLang(lang);
    await saveLanguage(lang);
  }, []);

  const t = useCallback(
    (key: string) => translations[language]?.[key] ?? translations.en[key] ?? key,
    [language],
  );

  if (!ready) return null;

  return React.createElement(I18nContext.Provider, { value: { language, t, setLanguage } }, children);
};
