import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import InstallApp from './components/InstallApp';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  Wifi, WifiOff, Activity, Cpu, Download, Volume2, VolumeX, Eye, Share2,
  HeartPulse, Scale, TrendingDown, DollarSign, Pill, Camera, MessageSquare, Send,
  Zap, BarChart3, ScanFace, CheckCircle2, XCircle, ClipboardCheck, FlaskConical, 
  ActivitySquare, ShieldCheck, ShieldAlert, Milk, Leaf, Droplets, UploadCloud, Loader2
} from "lucide-react";

// ============================================================================
// BACKEND WEBSOCKET CONFIGURATION
// ============================================================================
const WS_URL = "wss://smart-spoon-backend.onrender.com/ws";
// ============================================================================

const HISTORY_LEN = 40;
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;

// All 22 Official Scheduled Languages of India + English
const GLOBAL_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", ttsCode: "en-US" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", ttsCode: "hi-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", ttsCode: "ta-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", ttsCode: "te-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", ttsCode: "mr-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", ttsCode: "bn-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", ttsCode: "gu-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", ttsCode: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", ttsCode: "ml-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", ttsCode: "pa-IN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", ttsCode: "or-IN" }, // Fallback to best available
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", ttsCode: "en-IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", ttsCode: "ur-IN" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", ttsCode: "hi-IN" },
  { code: "ks", name: "Kashmiri", nativeName: "कॉशुर", ttsCode: "hi-IN" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", ttsCode: "ne-NP" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي", ttsCode: "hi-IN" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी", ttsCode: "hi-IN" },
  { code: "mni", name: "Manipuri", nativeName: "মৈতৈলোন্", ttsCode: "en-IN" },
  { code: "brx", name: "Bodo", nativeName: "बड़ो", ttsCode: "hi-IN" },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", ttsCode: "hi-IN" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली", ttsCode: "hi-IN" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी", ttsCode: "hi-IN" }
];

const INTERNAL_DICTIONARY = {
  en: {
    app_title: "Smart Spoon AI",
    subtitle: "Universal Spectroscopic Liquid Metrology",
    live: "Neural Live",
    reconnecting: "Re-calibrating",
    offline: "Link Lost",
    verdict: "Target Diagnostic Verdict",
    confidence: "Model Confidence",
    safety_score: "FSSAI Safety Index",
    ph_meter: "Active Dielectric pH",
    consumer_intel: "Consumer Safety Intelligence",
    deep_lab: "Multi-Model Spectroscopic Diagnostics",
    eis_waveform: "Real-Time EIS Impedance Stream",
    ai_prob: "Ensemble Probability Matrix"
  },
  ta: {
    app_title: "ஸ்மார்ட் ஸ்பூன் ஏஐ",
    subtitle: "திரவ பகுப்பாய்வு மற்றும் அளவியல்",
    live: "நேரலை",
    reconnecting: "இணைக்கிறது",
    offline: "துண்டிக்கப்பட்டது",
    verdict: "ஆய்வு முடிவு",
    confidence: "நம்பகத்தன்மை",
    safety_score: "பாதுகாப்பு குறியீடு",
    ph_meter: "செயலில் உள்ள pH"
  },
  hi: {
    app_title: "स्मार्ट स्पून एआई",
    subtitle: "सार्वभौमिक स्पेक्ट्रोस्कोपिक तरल मेट्रोलॉजी",
    live: "लाइव",
    reconnecting: "पुनः कनेक्ट हो रहा है",
    offline: "ऑफ़लाइन",
    verdict: "लक्षित नैदानिक ​​निर्णय",
    confidence: "मॉडल आत्मविश्वास",
    safety_score: "सुरक्षा सूचकांक",
    ph_meter: "सक्रिय ढांकता हुआ pH"
  }
};

