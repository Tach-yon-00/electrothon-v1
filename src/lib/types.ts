// ============================================================================
// Manhole Guardian — Extended Types
// Includes GPS coordinates, structural specs, maintenance history, record peak gas levels.
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
  | "checkin_reset"
  | "maintenance_completed";

/** A single entry in the timestamped alert log. */
export interface AlertEvent {
  id: string;
  type: AlertEventType;
  /** Milliseconds since epoch. */
  timestamp: number;
  message: string;
}

/** One sample of gas history (for the line chart). */
export interface HistoryPoint {
  /** Milliseconds since epoch. */
  timestamp: number;
  h2s: number;
  co: number;
  ch4: number;
}

/** Maintenance log entry. */
export interface MaintenanceRecord {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  technician: string;
  type: "Routine Inspection" | "Sensor Calibration" | "Seal & Hatch Service" | "Emergency Venting" | "Structural Repair";
  notes: string;
  status: "Completed" | "Pending" | "Scheduled";
}

/** Record peak gas measurement. */
export interface PeakGasRecord {
  gas: "h2s" | "co" | "ch4";
  maxValue: number;
  unit: string;
  recordedAt: string; // ISO date/time
  incidentId?: string;
}

/** Manhole structural / asset specifications */
export interface ManholeSpecs {
  depthMeters: number;
  diameterCm: number;
  installedYear: number;
  coverType: string;
  drainageNetwork: string;
  zone: string;
}

/**
 * Full telemetry and lifecycle record for one manhole
 */
export interface ManholeRecord {
  manhole_id: string;
  /** Location label, e.g. "Sector 4 — Main Road Junction". */
  location: string;
  /** Geographic coordinates for city map */
  coordinates: {
    lat: number;
    lng: number;
  };
  /** Structural specifications */
  specs: ManholeSpecs;
  /** Historical peak gas records */
  peak_gas_records: PeakGasRecord[];
  /** Past and scheduled maintenance records */
  maintenance_history: MaintenanceRecord[];
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
