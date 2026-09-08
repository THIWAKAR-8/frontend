import React, { useMemo } from "react";
import { motion } from "framer-motion";

const CX = 100;
const CY = 104;
const R_ARC = 82;
const R_TICK_IN = 82;
const R_TICK_OUT = 92;
const R_NEEDLE = 64;

/** score 0..100 -> point on the semicircle (0 = left / min, 100 = right / max). */
function polar(score, radius) {
  const theta = (180 - 1.8 * score) * (Math.PI / 180);
  return {
    x: CX + radius * Math.cos(theta),
    y: CY - radius * Math.sin(theta),
  };
}

function toneOf(score) {
  if (score >= 85) return { color: "var(--green)", label: "Within Tolerance" };
  if (score >= 50) return { color: "var(--amber)", label: "Marginal" };
  return { color: "var(--crimson)", label: "Out of Tolerance" };
}

export default function SafetyGauge({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = toneOf(clamped);
  const needleTip = useMemo(() => polar(clamped, R_NEEDLE), [clamped]);
  const ticks = [0, 25, 50, 75, 100];

  const arcStart = polar(0, R_ARC);
  const arcEnd = polar(100, R_ARC);
  const progressEnd = polar(clamped, R_ARC);

  return (
    <div className="instrument-panel p-5 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
          Instrument 01
        </span>
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
          Safety Index
        </span>
      </div>

      <svg viewBox="0 0 200 130" className="w-full max-w-[220px]">
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${R_ARC} ${R_ARC} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke="var(--rule-strong)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${arcStart.x} ${arcStart.y} A ${R_ARC} ${R_ARC} 0 ${clamped > 50 ? 1 : 0} 1 ${progressEnd.x} ${progressEnd.y}`}
          fill="none"
          stroke={tone.color}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {ticks.map((t) => {
          const inner = polar(t, R_TICK_IN);
          const outer = polar(t, R_TICK_OUT);
          const label = polar(t, R_TICK_OUT + 12);
          return (
            <g key={t}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="var(--ink-faint)" strokeWidth="1" />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fontFamily="var(--font-mono)"
                fill="var(--ink-faint)"
              >
                {t}
              </text>
            </g>
          );
        })}

        <motion.line
          x1={CX}
          y1={CY}
          animate={{ x2: needleTip.x, y2: needleTip.y }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          stroke="var(--ink)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="4.5" fill="var(--brass)" stroke="var(--ink)" strokeWidth="1" />
      </svg>

      <div className="text-center -mt-1">
        <div className="font-display text-4xl font-medium tabular-nums" style={{ color: tone.color }}>
          {Math.round(clamped)}
        </div>
        <div className="font-mono text-[11px] mt-1" style={{ color: "var(--ink-soft)" }}>
          {tone.label}
        </div>
      </div>
    </div>
  );
}