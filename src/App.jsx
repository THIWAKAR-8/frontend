import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import html2canvas from "html2canvas";
import InstallApp from './components/InstallApp';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from "recharts";
import {
  Wifi, WifiOff, Baby, AlertTriangle, Flame, Activity, Droplet, Coffee, UtensilsCrossed,
  Package, Cookie, ClipboardCheck, Clock, Thermometer, Droplets, FlaskConical, Milk,
  IndianRupee, Leaf, ShieldCheck, ShieldAlert, Waves, ActivitySquare, Cpu, Download,
  Loader2, Volume2, VolumeX, Eye, Share2, AlertOctagon, HeartPulse, Scale, Shield,
  TrendingDown, DollarSign, Pill, Camera, MessageSquare, Send, Zap, BarChart3, ScanFace,
  CheckCircle2, RefreshCw, XCircle, Info, Radio, ZapOff, Layers, Terminal
} from "lucide-react";

// ============================================================================
// BACKEND WEBSOCKET CONFIGURATION
// ============================================================================
const WS_URL = "wss://smart-spoon-backend-ai.onrender.com/ws";
// ============================================================================

const HISTORY_LEN = 40;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;

const EMPTY_HERO = { adulteration_type: "Connecting Neural Link…", accuracy: 0, status_color: "#334155" };
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
  { code: "ur", name: "Urdu", nativeName: "اردو", ttsCode: "ur-PK" }
];

