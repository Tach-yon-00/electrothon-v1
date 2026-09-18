"use client";

// ============================================================================
// Gas Cards — one tile per gas (H2S / CO / CH4) with independent status color
// ============================================================================

import { GAS_THRESHOLDS } from "@/lib/config";
import type { GasReading, ManholeRecord, SafetyStatus } from "@/lib/types";
import { STATUS_STYLES } from "./ui";

const GASES: { key: "h2s" | "co" | "ch4"; label: string; full: string }[] = [
  { key: "h2s", label: "H₂S", full: "Hydrogen Sulfide" },
  { key: "co", label: "CO", full: "Carbon Monoxide" },
  { key: "ch4", label: "CH₄", full: "Methane (%LEL)" },
];

/** Tiny horizontal bar showing the reading vs warning threshold. */
function LevelBar({ value, max, stroke }: { value: number; max: number; stroke: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: stroke }}
      />
    </div>
  );
}

export function GasCards({ gas }: { gas: ManholeRecord["gas"] }) {
  const readings: Record<"h2s" | "co" | "ch4", GasReading> = gas;
  return (
    <div className="grid grid-cols-3 gap-3">
      {GASES.map(({ key, label, full }) => {
        const r = readings[key];
        const t = GAS_THRESHOLDS[key];
        const s: Record<SafetyStatus, (typeof STATUS_STYLES)["SAFE"]> =
          STATUS_STYLES;
        return (
          <div
            key={key}
            className={`rounded-xl border p-4 ${s[r.status].bg} ${s[r.status].border}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-200">{label}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${s[r.status].text} bg-white/5`}
              >
                {r.status}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`font-mono text-3xl font-bold tabular-nums ${s[r.status].text}`}
              >
                {r.value.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500">{t.unit}</span>
            </div>
            <LevelBar value={r.value} max={t.warningMax} stroke={s[r.status].stroke} />
            <p className="mt-2 text-[10px] text-zinc-500">
              Safe &lt;{t.safeMax} · Danger ≥{t.warningMax} {t.unit} — {full}
            </p>
          </div>
        );
      })}
    </div>
  );
}
