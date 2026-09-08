import React from "react";

/** Turn "1_safety_score" -> "Safety Score" for display labels. */
function cleanLabel(key) {
  return key
    .replace(/^\d+_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LabTable({ annexLabel, title, data, formatValue }) {
  const entries = Object.entries(data || {});
  return (
    <div className="instrument-panel p-5">
      <span className="annex-panel__tab mb-3">{annexLabel}</span>
      <h3 className="font-display text-base font-medium mb-3" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      <div>
        {entries.map(([key, value]) => (
          <div key={key} className="leader-row">
            <span className="leader-label">{cleanLabel(key)}</span>
            <span className="leader-fill" />
            <span className="leader-value">{formatValue ? formatValue(key, value) : String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}