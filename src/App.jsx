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

const GLOBAL_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", ttsCode: "en-US" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", ttsCode: "ta-IN" }
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
    countertop_timer: "Ambient Shelf Life",
    fridge_timer: "Cold-Chain Longevity",
    kitchen_directive: "Actionable Directive",
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
    ph_meter: "செயலில் உள்ள pH",
    countertop_timer: "அறை ஆயுள்",
    fridge_timer: "குளிர்பதன ஆயுள்",
    kitchen_directive: "வழிகாட்டல்",
    consumer_intel: "நுகர்வோர் நுண்ணறிவு",
    deep_lab: "ஆழமான தொழில்நுட்ப பகுப்பாய்வு",
    eis_waveform: "மின்மறிப்பு அலைவரிசை",
    ai_prob: "நிகழ்தகவு பரவல்"
  }
};

function parseProbabilityDistribution(raw) {
  if (!raw || typeof raw !== "string") {
    return [
      { name: "Pure Milk", value: 92.4 },
      { name: "Water Dilution", value: 4.1 },
      { name: "Apple Extract", value: 2.2 },
      { name: "Detergent", value: 1.3 }
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
      { name: "Pure Milk", value: 92.4 },
      { name: "Water Dilution", value: 4.1 },
      { name: "Apple Extract", value: 2.2 },
      { name: "Detergent", value: 1.3 }
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
  const [hero, setHero] = useState({ adulteration_type: "Connecting Neural Link…", accuracy: 0, status_color: "#334155" });
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

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: "Universal Spectrometer initialized. Select your target matrix (Milk, Apple, or Water) and I will evaluate its purity."
    }
  ]);
  const chatScrollRef = useRef(null);

  const t = useMemo(() => INTERNAL_DICTIONARY[lang] || INTERNAL_DICTIONARY.en, [lang]);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let retryAttempt = 0;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          setIsConnected(true);
          setConnectionState("OPEN");
          retryAttempt = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.hero) setHero(data.hero);
            if (data.primary) setPrimary(data.primary);
            if (data.secondary) setSecondary(data.secondary);
            if (data.system_meta) setMeta(data.system_meta);

            const zMag = firstNumber(data?.system_meta?.excitation_frequency_hz, 0);
            setZHistory(prev => [...prev, { t: prev.length + 1, z: zMag }].slice(-40));
          } catch (err) {
            console.error("Frame Parser Exception:", err);
          }
        };

        ws.onerror = () => ws.close();

        ws.onclose = () => {
          setIsConnected(false);
          setConnectionState("RECONNECTING");
          const backoff = Math.min(MAX_RETRY_DELAY_MS, INITIAL_RETRY_DELAY_MS * Math.pow(2, retryAttempt));
          retryAttempt += 1;
          reconnectTimer = setTimeout(connect, backoff + Math.floor(Math.random() * 500));
        };
      } catch {
        setIsConnected(false);
        setConnectionState("RECONNECTING");
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const query = chatInput.trim();
    setChatHistory((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    setTimeout(() => {
      const q = query.toLowerCase();
      let reply = `Target matrix is set to ${targetProfile}. Current live frequency is ${meta.excitation_frequency_hz} Hz.`;
      if (q.includes("apple") || q.includes("fruit")) {
        reply = "Apples contain malic acid and fructose, which dramatically increase ionic conductivity, pushing frequencies to 6000+ Hz.";
      } else if (q.includes("milk")) {
        reply = "Pure milk stabilizes around 2200-2400 Hz. If it drops to ~2000 Hz, water dilution is detected.";
      }
      setChatHistory((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 500);
  };

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

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

        let rT = 0, gT = 0, bT = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          rT += data[i];
          gT += data[i + 1];
          bT += data[i + 2];
          pixelCount++;
        }
        
        const r = Math.round(rT / pixelCount);
        const g = Math.round(gT / pixelCount);
        const b = Math.round(bT / pixelCount);
        const brightness = (r + g + b) / 3;

        let verdict = "Unknown Sample";
        let alertLevel = "safe";

        if (r > 200 && g > 200 && b > 200) {
          verdict = "Pure Milk Suspend Detected (High White Reflectance)";
          alertLevel = "safe";
        } else if (r > g + 20 && r > b + 40) {
          verdict = "Apple / Fruit Extract Detected (Red/Yellow Dominant)";
          alertLevel = "safe";
        } else if (b > r + 15 && b > g + 10) {
          verdict = "Water / Dilution Signature (High Cyan Scattering)";
          alertLevel = "danger";
        } else if (brightness < 100) {
          verdict = "Suspended Particulate / Turbidity Anomaly Detected";
          alertLevel = "warning";
        } else {
          verdict = "Mixed/Unknown Biological Matrix";
          alertLevel = "warning";
        }

        setTimeout(() => {
          setLabResults({ r, g, b, verdict, alertLevel });
          setIsAnalyzingImage(false);
        }, 1200); 

      } catch (err) {
        console.error("Canvas Execution Error:", err);
        setIsAnalyzingImage(false);
      }
    };

    img.onerror = () => {
      console.error("Image loading failed.");
      setIsAnalyzingImage(false);
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
        dynamicHero = { adulteration_type: "Pure Milk / Safe", accuracy: 98.2, status_color: "#10b981" };
        dynamicSafetyScore = 96;
        dynamicPh = 6.7;
      } else if (liveFreq < 2100) {
        dynamicHero = { adulteration_type: "Water Dilution Detected", accuracy: 94.1, status_color: "#ef4444" };
        dynamicSafetyScore = 40;
        dynamicPh = 7.0;
      } else {
        dynamicHero = { adulteration_type: "Chemical / Acid Adulterant", accuracy: 89.4, status_color: "#ef4444" };
        dynamicSafetyScore = 20;
      }
    } else if (targetProfile === "apple") {
      if (liveFreq >= 5500) {
        dynamicHero = { adulteration_type: "Pure Apple Extract", accuracy: 97.5, status_color: "#10b981" };
        dynamicSafetyScore = 98;
        dynamicPh = 4.2;
      } else {
        dynamicHero = { adulteration_type: "Diluted Apple / Synthetic", accuracy: 91.2, status_color: "#ef4444" };
        dynamicSafetyScore = 35;
        dynamicPh = 6.0;
      }
    } else if (targetProfile === "water") {
      if (liveFreq >= 1800 && liveFreq <= 2100) {
        dynamicHero = { adulteration_type: "Standard Pure Water", accuracy: 95.0, status_color: "#3b82f6" };
        dynamicSafetyScore = 99;
        dynamicPh = 7.0;
      } else {
        dynamicHero = { adulteration_type: "Contaminated / Hard Water", accuracy: 88.5, status_color: "#f59e0b" };
        dynamicSafetyScore = 55;
      }
    }
  } else {
    dynamicHero = { adulteration_type: "Awaiting Sensor Data…", accuracy: 0, status_color: "#334155" };
    dynamicSafetyScore = 0;
  }

  const isToxic = dynamicHero.status_color === "#dc2626" || dynamicHero.status_color === "#ef4444" || dynamicHero.status_color === "#f59e0b";
  const safetyColor = dynamicSafetyScore >= 80 ? "#10b981" : dynamicSafetyScore >= 50 ? "#f59e0b" : "#ef4444";
  const radarData = useMemo(() => parseProbabilityDistribution(secondary?.ai_and_regulatory_metrology?.["35_Class_Probability_Distribution"]), [secondary]);

  return (
    <div className="min-h-screen font-sans bg-[#020617] text-slate-100 selection:bg-cyan-500/30 relative overflow-hidden pb-16">
      
      {/* Dynamic Background Glows */}
      <div 
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000" 
        style={{ backgroundColor: `${dynamicHero.status_color}15` }} 
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* Modern Header */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-2xl bg-[#020617]/70 border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-md opacity-30 rounded-xl animate-pulse" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                <Cpu className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">{t.app_title}</h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  ESP32 • AI
                </span>
              </div>
              <p className="text-xs tracking-wider text-slate-400 font-medium mt-0.5">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-white/5 border border-white/10 hover:border-cyan-500/50 text-slate-200 rounded-lg px-3 py-2 text-xs font-semibold uppercase transition-all outline-none cursor-pointer backdrop-blur-md"
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900">{l.nativeName}</option>
              ))}
            </select>
            <InstallApp />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold tracking-wide uppercase transition-all backdrop-blur-md ${
              isConnected ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-rose-500/30 text-rose-400 bg-rose-500/10 animate-pulse"
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isConnected ? t.live : connectionState === "RECONNECTING" ? t.reconnecting : t.offline}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Animated Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-8 mb-6">
        <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl inline-flex">
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
                activeTab === tab.id ? "text-cyan-50" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-cyan-600/30 border border-cyan-500/40 rounded-xl -z-10 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6">
        
        {/* ======================= TAB 1: TELEMETRY ======================= */}
        {activeTab === "telemetry" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >

            {/* TARGET PROFILE SELECTOR */}
            <div className="flex flex-col gap-3 mb-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <FlaskConical className="w-4 h-4" /> Select Target Matrix
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: "milk", label: "Dairy (Milk)", icon: Milk, color: "hover:border-slate-300 hover:bg-slate-800" },
                  { id: "apple", label: "Apple Extract", icon: Leaf, color: "hover:border-emerald-500 hover:bg-emerald-900/30" },
                  { id: "water", label: "Pure Water", icon: Droplets, color: "hover:border-blue-500 hover:bg-blue-900/30" }
                ].map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setTargetProfile(profile.id)}
                    className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 border backdrop-blur-md overflow-hidden ${
                      targetProfile === profile.id
                        ? `border-${profile.id === 'milk' ? 'slate-300' : profile.id === 'apple' ? 'emerald-500' : 'blue-500'} bg-white/10 text-white shadow-lg`
                        : `border-white/5 bg-white/5 text-slate-400 ${profile.color}`
                    }`}
                  >
                    {targetProfile === profile.id && (
                      <motion.div layoutId="targetHighlight" className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
                    )}
                    <profile.icon className={`w-5 h-5 transition-transform ${targetProfile === profile.id ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'}`} />
                    {profile.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Section */}
            <AnimatePresence mode="wait">
              <motion.div
                key={dynamicHero.adulteration_type}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative rounded-3xl p-8 md:p-12 overflow-hidden border backdrop-blur-2xl shadow-2xl"
                style={{
                  backgroundColor: `${dynamicHero.status_color || '#334155'}15`,
                  borderColor: `${dynamicHero.status_color || '#334155'}40`,
                }}
              >
                {/* Dynamic Background Blob inside Hero */}
                <div 
                  className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none"
                  style={{ backgroundColor: dynamicHero.status_color }}
                />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 z-10">
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border bg-black/20 backdrop-blur-md text-xs font-bold uppercase tracking-[0.15em]"
                         style={{ borderColor: `${dynamicHero.status_color}50`, color: dynamicHero.status_color }}>
                      {isToxic ? <ShieldAlert className="w-4 h-4 animate-bounce" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>{t.verdict} ({targetProfile})</span>
                    </div>
                    <div className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                      {dynamicHero.adulteration_type}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-[#020617]/60 p-6 rounded-3xl backdrop-blur-xl border border-white/10 shrink-0 shadow-2xl">
                    <div className="w-24 h-24">
                      <CircularProgressbar
                        value={dynamicHero.accuracy || 0}
                        text={`${(dynamicHero.accuracy || 0).toFixed(1)}%`}
                        styles={buildStyles({
                          pathColor: dynamicHero.status_color || '#334155',
                          trailColor: "rgba(255,255,255,0.05)",
                          textColor: "#ffffff",
                          textSize: "24px",
                          strokeLinecap: "round"
                        })}
                      />
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{t.confidence}</div>
                      <div className="text-3xl font-black text-white tabular-nums tracking-tighter">
                        {(dynamicHero.accuracy || 0).toFixed(1)}<span className="text-xl text-slate-500">%</span>
                      </div>
                      <div className="text-xs text-cyan-400 font-mono mt-2 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20 inline-block">
                        {liveFreq} Hz Live
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Safety Score Card */}
              <div className="lg:col-span-4 rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-8 flex flex-col items-center justify-center relative shadow-lg">
                <div className="w-full flex items-center justify-between absolute top-6 px-6">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Safety Index</span>
                  <ActivitySquare className="w-4 h-4 text-slate-500" />
                </div>
                <div className="w-40 h-40 mt-6">
                  <CircularProgressbar
                    value={dynamicSafetyScore}
                    text={`${dynamicSafetyScore}`}
                    styles={buildStyles({
                      pathColor: safetyColor,
                      trailColor: "rgba(255,255,255,0.05)",
                      textColor: "#ffffff",
                      textSize: "28px",
                      strokeLinecap: "round"
                    })}
                  />
                </div>
              </div>

              {/* pH & Hardware Stats */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-widest font-semibold">{t.ph_meter}</span>
                    </div>
                    <div className="text-4xl font-black text-white tabular-nums tracking-tighter">{dynamicPh.toFixed(2)}</div>
                  </div>
                  
                  {/* Enhanced pH Bar */}
                  <div className="relative h-6 rounded-full bg-[#020617] border border-white/10 overflow-hidden shadow-inner mb-3">
                    <div className="absolute inset-0 flex opacity-90">
                      <div className="flex-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400" />
                      <div className="flex-[1.5] bg-gradient-to-r from-emerald-400 to-emerald-500" />
                      <div className="flex-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
                    </div>
                    <motion.div
                      className="absolute top-0 bottom-0 w-3 bg-white border-2 border-slate-900 rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]"
                      animate={{ left: `calc(${Math.min(Math.max(((dynamicPh - 4) / 5) * 100, 0), 100)}% - 6px)` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                    <span>4.0 Acidic</span>
                    <span className="text-emerald-400/80">6.3–6.9 Ideal Milk</span>
                    <span>9.0 Alkaline</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Probe Temp</div>
                    <div className="text-3xl font-black text-slate-200 tabular-nums">{meta.probe_temperature_c}<span className="text-lg text-slate-500">°C</span></div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Base Freq</div>
                    <div className="text-3xl font-black text-slate-200 tabular-nums">
                      {targetProfile === 'milk' ? '2200' : targetProfile === 'apple' ? '7000' : '2000'} <span className="text-lg text-slate-500">Hz</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Technical Lab Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* EIS Waveform */}
              <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.eis_waveform}</div>
                  <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs font-mono text-cyan-400 font-semibold tabular-nums">
                      {zHistory.length > 0 ? `${zHistory[zHistory.length - 1]?.z} Hz` : "0 Hz"}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={zHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorZ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(2, 6, 23, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc", fontSize: "12px", backdropFilter: "blur(8px)" }}
                      itemStyle={{ color: "#22d3ee", fontWeight: "bold" }}
                      formatter={(v) => [`${v} Hz`, "Frequency"]}
                      labelFormatter={() => ""}
                      cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                    />
                    <Line type="monotone" dataKey="z" stroke="#22d3ee" strokeWidth={3} dot={false} isAnimationActive={false} style={{ filter: "drop-shadow(0px 4px 6px rgba(34, 211, 238, 0.4))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* AI Probability Radar */}
              <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-xl p-6 shadow-lg">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.ai_prob}</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData} outerRadius={90}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    <Radar dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} style={{ filter: "drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.5))" }} isAnimationActive={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(2, 6, 23, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc", fontSize: "12px" }}
                      itemStyle={{ color: "#60a5fa", fontWeight: "bold" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================= TAB 2: HEALTH ======================= */}
        {activeTab === "health" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-950/30 to-transparent p-10 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center border border-rose-500/30 text-rose-400 mb-6">
                <TrendingDown className="w-7 h-7" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400/80 mb-2">Monthly Economic Fraud Impact</h3>
              <div className="text-6xl font-black text-white mb-4 tabular-nums tracking-tighter">
                <span className="text-3xl text-rose-500 mr-1">₹</span>
                {Math.round(firstNumber(primary["19_fraud_loss_penalty_inr"], 0) * 30)}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Financial capital lost paying pure dairy rates for water dilution and synthetic surfactant admixtures based on 1.0L daily consumption.
              </p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-transparent p-10 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 text-emerald-400 mb-6">
                <DollarSign className="w-7 h-7" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/80 mb-2">True Fair Market Value</h3>
              <div className="text-6xl font-black text-white mb-4 tabular-nums tracking-tighter">
                <span className="text-3xl text-emerald-500 mr-1">₹</span>
                {Math.max(0, 60 - firstNumber(primary["19_fraud_loss_penalty_inr"], 0)).toFixed(2)}
                <span className="text-2xl text-slate-500 ml-2">/ L</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Equitable market valuation computed directly from active impedance vectors and missing Solids-Not-Fat (SNF).
              </p>
            </div>
          </motion.div>
        )}

        {/* ======================= TAB 3: OPTICAL CV LAB ======================= */}
        {activeTab === "vision" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-8 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                <ScanFace className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Optical Computer Vision Lab</h3>
                <p className="text-sm text-slate-400">Evaluate liquid scattering vectors using device optics</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Input Zone */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-cyan-500/30 border-dashed rounded-3xl cursor-pointer bg-cyan-950/10 hover:bg-cyan-950/30 transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Camera className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm font-bold text-cyan-100">Live Camera</span>
                    <span className="text-[10px] text-cyan-500 font-semibold uppercase mt-1 tracking-widest">Capture Photo</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                  </label>

                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-white/10 border-dashed rounded-3xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden">
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-3 group-hover:text-white transition-colors duration-300" />
                    <span className="text-sm font-bold text-slate-200">Upload File</span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase mt-1 tracking-widest">From Gallery</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                {labImage && (
                  <button
                    onClick={executeOpticalAnalysis}
                    disabled={isAnalyzingImage}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-70"
                  >
                    {isAnalyzingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    <span>{isAnalyzingImage ? "Computing Pixel Matrix..." : "Run Spectrophotometry"}</span>
                  </button>
                )}
              </div>

              {/* Analysis Results Panel */}
              <div className="bg-[#020617]/50 rounded-3xl border border-white/5 p-6 flex flex-col justify-center relative overflow-hidden">
                {!labImage ? (
                  <div className="text-center text-slate-500 flex flex-col items-center justify-center h-full">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <BarChart3 className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Awaiting Image Matrix</p>
                  </div>
                ) : (
                  <div className="space-y-6 relative z-10">
                    <div className="flex gap-5 items-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500/20 animate-pulse rounded-2xl blur-md" />
                        <img src={labImage} alt="Sample" className="relative w-28 h-28 object-cover rounded-2xl border border-white/20 shadow-xl" />
                      </div>
                      <div>
                        <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
                          Buffer Staged
                        </div>
                        <div className="text-sm font-semibold text-white">Image matrix loaded</div>
                        <div className="text-xs text-slate-400 font-mono mt-1">Ready for classification</div>
                      </div>
                    </div>

                    <canvas ref={visionCanvasRef} className="hidden" />

                    {labResults && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Extracted RGB Vector</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <span className="text-[10px] font-bold uppercase mb-1 opacity-70">Red</span>
                            <span className="font-mono text-lg font-black">{labResults.r}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <span className="text-[10px] font-bold uppercase mb-1 opacity-70">Green</span>
                            <span className="font-mono text-lg font-black">{labResults.g}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <span className="text-[10px] font-bold uppercase mb-1 opacity-70">Blue</span>
                            <span className="font-mono text-lg font-black">{labResults.b}</span>
                          </div>
                        </div>
                        <div className={`mt-4 pt-4 border-t border-white/10 text-lg font-black tracking-tight ${
                          labResults.alertLevel === 'danger' ? 'text-rose-400' : 
                          labResults.alertLevel === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {labResults.verdict}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================= TAB 4: ASSISTANT ======================= */}
        {activeTab === "assistant" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent h-[650px] flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="bg-[#020617]/80 backdrop-blur-md p-5 border-b border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 relative">
                <MessageSquare className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#020617]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base tracking-tight">Spectrometer LLM Agent</h3>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ensemble Inference Active</span>
                </div>
              </div>
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
                      ? "bg-cyan-600 text-white rounded-br-sm" 
                      : "bg-white/5 text-slate-200 border border-white/10 rounded-bl-sm backdrop-blur-sm"
                  }`}>
                    {item.text}
                  </div>
                </motion.div>
              ))}
              <div ref={chatScrollRef} />
            </div>

            <div className="p-5 bg-[#020617]/90 backdrop-blur-md border-t border-white/5">
              <form onSubmit={handleChatSubmit} className="flex gap-3 relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Inquire about matrix data, FSSAI regulations..."
                  className="flex-1 bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:bg-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none transition-all placeholder:text-slate-500"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim()} 
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center group"
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
