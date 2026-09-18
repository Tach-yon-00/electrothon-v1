"use client";

// ============================================================================
// VENUS — Interlock, Worker, Dead-Man Switch & Maintenance State Cards
// Entry control, personnel tracking, work order lifecycle
// ============================================================================

import { formatDuration } from "@/lib/format";
import type { ManholeRecord, MaintenanceState } from "@/lib/types";
import { Badge, Panel } from "./ui";
import {
  Lock,
  LockOpen,
  SpinnerGap,
  WarningOctagon,
  ShieldWarning,
  IdentificationCard,
  ClipboardText,
  Fan,
  Wrench,
  CheckCircle,
  HardHat,
} from "@phosphor-icons/react";

export function InterlockCard({ m }: { m: ManholeRecord }) {
  const isLocked = m.interlock_status === "LOCKED";
  const isVerifying = m.interlock_status === "VERIFYING";

  return (
    <Panel
      title="Access Interlock"
      right={
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
            isLocked
              ? "bg-[#e1f3fe] border-sky-200 text-sky-700"
              : isVerifying
                ? "bg-purple-50 border-purple-200 text-purple-700 animate-pulse"
                : "bg-[#edf3ec] border-emerald-200 text-emerald-700"
          }`}
        >
          {m.interlock_status}
        </span>
      }
    >
      <div className="flex flex-col justify-between min-h-[120px]">
        {isVerifying && m.countdown_seconds !== null ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-700 font-semibold flex items-center gap-1.5">
                <SpinnerGap size={14} className="animate-spin" />
                4-Gas Pre-Entry Sample
              </span>
              <span className="font-mono text-xs text-purple-700 font-bold">
                {m.countdown_seconds}s remaining
              </span>
            </div>
            <div className="mt-2 text-3xl font-black font-mono tracking-tight text-purple-700">
              {Math.max(0, m.countdown_seconds)}s
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#f7f6f3]">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(m.countdown_seconds / 15) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                  isLocked
                    ? "bg-[#e1f3fe] border-sky-200 text-sky-700"
                    : "bg-[#edf3ec] border-emerald-200 text-emerald-700"
                }`}
              >
                {isLocked ? (
                  <Lock size={20} weight="bold" />
                ) : (
                  <LockOpen size={20} weight="bold" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-[#111] tracking-tight">
                  {isLocked ? "Solenoid Deadbolt Engaged" : "Hatch Unlatched"}
                </div>
                <div className="text-xs text-[#787774]">
                  {isLocked ? "Fails locked on power loss" : "PTW scan confirmed"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[#eaeaea] pt-2.5 text-xs text-[#787774]">
          {isLocked
            ? "Auto-locks on gas breach or power loss."
            : isVerifying
              ? "Awaiting 30s clean 4-gas sample + PTW scan to release bolt."
              : "Active entry permitted. Dead-man switch armed."}
        </div>
      </div>
    </Panel>
  );
}

export function WorkerCard({ m }: { m: ManholeRecord }) {
  const inside = m.worker_status === "INSIDE";
  const worker = m.worker;

  return (
    <Panel
      title="Personnel Tracking"
      right={
        <Badge
          className={
            inside
              ? "bg-[#fbf3db] border border-amber-200 text-amber-700"
              : "bg-[#f7f6f3] border border-[#eaeaea] text-[#787774]"
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              inside ? "bg-amber-500 animate-radar" : "bg-[#ccc]"
            }`}
          />
          <span className="font-mono text-[10px] font-bold">
            {m.worker_status}
          </span>
        </Badge>
      }
    >
      <div className="flex flex-col justify-between min-h-[120px]">
        {inside && worker ? (
          <div className="space-y-2">
            {/* Worker identity */}
            <div className="flex items-center gap-2 rounded-lg bg-[#f7f6f3] border border-[#eaeaea] px-2.5 py-2">
              <IdentificationCard size={15} className="text-amber-600 shrink-0" weight="bold" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#111] truncate">{worker.name}</div>
                <div className="font-mono text-[10px] text-[#787774]">{worker.badgeId} · {worker.entryMethod}</div>
              </div>
            </div>
            {/* PTW permit */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#787774]">Permit</span>
              <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{worker.permitId}</span>
            </div>
            {/* Elapsed */}
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black tabular-nums tracking-tight text-amber-600">
                {formatDuration(m.elapsed_time_seconds)}
              </span>
              <span className="text-[10px] text-[#787774]">in shaft</span>
            </div>
          </div>
        ) : inside ? (
          <div>
            <div className="text-[10px] font-semibold text-[#787774] uppercase tracking-widest">
              Time In Confined Space
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <div className="font-mono text-3xl font-black tabular-nums tracking-tight text-amber-600">
                {formatDuration(m.elapsed_time_seconds)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-[#787774]">
              <HardHat size={16} className="text-[#ccc]" weight="bold" />
              <span className="text-xs">No personnel — hatch secured</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#eaeaea] pt-2.5 text-xs text-[#787774]">
          <span>Max shift: 45:00</span>
          <span className={`font-mono font-bold ${inside ? "text-amber-600" : "text-[#ccc]"}`}>
            {inside ? "1 Operator Inside" : "0 Personnel"}
          </span>
        </div>
      </div>
    </Panel>
  );
}

export function CheckinCard({ m }: { m: ManholeRecord }) {
  const inside = m.worker_status === "INSIDE";
  const remaining = Math.max(0, 120 - (m.last_checkin_seconds_ago % 120));
  const manDown = (m._consecutive_missed_checkins ?? 0) >= 2;
  const missedCount = m._consecutive_missed_checkins ?? 0;

  return (
    <Panel
      title="Dead-Man Switch"
      right={
        manDown ? (
          <span className="flex items-center gap-1 rounded-full bg-[#fdebec] border border-red-200 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-red-700 animate-pulse">
            <WarningOctagon size={12} weight="bold" />
            MAN DOWN
          </span>
        ) : inside ? (
          <span className="font-mono text-[10px] text-emerald-700 font-bold bg-[#edf3ec] border border-emerald-200 px-2.5 py-0.5 rounded-full">
            ARMED
          </span>
        ) : (
          <span className="font-mono text-[10px] text-[#787774] bg-[#f7f6f3] border border-[#eaeaea] px-2.5 py-0.5 rounded-full">
            STANDBY
          </span>
        )
      }
    >
      <div className="flex flex-col justify-between min-h-[120px]">
        {manDown ? (
          <div className="rounded-lg border border-red-200 bg-[#fdebec] p-3">
            <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
              <ShieldWarning size={16} weight="bold" className="shrink-0" />
              <span>Emergency Protocol Active</span>
            </div>
            <p className="mt-1.5 text-[11px] text-red-600 leading-relaxed">
              2 consecutive intervals unacknowledged. Emergency rescue dispatch triggered.
            </p>
          </div>
        ) : inside ? (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold text-[#787774] uppercase tracking-widest">
                Check-in Countdown
              </span>
              {missedCount > 0 ? (
                <span className="font-mono text-[10px] font-bold text-amber-700 bg-[#fbf3db] px-2 py-0.5 rounded-full border border-amber-200">
                  {missedCount}/2 missed
                </span>
              ) : null}
            </div>

            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={`font-mono text-3xl font-black tabular-nums tracking-tight ${
                  remaining <= 20 ? "text-amber-600 animate-pulse" : "text-[#111]"
                }`}
              >
                {remaining}s
              </span>
              <span className="text-xs text-[#787774]">until next check-in</span>
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#f7f6f3]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  remaining <= 20 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${(remaining / 120) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center h-full">
            <p className="text-xs text-[#787774] leading-relaxed">
              Standby. Timer auto-arms on NFC badge entry confirmation.
            </p>
          </div>
        )}

        <div className="border-t border-[#eaeaea] pt-2.5 text-xs text-[#787774] flex items-center justify-between">
          <span>Physical ack required</span>
          <span className="font-mono font-semibold text-[#555]">120s interval</span>
        </div>
      </div>
    </Panel>
  );
}

// Maintenance state stepper
const MAINTENANCE_STEPS: { state: MaintenanceState; label: string }[] = [
  { state: "IDLE",                 label: "Idle" },
  { state: "PERMIT_REQUESTED",    label: "Permit Requested" },
  { state: "ATMOSPHERE_PRE_CHECK", label: "Atm. Pre-Check" },
  { state: "VENTILATION_ACTIVE",  label: "Ventilation Active" },
  { state: "WORK_IN_PROGRESS",    label: "Work in Progress" },
];

const STATE_ORDER: MaintenanceState[] = [
  "IDLE", "PERMIT_REQUESTED", "ATMOSPHERE_PRE_CHECK", "VENTILATION_ACTIVE", "WORK_IN_PROGRESS",
];

export function MaintenanceStateCard({ m }: { m: ManholeRecord }) {
  const currentIdx = STATE_ORDER.indexOf(m.maintenance_state);
  const isActive = m.maintenance_state !== "IDLE";
  const wo = m.active_work_order;
  const lastService = m.maintenance_history[0];

  return (
    <Panel
      title="Maintenance State"
      right={
        <span className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
          isActive
            ? "bg-[#fbf3db] border-amber-200 text-amber-700"
            : "bg-[#f7f6f3] border-[#eaeaea] text-[#787774]"
        }`}>
          {isActive ? m.maintenance_state.replace(/_/g, " ") : "IDLE"}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Progress stepper */}
        <div className="flex items-center gap-0.5">
          {MAINTENANCE_STEPS.map(({ state, label }, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={state} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full transition-colors ${
                  done ? "bg-amber-500" : active ? "bg-amber-400" : "bg-[#eaeaea]"
                }`} />
                {active && (
                  <span className="text-[8px] font-semibold text-amber-700 text-center leading-tight">{label}</span>
                )}
              </div>
            );
          })}
        </div>

        {isActive && wo ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-2">
              <ClipboardText size={14} className="text-amber-600 shrink-0" weight="bold" />
              <div>
                <div className="font-mono text-[10px] font-bold text-amber-700">{wo.id}</div>
                <div className="text-[11px] text-[#555]">{wo.type}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="flex items-center gap-1.5">
                <Wrench size={11} className="text-[#bbb]" />
                <span className="text-[#787774]">Crew:</span>
                <span className="font-medium text-[#555] truncate">{wo.crew}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={11} className={wo.lotoStatus === "CLEARED" ? "text-emerald-600" : "text-amber-600"} weight="bold" />
                <span className="text-[#787774]">LOTO:</span>
                <span className={`font-semibold ${wo.lotoStatus === "CLEARED" ? "text-emerald-700" : "text-amber-700"}`}>{wo.lotoStatus.replace(/_/g, " ")}</span>
              </div>
              {wo.blowerStatus === "ACTIVE" && wo.blowerCFM && (
                <div className="col-span-2 flex items-center gap-1.5">
                  <Fan size={11} className="text-sky-500 animate-spin" />
                  <span className="text-[#787774]">Blower:</span>
                  <span className="font-semibold text-sky-700">{wo.blowerCFM} CFM active</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#787774]">
            {lastService
              ? `No active work order. Last service: ${lastService.date} — ${lastService.type}`
              : "No maintenance records on file."}
          </div>
        )}
      </div>
    </Panel>
  );
}
