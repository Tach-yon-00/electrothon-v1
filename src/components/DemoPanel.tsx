"use client";

// ============================================================================
// Demo Control Panel — hidden dev tools to drive the live demo narrative
// Collapsed by default; expand to trigger state changes manually.
// ============================================================================

import { useState } from "react";
import type { ManholeRecord } from "@/lib/types";

interface DemoAction {
  label: string;
  onClick: () => void;
  /** Tailwind classes for the button flavor. */
  cls: string;
  disabled?: boolean;
}

export function DemoPanel({
  selected,
  actions,
}: {
  selected: ManholeRecord;
  actions: {
    triggerGasWarning: () => void;
    triggerGasDanger: () => void;
    resetToSafe: () => void;
    simulateEntry: () => void;
    simulateExit: () => void;
    triggerMissedCheckin: () => void;
    toggleSensorFault: () => void;
    startVerify: () => void;
    workerCheckin: () => void;
  };
}) {
  const [open, setOpen] = useState(false);
  const inside = selected.worker_status === "INSIDE";

  const groups: { title: string; btns: DemoAction[] }[] = [
    {
      title: "Gas",
      btns: [
        {
          label: "Trigger Gas Warning",
          onClick: actions.triggerGasWarning,
          cls: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25",
        },
        {
          label: "Trigger Gas Danger",
          onClick: actions.triggerGasDanger,
          cls: "bg-red-500/15 text-red-300 hover:bg-red-500/25",
        },
        {
          label: "Clear Air / Reset to Safe",
          onClick: actions.resetToSafe,
          cls: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
        },
      ],
    },
    {
      title: "Worker",
      btns: [
        {
          label: "Simulate Worker Entry",
          onClick: actions.simulateEntry,
          cls: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25",
          disabled: inside,
        },
        {
          label: "Simulate Worker Exit",
          onClick: actions.simulateExit,
          cls: "bg-zinc-500/15 text-zinc-300 hover:bg-zinc-500/25",
        },
        {
          label: "Trigger Missed Check-in",
          onClick: actions.triggerMissedCheckin,
          cls: "bg-orange-500/15 text-orange-300 hover:bg-orange-500/25",
        },
        {
          label: "Worker Check-in",
          onClick: actions.workerCheckin,
          cls: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
        },
      ],
    },
    {
      title: "Hardware",
      btns: [
        {
          label: "Toggle Sensor Fault",
          onClick: actions.toggleSensorFault,
          cls: "bg-fuchsia-500/15 text-fuchsia-300 hover:bg-fuchsia-500/25",
        },
        {
          label: "Interlock Verify (15s)",
          onClick: actions.startVerify,
          cls: "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25",
        },
      ],
    },
  ];

  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-zinc-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-300"
      >
        <span>🛠 Demo Control Panel — {selected.manhole_id} (dev only)</span>
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 px-4 py-3">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                {g.title}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.btns.map((b) => (
                  <button
                    key={b.label}
                    onClick={b.onClick}
                    disabled={b.disabled}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${b.cls} ${
                      b.disabled ? "cursor-not-allowed opacity-40" : ""
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="w-full text-[10px] leading-relaxed text-zinc-600">
            Missed check-in ×2 (or 120s without check-in while INSIDE) fires MAN DOWN.
            &ldquo;Worker Check-in&rdquo; resets the dead-man&apos;s switch.
          </p>
        </div>
      ) : null}
    </div>
  );
}
