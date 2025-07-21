import React, { useState, useEffect } from "react";
import { currencyMap, getCurrencyInfo, CurrencyInfo } from "@/lib/currencyMap";

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: "year" | "month";
}

interface SalaryRangeSelectorProps {
  countryCode?: string; // e.g. 'US', 'IN', 'DE', 'GB', 'EU'
  value: SalaryRange;
  onChange: (range: SalaryRange) => void;
}

const SalaryRangeSelector: React.FC<SalaryRangeSelectorProps> = ({ countryCode, value, onChange }) => {
  const [currency, setCurrency] = useState<CurrencyInfo>(getCurrencyInfo(countryCode));
  const [period, setPeriod] = useState<"year" | "month">("year");
  const [min, setMin] = useState(value.min || currency.min);
  const [max, setMax] = useState(value.max || currency.max);

  // Update currency on country change
  useEffect(() => {
    const info = getCurrencyInfo(countryCode);
    setCurrency(info);
    setMin(info.min);
    setMax(info.max);
    onChange({ min: info.min, max: info.max, currency: info.code, period });
    // eslint-disable-next-line
  }, [countryCode]);

  // Handle period toggle
  const handlePeriodToggle = (p: "year" | "month") => {
    setPeriod(p);
    let newMin = min, newMax = max;
    if (p === "month") {
      newMin = Math.round(min / 12);
      newMax = Math.round(max / 12);
    } else {
      newMin = Math.round(min * 12);
      newMax = Math.round(max * 12);
    }
    setMin(newMin);
    setMax(newMax);
    onChange({ min: newMin, max: newMax, currency: currency.code, period: p });
  };

  // Handle slider change
  const handleSlider = (newMin: number, newMax: number) => {
    setMin(newMin);
    setMax(newMax);
    onChange({ min: newMin, max: newMax, currency: currency.code, period });
  };

  // Snap to step
  const snap = (val: number) => Math.round(val / currency.step) * currency.step;

  return (
    <div style={{ maxWidth: 500, margin: "0 auto 32px", background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px #0001", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: "Roboto Mono, monospace", fontSize: 18, fontWeight: 600 }}>
          {currency.format(period === "year" ? min : min * 12)}
          <span style={{ color: "#6b7280", margin: "0 8px" }}>–</span>
          {currency.format(period === "year" ? max : max * 12)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handlePeriodToggle("year")}
            style={{
              background: period === "year" ? "#3E92CC" : "#f3f4f6",
              color: period === "year" ? "#fff" : "#3E92CC",
              border: "none",
              borderRadius: 8,
              padding: "6px 16px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Annual
          </button>
          <button
            onClick={() => handlePeriodToggle("month")}
            style={{
              background: period === "month" ? "#3E92CC" : "#f3f4f6",
              color: period === "month" ? "#fff" : "#3E92CC",
              border: "none",
              borderRadius: 8,
              padding: "6px 16px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Monthly
          </button>
        </div>
      </div>
      <div style={{ margin: "32px 0 16px" }}>
        <input
          type="range"
          min={currency.min}
          max={currency.max}
          step={currency.step}
          value={min}
          onChange={e => handleSlider(snap(Number(e.target.value)), max)}
          style={{ width: "100%" }}
          aria-label={`Minimum salary: ${currency.format(min)}`}
        />
        <input
          type="range"
          min={currency.min}
          max={currency.max}
          step={currency.step}
          value={max}
          onChange={e => handleSlider(min, snap(Number(e.target.value)))}
          style={{ width: "100%", marginTop: 8 }}
          aria-label={`Maximum salary: ${currency.format(max)}`}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Roboto Mono, monospace", fontSize: 14, color: "#6b7280", marginTop: 8 }}>
          <span>{currency.format(currency.min)}</span>
          <span>{currency.format(currency.max)}</span>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
        <span title={`Salaries shown in ${currency.symbol} based on ${countryCode || 'your country'}`}>Salaries shown in <b>{currency.symbol}</b> based on <b>{countryCode || 'your country'}</b>.</span>
      </div>
    </div>
  );
};

export default SalaryRangeSelector; 