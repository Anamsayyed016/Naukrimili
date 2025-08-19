"use client";
import React from "react";

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: "year" | "month";
}

interface SalaryRangeSelectorProps {
  value: SalaryRange;
  onChange: (range: SalaryRange) => void;
}

// Minimal, parse-safe implementation (placeholder while resolving prior corruption cache)
export default function SalaryRangeSelector({ value, onChange }: SalaryRangeSelectorProps) {
  const update = (patch: Partial<SalaryRange>) => onChange({ ...value, ...patch });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Salary Range</div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          Min
          <input
            type="number"
            value={value.min}
            onChange={(e) => update({ min: Number(e.target.value) })}
            style={{ padding: 4, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          Max
          <input
            type="number"
            value={value.max}
            onChange={(e) => update({ max: Number(e.target.value) })}
            style={{ padding: 4, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <select
          value={value.period}
          onChange={(e) => update({ period: e.target.value as SalaryRange["period"] })}
          style={{ padding: 4, border: "1px solid #ccc", borderRadius: 4 }}
        >
          <option value="year">Yearly</option>
          <option value="month">Monthly</option>
        </select>
        <span style={{ fontSize: 12 }}>{value.currency}</span>
      </div>
    </div>
  );
}