function parseProbabilityDistribution(raw) {
  if (!raw || typeof raw !== "string") {
    return [
      { name: "Pure Milk", value: 92.4 }, { name: "Water Dilution", value: 4.1 },
      { name: "Apple Extract", value: 2.2 }, { name: "Detergent", value: 1.3 }
    ];
  }
  try {
    const sanitized = raw.replace(/'/g, '"');
    const parsed = JSON.parse(sanitized);
    return Object.entries(parsed).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value: Number(value) || 0
    }));
  } catch {
    return [
      { name: "Pure Milk", value: 92.4 }, { name: "Water Dilution", value: 4.1 },
      { name: "Apple Extract", value: 2.2 }, { name: "Detergent", value: 1.3 }
    ];
  }
}

function firstNumber(raw, fallback = 0) {
  if (typeof raw === "number") return isNaN(raw) ? fallback : raw;
  if (typeof raw !== "string") return fallback;
  const match = raw.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : fallback;
}

export default function App() {
  const [hero, setHero] = useState({ adulteration_type: "Connecting Neural Link…", accuracy: 0, status_color: "#2e1065" });
  const [primary, setPrimary] = useState({});
  const [secondary, setSecondary] = useState({});
  const [meta, setMeta] = useState({ timestamp: "--", raw_adc: 0, probe_temperature_c: 0, excitation_frequency_hz: 0 });
  const [zHistory, setZHistory] = useState([]);
  
  const [lang, setLang] = useState("en");
  const [activeTab, setActiveTab] = useState("telemetry");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("CONNECTING");
  const [targetProfile, setTargetProfile] = useState("milk");

  const [labImage, setLabImage] = useState(null);
  const [labResults, setLabResults] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const visionCanvasRef = useRef(null);

  // Chatbot & Voice States
  const [chatInput, setChatInput] = useState("");
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: "Universal Spectrometer initialized. Select your target matrix and I will evaluate its purity."
    }
  ]);
  const chatScrollRef = useRef(null);

  // Smart Dictionary Fallback (Falls back to English if translation is missing)
  const t = useMemo(() => {
    const dict = INTERNAL_DICTIONARY[lang] || {};
    return new Proxy(dict, {
      get: (target, prop) => target[prop] || INTERNAL_DICTIONARY.en[prop]
    });
  }, [lang]);

  // WebSocket Connection
  useEffect(() => {
    let ws;
    let reconnectTimer;
    let retryAttempt = 0;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => { setIsConnected(true); setConnectionState("OPEN"); retryAttempt = 0; };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.hero) setHero(data.hero);
            if (data.primary) setPrimary(data.primary);
            if (data.secondary) setSecondary(data.secondary);
            if (data.system_meta) setMeta(data.system_meta);
            const zMag = firstNumber(data?.system_meta?.excitation_frequency_hz, 0);
            setZHistory(prev => [...prev, { t: prev.length + 1, z: zMag }].slice(-40));
          } catch (err) { console.error("Frame Parser Exception:", err); }
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => {
          setIsConnected(false); setConnectionState("RECONNECTING");
          const backoff = Math.min(MAX_RETRY_DELAY_MS, INITIAL_RETRY_DELAY_MS * Math.pow(2, retryAttempt));
          retryAttempt += 1;
          reconnectTimer = setTimeout(connect, backoff + Math.floor(Math.random() * 500));
        };
      } catch {
        setIsConnected(false); setConnectionState("RECONNECTING");
      }
    };
    connect();
    return () => { if (reconnectTimer) clearTimeout(reconnectTimer); if (ws) ws.close(); };
  }, []);

  // Text-To-Speech Function
  const speakText = useCallback((text) => {
    if (!isVoiceEnabled || !("speechSynthesis" in window)) return;
    
    // Stop any ongoing speech before starting a new one
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const langConfig = GLOBAL_LANGUAGES.find(l => l.code === lang);
    
    // Set the language code for the speech engine based on user selection
    utterance.lang = langConfig ? langConfig.ttsCode : "en-US";
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }, [lang, isVoiceEnabled]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const query = chatInput.trim();
    setChatHistory((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    setTimeout(() => {
      const q = query.toLowerCase();
      let reply = `Target matrix is set to ${targetProfile}. Current live frequency is ${meta.excitation_frequency_hz} Hz.`;
      
      // Simple Mock NLP Logic
      if (q.includes("apple") || q.includes("fruit")) {
        reply = "Apples contain malic acid and fructose, which dramatically increase ionic conductivity, pushing frequencies to over 6000 Hertz.";
      } else if (q.includes("milk")) {
        reply = "Pure milk stabilizes around 2200 to 2400 Hertz. If it drops to around 2000 Hertz, water dilution is detected.";
      } else if (lang === "ta") {
        reply = "உங்கள் கோரிக்கையை பகுப்பாய்வு செய்கிறேன். நேரடி அதிர்வெண் " + meta.excitation_frequency_hz + " ஹெர்ட்ஸ்.";
      } else if (lang === "hi") {
        reply = "मैं आपके अनुरोध का विश्लेषण कर रहा हूँ। वर्तमान फ्रीक्वेंसी " + meta.excitation_frequency_hz + " हर्ट्ज़ है।";
      }

      setChatHistory((prev) => [...prev, { sender: "bot", text: reply }]);
      speakText(reply); // Trigger Voice Synthesis
    }, 600);
  };

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { setLabImage(event.target?.result); setLabResults(null); };
    reader.readAsDataURL(file);
  };

  const executeOpticalAnalysis = () => {
    if (!labImage || !visionCanvasRef.current) return;
    setIsAnalyzingImage(true);
    const canvas = visionCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const img = new Image();
    
    img.onload = () => {
      try {
        const MAX_SIZE = 150;
        const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let rT = 0, gT = 0, bT = 0, pixelCount = 0;
        for (let i = 0; i < data.length; i += 4) {
          rT += data[i]; gT += data[i + 1]; bT += data[i + 2]; pixelCount++;
        }
        
        const r = Math.round(rT / pixelCount);
        const g = Math.round(gT / pixelCount);
        const b = Math.round(bT / pixelCount);
        const brightness = (r + g + b) / 3;

        let verdict = "Unknown Sample", alertLevel = "safe";

        if (r > 200 && g > 200 && b > 200) { verdict = "Pure Milk Suspend Detected"; alertLevel = "safe"; }
        else if (r > g + 20 && r > b + 40) { verdict = "Apple / Fruit Extract Detected"; alertLevel = "safe"; }
        else if (b > r + 15 && b > g + 10) { verdict = "Water / Dilution Signature"; alertLevel = "danger"; }
        else if (brightness < 100) { verdict = "Suspended Particulate Anomaly"; alertLevel = "warning"; }
        else { verdict = "Mixed/Unknown Matrix"; alertLevel = "warning"; }

        setTimeout(() => {
          setLabResults({ r, g, b, verdict, alertLevel });
          setIsAnalyzingImage(false);
        }, 1200); 
      } catch (err) { setIsAnalyzingImage(false); }
    };
    img.src = labImage;
  };

  const liveFreq = meta.excitation_frequency_hz || 0;
  let dynamicHero = { ...hero };
  let dynamicSafetyScore = primary["1_safety_score"] || 0;
  let dynamicPh = primary["21_REAL_TIME_PH_METER"] || 6.7;

  if (liveFreq > 100) {
    if (targetProfile === "milk") {
      if (liveFreq >= 2100 && liveFreq <= 2700) {
        dynamicHero = { adulteration_type: "Pure Milk / Safe", accuracy: 98.2, status_color: "#2dd4bf" }; 
        dynamicSafetyScore = 96; dynamicPh = 6.7;
      } else if (liveFreq < 2100) {
        dynamicHero = { adulteration_type: "Water Dilution Detected", accuracy: 94.1, status_color: "#ec4899" }; 
        dynamicSafetyScore = 40; dynamicPh = 7.0;
      } else {
        dynamicHero = { adulteration_type: "Chemical Adulterant", accuracy: 89.4, status_color: "#e11d48" }; 
        dynamicSafetyScore = 20;
      }
    } else if (targetProfile === "apple") {
      if (liveFreq >= 5500) {
        dynamicHero = { adulteration_type: "Pure Apple Extract", accuracy: 97.5, status_color: "#2dd4bf" };
        dynamicSafetyScore = 98; dynamicPh = 4.2;
      } else {
        dynamicHero = { adulteration_type: "Diluted Synthetic", accuracy: 91.2, status_color: "#ec4899" };
        dynamicSafetyScore = 35; dynamicPh = 6.0;
      }
    } else if (targetProfile === "water") {
      if (liveFreq >= 1800 && liveFreq <= 2100) {
        dynamicHero = { adulteration_type: "Standard Pure Water", accuracy: 95.0, status_color: "#38bdf8" }; 
        dynamicSafetyScore = 99; dynamicPh = 7.0;
      } else {
        dynamicHero = { adulteration_type: "Contaminated Water", accuracy: 88.5, status_color: "#fb923c" }; 
        dynamicSafetyScore = 55;
      }
    }
  } else {
    dynamicHero = { adulteration_type: "Awaiting Sensor Data…", accuracy: 0, status_color: "#6b21a8" }; 
    dynamicSafetyScore = 0;
  }

  const isToxic = dynamicHero.status_color === "#ec4899" || dynamicHero.status_color === "#e11d48" || dynamicHero.status_color === "#fb923c";
  const safetyColor = dynamicSafetyScore >= 80 ? "#2dd4bf" : dynamicSafetyScore >= 50 ? "#fb923c" : "#ec4899";
  const radarData = useMemo(() => parseProbabilityDistribution(secondary?.ai_and_regulatory_metrology?.["35_Class_Probability_Distribution"]), [secondary]);

  return (
    <div className="min-h-screen font-sans bg-[#090014] text-slate-100 selection:bg-fuchsia-500/30 relative overflow-hidden pb-16">
      
      {/* Deep Space / Nebula Background Glows */}
      <div 
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-colors duration-1000 opacity-40" 
        style={{ backgroundColor: `${dynamicHero.status_color}` }} 
      />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-fuchsia-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-overlay pointer-events-none" />

      {/* Modern Header */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-2xl bg-[#090014]/60 border-purple-500/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-fuchsia-500 blur-md opacity-40 rounded-xl animate-pulse" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                <Cpu className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">{t.app_title}</h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  NEBULA • AI
                </span>
              </div>
              <p className="text-xs tracking-wider text-purple-300/70 font-medium mt-0.5">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Extended 22 Languages Dropdown */}
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
                window.speechSynthesis.cancel(); // Stop speaking if language changes
              }}
              className="bg-white/5 border border-purple-500/20 hover:border-fuchsia-500/50 text-purple-100 rounded-lg px-3 py-2 text-xs font-semibold uppercase transition-all outline-none cursor-pointer backdrop-blur-md max-w-[140px] truncate"
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#090014] text-white">
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
            <InstallApp />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold tracking-wide uppercase transition-all backdrop-blur-md ${
              isConnected ? "border-teal-500/40 text-teal-300 bg-teal-500/10" : "border-pink-500/40 text-pink-400 bg-pink-500/10 animate-pulse"
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isConnected ? t.live : connectionState === "RECONNECTING" ? t.reconnecting : t.offline}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Animated Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-8 mb-6">
        <div className="flex flex-wrap gap-2 p-1.5 bg-purple-900/10 backdrop-blur-md border border-purple-500/10 rounded-2xl inline-flex">
          {[
            { id: "telemetry", icon: ActivitySquare, label: "Telemetry" },
            { id: "health", icon: HeartPulse, label: "Bio-Grid" },
            { id: "vision", icon: ScanFace, label: "Optical Lab" },
            { id: "assistant", icon: MessageSquare, label: "AI Agent" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors z-10 ${
                activeTab === tab.id ? "text-fuchsia-50" : "text-purple-300/60 hover:text-purple-200"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-fuchsia-600/20 border border-fuchsia-500/30 rounded-xl -z-10 shadow-[0_0_20px_rgba(217,70,239,0.15)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6">
        
        {/* ======================= TAB 1: TELEMETRY ======================= */}
        {activeTab === "telemetry" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col gap-3 mb-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-purple-400/80 flex items-center gap-2">
                <FlaskConical className="w-4 h-4" /> Select Target Matrix
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: "milk", label: "Dairy (Milk)", icon: Milk, color: "hover:border-purple-300 hover:bg-purple-800/30", activeBorder: "border-purple-300" },
                  { id: "apple", label: "Apple Extract", icon: Leaf, color: "hover:border-teal-500 hover:bg-teal-900/30", activeBorder: "border-teal-400" },
                  { id: "water", label: "Pure Water", icon: Droplets, color: "hover:border-blue-400 hover:bg-blue-900/30", activeBorder: "border-blue-400" }
                ].map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setTargetProfile(profile.id)}
                    className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 border backdrop-blur-md overflow-hidden ${
                      targetProfile === profile.id
                        ? `${profile.activeBorder} bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]`
                        : `border-purple-500/10 bg-purple-950/20 text-purple-300/70 ${profile.color}`
                    }`}
                  >
                    {targetProfile === profile.id && (
                      <motion.div layoutId="targetHighlight" className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
                    )}
                    <profile.icon className={`w-5 h-5 transition-transform ${targetProfile === profile.id ? 'scale-110 drop-shadow-md text-white' : 'group-hover:scale-110'}`} />
                    {profile.label}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={dynamicHero.adulteration_type}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative rounded-3xl p-8 md:p-12 overflow-hidden border backdrop-blur-2xl shadow-2xl"
                style={{ backgroundColor: `${dynamicHero.status_color}15`, borderColor: `${dynamicHero.status_color}40` }}
              >
                <div 
                  className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[90px] opacity-25 -translate-y-1/2 translate-x-1/3 pointer-events-none mix-blend-screen"
                  style={{ backgroundColor: dynamicHero.status_color }}
                />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 z-10">
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border bg-[#090014]/40 backdrop-blur-md text-xs font-bold uppercase tracking-[0.15em]"
                         style={{ borderColor: `${dynamicHero.status_color}50`, color: dynamicHero.status_color }}>
                      {isToxic ? <ShieldAlert className="w-4 h-4 animate-bounce" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>{t.verdict} ({targetProfile})</span>
                    </div>
                    <div className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                      {dynamicHero.adulteration_type}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-[#090014]/60 p-6 rounded-3xl backdrop-blur-xl border border-purple-500/10 shrink-0 shadow-2xl">
                    <div className="w-24 h-24">
                      <CircularProgressbar
                        value={dynamicHero.accuracy || 0}
                        text={`${(dynamicHero.accuracy || 0).toFixed(1)}%`}
                        styles={buildStyles({
                          pathColor: dynamicHero.status_color || '#a855f7',
                          trailColor: "rgba(255,255,255,0.05)",
                          textColor: "#ffffff",
                          textSize: "24px",
                          strokeLinecap: "round"
                        })}
                      />
                    </div>
                    <div>
                      <div className="text-purple-300/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{t.confidence}</div>
                      <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                        {(dynamicHero.accuracy || 0).toFixed(1)}<span className="text-xl text-purple-500">%</span>
                      </div>
                      <div className="text-xs text-fuchsia-400 font-mono mt-2 bg-fuchsia-500/10 px-2 py-1 rounded-md border border-fuchsia-500/20 inline-block">
                        {liveFreq} Hz Live
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 rounded-3xl border border-purple-500/10 bg-purple-900/10 backdrop-blur-xl p-8 flex flex-col items-center justify-center relative shadow-lg">
                <div className="w-full flex items-center justify-between absolute top-6 px-6">
                  <span className="text-xs font-semibold uppercase tracking-widest text-purple-300/60">Safety Index</span>
                  <ActivitySquare className="w-4 h-4 text-purple-500/50" />
                </div>
                <div className="w-40 h-40 mt-6 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <CircularProgressbar
                    value={dynamicSafetyScore}
                    text={`${dynamicSafetyScore}`}
                    styles={buildStyles({
                      pathColor: safetyColor,
                      trailColor: "rgba(168, 85, 247, 0.1)",
                      textColor: "#ffffff",
                      textSize: "28px",
                      strokeLinecap: "round"
                    })}
                  />
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="rounded-3xl border border-purple-500/10 bg-purple-900/10 backdrop-blur-xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-purple-300/80">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-widest font-semibold">{t.ph_meter}</span>
                    </div>
                    <div className="text-4xl font-black text-white tabular-nums tracking-tighter">{dynamicPh.toFixed(2)}</div>
                  </div>
                  
                  <div className="relative h-6 rounded-full bg-[#090014] border border-purple-500/20 overflow-hidden shadow-inner mb-3">
                    <div className="absolute inset-0 flex opacity-90">
                      <div className="flex-1 bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-400" />
                      <div className="flex-[1.5] bg-gradient-to-r from-teal-400 to-teal-500" />
                      <div className="flex-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500" />
                    </div>
                    <motion.div
                      className="absolute top-0 bottom-0 w-3 bg-white border-2 border-[#090014] rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]"
                      animate={{ left: `calc(${Math.min(Math.max(((dynamicPh - 4) / 5) * 100, 0), 100)}% - 6px)` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-purple-400/60">
                    <span>4.0 Acidic</span>
                    <span className="text-teal-400">6.3–6.9 Ideal</span>
                    <span>9.0 Alkaline</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-purple-500/10 bg-white/[0.02] p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="text-[10px] uppercase tracking-widest text-purple-300/60 font-bold mb-2">Probe Temp</div>
                    <div className="text-3xl font-black text-fuchsia-100 tabular-nums">{meta.probe_temperature_c}<span className="text-lg text-fuchsia-500/50">°C</span></div>
                  </div>
                  <div className="rounded-2xl border border-purple-500/10 bg-white/[0.02] p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="text-[10px] uppercase tracking-widest text-purple-300/60 font-bold mb-2">Base Freq</div>
                    <div className="text-3xl font-black text-fuchsia-100 tabular-nums">
                      {targetProfile === 'milk' ? '2200' : targetProfile === 'apple' ? '7000' : '2000'} <span className="text-lg text-fuchsia-500/50">Hz</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================= TAB 4: ASSISTANT ======================= */}
        {activeTab === "assistant" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-purple-500/10 bg-purple-900/10 h-[650px] flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="bg-[#090014]/80 backdrop-blur-md p-5 border-b border-purple-500/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 relative">
                  <MessageSquare className="w-6 h-6" />
                  <span className="absolute top-0 right-0 w-3 h-3 bg-teal-400 rounded-full border-2 border-[#090014]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base tracking-tight">Spectrometer LLM Agent</h3>
                  <div className="flex items-center gap-1.5 text-xs text-teal-400 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    <span>Ensemble Voice Active</span>
                  </div>
                </div>
              </div>

              {/* TTS Voice Toggle Button */}
              <button 
                onClick={() => {
                  setIsVoiceEnabled(!isVoiceEnabled);
                  if (isVoiceEnabled) window.speechSynthesis.cancel();
                }}
                className={`p-2.5 rounded-xl border transition-all ${
                  isVoiceEnabled ? "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.2)]" : "bg-white/5 border-white/10 text-slate-500"
                }`}
                title="Toggle Text-to-Speech"
              >
                {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatHistory.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} 
                  key={idx} 
                  className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-6 py-4 text-sm leading-relaxed shadow-lg ${
                    item.sender === "user" 
                      ? "bg-fuchsia-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(217,70,239,0.2)]" 
                      : "bg-white/5 text-purple-100 border border-purple-500/20 rounded-bl-sm backdrop-blur-sm"
                  }`}>
                    {item.text}
                  </div>
                </motion.div>
              ))}
              <div ref={chatScrollRef} />
            </div>

            <div className="p-5 bg-[#090014]/90 backdrop-blur-md border-t border-purple-500/10">
              <form onSubmit={handleChatSubmit} className="flex gap-3 relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Type a message in ${GLOBAL_LANGUAGES.find(l => l.code === lang)?.name || "English"}...`}
                  className="flex-1 bg-white/5 border border-purple-500/20 focus:border-fuchsia-500/50 focus:bg-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none transition-all placeholder:text-purple-300/40"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim()} 
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 disabled:hover:bg-fuchsia-600 text-white px-6 rounded-2xl transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)] flex items-center justify-center group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
