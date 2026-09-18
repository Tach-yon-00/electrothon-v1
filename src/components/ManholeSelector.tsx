"use client";

// ============================================================================
// Manhole Selector — Node switch bar (Light Theme)
// Clean tab strip with status-color accents
// ============================================================================

import type { ManholeRecord } from "@/lib/types";
import { STATUS_STYLES } from "./ui";
import { HardHat } from "@phosphor-icons/react";

export function ManholeSelector({
  manholes,
  selectedId,
  onSelect,
}: {
  manholes: ManholeRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Select monitoring node"
      className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 rounded-xl bg-white border border-[#eaeaea] p-2"
    >
      {manholes.map((m) => {
        const active = m.manhole_id === selectedId;
        const s = STATUS_STYLES[m.overall_status];
        const isOccupied = m.worker_status === "INSIDE";

        return (
          <button
            key={m.manhole_id}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(m.manhole_id)}
            className={`group flex flex-col justify-between rounded-lg p-2.5 text-left transition-all duration-200 cursor-pointer ${
              active
                ? `${s.bg} ${s.border} border ring-1 ring-offset-0`
                : "hover:bg-[#f7f6f3] border border-transparent"
            }`}
          >
            {/* Top row: ID and Status */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full animate-radar rounded-full opacity-60 ${s.dot}`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
                </span>
                <span className="font-mono text-xs font-bold tracking-tight text-[#111]">
                  {m.manhole_id}
                </span>
              </div>
              <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${s.badgeBg}`}>
                {m.overall_status}
              </span>
            </div>

            {/* Location */}
            <div className="mt-1 text-[11px] text-[#787774] truncate">{m.location}</div>

            {/* Worker & Gas */}
            <div className="mt-2 flex items-center justify-between border-t border-[#eaeaea] pt-1.5 text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <HardHat
                  size={11}
                  weight="bold"
                  className={isOccupied ? "text-amber-600" : "text-[#ccc]"}
                />
                <span className={isOccupied ? "text-amber-700 font-bold" : "text-[#bbb]"}>
                  {isOccupied ? "Worker" : "Empty"}
                </span>
              </div>
              <span className="text-[#787774] font-semibold">
                H₂S {m.gas.h2s.value.toFixed(1)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
