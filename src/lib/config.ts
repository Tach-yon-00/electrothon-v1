// ============================================================================
// VENUS — Config
// Central place for gas thresholds, timings and mock device metadata.
// ============================================================================

import type { GasThresholds } from "./types";

/**
 * Gas safety thresholds per OSHA 29 CFR 1910.146 confined-space regulations.
 *
 * H₂S, CO, CH₄: high value = dangerous (warningMax triggers DANGER)
 * O₂: low value = dangerous (warningMin triggers DANGER — inverted logic)
 *
 * Status bands:
 *   SAFE    — value < safeMax  (or for O₂: value > safeMin)
 *   WARNING — safeMax  ≤ value < warningMax  (or for O₂: safeMin ≥ value > warningMin)
 *   DANGER  — value ≥ warningMax  (or for O₂: value ≤ warningMin)
 */
export const GAS_THRESHOLDS: Record<"h2s" | "co" | "ch4" | "o2", GasThresholds> = {
  h2s:  { unit: "ppm",  safeMax: 10,   warningMax: 20  },  // OSHA 8h TWA ~10 ppm; IDLH 50 ppm
  co:   { unit: "ppm",  safeMax: 35,   warningMax: 70  },  // OSHA 8h TWA ~35 ppm; IDLH 1200 ppm
  ch4:  { unit: "%LEL", safeMax: 5,    warningMax: 10  },  // 10% LEL action level; 100% LEL = 5% vol
  o2:   {                                                   // OSHA 1910.146: <19.5% oxygen-deficient
    unit:            "%vol",
    safeMax:         100,   // unused for O₂ — high O₂ only flagged via separate hyperoxia check
    warningMax:      100,   // unused
    safeMin:         19.5,  // below this = WARNING (oxygen-deficient atmosphere)
    warningMin:      18.0,  // below this = DANGER  (imminent asphyxiation risk)
    normalBaseline:  20.9,  // normal dry air at sea level
  },
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
