"use client";

// ============================================================================
// Status Header — the big color-coded overall status banner
// ============================================================================

import type { ManholeRecord } from "@/lib/types";
import { ConnectionDot, STATUS_STYLES } from "./ui";

const STATUS_LABEL = {
  SAFE: "All parameters nominal",
  WARNING: "Gas levels elevated — monitor closely",
  DANGER: "Evacuation required — gas levels critical",
} as const;

export function StatusHeader({ m }: { m: ManholeRecord }) {
  const s = STATUS_STYLES[m.overall_status];
  const pulse =
    m.overall_status === "DANGER"
      ? "animate-pulse"
      : m.overall_status === "WARNING"
        ? "animate-pulse"
        : "";

  return (
    <section
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5 ${s.bg} ${s.border} ${s.glow}`}
    >
      <div className="flex items-center gap-5">
        {/* Pulsing status beacon */}
        <span className="relative flex h-4 w-4">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${s.dot}`}
          />
          <span className={`relative inline-flex h-4 w-4 rounded-full ${s.dot}`} />
        </span>
        <div>
          <div
            className={`text-5xl font-black leading-none tracking-tight ${s.text} ${pulse}`}
          >
            {m.overall_status}
          </div>
          <p className="mt-1.5 text-sm text-zinc-400">{STATUS_LABEL[m.overall_status]}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {/* Sensor fault badge (req #9) */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              m.sensor_fault
                ? "bg-red-500/15 text-red-300"
                : "bg-emerald-500/10 text-emerald-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                m.sensor_fault ? "bg-red-400" : "bg-emerald-400"
              }`}
            />
            {m.sensor_fault ? "Sensor Fault" : "Sensor OK"}
          </span>
          {/* Connection status dot (req #10) */}
          <ConnectionDot lastSeen={m.last_seen} />
        </div>
        <span className="font-mono text-xs text-zinc-500">
          {m.manhole_id} · {m.location}
        </span>
      </div>
    </section>
  );
}
