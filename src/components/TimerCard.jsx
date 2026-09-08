import React from "react";

export default function TimerCard({ label, value, unit, icon: Icon }) {
  return (
    <div className="data-plate p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-[0.08em]" style={{ color: "var(--ink-faint)" }}>
          {label}
        </span>
        {Icon ? <Icon className="w-3.5 h-3.5" style={{ color: "var(--brass)" }} /> : null}
      </div>
      <div className="font-display text-2xl font-medium tabular-nums" style={{ color: "var(--ink)" }}>
        {value}
        {unit ? (
          <span className="text-sm ml-1" style={{ color: "var(--ink-soft)" }}>
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}