import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import html2canvas from "html2canvas";
import InstallApp from './components/InstallApp';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from "recharts";
import {
  Wifi, WifiOff, Baby, AlertTriangle, Flame, Activity, Droplet, Coffee, UtensilsCrossed,
  Package, Cookie, ClipboardCheck, Clock, Thermometer, Droplets, FlaskConical, Milk,
  IndianRupee, Leaf, ShieldCheck, ShieldAlert, Waves, ActivitySquare, Cpu, Download,
  Loader2, Volume2, VolumeX, Eye, Share2, AlertOctagon, HeartPulse, Scale, Shield,
  TrendingDown, DollarSign, Pill, Camera, MessageSquare, Send, Zap, BarChart3, ScanFace,
  CheckCircle2, RefreshCw, XCircle, Info
} from "lucide-react";

// ============================================================================
// THE FIX: URL NOW POINTS TO smart-spoon-backend-ai
// ============================================================================
const WS_URL = "wss://smart-spoon-backend-ai.onrender.com/ws";
// ============================================================================

const HISTORY_LEN = 40;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;

const EMPTY_HERO = { adulteration_type: "Connecting…", accuracy: 0, status_color: "#334155" };
const EMPTY_META = {
  timestamp: "--",
  raw_adc: 0,
  probe_temperature_c: 0,
  excitation_frequency_hz: 0,
  com_port: "--"
};

const GLOBAL_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", ttsCode: "en-US" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", ttsCode: "ta-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", ttsCode: "hi-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", ttsCode: "ml-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", ttsCode: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", ttsCode: "kn-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", ttsCode: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", ttsCode: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", ttsCode: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", ttsCode: "pa-IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", ttsCode: "ur-PK" },
  { code: "es", name: "Spanish", nativeName: "Español", ttsCode: "es-ES" },
  { code: "fr", name: "French", nativeName: "Français", ttsCode: "fr-FR" },
  { code: "de", name: "German", nativeName: "Deutsch", ttsCode: "de-DE" },
  { code: "zh", name: "Chinese", nativeName: "中文", ttsCode: "zh-CN" },
  { code: "ar", name: "Arabic", nativeName: "العربية", ttsCode: "ar-SA" },
  { code: "ja", name: "Japanese", nativeName: "日本語", ttsCode: "ja-JP" },
  { code: "ru", name: "Russian", nativeName: "Русский", ttsCode: "ru-RU" }
];

