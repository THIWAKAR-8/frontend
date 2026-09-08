import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

/** Small spoon-in-ring mark used as the lab's seal — reused in the masthead. */
export function SealMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="var(--brass)" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="17.5" stroke="var(--brass)" strokeWidth="1" strokeDasharray="1.5 3.4" />
      <path
        d="M24 12c-3.6 0-6.4 2.8-6.4 6.2 0 2.9 2 5.3 4.7 6v10.4a1.7 1.7 0 0 0 3.4 0V24.2c2.7-.7 4.7-3.1 4.7-6C30.4 14.8 27.6 12 24 12Z"
        stroke="var(--brass)"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}

/** Backend sends hero.status_color as one of three exact hexes — map to our tokens. */
function toneFromStatusColor(hex) {
  switch ((hex || "").toLowerCase()) {
    case "#16a34a":
      return "green";
    case "#ea580c":
      return "amber";
    case "#dc2626":
      return "crimson";
    default:
      return "neutral";
  }
}

const TONE = {
  green: { color: "var(--green)", soft: "var(--green-soft)", Icon: ShieldCheck, word: "Pass" },
  amber: { color: "var(--amber)", soft: "var(--amber-soft)", Icon: ShieldAlert, word: "Caution" },
  crimson: { color: "var(--crimson)", soft: "var(--crimson-soft)", Icon: ShieldAlert, word: "Fail" },
  neutral: { color: "var(--ink-soft)", soft: "var(--brass-soft)", Icon: ShieldQuestion, word: "Pending" },
};

export default function HeroVerdict({ verdict, accuracy, statusColor, connected, timestamp, sampleId }) {
  const tone = useMemo(() => toneFromStatusColor(statusColor), [statusColor]);
  const { color, soft, Icon, word } = TONE[tone];

  return (
    <div className="certificate-frame relative px-6 py-8 md:px-10 md:py-10 mb-10">
      <span className="corner-mark corner-mark--tl" />
      <span className="corner-mark corner-mark--tr" />
      <span className="corner-mark corner-mark--bl" />
      <span className="corner-mark corner-mark--br" />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="font-mono text-[11px] tracking-[0.1em] leading-relaxed" style={{ color: "var(--ink-faint)" }}>
          <div>Certificate No. {sampleId}</div>
          <div>Issued {timestamp}</div>
        </div>

        <div
          className="stamp font-mono text-[10px] tracking-[0.1em]"
          style={{ color: connected ? "var(--green)" : "var(--crimson)" }}
        >
          {connected ? "Telemetry Live" : "Signal Lost"}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <p className="font-mono text-[11px] tracking-[0.1em] mb-3" style={{ color: "var(--ink-faint)" }}>
            AI Adulteration Verdict
          </p>
          <AnimatePresence mode="wait">
            <motion.h1
              key={verdict}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-[1.05] font-medium"
              style={{ color }}
            >
              {verdict}
            </motion.h1>
          </AnimatePresence>

          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-mono text-[11px] tracking-[0.08em]" style={{ color: "var(--ink-faint)" }}>
              AI Confidence
            </span>
            <span className="font-mono text-lg font-medium tabular-nums" style={{ color: "var(--ink)" }}>
              {Number(accuracy || 0).toFixed(1)}%
            </span>
          </div>
        </div>

        <motion.div
          key={tone}
          initial={{ scale: 1.5, rotate: 10, opacity: 0 }}
          animate={{ scale: 1, rotate: -4, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
          className="justify-self-center md:justify-self-end w-24 h-24 rounded-full flex flex-col items-center justify-center border-2"
          style={{ borderColor: color, backgroundColor: soft, color }}
        >
          <Icon className="w-7 h-7 mb-1" strokeWidth={1.6} />
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase">{word}</span>
        </motion.div>
      </div>
    </div>
  );
}