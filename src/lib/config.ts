// ============================================================================
// Manhole Guardian — Config
// Central place for gas thresholds, timings and mock device metadata.
// Judges / devs can tweak everything from here.
// ============================================================================

import type { GasThresholds } from "./types";

/**
 * Gas safety thresholds (values chosen for demo purposes).
 * value <  safeMax                 => SAFE
 * safeMax <= value < warningMax    => WARNING
 * value >= warningMax              => DANGER
 */
export const GAS_THRESHOLDS: Record<"h2s" | "co" | "ch4", GasThresholds> = {
  h2s: { unit: "ppm", safeMax: 10, warningMax: 20 }, // OSHA 8h TWA ~10 ppm
  co: { unit: "ppm", safeMax: 35, warningMax: 70 }, // OSHA 8h TWA ~35 ppm
  ch4: { unit: "%LEL", safeMax: 5, warningMax: 10 }, // lower explosive limit %
};

/** Seconds remaining on the dead-man's switch when a check-in is confirmed. */
export const CHECKIN_INTERVAL_SECONDS = 120;
/** A check-in is considered MISSED when the countdown hits 0. */
export const MAN_DOWN_AFTER_MISSED = 2;

/** Live data simulation tick (ms). Keep small so timers look real-time. */
export const SIM_TICK_MS = 1000;

/** Interval at which new history points are appended (ms). */
export const HISTORY_SAMPLE_MS = 60_000;

/** History window shown on the chart. */
export const HISTORY_WINDOW_MS = 2 * 60 * 60 * 1000;

/** How often the "connection" heartbeat refreshes (ms). */
export const HEARTBEAT_MS = 5000;
