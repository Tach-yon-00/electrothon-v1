"use client";

// ============================================================================
// Status Header — Municipal Telemetry Status Banner (Light Theme)
// Minimalist, high-clarity typography with human-crafted editorial structure
// ============================================================================

import type { ManholeRecord } from "@/lib/types";
import { ConnectionDot, STATUS_STYLES } from "./ui";
import {
  ShieldCheck,
  Warning,
  Flame,
  MapPin,
  Cpu,
} from "@phosphor-icons/react";

const STATUS_CONFIG = {
  SAFE: {
    label: "Atmosphere Nominal",
    desc: "All monitored gases and ventilation parameters are within municipal safety thresholds.",
    icon: ShieldCheck,
  },
  WARNING: {
    label: "Gas Elevation Detected",
    desc: "Hazardous gas concentration is approaching the permissible exposure limit. Caution required.",
    icon: Warning,
  },
  DANGER: {
    label: "Critical Hazard — Evacuate",
    desc: "Atmosphere exceeds lethal threshold. Immediate evacuation protocol engaged.",
    icon: Flame,
  },
} as const;

export function StatusHeader({ m }: { m: ManholeRecord }) {
  const s = STATUS_STYLES[m.overall_status];
  const cfg = STATUS_CONFIG[m.overall_status];
  const Icon = cfg.icon;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5 sm:p-6 transition-colors duration-300`}
    >
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Status Icon */}
          <div
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${s.border} bg-white shadow-xs`}
          >
            <Icon size={24} weight="bold" className={s.text} />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-radar rounded-full opacity-75 ${s.dot}`}
              />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full border border-white ${s.dot}`} />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-[#787774] uppercase">
                Status
              </span>
              <span className="h-1 w-1 rounded-full bg-[#ccc]" />
              <span className={`text-xs font-bold ${s.text}`}>
                {m.overall_status}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] mt-0.5">
              {cfg.label}
            </h2>
            <p className="mt-1 text-xs text-[#555] max-w-xl leading-relaxed">
              {cfg.desc}
            </p>
          </div>
        </div>

        {/* Right Info Matrix */}
        <div className="flex flex-col items-start sm:items-end gap-2 border-t sm:border-t-0 border-[#eaeaea] pt-3 sm:pt-0 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                m.sensor_fault
                  ? "border-red-200 bg-[#fdebec] text-red-700"
                  : "border-emerald-200 bg-[#edf3ec] text-emerald-700"
              }`}
            >
              <Cpu size={13} weight="bold" />
              {m.sensor_fault ? "Sensor Fault" : "Sensors Nominal"}
            </span>

            <ConnectionDot lastSeen={m.last_seen} />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#555] bg-white border border-[#eaeaea] px-2.5 py-1 rounded-lg">
            <MapPin size={13} className="text-[#888]" />
            <span className="font-bold text-[#111]">{m.manhole_id}</span>
            <span className="text-[#ccc]">|</span>
            <span className="text-[#666] truncate max-w-[220px] sm:max-w-none">{m.location}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
