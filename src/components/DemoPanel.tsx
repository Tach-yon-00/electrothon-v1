"use client";

// ============================================================================
// Demo Control Panel — Scenario driver (Light Theme)
// ============================================================================

import { useState } from "react";
import type { ManholeRecord } from "@/lib/types";
import {
  SlidersHorizontal,
  Flame,
  Warning,
  ShieldCheck,
  SignIn,
  SignOut,
  Clock,
  CheckCircle,
  Wrench,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";

interface DemoAction {
  label: string;
  icon: typeof Flame;
  onClick: () => void;
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
      title: "Atmospheric",
      btns: [
        {
          label: "Trigger Gas Warning",
          icon: Warning,
          onClick: actions.triggerGasWarning,
          cls: "border-amber-200 bg-[#fbf3db] text-amber-700 hover:bg-amber-100",
        },
        {
          label: "Trigger Gas Danger",
          icon: Flame,
          onClick: actions.triggerGasDanger,
          cls: "border-red-200 bg-[#fdebec] text-red-700 hover:bg-red-100",
        },
        {
          label: "Purge / Reset Safe",
          icon: ShieldCheck,
          onClick: actions.resetToSafe,
          cls: "border-emerald-200 bg-[#edf3ec] text-emerald-700 hover:bg-emerald-100",
        },
      ],
    },
    {
      title: "Personnel & Timer",
      btns: [
        {
          label: "Worker Entry",
          icon: SignIn,
          onClick: actions.simulateEntry,
          cls: "border-sky-200 bg-[#e1f3fe] text-sky-700 hover:bg-sky-100",
          disabled: inside,
        },
        {
          label: "Worker Exit",
          icon: SignOut,
          onClick: actions.simulateExit,
          cls: "border-[#eaeaea] bg-[#f7f6f3] text-[#555] hover:bg-[#eaeaea]",
        },
        {
          label: "Missed Check-in",
          icon: Clock,
          onClick: actions.triggerMissedCheckin,
          cls: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
        },
        {
          label: "Acknowledge",
          icon: CheckCircle,
          onClick: actions.workerCheckin,
          cls: "border-emerald-200 bg-[#edf3ec] text-emerald-700 hover:bg-emerald-100",
        },
      ],
    },
    {
      title: "Hardware & Interlock",
      btns: [
        {
          label: "Toggle Sensor Fault",
          icon: Wrench,
          onClick: actions.toggleSensorFault,
          cls: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
        },
        {
          label: "Interlock Purge Test (15s)",
          icon: Clock,
          onClick: actions.startVerify,
          cls: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
        },
      ],
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-white border border-[#eaeaea]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#f7f6f3] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal size={15} weight="bold" className="text-[#787774]" />
          <span className="text-xs font-semibold text-[#555] uppercase tracking-widest">
            Scenario Driver
          </span>
          <span className="rounded-full bg-[#f7f6f3] border border-[#eaeaea] px-2 py-0.5 text-[10px] font-semibold text-[#787774]">
            {selected.manhole_id}
          </span>
        </div>
        <span className="text-[#787774]">
          {open ? <CaretUp size={13} weight="bold" /> : <CaretDown size={13} weight="bold" />}
        </span>
      </button>

      {open ? (
        <div className="border-t border-[#eaeaea] p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {groups.map((g) => (
              <div key={g.title} className="flex flex-col gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#787774]">
                  {g.title}
                </div>
                <div className="flex flex-col gap-1.5">
                  {g.btns.map((b) => {
                    const Icon = b.icon;
                    return (
                      <button
                        key={b.label}
                        onClick={b.onClick}
                        disabled={b.disabled}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150 ${b.cls} ${
                          b.disabled ? "cursor-not-allowed opacity-35 pointer-events-none" : "cursor-pointer active:scale-[0.98]"
                        }`}
                      >
                        <Icon size={13} weight="bold" className="shrink-0" />
                        <span>{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 pt-3 border-t border-[#eaeaea] text-[11px] text-[#787774]">
            2 missed check-ins or a gas spike triggers emergency lockout and an incident log entry.
          </p>
        </div>
      ) : null}
    </div>
  );
}
