"use client";

// ============================================================================
// Interlock + Worker cards — Entry control, personnel tracking (Light Theme)
// Clean, readable safety metrics
// ============================================================================

import { formatDuration } from "@/lib/format";
import type { ManholeRecord } from "@/lib/types";
import { Badge, Panel } from "./ui";
import {
  Lock,
  LockOpen,
  SpinnerGap,
  WarningOctagon,
  ShieldWarning,
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
                Pre-entry Verification
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
                  {isLocked ? "Mechanically Secured" : "Hatch Unlocked"}
                </div>
                <div className="text-xs text-[#787774]">
                  {isLocked ? "Physical air lock engaged" : "Authorized for crew entry"}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[#eaeaea] pt-2.5 text-xs text-[#787774]">
          {isLocked
            ? "Hatch auto-locks if gas breaches safe threshold."
            : isVerifying
              ? "Verifying sensors before releasing solenoid lock."
              : "Active entry permitted. Dead-man switch armed."}
        </div>
      </div>
    </Panel>
  );
}

export function WorkerCard({ m }: { m: ManholeRecord }) {
  const inside = m.worker_status === "INSIDE";

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
        <div>
          <div className="text-[10px] font-semibold text-[#787774] uppercase tracking-widest">
            Time In Confined Space
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <div
              className={`font-mono text-3xl font-black tabular-nums tracking-tight ${
                inside ? "text-amber-600" : "text-[#ccc]"
              }`}
            >
              {formatDuration(m.elapsed_time_seconds)}
            </div>
            {inside ? (
              <span className="text-[10px] font-bold text-amber-700 bg-[#fbf3db] px-2 py-0.5 rounded-full border border-amber-200">
                Active
              </span>
            ) : null}
          </div>
        </div>

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
              Standby. Safety timer auto-arms when worker entry is confirmed.
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
