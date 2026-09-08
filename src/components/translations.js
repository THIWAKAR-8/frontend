const TRANSLATIONS = {
  en: {
    // Existing UI labels...
    verdict_label: "Verdict",
    
    // Voice AI Sentences
    speech_passed: "This sample passed inspection.",
    speech_caution: "This sample requires caution.",
    speech_failed: "This sample failed inspection.",
    speech_pending: "Result is pending.",
    speech_confidence: "A. I. confidence",
    speech_percent: "percent",
    speech_disconnected: "Telemetry is disconnected.",

    // Live Backend Data Translations (Whatever your websocket sends)
    "Pure Milk": "Pure Milk",
    "Water Adulteration": "Water Adulteration",
    "Urea Detected": "Urea Detected"
  },
  hi: {
    // Existing UI labels...
    verdict_label: "निर्णय",
    
    // Voice AI Sentences
    speech_passed: "यह नमूना निरीक्षण में पास हो गया है।",
    speech_caution: "इस नमूने में सावधानी की आवश्यकता है।",
    speech_failed: "यह नमूना निरीक्षण में विफल रहा।",
    speech_pending: "परिणाम अभी बाकी है।",
    speech_confidence: "ए आई आत्मविश्वास",
    speech_percent: "प्रतिशत",
    speech_disconnected: "टेलीमेट्री डिस्कनेक्ट हो गई है।",

    // Live Backend Data Translations
    "Pure Milk": "शुद्ध दूध",
    "Water Adulteration": "पानी की मिलावट",
    "Urea Detected": "यूरिया मिलावट"
  },
  ta: {
    // Existing UI labels...
    verdict_label: "தீர்ப்பு",
    
    // Voice AI Sentences
    speech_passed: "இந்த மாதிரி சோதனையில் தேர்ச்சி பெற்றது.",
    speech_caution: "இந்த மாதிரிக்கு எச்சரிக்கை தேவை.",
    speech_failed: "இந்த மாதிரி சோதனையில் தோல்வியடைந்தது.",
    speech_pending: "முடிவு நிலுவையில் உள்ளது.",
    speech_confidence: "ஏ ஐ உறுதி",
    speech_percent: "சதவீதம்",
    speech_disconnected: "தொடர்பு துண்டிக்கப்பட்டது.",

    // Live Backend Data Translations
    "Pure Milk": "சுத்தமான பால்",
    "Water Adulteration": "தண்ணீர் கலப்படம்",
    "Urea Detected": "யூரியா கலப்படம்"
  }
};

export function getTranslations(langCode) {
  return TRANSLATIONS[langCode] || TRANSLATIONS["en"];
}