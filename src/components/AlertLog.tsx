"use client";

// ============================================================================
// Alert Log — scrollable, newest-first timestamped event feed
// ============================================================================

import { formatTime } from "@/lib/format";
import type { AlertEvent, AlertEventType } from "@/lib/types";
import { Panel } from "./ui";

const EVENT_STYLES: Record<
  AlertEventType,
  { color: string; icon: string }
> = {
  man_down: { color: "text-red-400", icon: "🚨" },
  gas_danger: { color: "text-red-300", icon: "☠" },
  gas_warning: { color: "text-amber-300", icon: "⚠" },
  sensor_fault: { color: "text-orange-300", icon: "⚡" },
  entry: { color: "text-sky-300", icon: "↓" },
  exit: { color: "text-sky-300", icon: "↑" },
  interlock_unlocked: { color: "text-violet-300", icon: "🔓" },
  interlock_locked: { color: "text-zinc-400", icon: "🔒" },
  checkin_reset: { color: "text-emerald-300", icon: "✓" },
};

export function AlertLog({ events }: { events: AlertEvent[] }) {
  return (
    <Panel title="Alert Log" right={<span className="text-[10px] text-zinc-500">newest first</span>}>
      <ul className="max-h-[268px] space-y-1 overflow-y-auto pr-1">
        {events.map((e) => {
          const st = EVENT_STYLES[e.type];
          return (
            <li
              key={e.id}
              className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white/5"
            >
              <span aria-hidden className="mt-0.5 w-4 shrink-0 text-center">
                {st.icon}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                {formatTime(e.timestamp)}
              </span>
              <span className={`${st.color} leading-snug`}>{e.message}</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
