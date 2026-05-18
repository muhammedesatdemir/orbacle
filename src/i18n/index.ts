import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Language, FALLBACK_LANGUAGE, supportedLanguages } from '../types/language';
import { getDeviceLanguage } from '../utils/getDeviceLanguage';
import { getSavedLanguage, saveLanguage } from '../storage/settingsStorage';
import tr from './tr.json';
import en from './en.json';
import esLA from './es-LA.json';
import ptBR from './pt-BR.json';
import hiIN from './hi-IN.json';
import idID from './id-ID.json';
import ar from './ar.json';
import deDE from './de-DE.json';
import frFR from './fr-FR.json';
import jaJP from './ja-JP.json';

const translations: Record<Language, Record<string, string>> = {
  tr,
  en,
  'es-LA': esLA,
  'pt-BR': ptBR,
  'hi-IN': hiIN,
  'id-ID': idID,
  ar,
  'de-DE': deDE,
  'fr-FR': frFR,
  'ja-JP': jaJP,
};

interface I18nContextValue {
  language: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  ready: boolean;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  language: FALLBACK_LANGUAGE,
  t: (key: string) => key,
  setLanguage: () => {},
  ready: false,
  isRTL: false,
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<Language>(FALLBACK_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getSavedLanguage();
        if (saved) {
          setLang(saved);
        } else {
          const device = getDeviceLanguage();
          setLang(device);
          await saveLanguage(device);
        }
      } catch {
        // Fall back to default — storage errors must not block app.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLang(lang);
    await saveLanguage(lang);
  }, []);

  const t = useCallback(
    (key: string) =>
      translations[language]?.[key] ?? translations[FALLBACK_LANGUAGE][key] ?? key,
    [language],
  );

  const isRTL = useMemo(
    () => supportedLanguages.find((l) => l.code === language)?.rtl ?? false,
    [language],
  );

  return React.createElement(
    I18nContext.Provider,
    { value: { language, t, setLanguage, ready, isRTL } },
    children,
  );
};
