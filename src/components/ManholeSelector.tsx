"use client";

// ============================================================================
// Manhole Selector — tabs for MH-01/02/03 with at-a-glance status dots
// ============================================================================

import type { ManholeRecord } from "@/lib/types";
import { STATUS_STYLES } from "./ui";

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
      aria-label="Select manhole"
      className="flex gap-2 rounded-xl border border-white/10 bg-zinc-900/60 p-1.5"
    >
      {manholes.map((m) => {
        const active = m.manhole_id === selectedId;
        const s = STATUS_STYLES[m.overall_status];
        return (
          <button
            key={m.manhole_id}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(m.manhole_id)}
            className={`flex flex-1 items-center justify-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-white/10 text-white shadow-inner"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
            <span className="font-mono">{m.manhole_id}</span>
            <span className="hidden text-xs font-normal text-zinc-500 lg:inline">
              {m.location}
            </span>
          </button>
        );
      })}
    </div>
  );
}
