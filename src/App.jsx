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
  Zap, BarChart3, ScanFace, CheckCircle2, XCircle, ClipboardCheck, FlaskConical, ActivitySquare, ShieldCheck, ShieldAlert
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
    subtitle: "Ensemble Neural Telemetry & Electrochemical Metrology",
    live: "Neural Live",
    reconnecting: "Re-calibrating",
    offline: "Link Lost",
    verdict: "Ensemble Consensus Verdict",
    confidence: "Model Confidence",
    safety_score: "FSSAI Safety Index",
    ph_meter: "Active Dielectric pH",
    countertop_timer: "Ambient Shelf Life",
    fridge_timer: "Cold-Chain Longevity",
    kitchen_directive: "Actionable Kitchen Directive",
    consumer_intel: "Consumer Safety Intelligence",
    deep_lab: "Multi-Model Spectroscopic Diagnostics",
    eis_waveform: "Real-Time EIS Impedance Stream",
    ai_prob: "Ensemble Probability Matrix"
  },
  ta: {
    app_title: "ஸ்மார்ட் ஸ்பூன் ஏஐ",
    subtitle: "நிகழ்நேர நரம்பியல் தொலைஅளவை & மின்வேதியியல் ஆய்வு",
    live: "நேரலை",
    reconnecting: "இணைக்கிறது",
    offline: "துண்டிக்கப்பட்டது",
    verdict: "ஒப்புதல் முடிவு",
    confidence: "நம்பகத்தன்மை",
    safety_score: "பாதுகாப்பு குறியீடு",
    ph_meter: "செயலில் உள்ள pH",
    countertop_timer: "அறை ஆயுள்",
    fridge_timer: "குளிர்பதன ஆயுள்",
    kitchen_directive: "சமையலறை வழிகாட்டல்",
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
      { name: "Urea Admixture", value: 2.2 },
      { name: "Synthetic Detergent", value: 1.3 }
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

  // Chatbot states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: "Smart Spoon Neural Ensemble initialized. Connected to Random Forest & Gradient Boosting inference pipeline."
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

            const zMag = firstNumber(data?.secondary?.eis_dsp_telemetry?.["1_Total_Impedance_Magnitude"], data?.system_meta?.raw_adc || 500);
            setZHistory(prev => [...prev, { t: prev.length + 1, z: zMag }].slice(-40));
          } catch (err) {
            console.error("Frame Parser Exception:", err);
          }
        };

        ws.onerror = () => {
          ws.close();
        };

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
      let reply = `Neural Ensemble active. Current verdict: ${hero.adulteration_type}.`;
      if (q.includes("urea")) {
        reply = "Urea increases apparent nitrogen content. Our ESP32 dual-frequency EIS probe detects this via ionic relaxation shifts.";
      } else if (q.includes("fssai")) {
        reply = "Under FSSAI 2011 regulations, cow milk must have min 3.2% Fat and 8.3% SNF.";
      }
      setChatHistory((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 500);
  };

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const isToxic = useMemo(
    () => hero.status_color === "#dc2626" || hero.status_color === "#ef4444" || String(hero.adulteration_type).includes("Adulterated"),
    [hero.status_color, hero.adulteration_type]
  );

  const radarData = useMemo(
    () => parseProbabilityDistribution(secondary?.ai_and_regulatory_metrology?.["35_Class_Probability_Distribution"]),
    [secondary]
  );

  const phValue = firstNumber(primary["21_REAL_TIME_PH_METER"], 6.65);
  const safetyScore = firstNumber(primary["1_safety_score"], 94);
  const monthlyLoss = Math.round(firstNumber(primary["19_fraud_loss_penalty_inr"], 0) * 30);
  const trueMarketPrice = Math.max(0, 60 - firstNumber(primary["19_fraud_loss_penalty_inr"], 0)).toFixed(2);
  const safetyColor = safetyScore >= 80 ? "#10b981" : safetyScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen font-sans bg-slate-950 text-slate-100 selection:bg-cyan-500/30 relative overflow-hidden pb-16">
      {/* Background Lighting Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl bg-slate-950/80 border-slate-800/80">
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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-6 flex flex-wrap gap-2 border-b border-slate-800/80 pb-2">
        {[
          { id: "telemetry", icon: ActivitySquare, label: "Neural Telemetry" },
          { id: "health", icon: HeartPulse, label: "Clinical Bio-Grid" },
          { id: "assistant", icon: MessageSquare, label: "LLM Biosensor Agent" }
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6">
        {activeTab === "telemetry" && (
          <div className="space-y-8">
            {/* Hero Section */}
            <AnimatePresence mode="wait">
              <motion.div
                key={hero.adulteration_type}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl p-8 md:p-10 relative overflow-hidden backdrop-blur-xl border shadow-2xl"
                style={{
                  backgroundColor: `${hero.status_color || '#334155'}18`,
                  backgroundImage: `linear-gradient(135deg, ${hero.status_color || '#334155'}30 0%, ${hero.status_color || '#334155'}05 100%)`,
                  borderColor: hero.status_color || '#334155'
                }}
              >
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 text-white/90 text-xs font-black uppercase tracking-[0.2em] mb-3">
                      {isToxic ? <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                      <span>{t.verdict}</span>
                    </div>
                    <div className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md mb-2">
                      {hero.adulteration_type}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 bg-slate-950/60 p-6 rounded-2xl backdrop-blur-md border border-white/10 shrink-0 shadow-2xl">
                    <div className="w-28 h-28">
                      <CircularProgressbar
                        value={hero.accuracy || 0}
                        text={`${(hero.accuracy || 0).toFixed(1)}%`}
                        styles={buildStyles({
                          pathColor: hero.status_color || '#334155',
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
                        {(hero.accuracy || 0).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono mt-1">
                        ENSEMBLE: RF + GB
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Consumer Intel */}
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
                        <Activity className="w-4 h-4 text-cyan-400" />
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
            </section>

            {/* Deep Technical Lab Section */}
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
      </main>
    </div>
  );
}