const INTERNAL_DICTIONARY = {
  en: {
    app_title: "Smart Spoon AI", subtitle: "Real-Time Telemetry & Adulteration Metrology",
    live: "Live", reconnecting: "Reconnecting", offline: "Offline",
    tab_telemetry: "Telemetry", tab_health: "Health & Eco", tab_vision: "Optical Lab",
    tab_assistant: "AI Assistant", tab_settings: "Accessibility",
    verdict: "Primary Verdict", confidence: "AI Confidence", safety_score: "Safety Score",
    ph_meter: "Live pH Level", acidic: "Acidic", ideal: "Ideal", alkaline: "Alkaline",
    countertop_timer: "Countertop Life", fridge_timer: "Fridge Life",
    kitchen_directive: "Kitchen Directive", consumer_intel: "Consumer Intelligence",
    deep_lab: "Deep Technical Diagnostics", eis_waveform: "Real-Time EIS Impedance",
    ai_prob: "AI Probability Distribution", download_cert: "Download Certificate",
    share: "Share Alert", speech_alert: "Diagnostic Verdict is:"
  },
  ta: {
    app_title: "ஸ்மார்ட் ஸ்பூன் ஏஐ", subtitle: "நிகழ்நேர தொலைஅளவை & கலப்பட ஆய்வு",
    live: "நேரலை", reconnecting: "மீண்டும் இணைகிறது", offline: "இணைப்பில்லை",
    tab_telemetry: "தொலைஅளவை", tab_health: "சுகாதாரம் & நலம்", tab_vision: "ஒளியியல் பார்வை",
    tab_assistant: "AI உதவியாளர்", tab_settings: "அமைப்புகள்",
    verdict: "ஆய்வு முடிவு", confidence: "துல்லியம்", safety_score: "பாதுகாப்பு மதிப்பு",
    ph_meter: "நிகழ்நேர pH அளவு", acidic: "அமிலத்தன்மை", ideal: "சிறந்தது", alkaline: "காரத்தன்மை",
    countertop_timer: "அறை வெப்ப ஆயுள்", fridge_timer: "குளிர்பதன ஆயுள்",
    kitchen_directive: "சமையலறை வழிகாட்டல்", consumer_intel: "நுகர்வோர் நுண்ணறிவு",
    deep_lab: "ஆழமான தொழில்நுட்ப பகுப்பாய்வு", eis_waveform: "மின்மறிப்பு அலைவரிசை",
    ai_prob: "நிகழ்தகவு பரவல்", download_cert: "சான்றிதழ் பதிவிறக்கு",
    share: "பகிரவும்", speech_alert: "கணினி ஆய்வு முடிவு:"
  },
  hi: {
    app_title: "स्मार्ट स्पून एआई", subtitle: "रीयल-टाइम टेलीमेट्री और मिलावट निदान",
    live: "लाइव", reconnecting: "पुनः जुड़ रहा है", offline: "ऑफ़लाइन",
    tab_telemetry: "टेलीमेट्री", tab_health: "स्वास्थ्य और अर्थशास्त्र", tab_vision: "ऑप्टिकल लैब",
    tab_assistant: "एआई सहायक", tab_settings: "पहुंच",
    verdict: "प्राथमिक निर्णय", confidence: "सटीकता", safety_score: "सुरक्षा स्कोर",
    ph_meter: "लाइव पीएच स्तर", acidic: "अम्लीय", ideal: "आदर्श", alkaline: "क्षारीय",
    countertop_timer: "सामान्य शेल्फ लाइफ", fridge_timer: "फ्रिज शेल्फ लाइफ",
    kitchen_directive: "रसोई निर्देश", consumer_intel: "उपभोक्ता खुफिया",
    deep_lab: "गहन तकनीकी निदान", eis_waveform: "प्रतिबाधा तरंग",
    ai_prob: "संभावना वितरण", download_cert: "प्रमाणपत्र डाउनलोड",
    share: "शेयर करें", speech_alert: "निदान निर्णय है:"
  },
  ml: {
    app_title: "സ്മാർട്ട് സ്പൂൺ AI", subtitle: "തത്സമയ ടെലിമെട്രിയും മായം കണ്ടെത്തലും",
    live: "തത്സമയം", reconnecting: "വീണ്ടും ബന്ധിപ്പിക്കുന്നു", offline: "ഓഫ്‌ലൈൻ",
    tab_telemetry: "ടെലിമെട്രി", tab_health: "ആരോഗ്യം", tab_vision: "ഒപ്റ്റിക്കൽ ലാബ്",
    tab_assistant: "AI അസിസ്റ്റന്റ്", tab_settings: "ക്രമീകരണങ്ങൾ",
    verdict: "വിധി", confidence: "കൃത്യത", safety_score: "സുരക്ഷാ സ്കോർ",
    ph_meter: "തത്സമയ pH നില", acidic: "അസിഡിക്", ideal: "ഉചിതം", alkaline: "ആൽക്കലൈൻ",
    countertop_timer: "റൂം ഷെൽഫ് ലൈഫ്", fridge_timer: "ഫ്രിഡ്ജ് ഷെൽഫ് ലൈഫ്",
    kitchen_directive: "നിർദ്ദേശം", consumer_intel: "വിവരങ്ങൾ",
    deep_lab: "സാങ്കേതിക വിശകലനം", eis_waveform: "ഇംപെഡൻസ് തരംഗം",
    ai_prob: "പ്രോബബിലിറ്റി", download_cert: "സർട്ടിഫിക്കറ്റ്",
    share: "പങ്കിടുക", speech_alert: "സാമ്പിൾ വിധി:"
  },
  te: {
    app_title: "స్మార్ట్ స్పూన్ AI", subtitle: "రియల్ టైమ్ టెలిమెట్రీ & కల్తీ నిర్ధారణ",
    live: "లైవ్", reconnecting: "పునఃకనెక్ట్ అవుతోంది", offline: "ఆఫ్‌లైన్",
    tab_telemetry: "టెలిమెట్రీ", tab_health: "ఆరోగ్యం", tab_vision: "ఆప్టికల్ ల్యాబ్",
    tab_assistant: "AI సహాయకుడు", tab_settings: "అమరికలు",
    verdict: "తీర్పు", confidence: "ఖచ్చితత్వం", safety_score: "భద్రతా స్కోరు",
    ph_meter: "లైవ్ pH స్థాయి", acidic: "ఆమ్ల", ideal: "ఆదర్శం", alkaline: "క్షార",
    countertop_timer: "గది ఉష్ణోగ్రత నిల్వ", fridge_timer: "ఫ్రిజ్ నిల్వ",
    kitchen_directive: "వంటగది ఆదేశం", consumer_intel: "వినియోగదారు సమాచారం",
    deep_lab: "సాంకేతిక విశ్లేషణ", eis_waveform: "ఇంపెడెన్స్ వేవ్‌ఫార్మ్",
    ai_prob: "సంభావ్యత", download_cert: "సర్టిఫికేట్ పొందండి",
    share: "షేర్ చేయండి", speech_alert: "నమూనా ఫలితం:"
  },
  kn: {
    app_title: "ಸ್ಮಾರ್ಟ್ ಸ್ಪೂನ್ AI", subtitle: "ನೈಜ ಸಮಯದ ಟೆಲಿಮೆಟ್ರಿ ಮತ್ತು ಕಲಬೆರಕೆ ಪತ್ತೆ",
    live: "ಲೈವ್", reconnecting: "ಮರುಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ", offline: "ಆಫ್‌ಲೈನ್",
    tab_telemetry: "ಟೆಲಿಮೆಟ್ರಿ", tab_health: "ಆರೋಗ್ಯ", tab_vision: "ಆಪ್ಟಿಕಲ್ ಲ್ಯಾಬ್",
    tab_assistant: "AI ಸಹಾಯಕ", tab_settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    verdict: "ತೀರ್ಪು", confidence: "ನಿಖರತೆ", safety_score: "ಸುರಕ್ಷತಾ ಸ್ಕೋರ್",
    ph_meter: "pH ಮಟ್ಟ", acidic: "ಆಮ್ಲೀಯ", ideal: "ಸೂಕ್ತ", alkaline: "ಕ್ಷಾರೀಯ",
    countertop_timer: "ಕೋಣೆಯ ಜೀವಿತಾವಧಿ", fridge_timer: "ಫ್ರಿಡ್ಜ್ ಜೀವಿತಾವಧಿ",
    kitchen_directive: "ಸೂಚನೆ", consumer_intel: "ಗ್ರಾಹಕ ಮಾಹಿತಿ",
    deep_lab: "ತಾಂತ್ರಿಕ ವಿಶ್ಲೇಷಣೆ", eis_waveform: "ಪ್ರತಿರೋಧ ತರಂಗ",
    ai_prob: "ಸಂಭವನೀಯತೆ", download_cert: "ಪ್ರಮಾಣಪತ್ರ ಡೌನ್‌ಲೋಡ್",
    share: "ಹಂಚಿಕೊಳ್ಳಿ", speech_alert: "ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶ:"
  }
};

function parseProbabilityDistribution(raw) {
  if (!raw || typeof raw !== "string") return [];
  try {
    const sanitized = raw.replace(/'/g, '"');
    const parsed = JSON.parse(sanitized);
    return Object.entries(parsed).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value: Number(value) || 0
    }));
  } catch {
    return [];
  }
}

function firstNumber(raw, fallback = 0) {
  if (typeof raw === "number") return isNaN(raw) ? fallback : raw;
  if (typeof raw !== "string") return fallback;
  const match = raw.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : fallback;
}

