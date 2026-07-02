"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { dictionaries } from "./dictionaries";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem("preferred_lang");
    if (saved && (saved === "en" || saved === "cs")) {
      setLang(saved);
      document.documentElement.lang = saved;
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === "cs") {
        setLang("cs");
        document.documentElement.lang = "cs";
      }
    }
  }, []);

  const switchLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("preferred_lang", newLang);
    document.documentElement.lang = newLang;
  };

  const t = (key) => {
    const text = dictionaries[lang][key];
    if (text === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key; // Fallback to key
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
