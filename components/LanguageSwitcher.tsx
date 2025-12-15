"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
      title={language === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
    >
      <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      <span className="text-slate-700 dark:text-slate-200 uppercase tracking-wide">
        {language === "en" ? "EN" : "ES"}
      </span>
      <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-0.5" />
      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wide">
        {language === "en" ? "ES" : "EN"}
      </span>
    </button>
  );
};

// Compact version for tight spaces
export const LanguageSwitcherCompact: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-bold text-slate-700 dark:text-slate-200 uppercase"
      title={language === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
    >
      {language === "en" ? "EN" : "ES"}
    </button>
  );
};

export default LanguageSwitcher;
