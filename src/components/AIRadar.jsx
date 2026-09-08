import React from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";

export default function AIRadar({ data = [] }) {
  return (
    <div className="instrument-panel p-5">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
          Instrument 04
        </span>
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: "var(--ink-faint)" }}>
          Classifier Output
        </span>
      </div>
      <h3 className="font-display text-base font-medium mb-4" style={{ color: "var(--ink)" }}>
        Class Probability Distribution
      </h3>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius={68}>
            <PolarGrid stroke="var(--rule)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "var(--ink-soft)", fontSize: 9, fontFamily: "var(--font-mono)" }} />
            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
            <Radar dataKey="value" stroke="var(--brass)" fill="var(--brass)" fillOpacity={0.28} isAnimationActive={false} />
            <Tooltip
              contentStyle={{
                background: "var(--paper-raised)",
                border: "1px solid var(--rule-strong)",
                borderRadius: 0,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}