import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function EiSChart({ data = [] }) {
  return (
    <div className="instrument-panel p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
          Instrument 03
        </span>
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
          Live Trace
        </span>
      </div>
      <h3 className="font-display text-base font-medium mb-4" style={{ color: "var(--ink)" }}>
        EIS Impedance Magnitude
      </h3>

      <div className="oscilloscope-grid" style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="t" hide />
            <YAxis domain={[50, 1050]} hide />
            <Tooltip
              contentStyle={{
                background: "var(--paper-raised)",
                border: "1px solid var(--rule-strong)",
                borderRadius: 0,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
              formatter={(v) => [`${v} Ω`, "|Z|"]}
              labelFormatter={() => ""}
            />
            <Line type="monotone" dataKey="z" stroke="var(--brass)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between font-mono text-[10px] mt-2" style={{ color: "var(--ink-faint)" }}>
        <span>50 Ω</span>
        <span>1050 Ω</span>
      </div>
    </div>
  );
}