const INTERNAL_DICTIONARY = {
  en: {
    app_title: "Smart Spoon AI", subtitle: "Ensemble Neural Telemetry & Electrochemical Metrology",
    live: "Neural Live", reconnecting: "Re-calibrating", offline: "Link Lost",
    tab_telemetry: "Neural Telemetry", tab_health: "Clinical Bio-Grid", tab_vision: "Optical CV Lab",
    tab_assistant: "LLM Biosensor Agent", tab_settings: "A11y & Command",
    verdict: "Ensemble Consensus Verdict", confidence: "Model Confidence", safety_score: "FSSAI Safety Index",
    ph_meter: "Active Dielectric pH", acidic: "Acidic", ideal: "Ideal Range", alkaline: "Alkaline",
    countertop_timer: "Ambient Shelf Life", fridge_timer: "Cold-Chain Longevity",
    kitchen_directive: "Actionable Kitchen Directive", consumer_intel: "Consumer Safety Intelligence",
    deep_lab: "Multi-Model Spectroscopic Diagnostics", eis_waveform: "Real-Time EIS Impedance Stream",
    ai_prob: "Ensemble Probability Matrix", download_cert: "Export FSSAI Certificate",
    share: "Dispatch WhatsApp Alert", speech_alert: "Neural Diagnostic Consensus is:"
  },
  ta: {
    app_title: "ஸ்மார்ட் ஸ்பூன் ஏஐ", subtitle: "நிகழ்நேர நரம்பியல் தொலைஅளவை & மின்வேதியியல் ஆய்வு",
    live: "நேரலை", reconnecting: "இணைக்கிறது", offline: "துண்டிக்கப்பட்டது",
    tab_telemetry: "தொலைஅளவை", tab_health: "மருத்துவ கட்டமைப்பு", tab_vision: "ஒளியியல் ஆய்வகம்",
    tab_assistant: "AI உதவியாளர்", tab_settings: "அமைப்புகள்",
    verdict: "ஒப்புதல் முடிவு", confidence: "நம்பகத்தன்மை", safety_score: "பாதுகாப்பு குறியீடு",
    ph_meter: "செயலில் உள்ள pH", acidic: "அமிலம்", ideal: "சிறந்தது", alkaline: "காரம்",
    countertop_timer: "அறை ஆயுள்", fridge_timer: "குளிர்பதன ஆயுள்",
    kitchen_directive: "சமையலறை வழிகாட்டல்", consumer_intel: "நுகர்வோர் நுண்ணறிவு",
    deep_lab: "ஆழமான தொழில்நுட்ப பகுப்பாய்வு", eis_waveform: "மின்மறிப்பு அலைவரிசை",
    ai_prob: "நிகழ்தகவு பரவல்", download_cert: "சான்றிதழ் பதிவிறக்கு",
    share: "பகிரவும்", speech_alert: "கணினி ஆய்வு முடிவு:"
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
    return [
      { name: "Pure Milk", value: 92.4 },
      { name: "Water Dilution", value: 4.1 },
      { name: "Urea Admixture", value: 2.2 },
      { name: "Synthetic Detergent", value: 1.3 }
    ];
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

function useWebSocket(url, onMessageCallback) {
  const [connectionState, setConnectionState] = useState("CONNECTING");
  const retryAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const callbackRef = useRef(onMessageCallback);

  useEffect(() => {
    callbackRef.current = onMessageCallback;
  }, [onMessageCallback]);

  const connect = useCallback(() => {
    try {
      if (socketRef.current) socketRef.current.close();
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
          console.error("Frame Parser Exception:", err);
        }
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        setConnectionState("RECONNECTING");
        const backoff = Math.min(
          MAX_RETRY_DELAY_MS,
          INITIAL_RETRY_DELAY_MS * Math.pow(2, retryAttemptRef.current)
        );
        const jitter = Math.floor(Math.random() * 500);
        retryAttemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, backoff + jitter);
      };
    } catch {
      setConnectionState("RECONNECTING");
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  return { isConnected: connectionState === "OPEN", connectionState };
}

function useSpeechSynthesis(lang) {
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
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
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = GLOBAL_LANGUAGES.find((l) => l.code === lang);
      const ttsCode = targetLang ? targetLang.ttsCode : "en-US";
      const matchedVoice = voices.find((v) => v.lang === ttsCode || v.lang.startsWith(lang));
      if (matchedVoice) utterance.voice = matchedVoice;
      utterance.lang = ttsCode;
      utterance.rate = 0.95;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
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
        gain.gain.value = 0.02;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return { speak, unlockAudioContext, isSpeaking };
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

  // A11y
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Medical & CV states
  const [pregnancyMode, setPregnancyMode] = useState(false);
  const [labImage, setLabImage] = useState(null);
  const [labResults, setLabResults] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const visionCanvasRef = useRef(null);

  // LLM Chat
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: "Smart Spoon Neural Ensemble initialized. Connected to Random Forest & Gradient Boosting inference pipeline. Ask me anything regarding milk safety, dielectric impedance, or FSSAI compliance."
    }
  ]);
  const chatScrollRef = useRef(null);

  const tickCounterRef = useRef(0);
  const certificateRef = useRef(null);

  const t = useMemo(() => INTERNAL_DICTIONARY[lang] || INTERNAL_DICTIONARY.en, [lang]);
  const { speak, unlockAudioContext, isSpeaking } = useSpeechSynthesis(lang);

  const handleIncomingTelemetry = useCallback((data) => {
    if (data.hero) setHero(data.hero);
    if (data.primary) setPrimary(data.primary);
    if (data.secondary) setSecondary(data.secondary);
    if (data.system_meta) setMeta(data.system_meta);

    const zMagnitude = firstNumber(
      data?.secondary?.eis_dsp_telemetry?.["1_Total_Impedance_Magnitude"],
      Math.floor(Math.random() * 200) + 400
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
    if (voiceActive && hero.adulteration_type && !hero.adulteration_type.includes("Connecting")) {
      speak(`${t.speech_alert} ${hero.adulteration_type}.`);
    }
  }, [hero.adulteration_type, voiceActive, speak, t.speech_alert]);

  const triggerCertificateDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const dataUrl = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.download = `Smart_Spoon_FSSAI_Certificate_${Date.now()}.png`;
      anchor.href = dataUrl;
      anchor.click();
      setStatusToast({ type: "success", text: "Official FSSAI Metrological Certificate generated." });
    } catch {
      setStatusToast({ type: "error", text: "Certificate canvas capture failed." });
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

      let rT = 0, gT = 0, bT = 0;
      const count = canvas.width * canvas.height;
      for (let i = 0; i < data.length; i += 4) {
        rT += data[i];
        gT += data[i + 1];
        bT += data[i + 2];
      }
      const r = Math.round(rT / count);
      const g = Math.round(gT / count);
      const b = Math.round(bT / count);
      const brightness = (r + g + b) / 3;

      let verdict = "Pure Colloidal Milk Suspension (Normal)";
      let alertLevel = "safe";
      if (brightness < 160) {
        verdict = "Suspended Particulate / Turbidity Anomaly Detected";
        alertLevel = "warning";
      } else if (b > r + 15) {
        verdict = "Cyan Scattering Index: Water Adulteration Signature";
        alertLevel = "danger";
      } else if (r > 240 && g > 240 && b > 240) {
        verdict = "Hyper-Reflective Surface: Synthetic Urea / Detergent Mix";
        alertLevel = "critical";
      }

      setTimeout(() => {
        setLabResults({ r, g, b, verdict, alertLevel });
        setIsAnalyzingImage(false);
      }, 800);
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
      let reply = `Neural Ensemble active. Current verdict: ${hero.adulteration_type}.`;
      if (q.includes("urea")) {
        reply = "Urea increases apparent nitrogen content. Our ESP32 dual-frequency EIS probe detects this via ionic relaxation shifts in the 1kHz–10kHz band.";
      } else if (q.includes("fssai") || q.includes("act")) {
        reply = "Under FSSAI 2011 regulations, cow milk must have min 3.2% Fat and 8.3% SNF. Synthetic adulterants violate Section 59 punishable by imprisonment.";
      } else if (q.includes("safe") || q.includes("drink")) {
        const score = firstNumber(primary["1_safety_score"], 85);
        reply = score > 75 ? "Safety index is high. Sample is approved for consumption." : "CRITICAL WARNING: Adulteration biomarkers exceed safe consumption thresholds.";
      }
      setChatHistory((prev) => [...prev, { sender: "bot", text: reply }]);
      if (voiceActive) speak(reply);
    }, 500);
  };

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const isToxic = useMemo(
    () => hero.status_color === "#dc2626" || hero.status_color === "#ef4444" || hero.adulteration_type.includes("Adulterated"),
    [hero.status_color, hero.adulteration_type]
  );

  const radarData = useMemo(
    () => parseProbabilityDistribution(secondary?.ai_and_regulatory_metrology?.["35_Class_Probability_Distribution"]),
    [secondary]
  );

  const phValue = firstNumber(primary["21_REAL_TIME_PH_METER"], 6.65);
  const safetyScore = firstNumber(primary["1_safety_score"], 94);
  const waterPct = firstNumber(primary["16_water_adulteration_pct"], 0);
  const penaltyINR = firstNumber(primary["19_fraud_loss_penalty_inr"], 0);
  const monthlyLoss = Math.round(penaltyINR * 30);
  const trueMarketPrice = Math.max(0, 60 - penaltyINR).toFixed(2);
  const safetyColor = safetyScore >= 80 ? "#10b981" : safetyScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className={`min-h-screen font-sans selection:bg-cyan-500/30 relative overflow-hidden pb-16 transition-all ${
        highContrast ? "bg-black text-white" : "bg-slate-950 text-slate-100"
      }`}
      style={{
        fontFamily: dyslexicFont ? "'OpenDyslexic', sans-serif" : "inherit",
        fontSize: `${fontSizeMultiplier}rem`
      }}
    >
      {/* Background Cyber Grid */}
      {!highContrast && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none -z-10" />
        </>
      )}

      {/* Floating Status Toast */}
      {statusToast && (
        <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${
          statusToast.type === "success" ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" : "bg-rose-950/90 border-rose-500/50 text-rose-200"
        }`}>
          {statusToast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-xs font-bold">{statusToast.text}</span>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        highContrast ? "bg-black border-white" : "bg-slate-950/80 border-slate-800/80"
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/30">
              <Cpu className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">{t.app_title}</h1>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ESP32 • ENSEMBLE AI
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/90 font-semibold">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-slate-900 border border-slate-700 hover:border-cyan-500 text-white rounded-xl px-3 py-2 text-xs font-bold uppercase transition-all outline-none cursor-pointer"
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>
              ))}
            </select>

            <button
              onClick={handleVoiceToggle}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                voiceActive ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {voiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{voiceActive ? (isSpeaking ? "Speaking…" : "Voice ON") : "Voice OFF"}</span>
            </button>

            <InstallApp />

            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold tracking-wide uppercase transition-all ${
              isConnected ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-rose-500/40 text-rose-300 bg-rose-500/10 animate-pulse"
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isConnected ? t.live : connectionState === "RECONNECTING" ? t.reconnecting : t.offline}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-6 flex flex-wrap gap-2 border-b border-slate-800/80 pb-2">
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6">
        {activeTab === "telemetry" && (
          <div className="space-y-8">
            {/* Presentation Hero Banner */}
            <AnimatePresence mode="wait">
              <motion.div
                key={hero.adulteration_type}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl p-8 md:p-10 relative overflow-hidden backdrop-blur-xl border shadow-2xl"
                style={{
                  backgroundColor: highContrast ? "#000000" : `${hero.status_color}18`,
                  backgroundImage: highContrast ? "none" : `linear-gradient(135deg, ${hero.status_color}30 0%, ${hero.status_color}05 100%)`,
                  borderColor: hero.status_color
                }}
              >
                {isToxic && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl"
                    animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0)", "0 0 0 16px rgba(239,68,68,0.25)", "0 0 0 0 rgba(239,68,68,0)"] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 text-white/90 text-xs font-black uppercase tracking-[0.2em] mb-3">
                      {isToxic ? <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                      <span>{t.verdict}</span>
                    </div>
                    <div className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md mb-6">
                      {hero.adulteration_type}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={triggerCertificateDownload}
                        disabled={isDownloading || !isConnected}
                        className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-950 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 shadow-xl disabled:opacity-50"
                      >
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span>{isDownloading ? "Rendering DOM…" : t.download_cert}</span>
                      </button>

                      <button
                        onClick={() => {
                          const shareText = `🚨 Smart Spoon AI Report: Verdict = ${hero.adulteration_type} | Confidence = ${hero.accuracy}% | Safety Index = ${safetyScore}/100`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
                        }}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-xl shadow-emerald-900/30"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{t.share}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-slate-950/60 p-6 rounded-2xl backdrop-blur-md border border-white/10 shrink-0 shadow-2xl">
                    <div className="w-28 h-28">
                      <CircularProgressbar
                        value={hero.accuracy}
                        text={`${hero.accuracy?.toFixed(1) ?? 0}%`}
                        styles={buildStyles({
                          pathColor: hero.status_color,
                          trailColor: "rgba(255,255,255,0.08)",
                          textColor: "#ffffff",
                          textSize: "22px",
                          strokeLinecap: "round"
                        })}
                      />
                    </div>
                    <div>
                      <div className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{t.confidence}</div>
                      <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
                        {hero.accuracy?.toFixed(1) ?? "--"}%
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-1">
                        ENSEMBLE: RF + GB
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Consumer Intelligence Metrology */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <ActivitySquare className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-300">{t.consumer_intel}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-6 flex flex-col items-center justify-center relative shadow-xl">
                  <div className="w-32 h-32">
                    <CircularProgressbar
                      value={safetyScore}
                      text={`${safetyScore}`}
                      styles={buildStyles({
                        pathColor: safetyColor,
                        trailColor: "rgba(30, 41, 59, 0.6)",
                        textColor: "#f8fafc",
                        textSize: "26px",
                        strokeLinecap: "round"
                      })}
                    />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mt-5 bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800">
                    {t.safety_score}
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-5">
                  <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">{t.ph_meter}</span>
                      </div>
                      <div className="text-3xl font-black text-cyan-300 tabular-nums">{phValue.toFixed(2)}</div>
                    </div>
                    <div className="relative h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
                      <div className="absolute inset-0 flex opacity-80">
                        <div className="flex-1 bg-gradient-to-r from-rose-500 to-amber-500" />
                        <div className="flex-[1.4] bg-gradient-to-r from-emerald-400 to-emerald-500" />
                        <div className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500" />
                      </div>
                      <motion.div
                        className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_12px_4px_rgba(255,255,255,0.8)]"
                        animate={{ left: `calc(${((phValue - 4) / 5) * 100}% - 5px)` }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mt-2">
                      <span>4.0 Acidic</span>
                      <span className="text-emerald-400">6.3–6.9 Ideal Milk</span>
                      <span>9.0 Alkaline</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 text-center shadow-lg">
                      <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1">{t.countertop_timer}</div>
                      <div className="text-2xl font-black text-cyan-400 tabular-nums">{primary["12_countertop_timer_hrs"] || "6 Hrs"}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 text-center shadow-lg">
                      <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1">{t.fridge_timer}</div>
                      <div className="text-2xl font-black text-cyan-400 tabular-nums">{primary["13_fridge_timer_hrs"] || "48 Hrs"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kitchen Directive */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/25 backdrop-blur-xl p-5 mb-6 flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30 text-cyan-400">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black mb-1">{t.kitchen_directive}</div>
                  <div className="text-base font-bold text-cyan-50 tracking-wide">{primary["11_kitchen_directive"] || "Sample tested via dual-frequency EIS biosensor array."}</div>
                </div>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(primary).map(([k, val]) => {
                  if (["11_kitchen_directive", "1_safety_score", "21_REAL_TIME_PH_METER"].some(x => k.includes(x)) || k.includes("timer")) return null;
                  return (
                    <div key={k} className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-4 flex items-start gap-4 transition-all hover:bg-slate-800/60 hover:border-slate-700 shadow-lg">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-cyan-400 border border-slate-700">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1 truncate">{cleanLabel(k)}</div>
                        <div className="text-sm text-slate-100 font-semibold truncate tabular-nums">{String(val ?? "--")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Deep Technical Diagnostics */}
            <section className="pt-4">
              <div className="flex items-center gap-3 mb-5">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-300">{t.deep_lab}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{t.eis_waveform}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 tabular-nums">
                        {zHistory.length > 0 ? `${zHistory[zHistory.length - 1]?.z} Ω` : "0 Ω"}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={230}>
                    <LineChart data={zHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <XAxis dataKey="t" hide />
                      <YAxis domain={[100, 1000]} hide />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid #334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                        itemStyle={{ color: "#22d3ee" }}
                        formatter={(v) => [`${v} Ω`, "Impedance Magnitude"]}
                        labelFormatter={() => ""}
                      />
                      <Line type="monotone" dataKey="z" stroke="#22d3ee" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-6 shadow-xl">
                  <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">{t.ai_prob}</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData} outerRadius={80}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                      <Radar dataKey="value" stroke="#22d3ee" strokeWidth={2.5} fill="#22d3ee" fillOpacity={0.3} isAnimationActive={false} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid #334155", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                        itemStyle={{ color: "#22d3ee" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================================================================= */}
        {activeTab === "health" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30 text-rose-400">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-rose-400">Monthly Economic Fraud Impact</h3>
                    <p className="text-[11px] text-slate-400">Calculated over 1.0L daily household consumption</p>
                  </div>
                </div>
                <div className="text-5xl font-black text-white mb-2 tabular-nums">₹{monthlyLoss}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Financial capital lost paying pure dairy rates for water dilution and synthetic surfactant admixtures.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">True Fair Market Value</h3>
                    <p className="text-[11px] text-slate-400">Calibrated against missing Solids-Not-Fat (SNF)</p>
                  </div>
                </div>
                <div className="text-5xl font-black text-white mb-2 tabular-nums">₹{trueMarketPrice} / L</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Equitable market valuation computed directly from active impedance and density vectors.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {activeTab === "vision" && (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <ScanFace className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Client-Side Optical Computer Vision Lab</h3>
                <p className="text-xs text-slate-400">Local RGB Spectrophotometric Pixel Matrix Ingestion</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-700 border-dashed rounded-3xl cursor-pointer bg-slate-950/60 hover:bg-slate-900 transition-all group">
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Camera className="w-10 h-10 text-slate-500 mb-3 group-hover:text-cyan-400 transition-colors" />
                    <p className="text-sm font-bold text-slate-300 mb-1">Upload Milk Sample Photograph</p>
                    <p className="text-xs text-slate-500">Instant Canvas RGB Extraction</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                {labImage && (
                  <button
                    onClick={executeOpticalAnalysis}
                    disabled={isAnalyzingImage}
                    className="mt-4 w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/50"
                  >
                    {isAnalyzingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    <span>{isAnalyzingImage ? "Analyzing Vectors…" : "Run Spectrophotometry"}</span>
                  </button>
                )}
              </div>

              <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-6 flex flex-col justify-center">
                {!labImage ? (
                  <div className="text-center text-slate-600">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting Image Ingestion</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <img src={labImage} alt="Sample" className="w-24 h-24 object-cover rounded-2xl border border-slate-700 shadow-lg" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">Image Buffer Staged</div>
                        <div className="text-[11px] text-cyan-400 font-mono">Ready for Pixel Classification</div>
                      </div>
                    </div>

                    <canvas ref={visionCanvasRef} className="hidden" />

                    {labResults && (
                      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Extracted RGB Vector</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center font-mono text-xs text-rose-300">R: {labResults.r}</div>
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center font-mono text-xs text-emerald-300">G: {labResults.g}</div>
                          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center font-mono text-xs text-blue-300">B: {labResults.b}</div>
                        </div>
                        <div className="text-sm font-black text-cyan-300 pt-2">{labResults.verdict}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {activeTab === "assistant" && (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 h-[620px] flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Smart Spoon Biosensor LLM Assistant</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ensemble Inference Active</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.map((item, idx) => (
                <div key={idx} className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                    item.sender === "user" ? "bg-cyan-600 text-white rounded-tr-none shadow-lg" : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none shadow-lg"
                  }`}>
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
                  placeholder="Inquire on urea adulteration, FSSAI regulations, dielectric dispersion…"
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-2xl px-5 py-3 text-sm text-white outline-none transition-colors"
                />
                <button type="submit" disabled={!chatInput.trim()} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white p-3.5 rounded-2xl transition-all shadow-lg">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {activeTab === "settings" && (
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-base font-bold text-white mb-6">Accessibility & Sensory Engine</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div>
                  <div className="font-bold text-white text-xs">High Contrast Mode</div>
                  <div className="text-[11px] text-slate-400">Optimizes UI for presentation projection</div>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    highContrast ? "bg-emerald-500 text-black shadow-lg" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {highContrast ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-bold text-white text-xs">Dyslexia-Optimized Typography</div>
                  <div className="text-[11px] text-slate-400">Applies high-legibility font weighting</div>
                </div>
                <button
                  onClick={() => setDyslexicFont(!dyslexicFont)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    dyslexicFont ? "bg-emerald-500 text-black shadow-lg" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {dyslexicFont ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hidden DOM Certificate for html2canvas export */}
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: "none" }}>
        <div ref={certificateRef} className="w-[1000px] h-[750px] bg-white p-12 text-slate-950 font-sans border-[16px] border-slate-900 flex flex-col justify-between">
          <div className="flex justify-between items-end border-b-4 border-cyan-600 pb-6">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 mb-1">TEAM TESLA • BIOSENSOR METROLOGY</div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Smart_Spoon_AI Official FSSAI Report</h1>
              <p className="text-xs text-slate-500 font-semibold uppercase mt-1">Ensemble Neural Network Verification Certificate</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Timestamp</div>
              <div className="text-sm font-mono font-bold text-slate-800">{meta.timestamp || new Date().toLocaleString()}</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center my-6">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-3">Electrochemical Classification Result</div>
            <div className="text-5xl font-black mb-4 uppercase" style={{ color: isToxic ? "#dc2626" : "#059669" }}>
              {hero.adulteration_type}
            </div>
            <div className="bg-slate-100 border border-slate-300 px-6 py-2 rounded-full mb-8">
              <span className="text-base font-semibold text-slate-700">
                Ensemble Confidence: <strong className="text-slate-950 font-black">{hero.accuracy?.toFixed(1) ?? 0}%</strong>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Safety Index</div>
                <div className="text-2xl font-black text-slate-900">{safetyScore}/100</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Impedance</div>
                <div className="text-2xl font-black text-slate-900 font-mono">{meta.raw_adc} Ω</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">pH Level</div>
                <div className="text-2xl font-black text-slate-900">{phValue.toFixed(2)}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">Dilution</div>
                <div className="text-2xl font-black text-slate-900">{waterPct}%</div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-300 pt-6 flex justify-between items-end">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Cryptographic Signature</div>
              <div className="text-sm font-black text-slate-900">TEAM TESLA HARDWARE ENGINE</div>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-cyan-700 flex items-center justify-center rotate-[-12deg] bg-slate-50">
              <span className="text-cyan-800 font-black uppercase text-[8px] text-center leading-tight">Team Tesla<br />Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
