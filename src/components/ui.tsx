"use client";

// ============================================================================
// Manhole Guardian — UI primitives
// Shared, presentational building blocks (badges, dots, panel shells).
// ============================================================================

import type { ReactNode } from "react";
import { useNow } from "@/hooks/useIsClient";
import type { SafetyStatus } from "@/lib/types";

/** One palette entry per status — strong colors readable from a distance. */
export const STATUS_STYLES: Record<
  SafetyStatus,
  { text: string; bg: string; border: string; glow: string; dot: string; stroke: string }
> = {
  SAFE: {
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    glow: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]",
    dot: "bg-emerald-400",
    stroke: "#34d399",
  },
  WARNING: {
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    glow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.55)]",
    dot: "bg-amber-400",
    stroke: "#fbbf24",
  },
  DANGER: {
    text: "text-red-300",
    bg: "bg-red-500/15",
    border: "border-red-500/50",
    glow: "shadow-[0_0_35px_-5px_rgba(239,68,68,0.65)]",
    dot: "bg-red-400",
    stroke: "#f87171",
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
      className={`rounded-xl border border-white/10 bg-zinc-900/60 p-4 ${className}`}
    >
      {title ? (
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

/** Green pulsing "Connected" dot, or gray "Last seen Xs ago". */
export function ConnectionDot({ lastSeen }: { lastSeen: number }) {
  const now = useNow(1000);
  const secondsAgo = Math.max(0, Math.round((now - lastSeen) / 1000));
  const connected = secondsAgo <= 10;
  return (
    <Badge
      className={
        connected
          ? "bg-emerald-500/10 text-emerald-300"
          : "bg-zinc-700/40 text-zinc-400"
      }
    >
      <span className="relative flex h-2 w-2">
        {connected ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        ) : null}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            connected ? "bg-emerald-400" : "bg-zinc-500"
          }`}
        />
      </span>
      {connected ? "Connected" : `Last seen ${secondsAgo}s ago`}
    </Badge>
  );
}