function cleanLabel(key) {
  return String(key)
    .replace(/^\d+_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ICON_MAP = {
  baby: Baby,
  toxicity: AlertTriangle,
  flame: Flame,
  activity: Activity,
  droplet: Droplet,
  coffee: Coffee,
  utensils: UtensilsCrossed,
  package: Package,
  cookie: Cookie,
  clock: Clock,
  thermometer: Thermometer,
  droplets: Droplets,
  flask: FlaskConical,
  milk: Milk,
  rupee: IndianRupee,
  leaf: Leaf
};

function getMetricIcon(key) {
  const k = key.toLowerCase();
  if (k.includes("infant")) return ICON_MAP.baby;
  if (k.includes("toxicity")) return ICON_MAP.toxicity;
  if (k.includes("boiling")) return ICON_MAP.flame;
  if (k.includes("lactose")) return ICON_MAP.activity;
  if (k.includes("curdle") || k.includes("water")) return ICON_MAP.droplet;
  if (k.includes("chai")) return ICON_MAP.coffee;
  if (k.includes("curd")) return ICON_MAP.utensils;
  if (k.includes("paneer")) return ICON_MAP.package;
  if (k.includes("baking")) return ICON_MAP.cookie;
  if (k.includes("age") || k.includes("timer")) return ICON_MAP.clock;
  if (k.includes("temp") || k.includes("cold")) return ICON_MAP.thermometer;
  if (k.includes("adulterant")) return ICON_MAP.flask;
  if (k.includes("cream")) return ICON_MAP.milk;
  if (k.includes("loss") || k.includes("penalty") || k.includes("fraud")) return ICON_MAP.rupee;
  if (k.includes("nutrition")) return ICON_MAP.leaf;
  return Activity;
}

function useWebSocket(url, onMessageCallback) {
  const [connectionState, setConnectionState] = useState("CONNECTING"); // CONNECTING | OPEN | RECONNECTING
  const retryAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const callbackRef = useRef(onMessageCallback);

  useEffect(() => {
    callbackRef.current = onMessageCallback;
  }, [onMessageCallback]);

  const connect = useCallback(() => {
    try {
      if (socketRef.current) {
        socketRef.current.close();
      }
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionState("OPEN");
        retryAttemptRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          callbackRef.current?.(parsed);
        } catch (err) {
          console.error("Defensive Parser Intercepted Broken Frame:", err);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        setConnectionState("RECONNECTING");
        // Exponential backoff with randomized jitter formula: min(30000, 1000 * 2^attempt) + random(0, 500)
        const backoff = Math.min(
          MAX_RETRY_DELAY_MS,
          INITIAL_RETRY_DELAY_MS * Math.pow(2, retryAttemptRef.current)
        );
        const jitter = Math.floor(Math.random() * 500);
        const nextDelay = backoff + jitter;

        retryAttemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, nextDelay);
      };
    } catch {
      setConnectionState("RECONNECTING");
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected: connectionState === "OPEN", connectionState };
}

function useSpeechSynthesis(lang) {
  const [voices, setVoices] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
        setIsReady(true);
      }
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    try {
      window.speechSynthesis.cancel(); // Force clear audio queue to eliminate overlap
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = GLOBAL_LANGUAGES.find((l) => l.code === lang);
      const ttsCode = targetLang ? targetLang.ttsCode : "en-US";

      const matchedVoice = voices.find((v) => v.lang === ttsCode || v.lang.startsWith(lang));
      if (matchedVoice) utterance.voice = matchedVoice;
      utterance.lang = ttsCode;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
    }
  }, [lang, voices]);

  const unlockAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
      if ("speechSynthesis" in window) {
        const priming = new SpeechSynthesisUtterance("");
        priming.volume = 0;
        window.speechSynthesis.speak(priming);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return { speak, unlockAudioContext, isReady, isSpeaking };
}

function ConnectionBadge({ connectionState, t }) {
  const isLive = connectionState === "OPEN";
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
        isLive
          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
          : "border-rose-500/30 text-rose-400 bg-rose-500/10 animate-pulse"
      }`}
    >
      {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      {isLive ? t.live : connectionState === "RECONNECTING" ? t.reconnecting : t.offline}
    </div>
  );
}

function PrimaryCard({ icon: Icon, label, value }) {
  return (
    <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm p-4 flex items-start gap-4 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5">
      <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0 text-cyan-400 border border-slate-700/50 group-hover:scale-110 transition-transform duration-300 shadow-inner">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1 truncate">{label}</div>
        <div className="text-sm text-slate-200 font-medium leading-snug truncate tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function PHThermometer({ value, t }) {
  const min = 4.0;
  const max = 9.0;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = ((clamped - min) / (max - min)) * 100;
  const inRange = value >= 6.3 && value <= 6.9;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-cyan-400 border border-slate-700/50">
            <Waves className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase tracking-[0.1em] text-slate-400 font-semibold">{t.ph_meter}</span>
        </div>
        <div className={`text-3xl font-bold tabular-nums tracking-tight ${inRange ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"}`}>
          {value.toFixed(2)}
        </div>
      </div>
      <div className="relative h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shadow-inner z-10">
        <div className="absolute inset-y-0 left-0 right-0 flex opacity-80">
          <div className="flex-1 bg-gradient-to-r from-rose-500 to-amber-500" />
          <div className="flex-[1.4] bg-gradient-to-r from-emerald-400 to-emerald-500" />
          <div className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500" />
        </div>
        <motion.div
          className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_4px_rgba(255,255,255,0.7)]"
          animate={{ left: `calc(${pct}% - 4px)` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-2 z-10 relative">
        <span>4.0 {t.acidic}</span>
        <span className="text-emerald-500/80">6.3–6.9 {t.ideal}</span>
        <span>9.0 {t.alkaline}</span>
      </div>
    </div>
  );
}

function DigitalTimer({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm p-5 text-center flex flex-col justify-center items-center h-full">
      <div className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-2">{label}</div>
      <div className="text-3xl font-bold text-cyan-400 tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">{value}</div>
    </div>
  );
}

