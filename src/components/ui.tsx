"use client";

// ============================================================================
// Manhole Guardian — UI primitives (light theme)
// ============================================================================

import type { ReactNode } from "react";
import { useNow, useIsClient } from "@/hooks/useIsClient";
import type { SafetyStatus } from "@/lib/types";

/** Status palette — clean light semantic colors */
export const STATUS_STYLES: Record<
  SafetyStatus,
  {
    text: string;
    bg: string;
    border: string;
    glow: string;
    dot: string;
    stroke: string;
    badgeBg: string;
    radarColor: string;
  }
> = {
  SAFE: {
    text: "text-emerald-700",
    bg: "bg-[#edf3ec]",
    border: "border-emerald-200",
    glow: "",
    dot: "bg-emerald-500",
    stroke: "#059669",
    badgeBg: "bg-[#edf3ec] text-emerald-700 border-emerald-200",
    radarColor: "from-emerald-100/60 to-transparent",
  },
  WARNING: {
    text: "text-amber-700",
    bg: "bg-[#fbf3db]",
    border: "border-amber-200",
    glow: "",
    dot: "bg-amber-500",
    stroke: "#d97706",
    badgeBg: "bg-[#fbf3db] text-amber-700 border-amber-200",
    radarColor: "from-amber-100/60 to-transparent",
  },
  DANGER: {
    text: "text-red-700",
    bg: "bg-[#fdebec]",
    border: "border-red-200",
    glow: "",
    dot: "bg-red-500",
    stroke: "#dc2626",
    badgeBg: "bg-[#fdebec] text-red-700 border-red-200",
    radarColor: "from-red-100/60 to-transparent",
  },
};

export function Panel({
  title,
  right,
  children,
  className = "",
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl bg-white border border-[#eaeaea] p-4 card-lift ${className}`}
    >
      {title ? (
        <header className="mb-3 flex items-center justify-between pb-2.5 border-b border-[#eaeaea]">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#787774]">
            {title}
          </h2>
          {right}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

/** Green pulsing "Connected" dot, or gray "Last seen Xs ago". */
export function ConnectionDot({ lastSeen }: { lastSeen: number }) {
  const isClient = useIsClient();
  const now = useNow(1000);
  const secondsAgo = isClient ? Math.max(0, Math.round((now - lastSeen) / 1000)) : 0;
  const connected = secondsAgo <= 10;
  return (
    <Badge
      className={
        connected
          ? "bg-[#edf3ec] text-emerald-700 border border-emerald-200"
          : "bg-[#f7f6f3] text-[#787774] border border-[#eaeaea]"
      }
    >
      <span className="relative flex h-1.5 w-1.5">
        {connected ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        ) : null}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            connected ? "bg-emerald-500" : "bg-[#bbb]"
          }`}
        />
      </span>
      {isClient ? (connected ? "Connected" : `Last seen ${secondsAgo}s ago`) : "Connecting..."}
    </Badge>
  );
}
