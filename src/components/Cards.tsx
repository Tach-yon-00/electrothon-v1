"use client";

// ============================================================================
// Interlock + Worker cards — entry control and presence tracking
// ============================================================================

import { formatDuration } from "@/lib/format";
import type { ManholeRecord } from "@/lib/types";
import { Badge, Panel } from "./ui";

const INTERLOCK_STYLES = {
  LOCKED: "bg-sky-500/10 text-sky-300 border-sky-500/40",
  UNLOCKED: "bg-amber-500/10 text-amber-300 border-amber-500/40",
  VERIFYING: "bg-violet-500/10 text-violet-300 border-violet-500/40",
} as const;

const INTERLOCK_ICON = {
  LOCKED: "🔒",
  UNLOCKED: "🔓",
  VERIFYING: "⏳",
} as const;

export function InterlockCard({ m }: { m: ManholeRecord }) {
  return (
    <Panel title="Entry Interlock">
      <div
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-lg font-bold ${INTERLOCK_STYLES[m.interlock_status]}`}
      >
        <span aria-hidden>{INTERLOCK_ICON[m.interlock_status]}</span>
        {m.interlock_status}
      </div>

      {m.interlock_status === "VERIFYING" && m.countdown_seconds !== null ? (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-violet-300">
              {Math.max(0, m.countdown_seconds)}s
            </span>
            <span className="text-xs text-zinc-500">unlocking…</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(m.countdown_seconds / 15) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">
          {m.interlock_status === "LOCKED"
            ? "Hatch mechanically locked — entry requires authorization"
            : "Hatch unlocked — entry permitted"}
        </p>
      )}
    </Panel>
  );
}

export function WorkerCard({ m }: { m: ManholeRecord }) {
  const inside = m.worker_status === "INSIDE";
  return (
    <Panel title="Worker Presence">
      <div className="flex items-center gap-3">
        <Badge
          className={
            inside
              ? "bg-amber-500/15 text-amber-300"
              : "bg-emerald-500/10 text-emerald-300"
          }
        >
          <span className={`h-2 w-2 rounded-full ${inside ? "bg-amber-400" : "bg-emerald-400"}`} />
          {m.worker_status}
        </Badge>
        {inside ? (
          <span className="text-xs text-zinc-500">worker in confined space</span>
        ) : (
          <span className="text-xs text-zinc-500">no one inside</span>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">
          Time inside
        </div>
        <div
          className={`font-mono text-3xl font-bold tabular-nums ${
            inside ? "text-zinc-100" : "text-zinc-600"
          }`}
        >
          {formatDuration(m.elapsed_time_seconds)}
        </div>
      </div>
    </Panel>
  );
}

/** Dead-man's switch — "next check-in due in Xs" + MAN DOWN state. */
export function CheckinCard({ m }: { m: ManholeRecord }) {
  const inside = m.worker_status === "INSIDE";
  const remaining = Math.max(
    0,
    120 - (m.last_checkin_seconds_ago % 120)
  );
  const manDown = (m._consecutive_missed_checkins ?? 0) >= 2;

  return (
    <Panel title="Dead-Man's Switch">
      {manDown ? (
        <div className="rounded-lg border border-red-500/50 bg-red-500/15 px-3 py-3">
          <div className="flex items-center gap-2 text-lg font-black tracking-wide text-red-300">
            <span aria-hidden>🚨</span> MAN DOWN
          </div>
          <p className="mt-1 text-xs text-red-200/70">
            2 consecutive check-ins missed — initiate rescue protocol
          </p>
        </div>
      ) : inside ? (
        <>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono text-3xl font-bold tabular-nums ${
                remaining <= 20 ? "text-amber-300" : "text-zinc-100"
              }`}
            >
              {remaining}s
            </span>
            <span className="text-xs text-zinc-500">until next check-in</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                remaining <= 20 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${(remaining / 120) * 100}%` }}
            />
          </div>
          {(m._consecutive_missed_checkins ?? 0) > 0 ? (
            <p className="mt-2 text-xs text-amber-300">
              ⚠ {m._consecutive_missed_checkins}/2 check-ins missed
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-zinc-500">
          Standby — switch arms when a worker is INSIDE
        </p>
      )}
    </Panel>
  );
}
