"use client";

// ============================================================================
// Gas Cards — 4-Gas Atmospheric Sensor Readouts (Light Theme)
// H₂S, CO, CH₄ + mandatory O₂ per OSHA 29 CFR 1910.146
// ============================================================================

import { GAS_THRESHOLDS } from "@/lib/config";
import type { GasReading, ManholeRecord } from "@/lib/types";
import { STATUS_STYLES } from "./ui";
import { Pulse, Flame, ShieldWarning, Drop } from "@phosphor-icons/react";

interface GasMeta {
  key: "h2s" | "co" | "ch4" | "o2";
  formula: string;
  name: string;
  icon: typeof Flame;
  /** O₂ uses inverted bar: full = 20.9%, depleted toward 16% */
  isOxygen?: boolean;
}

const GAS_CONFIG: GasMeta[] = [
  { key: "h2s", formula: "H₂S", name: "Hydrogen Sulfide", icon: ShieldWarning },
  { key: "co",  formula: "CO",  name: "Carbon Monoxide",  icon: Pulse },
  { key: "ch4", formula: "CH₄", name: "Methane (%LEL)",   icon: Flame },
  { key: "o2",  formula: "O₂",  name: "Oxygen (Atm.)",    icon: Drop, isOxygen: true },
];

export function GasCards({ gas }: { gas: ManholeRecord["gas"] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {GAS_CONFIG.map(({ key, formula, name, icon: Icon, isOxygen }) => {
        const r = gas[key] as GasReading;
        const t = GAS_THRESHOLDS[key];
        const s = STATUS_STYLES[r.status];

        // O₂: bar fills from left showing how much O₂ remains (20.9 = full, 16 = empty)
        // Others: bar fills toward warningMax
        const pct = isOxygen
          ? Math.max(0, Math.min(100, Math.round(((r.value - 16) / (20.9 - 16)) * 100)))
          : Math.min(100, Math.round((r.value / t.warningMax) * 100));

        const limitLabel = isOxygen
          ? `Min ${t.safeMin}%vol`
          : `Safe <${t.safeMax}${t.unit}`;
        const dangerLabel = isOxygen
          ? `Danger ≤${t.warningMin}%vol`
          : `Danger ≥${t.warningMax}${t.unit}`;

        const stagger = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"][GAS_CONFIG.indexOf(GAS_CONFIG.find(g => g.key === key)!)];
        return (
          <div
            key={key}
            className={`fade-up ${stagger} relative overflow-hidden rounded-xl border bg-white p-4 sm:p-5 card-lift ${s.border}`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${s.border} ${s.bg}`}>
                  <Icon size={18} className={s.text} weight="bold" />
                </div>
                <div>
                  <span className="font-mono text-base font-extrabold tracking-tight text-[#111] block leading-tight">
                    {formula}
                  </span>
                  <span className="text-[10px] text-[#787774] block">{name}</span>
                </div>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${s.badgeBg}`}>
                {r.status}
              </span>
            </div>

            {/* Primary readout */}
            <div className="mt-4 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono text-3xl sm:text-4xl font-black tracking-tight tabular-nums ${s.text}`}>
                  {r.value.toFixed(1)}
                </span>
                <span className="font-mono text-xs text-[#787774]">{t.unit}</span>
              </div>
              <span className="text-[10px] text-[#787774] bg-[#f7f6f3] px-2 py-0.5 rounded-full">
                {isOxygen ? `${(20.9 - r.value).toFixed(1)} below norm` : `${pct}% of limit`}
              </span>
            </div>

            {/* Level bar — O₂ inverted (full = safe, depleted = danger) */}
            <div className="mt-3 relative h-2 w-full overflow-hidden rounded-full bg-[#f7f6f3]">
              <div
                className="h-full rounded-full bar-fill"
                style={{ width: `${Math.max(4, pct)}%`, backgroundColor: s.stroke }}
              />
              {!isOxygen && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                  style={{ left: `${(t.safeMax / t.warningMax) * 100}%` }}
                  title={`Safe limit: ${t.safeMax} ${t.unit}`}
                />
              )}
              {isOxygen && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                  style={{ left: `${((19.5 - 16) / (20.9 - 16)) * 100}%` }}
                  title="Min safe: 19.5 %vol"
                />
              )}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-[#eaeaea] pt-2.5 text-[10px] font-mono text-[#787774]">
              <span>{limitLabel}</span>
              <span className="text-red-600 font-semibold">{dangerLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
