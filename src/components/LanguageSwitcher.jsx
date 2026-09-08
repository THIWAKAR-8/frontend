import React from "react";
import { INDIA_OFFICIAL_LANGUAGES } from "./indiaLanguages.js";

export default function LanguageSwitcher({ value, onChange }) {
  // We only show the languages we have in translations.js (en, hi, ta)
  const supportedCodes = ["en", "hi", "ta"];
  const availableLangs = INDIA_OFFICIAL_LANGUAGES.filter(lang => 
    supportedCodes.includes(lang.code)
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-900/80 text-cyan-400 border border-cyan-800/50 rounded-lg p-1.5 text-xs font-bold tracking-wider outline-none cursor-pointer"
    >
      {availableLangs.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName} ({lang.code.toUpperCase()})
        </option>
      ))}
    </select>
  );
}