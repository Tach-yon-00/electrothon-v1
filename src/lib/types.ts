// ============================================================================
// Manhole Guardian — Types
// Shared type definitions for manhole telemetry records.
// Structured to mirror what a real backend (Firebase / REST / WebSocket)
// would return, so UI components can be reused without restructuring.
// ============================================================================

/** Overall safety status of a manhole, derived from the worst gas reading. */
export type SafetyStatus = "SAFE" | "WARNING" | "DANGER";

/** Per-gas computed status. */
export type GasStatus = SafetyStatus;

/** Per-gas reading with its computed status. */
export interface GasReading {
  value: number;
  status: GasStatus;
}

/** Worker presence inside the manhole. */
export type WorkerStatus = "INSIDE" | "OUTSIDE";

/** Entry interlock state. */
export type InterlockStatus = "LOCKED" | "UNLOCKED" | "VERIFYING";

/** Types of events that can appear in the alert log. */
export type AlertEventType =
  | "gas_warning"
  | "gas_danger"
  | "man_down"
  | "entry"
  | "exit"
  | "interlock_unlocked"
  | "interlock_locked"
  | "sensor_fault"
  | "checkin_reset";

/** A single entry in the timestamped alert log. */
export interface AlertEvent {
  id: string;
  type: AlertEventType;
  /** Milliseconds since epoch. */
  timestamp: number;
  message: string;
}

/** One sample of gas history (for the 2-hour line chart). */
export interface HistoryPoint {
  /** Milliseconds since epoch. */
  timestamp: number;
  h2s: number;
  co: number;
  ch4: number;
}

/**
 * Full telemetry record for one manhole — this is the shape a real
 * DB document / API response / websocket payload should provide.
 */
export interface ManholeRecord {
  manhole_id: string;
  /** Location label, e.g. "Sector 4 — Main Road Junction". */
  location: string;
  /** Current gas readings with computed statuses. */
  gas: {
    h2s: GasReading;
    co: GasReading;
    ch4: GasReading;
  };
  /** Derived from the worst of the three gas statuses. */
  overall_status: SafetyStatus;
  worker_status: WorkerStatus;
  /** Running timer while a worker is INSIDE (seconds). */
  elapsed_time_seconds: number;
  interlock_status: InterlockStatus;
  /** Live countdown while interlock is VERIFYING (seconds). */
  countdown_seconds: number | null;
  /** Dead-man's switch: seconds until the next worker check-in is due. */
  last_checkin_seconds_ago: number;
  sensor_fault: boolean;
  /** Milliseconds since epoch — used to derive connected vs "last seen". */
  last_seen: number;
  /** ~2 hours of history sampled every ~1 minute. */
  history: HistoryPoint[];
  /** Newest-first event feed. */
  alerts: AlertEvent[];
  /**
   * Simulation-only bookkeeping (not part of a real payload):
   * counts consecutive missed check-ins for the MAN DOWN logic.
   */
  _consecutive_missed_checkins?: number;
}

/** Thresholds per gas: [safeBelow, warningBelow] — above warning => DANGER. */
export interface GasThresholds {
  /** Display unit, e.g. "ppm". */
  unit: string;
  /** Reading >= safeMax means WARNING or worse. */
  safeMax: number;
  /** Reading >= warningMax means DANGER. */
  warningMax: number;
}
