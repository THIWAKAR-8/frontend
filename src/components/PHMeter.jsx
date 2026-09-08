import React from "react";
import { motion } from "framer-motion";

const MIN = 4.0;
const MAX = 9.0;
const SAFE_LOW = 6.3;
const SAFE_HIGH = 6.9;
const SCALE_HEIGHT = 200;

function posPct(v) {
  return ((MAX - v) / (MAX - MIN)) * 100;
}

export default function PHMeter({ value = 6.7 }) {
  const numeric = typeof value === "number" ? value : parseFloat(value) || 6.7;
  const clamped = Math.max(MIN, Math.min(MAX, numeric));
  const inRange = numeric >= SAFE_LOW && numeric <= SAFE_HIGH;
  const tone = inRange ? "var(--green)" : "var(--amber)";

  const ticks = [];
  for (let t = MIN; t <= MAX + 0.001; t += 0.5) ticks.push(Math.round(t * 10) / 10);

  return (
    <div className="instrument-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
          Instrument 02
        </span>
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
          pH Titration
        </span>
      </div>

      <div className="flex gap-5">
        <div className="relative w-6" style={{ height: SCALE_HEIGHT }}>
          <div className="absolute inset-0" style={{ background: "var(--paper-shadow)" }} />
          <div
            className="absolute left-0 right-0"
            style={{
              top: `${posPct(SAFE_HIGH)}%`,
              height: `${posPct(SAFE_LOW) - posPct(SAFE_HIGH)}%`,
              background: "var(--green-soft)",
              borderTop: "1px solid var(--green)",
              borderBottom: "1px solid var(--green)",
            }}
          />
          <motion.div
            className="absolute left-0 right-0 h-[2px]"
            style={{ background: "var(--ink)" }}
            animate={{ top: `${posPct(clamped)}%` }}
            transition={{ type: "spring", stiffness: 110, damping: 16 }}
          />
        </div>

        <div className="relative flex-1" style={{ height: SCALE_HEIGHT }}>
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute left-0 flex items-center gap-2"
              style={{ top: `${posPct(t)}%`, transform: "translateY(-50%)" }}
            >
              <span className="w-2 h-px" style={{ background: "var(--rule-strong)" }} />
              <span className="font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                {t.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--rule)" }}>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
            Reading
          </span>
          <span className="font-display text-3xl font-medium tabular-nums" style={{ color: tone }}>
            {numeric.toFixed(2)}
          </span>
        </div>
        <div className="font-mono text-[10px] mt-1" style={{ color: "var(--ink-faint)" }}>
          Fresh milk band 6.30 – 6.90
        </div>
      </div>
    </div>
  );
}