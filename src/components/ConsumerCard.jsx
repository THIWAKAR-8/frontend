import React from "react";

const TONE_COLOR = {
  normal: "var(--ink)",
  good: "var(--green)",
  warning: "var(--amber)",
  danger: "var(--crimson)",
};

export default function ConsumerCard({ index, icon: Icon, label, value, tone = "normal" }) {
  return (
    <div className="clause flex gap-4">
      <span className="clause__index font-mono">{String(index).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {Icon ? <Icon className="w-3.5 h-3.5" style={{ color: "var(--brass)" }} /> : null}
          <span className="font-mono text-[10.5px] tracking-[0.06em]" style={{ color: "var(--ink-faint)" }}>
            {label}
          </span>
        </div>
        <div className="text-[14px] leading-snug" style={{ color: TONE_COLOR[tone] || "var(--ink)" }}>
          {value}
        </div>
      </div>
    </div>
  );
}