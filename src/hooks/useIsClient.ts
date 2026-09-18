"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Canonical post-hydration gate (React docs pattern).
 * Server + first client render => false, then flips true once, so any
 * wall-clock-dependent text (timestamps, chart labels) renders only after
 * hydration — avoiding SSR/clock-skew mismatches without setState-in-effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * Ticking wall-clock value from state (never read during render directly).
 * Lets presentational components show live-aging values (e.g. "last seen
 * Xs ago") while keeping render pure.
 */
export function useNow(stepMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(id);
  }, [stepMs]);
  return now;
}
