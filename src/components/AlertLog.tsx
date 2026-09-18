"use client";

// ============================================================================
// Alert Log — Incident & Audit Log (Light Theme)
// ============================================================================

import { formatTime } from "@/lib/format";
import type { AlertEvent, AlertEventType } from "@/lib/types";
import { Panel } from "./ui";
import {
  Bell,
  Warning,
  Flame,
  Cpu,
  SignIn,
  SignOut,
  Lock,
  LockOpen,
  CheckCircle,
  WarningOctagon,
} from "@phosphor-icons/react";

const EVENT_CONFIG: Record<
  AlertEventType,
  { icon: typeof Warning; badgeStyle: string; textColor: string; label: string }
> = {
  man_down:             { icon: WarningOctagon, badgeStyle: "bg-[#fdebec] text-red-700 border-red-200",         textColor: "text-red-700 font-semibold", label: "MAN DOWN"    },
  gas_danger:           { icon: Flame,          badgeStyle: "bg-[#fdebec] text-red-700 border-red-200",         textColor: "text-red-700",               label: "GAS DANGER"  },
  gas_warning:          { icon: Warning,        badgeStyle: "bg-[#fbf3db] text-amber-700 border-amber-200",     textColor: "text-amber-700",             label: "WARNING"     },
  sensor_fault:         { icon: Cpu,            badgeStyle: "bg-purple-50 text-purple-700 border-purple-200",   textColor: "text-purple-700",            label: "HARDWARE"    },
  entry:                { icon: SignIn,         badgeStyle: "bg-[#e1f3fe] text-sky-700 border-sky-200",         textColor: "text-sky-700",               label: "ENTRY"       },
  exit:                 { icon: SignOut,        badgeStyle: "bg-[#e1f3fe] text-sky-700 border-sky-200",         textColor: "text-sky-700",               label: "EXIT"        },
  interlock_unlocked:   { icon: LockOpen,       badgeStyle: "bg-[#edf3ec] text-emerald-700 border-emerald-200", textColor: "text-emerald-700",           label: "INTERLOCK"   },
  interlock_locked:     { icon: Lock,           badgeStyle: "bg-[#f7f6f3] text-[#555] border-[#eaeaea]",        textColor: "text-[#555]",                label: "INTERLOCK"   },
  checkin_reset:        { icon: CheckCircle,    badgeStyle: "bg-[#edf3ec] text-emerald-700 border-emerald-200", textColor: "text-emerald-700",           label: "CHECK-IN"    },
  maintenance_completed:{ icon: CheckCircle,    badgeStyle: "bg-[#edf3ec] text-emerald-700 border-emerald-200", textColor: "text-emerald-700",           label: "MAINTENANCE" },
  work_order_opened:    { icon: CheckCircle,    badgeStyle: "bg-[#fbf3db] text-amber-700 border-amber-200",     textColor: "text-amber-700",             label: "WORK ORDER"  },
  ventilation_started:  { icon: Warning,        badgeStyle: "bg-[#fbf3db] text-amber-700 border-amber-200",     textColor: "text-amber-700",             label: "VENTILATION" },
  permit_cleared:       { icon: CheckCircle,    badgeStyle: "bg-[#edf3ec] text-emerald-700 border-emerald-200", textColor: "text-emerald-700",           label: "PERMIT"      },
  badge_entry:          { icon: SignIn,         badgeStyle: "bg-[#e1f3fe] text-sky-700 border-sky-200",         textColor: "text-sky-700",               label: "BADGE"       },
};

export function AlertLog({ events }: { events: AlertEvent[] }) {
  return (
    <Panel
      title="Incident & Audit Log"
      right={
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#787774]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{events.length} events</span>
        </div>
      }
    >
      <ul className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <li className="py-8 text-center text-xs text-[#787774]">
            No incidents recorded in this session.
          </li>
        ) : (
          events.map((e) => {
            const cfg = EVENT_CONFIG[e.type] ?? {
              icon: Bell,
              badgeStyle: "bg-[#f7f6f3] text-[#555] border-[#eaeaea]",
              textColor: "text-[#555]",
              label: "EVENT",
            };
            const Icon = cfg.icon;

            return (
              <li
                key={e.id}
                className="flex items-start gap-2.5 rounded-lg p-2.5 text-xs hover:bg-[#f7f6f3] transition-colors"
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${cfg.badgeStyle}`}
                >
                  <Icon size={11} weight="bold" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#bbb]">
                      {formatTime(e.timestamp)}
                    </span>
                    <span className={`font-mono text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full border ${cfg.badgeStyle}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className={`mt-0.5 leading-relaxed ${cfg.textColor}`}>{e.message}</p>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </Panel>
  );
}