function MetricTable({ title, data, formatValue, icon: Icon }) {
  const entries = Object.entries(data || {});
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
        <div className="text-[11px] uppercase tracking-[0.1em] text-slate-400 font-bold">{title}</div>
      </div>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="group flex items-baseline justify-between py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 px-2 -mx-2 rounded transition-colors">
            <span className="text-xs text-slate-400 pr-4">{cleanLabel(key)}</span>
            <span className="text-[13px] text-slate-200 font-medium text-right tabular-nums">
              {formatValue ? formatValue(key, value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [hero, setHero] = useState(EMPTY_HERO);
  const [primary, setPrimary] = useState({});
  const [secondary, setSecondary] = useState({});
  const [meta, setMeta] = useState(EMPTY_META);
  const [zHistory, setZHistory] = useState([]);
  const [lang, setLang] = useState("en");
  const [activeTab, setActiveTab] = useState("telemetry");
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusToast, setStatusToast] = useState(null);

  // Accessibility & Visual Configuration
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Household Medical Profile Configuration
  const [pregnancyMode, setPregnancyMode] = useState(false);

  // Optical Diagnostics Canvas State
  const [labImage, setLabImage] = useState(null);
  const [labResults, setLabResults] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const visionCanvasRef = useRef(null);

  // NLP Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: "Smart Spoon Neural Diagnostics operational. Ask me regarding milk purity, urea biomarkers, pH acidification, or FSSAI guidelines."
    }
  ]);
  const chatScrollRef = useRef(null);

  // High frequency tick reference stored in ref to prevent re-render cascades
  const tickCounterRef = useRef(0);
  const certificateRef = useRef(null);

  const t = useMemo(() => INTERNAL_DICTIONARY[lang] || INTERNAL_DICTIONARY.en, [lang]);
  const { speak, unlockAudioContext, isSpeaking } = useSpeechSynthesis(lang);

  // Handle incoming WebSocket frame without causing virtual DOM thrashing
  const handleIncomingTelemetry = useCallback((data) => {
    if (data.hero) setHero(data.hero);
    if (data.primary) setPrimary(data.primary);
    if (data.secondary) setSecondary(data.secondary);
    if (data.system_meta) setMeta(data.system_meta);

    const zMagnitude = firstNumber(
      data?.secondary?.eis_dsp_telemetry?.["1_Total_Impedance_Magnitude"],
      500
    );

    tickCounterRef.current += 1;
    setZHistory((prev) => {
      const next = [...prev, { t: tickCounterRef.current, z: zMagnitude }];
      return next.length > HISTORY_LEN ? next.slice(next.length - HISTORY_LEN) : next;
    });
  }, []);

  const { isConnected, connectionState } = useWebSocket(WS_URL, handleIncomingTelemetry);

  const handleVoiceToggle = useCallback(() => {
    if (!audioUnlocked) {
      unlockAudioContext();
      setAudioUnlocked(true);
      setVoiceActive(true);
      speak(`${t.app_title} audio system engaged.`);
    } else {
      const next = !voiceActive;
      setVoiceActive(next);
      if (!next && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [audioUnlocked, unlockAudioContext, voiceActive, speak, t.app_title]);

  useEffect(() => {
    if (voiceActive && hero.adulteration_type && hero.adulteration_type !== "Connecting…") {
      const msg = `${t.speech_alert} ${hero.adulteration_type}. Accuracy: ${Math.round(hero.accuracy)} percent.`;
      speak(msg);
    }
  }, [hero.adulteration_type, hero.accuracy, voiceActive, speak, t.speech_alert]);

  const triggerCertificateDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      // 150ms timeout ensures React has committed all layout computations
      await new Promise((resolve) => setTimeout(resolve, 150));
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f8fafc"
      });
      const dataUrl = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.download = `Team_Tesla_FSSAI_Certificate_${Date.now()}.png`;
      anchor.href = dataUrl;
      anchor.click();
      setStatusToast({ type: "success", text: "Official Certificate generated and downloaded successfully." });
    } catch (err) {
      console.error("Certificate Export Error:", err);
      setStatusToast({ type: "error", text: "Canvas rendering failed. Ensure hardware graphics acceleration is active." });
    } finally {
      setIsDownloading(false);
      setTimeout(() => setStatusToast(null), 4000);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setLabImage(event.target?.result);
      setLabResults(null);
    };
    reader.readAsDataURL(file);
  };

  const executeOpticalAnalysis = () => {
    if (!labImage || !visionCanvasRef.current) return;
    setIsAnalyzingImage(true);

    const canvas = visionCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      let rTotal = 0, gTotal = 0, bTotal = 0;
      const totalPixels = canvas.width * canvas.height;

      for (let i = 0; i < data.length; i += 4) {
        rTotal += data[i];
        gTotal += data[i + 1];
        bTotal += data[i + 2];
      }

      const r = Math.round(rTotal / totalPixels);
      const g = Math.round(gTotal / totalPixels);
      const b = Math.round(bTotal / totalPixels);
      const brightness = Math.round((r + g + b) / 3);
      const blueShift = b - (r + g) / 2;

      let verdict = "Standard Natural White (Normal Opacity)";
      let alertLevel = "safe";

      if (brightness < 175) {
        verdict = "Low Luminance: Suspected Admixture / Foreign Suspensions";
        alertLevel = "warning";
      } else if (blueShift > 12) {
        verdict = "Blue-Shift Dispersal: Water Dilution Signature";
        alertLevel = "danger";
      } else if (r > 242 && g > 242 && b > 242) {
        verdict = "Hyper-Reflective Whiteness: Synthetic Surfactant / Urea Signature";
        alertLevel = "critical";
      } else if (r > b + 18) {
        verdict = "Warm Carotenoid Hue: High Beta-Carotene or Starch Thickener";
        alertLevel = "notice";
      }

      setTimeout(() => {
        setLabResults({ r, g, b, brightness, verdict, alertLevel });
        setIsAnalyzingImage(false);
      }, 1000);
    };
    img.src = labImage;
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const query = chatInput.trim();
    setChatHistory((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    setTimeout(() => {
      const q = query.toLowerCase();
      let reply = `System operational. Current sample: ${hero.adulteration_type} with a safety rating of ${firstNumber(primary["1_safety_score"], 0)}/100.`;

      if (q.includes("urea")) {
        reply = "Urea is added to synthetic milk to artificially elevate Kjeldahl nitrogen readings (falsifying protein). It damages renal microvasculature. EIS detects this via sharp ionic conductance swings.";
      } else if (q.includes("water") || q.includes("dilut")) {
        reply = `Water adulteration reduces milk density and destroys nutrient bioavailability. Current estimated dilution level: ${primary["16_water_adulteration_pct"] || 0}%.`;
      } else if (q.includes("fssai") || q.includes("govt") || q.includes("rule")) {
        reply = "Under FSSAI Food Safety & Standards Regulations (2011), cow milk must maintain ≥3.2% fat and ≥8.3% SNF. Any synthetic adulteration warrants immediate seizure and Section 59 prosecution.";
      } else if (q.includes("safe") || q.includes("drink")) {
        const score = firstNumber(primary["1_safety_score"], 0);
        reply = score >= 80 ? `Sample safety score is ${score}/100. Parameters fall within permissible domestic thresholds.` : `CRITICAL: Sample safety score is only ${score}/100. Consumption is strongly discouraged.`;
      } else if (q.includes("ph")) {
        reply = `Active probe pH: ${firstNumber(primary["21_REAL_TIME_PH_METER"], 6.7).toFixed(2)}. Normal milk rests between 6.5 and 6.7. Values below 6.3 indicate progressive lactic acid fermentation.`;
      }

      setChatHistory((prev) => [...prev, { sender: "bot", text: reply }]);
      if (voiceActive) speak(reply);
    }, 600);
  };

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const isToxic = useMemo(
    () => hero.status_color === "#dc2626" || hero.status_color === "#ef4444",
    [hero.status_color]
  );

  const radarData = useMemo(
    () => parseProbabilityDistribution(secondary?.ai_and_regulatory_metrology?.["35_Class_Probability_Distribution"]),
    [secondary]
  );

  const phValue = firstNumber(primary["21_REAL_TIME_PH_METER"], 6.7);
  const safetyScore = firstNumber(primary["1_safety_score"], 0);
  const waterPct = firstNumber(primary["16_water_adulteration_pct"], 0);
  const penaltyINR = firstNumber(primary["19_fraud_loss_penalty_inr"], 0);
  const monthlyLoss = Math.round(penaltyINR * 30);
  const trueMarketPrice = Math.max(0, 60 - penaltyINR).toFixed(2);
  const caloriesPerGlass = Math.max(40, Math.round(150 * ((100 - waterPct) / 100)));
  const boilingTime = phValue < 6.4 ? 12 : 5;
  const calciumIndex = isToxic ? 0 : Math.round(100 - waterPct);
  const safetyColor = safetyScore >= 85 ? "#10b981" : safetyScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className={`min-h-screen font-sans selection:bg-cyan-500/30 relative overflow-hidden pb-12 transition-all ${
        highContrast ? "bg-black text-white" : "bg-slate-950 text-slate-200"
      }`}
      style={{
        fontFamily: dyslexicFont ? "'OpenDyslexic', 'Comic Sans MS', sans-serif" : "inherit",
        fontSize: `${fontSizeMultiplier}rem`
      }}
    >
      
      {/* Ambient glassmorphic lighting */}
      {!highContrast && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none -z-10" />
        </>
      )}

      {/* Floating Status Notification Toast */}
      {statusToast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
            statusToast.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/80 border-rose-500/40 text-rose-300"
          }`}
        >
          {statusToast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-xs font-semibold">{statusToast.text}</span>
        </div>
      )}

      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        highContrast ? "bg-black border-white" : "bg-slate-950/70 border-slate-800/80"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">{t.app_title}</h1>
              <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-400 font-semibold">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Language Switcher */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-slate-900 border border-slate-700 hover:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold uppercase transition-colors outline-none cursor-pointer"
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>

            {/* Speech Synthesis Interactive Button */}
            <button
              onClick={handleVoiceToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                voiceActive
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {voiceActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{voiceActive ? (isSpeaking ? "Speaking…" : "Voice ON") : "Voice OFF"}</span>
            </button>
            <InstallApp />
            <ConnectionBadge connectionState={connectionState} t={t} />
          </div>
        </div>
      </header>

      {/* Navigation Ribbon */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-6 flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: "telemetry", icon: ActivitySquare, label: t.tab_telemetry },
          { id: "health", icon: HeartPulse, label: t.tab_health },
          { id: "vision", icon: ScanFace, label: t.tab_vision },
          { id: "assistant", icon: MessageSquare, label: t.tab_assistant },
          { id: "settings", icon: Eye, label: t.tab_settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? "bg-cyan-500/15 text-cyan-400 border-b-2 border-cyan-400"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Analytical Dashboard Container */}
      <main className="max-w-7xl mx-auto px-6">
        {/* ======================================================================= */}
        {/* TAB 1: CORE TELEMETRY & HARDWARE METROLOGY                               */}
        {/* ======================================================================= */}
        {activeTab === "telemetry" && (
          <div className="space-y-8">
            {/* Framer Motion Choreographed Hero Banner with mode="wait" */}
            <AnimatePresence mode="wait">
              <motion.div
                key={hero.adulteration_type}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="rounded-3xl p-8 md:p-10 relative overflow-hidden backdrop-blur-md border shadow-2xl"
                style={{
                  backgroundColor: highContrast ? "#000000" : `${hero.status_color}25`,
                  backgroundImage: highContrast ? "none" : `linear-gradient(135deg, ${hero.status_color}35 0%, ${hero.status_color}08 100%)`,
                  borderColor: hero.status_color
                }}
              >
                {/* Visual pulse for toxic alerts */}
                {isToxic && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl"
                    animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0)", "0 0 0 14px rgba(239,68,68,0.2)", "0 0 0 0 rgba(239,68,68,0)"] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <div
                  className="absolute right-0 bottom-0 w-80 h-80 blur-3xl opacity-30 rounded-full pointer-events-none"
                  style={{ backgroundColor: hero.status_color }}
                />

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-white/80 text-[11px] font-bold uppercase tracking-[0.15em] mb-3">
                      {isToxic ? <ShieldAlert className="w-5 h-5 text-rose-400" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                      <span>{t.verdict}</span>
                    </div>
                    <div className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md mb-6">
                      {hero.adulteration_type}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={triggerCertificateDownload}
                        disabled={isDownloading || !isConnected}
                        className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span>{isDownloading ? "Capturing DOM…" : t.download_cert}</span>
                      </button>

                      <button
                        onClick={() => {
                          const shareText = `🚨 Smart Spoon AI Diagnostic Report: Verdict = ${hero.adulteration_type} | AI Confidence = ${hero.accuracy}% | Safety Score = ${safetyScore}/100.`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
                        }}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-emerald-900/30"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{t.share}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-slate-950/40 p-5 rounded-2xl backdrop-blur-md border border-white/10 shrink-0">
                    <div className="w-28 h-28">
                      <CircularProgressbar
                        value={hero.accuracy}
                        text={`${hero.accuracy?.toFixed(1) ?? 0}%`}
                        styles={buildStyles({
                          pathColor: hero.status_color,
                          trailColor: "rgba(255,255,255,0.08)",
                          textColor: "#ffffff",
                          textSize: "20px",
                          strokeLinecap: "round"
                        })}
                      />
                    </div>
                    <div>
                      <div className="text-white/70 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{t.confidence}</div>
                      <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
                        {hero.accuracy?.toFixed(1) ?? "--"}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        IMP: {meta.raw_adc} Ω
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Consumer Intelligence Layer */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <ActivitySquare className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-300">{t.consumer_intel}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                {/* Circular Safety Score Gauge */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm p-6 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="w-32 h-32 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <CircularProgressbar
                      value={safetyScore}
                      text={`${safetyScore}`}
                      styles={buildStyles({
                        pathColor: safetyColor,
                        trailColor: "rgba(30, 41, 59, 0.5)",
                        textColor: "#f8fafc",
                        textSize: "24px",
                        strokeLinecap: "round"
                      })}
                    />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mt-5 bg-slate-950/50 px-4 py-1.5 rounded-full border border-slate-800">
                    {t.safety_score}
                  </div>
                </div>

                {/* pH Meter and Shelf-Life Timers */}
                <div className="md:col-span-2 flex flex-col gap-5">
                  <PHThermometer value={phValue} t={t} />
                  <div className="grid grid-cols-2 gap-5 flex-1">
                    <DigitalTimer label={t.countertop_timer} value={primary["12_countertop_timer_hrs"] || "--"} />
                    <DigitalTimer label={t.fridge_timer} value={primary["13_fridge_timer_hrs"] || "--"} />
                  </div>
                </div>
              </div>

              {/* Kitchen Directive Card */}
              <div className="rounded-2xl border border-cyan-900/50 bg-cyan-950/20 backdrop-blur-sm p-5 mb-6 flex items-center gap-4 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <ClipboardCheck className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-cyan-500/80 font-bold mb-1">{t.kitchen_directive}</div>
                  <div className="text-lg font-semibold text-cyan-50 tracking-wide">{primary["11_kitchen_directive"] || "--"}</div>
                </div>
              </div>

              {/* Dynamic 16-Grid Telemetry Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(primary).map(([k, val]) => {
                  if (k === "11_kitchen_directive" || k === "1_safety_score" || k === "21_REAL_TIME_PH_METER" || k.includes("timer")) return null;
                  const IconComponent = getMetricIcon(k);
                  return (
                    <PrimaryCard
                      key={k}
                      icon={IconComponent}
                      label={cleanLabel(k)}
                      value={String(val ?? "--")}
                    />
                  );
                })}
              </div>
            </section>

            {/* Deep Technical Lab Layer */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-300">{t.deep_lab}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* High-frequency streaming line chart with animations disabled for peak performance */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{t.eis_waveform}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 tabular-nums">
                        {zHistory.length > 0 ? `${zHistory[zHistory.length - 1]?.z} Ω` : "--"}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={zHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <XAxis dataKey="t" hide />
                      <YAxis domain={[50, 1050]} hide />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          border: "1px solid rgba(51, 65, 85, 0.5)",
                          borderRadius: "12px",
                          backdropFilter: "blur(4px)",
                          color: "#f8fafc",
                          fontSize: "12px"
                        }}
                        itemStyle={{ color: "#22d3ee" }}
                        formatter={(v) => [`${v} Ω`, "Impedance Magnitude"]}
                        labelFormatter={() => ""}
                      />
                      <Line
                        type="monotone"
                        dataKey="z"
                        stroke="#22d3ee"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false} // Performance constraint: stops canvas recalculation spikes
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* AI Probability Distribution Radar Chart */}
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">{t.ai_prob}</div>
                  <ResponsiveContainer width="100%" height={230}>
                    <RadarChart data={radarData} outerRadius={75}>
                      <PolarGrid stroke="rgba(51, 65, 85, 0.5)" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                      <Radar
                        dataKey="value"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="#22d3ee"
                        fillOpacity={0.25}
                        isAnimationActive={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          border: "1px solid rgba(51, 65, 85, 0.5)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "12px"
                        }}
                        itemStyle={{ color: "#22d3ee" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Deep Telemetry Data Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <MetricTable icon={ActivitySquare} title="EIS DSP Telemetry" data={secondary.eis_dsp_telemetry} />
                <MetricTable icon={Cpu} title="Randles Circuit Equivalent" data={secondary.randles_circuit_parameters} />
                <MetricTable icon={FlaskConical} title="Biochemical Physics" data={secondary.biochemical_physics} />
                <MetricTable icon={IndianRupee} title="Rheology & Economics" data={secondary.dairy_rheology_economics} />
                <div className="lg:col-span-2">
                  <MetricTable
                    icon={ShieldCheck}
                    title="AI & Regulatory Metrology"
                    data={secondary.ai_and_regulatory_metrology}
                    formatValue={(key, value) =>
                      key === "35_Class_Probability_Distribution"
                        ? radarData.map((d) => `${d.name} (${d.value}%)`).join(" • ")
                        : String(value)
                    }
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: HEALTH, NUTRITION & FRAUD ECONOMICS                               */}
        {/* ======================================================================= */}
        {activeTab === "health" && (
          <div className="space-y-6">
            {/* Economic Fraud Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-500/30">
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400">Monthly Household Fraud Loss</h3>
                    <p className="text-[11px] text-slate-400">Estimated based on 1.0 Litre daily family consumption</p>
                  </div>
                </div>
                <div className="text-5xl font-black text-white mb-2 tabular-nums">₹{monthlyLoss}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Financial capital lost paying pure milk rates for water dilution or synthetic surfactants.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">True Fair Market Value</h3>
                    <p className="text-[11px] text-slate-400">Calibrated against missing SNF (Solids-Not-Fat)</p>
                  </div>
                </div>
                <div className="text-5xl font-black text-white mb-2 tabular-nums">₹{trueMarketPrice} / L</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fair transactional price calibrated against genuine fat content and chemical dilution.
                </p>
              </div>
            </div>

            {/* Physiological & Household Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 flex flex-col items-center text-center">
                <HeartPulse className="w-10 h-10 text-rose-400 mb-3" />
                <div className="text-3xl font-black text-white mb-1 tabular-nums">{caloriesPerGlass} kcal</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Per 250ml Glass (Digestible)</div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, caloriesPerGlass / 1.8)}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 flex flex-col items-center text-center">
                <Scale className="w-10 h-10 text-emerald-400 mb-3" />
                <div className="text-3xl font-black text-white mb-1 tabular-nums">{calciumIndex}%</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bioavailable Calcium Density</div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${calciumIndex}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 flex flex-col items-center text-center">
                <Flame className="w-10 h-10 text-amber-400 mb-3" />
                <div className="text-3xl font-black text-white mb-1 tabular-nums">{boilingTime} Mins</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Boiling Sterilization Threshold</div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(boilingTime / 15) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Medical Profiles Section */}
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Clinical Safety Profiles</h3>
                </div>
                <label className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={pregnancyMode}
                    onChange={(e) => setPregnancyMode(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer rounded"
                  />
                  <span>Pregnancy & Infant Safety Mode</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">
                    {pregnancyMode ? "Fetal Toxicity Risk" : "General Toxicity Risk"}
                  </div>
                  <div className={`text-xl font-black mb-2 ${isToxic ? "text-rose-400" : "text-emerald-400"}`}>
                    {isToxic ? "CRITICAL HAZARD" : "Within Safety Tolerance"}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isToxic
                      ? "Surfactants or urea detected. Molecular components compromise gut flora and induce acute renal inflammation."
                      : "No synthetic surfactant anomalies or phase-angle disruptions detected."}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">Diabetic Starch Warning</div>
                  <div className={`text-xl font-black mb-2 ${hero.adulteration_type.includes("Starch") ? "text-amber-400" : "text-emerald-400"}`}>
                    {hero.adulteration_type.includes("Starch") ? "Rapid Glycemic Spike" : "Zero Synthetic Starches"}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Starch adulterants are metabolized instantly into simple sugars, causing postprandial hyperglycemia in diabetic patients.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">Geriatric Gastric Compatibility</div>
                  <div className={`text-xl font-black mb-2 ${phValue < 6.4 ? "text-amber-400" : "text-emerald-400"}`}>
                    {phValue < 6.4 ? "High Acidosis Risk" : "Neutral Gastric Transit"}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sub-6.4 pH milk induces gastroesophageal reflux and curdles prematurely in senior individuals with compromised stomach acid buffering.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: OPTICAL FOOD COMPUTER VISION LAB                                */}
        {/* ======================================================================= */}
        {activeTab === "vision" && (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ScanFace className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Client-Side Optical Diagnostic Lab</h3>
                <p className="text-xs text-slate-400">Local RGB Spectrophotometric Pixel Extraction Engine</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-700 border-dashed rounded-2xl cursor-pointer bg-slate-950/50 hover:bg-slate-900/80 transition-all group">
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Camera className="w-10 h-10 text-slate-500 mb-3 group-hover:text-cyan-400 transition-colors" />
                    <p className="text-sm font-semibold text-slate-300 mb-1">Upload Milk Sample Photograph</p>
                    <p className="text-xs text-slate-500">100% Offline Canvas Pixel Buffer Extractor</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                {labImage && (
                  <button
                    onClick={executeOpticalAnalysis}
                    disabled={isAnalyzingImage}
                    className="mt-4 w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40"
                  >
                    {isAnalyzingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    <span>{isAnalyzingImage ? "Evaluating Pixel Matrix…" : "Run Spectrophotometry"}</span>
                  </button>
                )}
              </div>

              <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-6 flex flex-col">
                {!labImage ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting Image Ingestion</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="flex gap-4 items-center mb-6">
                      <img src={labImage} alt="Sample Target" className="w-24 h-24 object-cover rounded-xl border border-slate-700 shadow-md" />
                      <div className="flex-1 space-y-2">
                        <div className="text-xs font-semibold text-slate-300">DOM Image Buffer Staged</div>
                        <div className="text-[11px] text-slate-500 font-mono">Status: Ready for Spectrophotometry</div>
                      </div>
                    </div>

                    <canvas ref={visionCanvasRef} className="hidden" />

                    {labResults && (
                      <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 space-y-4 animate-in fade-in">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chrominance Vector (RGB)</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-center font-mono text-xs text-rose-300">
                            R: {labResults.r}
                          </div>
                          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-center font-mono text-xs text-emerald-300">
                            G: {labResults.g}
                          </div>
                          <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-center font-mono text-xs text-blue-300">
                            B: {labResults.b}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Optical Whiteness Index</div>
                          <div className={`text-base font-black ${
                            labResults.alertLevel === "critical"
                              ? "text-rose-400"
                              : labResults.alertLevel === "danger"
                              ? "text-blue-400"
                              : labResults.alertLevel === "warning"
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}>
                            {labResults.verdict}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: LOCAL NLP ASSISTANT CHATBOT                                    */}
        {/* ======================================================================= */}
        {activeTab === "assistant" && (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 h-[620px] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Smart Spoon Biosensor Assistant</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Rule-Engine Online & Telemetry-Linked</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.map((item, idx) => (
                <div key={idx} className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 text-xs md:text-sm leading-relaxed ${
                      item.sender === "user"
                        ? "bg-cyan-600 text-white rounded-tr-none"
                        : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none"
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
              <div ref={chatScrollRef} />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <form onSubmit={handleChatSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Inquire on urea adulteration, FSSAI rules, pH standards, boiling time…"
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 text-xs md:text-sm text-white outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white p-3 rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 5: ACCESSIBILITY, A11Y & SENSORY SAFETY ENGINE                     */}
        {/* ======================================================================= */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Visual Accessibility Engine</h3>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div>
                  <div className="font-semibold text-white text-xs">High Contrast Mode</div>
                  <div className="text-[11px] text-slate-400">Elevates contrast ratios for low-vision environments</div>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    highContrast ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {highContrast ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div>
                  <div className="font-semibold text-white text-xs">Dyslexia-Optimized Typography</div>
                  <div className="text-[11px] text-slate-400">Applies high-legibility font weighting</div>
                </div>
                <button
                  onClick={() => setDyslexicFont(!dyslexicFont)}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                    dyslexicFont ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {dyslexicFont ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-white text-xs">Global Text Scaling</div>
                  <div className="text-[11px] text-slate-400">Scales all typography across all dashboards</div>
                </div>
                <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setFontSizeMultiplier(0.9)}
                    className={`px-3 py-1 rounded text-xs ${fontSizeMultiplier === 0.9 ? "bg-cyan-500 text-black font-bold" : "text-slate-300"}`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSizeMultiplier(1.0)}
                    className={`px-3 py-1 rounded text-xs ${fontSizeMultiplier === 1.0 ? "bg-cyan-500 text-black font-bold" : "text-slate-300"}`}
                  >
                    1.0x
                  </button>
                  <button
                    onClick={() => setFontSizeMultiplier(1.15)}
                    className={`px-3 py-1 rounded text-xs ${fontSizeMultiplier === 1.15 ? "bg-cyan-500 text-black font-bold" : "text-slate-300"}`}
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-rose-400 mb-3">
                <AlertOctagon className="w-6 h-6" />
                <h3 className="text-base font-bold">Emergency Audio Siren Simulator</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Generates a square-wave 880Hz audio emergency pulse via the browser Web Audio API for alerting visually impaired users of chemical adulteration.
              </p>
              <button
                onClick={() => {
                  try {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (!AudioCtx) return;
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "square";
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 1.2);
                    setStatusToast({ type: "success", text: "Emergency hardware siren dispatched to audio output." });
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full py-4 bg-rose-600/20 border border-rose-500/50 hover:bg-rose-600 text-rose-200 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-950/50"
              >
                Dispatch Test Siren
              </button>
            </div>
          </div>
        )}

        {/* Global Metrology Footer */}
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-t border-slate-800/50 pt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>TIMESTAMP: <span className="text-slate-300 font-mono ml-1">{meta.timestamp}</span></span>
            <span>ADC: <span className="text-slate-300 font-mono ml-1">{meta.raw_adc}</span></span>
            <span>PROBE TEMP: <span className="text-slate-300 font-mono ml-1">{meta.probe_temperature_c}°C</span></span>
            <span>EXCITATION: <span className="text-slate-300 font-mono ml-1">{meta.excitation_frequency_hz} Hz</span></span>
            <span>COM PORT: <span className="text-slate-300 font-mono ml-1">{meta.com_port}</span></span>
          </div>
          <div className="text-slate-600 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            SMART_SPOON_AI SECURE TELEMETRY
          </div>
        </footer>
      </main>

      {/* ======================================================================= */}
      {/* HTML2CANVAS HIDDEN DOM CERTIFICATE NODE                                 */}
      {/* Mounted at top:0, left:0 with z-index:-50 & opacity:0 per constraint   */}
      {/* ======================================================================= */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -50,
          opacity: 0,
          pointerEvents: "none"
        }}
      >
        <div
          ref={certificateRef}
          className="w-[1000px] h-[750px] bg-slate-50 p-12 text-slate-900 font-sans border-[16px] border-slate-900 flex flex-col justify-between"
          style={{ backgroundImage: "radial-gradient(circle at top right, #ffffff, #f1f5f9)" }}
        >
          {/* Certificate Header */}
          <div className="flex justify-between items-end border-b-4 border-cyan-600 pb-6">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-600 mb-1">TEAM TESLA • LAB METROLOGY DIVISION</div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Smart_spoon_AI Official Diagnostic Report</h1>
              <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-1">Conforms to FSSAI Dairy Metrology Standards (Act 2006)</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Telemetry Timestamp</div>
              <div className="text-sm font-semibold font-mono text-slate-800">{meta.timestamp || new Date().toLocaleString()}</div>
            </div>
          </div>

          {/* Certificate Main Verdict */}
          <div className="flex-1 flex flex-col items-center justify-center text-center my-6">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold mb-3">Electrochemical Classification Result</div>
            <div
              className="text-6xl font-black mb-4 tracking-tight leading-tight uppercase"
              style={{ color: isToxic ? "#dc2626" : "#059669" }}
            >
              {hero.adulteration_type}
            </div>
            <div className="bg-slate-200/70 border border-slate-300 px-6 py-2 rounded-full mb-8">
              <span className="text-lg font-medium text-slate-700">
                Neural Network Confidence: <strong className="text-slate-950 font-black">{hero.accuracy?.toFixed(1) ?? 0}%</strong>
              </span>
            </div>

            {/* Metrological Values Grid */}
            <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Safety Index</div>
                <div className="text-2xl font-black text-slate-800">{safetyScore}/100</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Impedance</div>
                <div className="text-2xl font-black text-slate-800 font-mono">{meta.raw_adc} Ω</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Electrode pH</div>
                <div className="text-2xl font-black text-slate-800">{phValue.toFixed(2)}</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Dilution Factor</div>
                <div className="text-2xl font-black text-slate-800">{waterPct}%</div>
              </div>
            </div>
          </div>

          {/* Certificate Authorization Seal & Cryptographic Hash */}
          <div className="border-t border-slate-300 pt-6 flex justify-between items-end">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Cryptographic Sensor Signature</div>
              <div className="text-sm font-black text-slate-900 tracking-wider">TEAM TESLA HARDWARE ENGINE</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                HASH: {meta.raw_adc}-{meta.excitation_frequency_hz}-{meta.probe_temperature_c}-OK
              </div>
            </div>

            <div className="w-24 h-24 rounded-full border-4 border-cyan-700 flex items-center justify-center rotate-[-12deg] shadow-md bg-white">
              <div className="w-20 h-20 rounded-full border border-dashed border-cyan-600 flex items-center justify-center text-center">
                <span className="text-cyan-800 font-black uppercase tracking-widest text-[9px] leading-tight">
                  Team Tesla<br />Verified<br />Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}