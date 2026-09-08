/**
 * Official languages of India.
 *
 * - Hindi and English are the two official languages of the Union
 *   government (Article 343).
 * - The remaining entries are the 22 languages listed in the
 *   Eighth Schedule of the Constitution, which states/institutions
 *   draw on for regional official-language status.
 *
 * `code` follows ISO 639-1 where one exists, otherwise ISO 639-2/3.
 * `nativeName` is the language's own name written in its own script,
 * useful for a language picker UI.
 */

export const INDIA_OFFICIAL_LANGUAGES = [
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", union: true },
  { code: "en", name: "English", nativeName: "English", union: true },

  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "brx", name: "Bodo", nativeName: "बड़ो" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ks", name: "Kashmiri", nativeName: "کٲشُر" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mni", name: "Manipuri (Meitei)", nativeName: "ꯃꯤꯇꯩ ꯂꯣꯟ" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
];

/** Quick lookup: code -> language object. */
export const INDIA_LANGUAGE_BY_CODE = Object.fromEntries(
  INDIA_OFFICIAL_LANGUAGES.map((lang) => [lang.code, lang])
);

/** Returns the display name for a code, falling back to the code itself. */
export function getLanguageName(code, { native = false } = {}) {
  const lang = INDIA_LANGUAGE_BY_CODE[code];
  if (!lang) return code;
  return native ? lang.nativeName : lang.name;
}

export default INDIA_OFFICIAL_LANGUAGES;