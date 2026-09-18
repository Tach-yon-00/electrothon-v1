"use client";

// ============================================================================
// Gas Cards — Atmospheric Sensor Readouts (Light Theme)
// Clean numeric-first cards with minimal chrome
// ============================================================================

import { GAS_THRESHOLDS } from "@/lib/config";
import type { GasReading, ManholeRecord } from "@/lib/types";
import { STATUS_STYLES } from "./ui";
import { Pulse, Flame, ShieldWarning } from "@phosphor-icons/react";

interface GasMeta {
  key: "h2s" | "co" | "ch4";
  formula: string;
  name: string;
  icon: typeof Flame;
}

const GAS_CONFIG: GasMeta[] = [
  { key: "h2s", formula: "H₂S", name: "Hydrogen Sulfide", icon: ShieldWarning },
  { key: "co",  formula: "CO",  name: "Carbon Monoxide",  icon: Pulse },
  { key: "ch4", formula: "CH₄", name: "Methane (%LEL)",   icon: Flame },
];

export function GasCards({ gas }: { gas: ManholeRecord["gas"] }) {
  const readings: Record<"h2s" | "co" | "ch4", GasReading> = gas;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
      {GAS_CONFIG.map(({ key, formula, name, icon: Icon }) => {
        const r = readings[key];
        const t = GAS_THRESHOLDS[key];
        const s = STATUS_STYLES[r.status];
        const pct = Math.min(100, Math.round((r.value / t.warningMax) * 100));

        return (
          <div
            key={key}
            className={`relative overflow-hidden rounded-xl border bg-white p-4 sm:p-5 card-lift ${s.border}`}
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
                {pct}% of limit
              </span>
            </div>

            {/* Level bar */}
            <div className="mt-3 relative h-2 w-full overflow-hidden rounded-full bg-[#f7f6f3]">
              <div
                className="h-full rounded-full bar-fill"
                style={{ width: `${Math.max(4, pct)}%`, backgroundColor: s.stroke }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                style={{ left: `${(t.safeMax / t.warningMax) * 100}%` }}
                title={`Safe limit: ${t.safeMax} ${t.unit}`}
              />
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-[#eaeaea] pt-2.5 text-[10px] font-mono text-[#787774]">
              <span>Safe &lt;{t.safeMax}{t.unit}</span>
              <span className="text-red-600 font-semibold">Danger &ge;{t.warningMax}{t.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
