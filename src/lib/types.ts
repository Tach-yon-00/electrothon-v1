// ============================================================================
// VENUS — Extended Types
// Includes GPS coordinates, structural specs, maintenance history, record peak gas levels,
// IoT connectivity metadata, worker badge/PTW identification, maintenance work orders,
// sewer pipe topology, and mandatory O₂ atmospheric monitoring.
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

/**
 * Maintenance lifecycle state machine.
 * Tracks the real sequence a confined-space work permit goes through.
 */
export type MaintenanceState =
  | "IDLE"
  | "PERMIT_REQUESTED"
  | "ATMOSPHERE_PRE_CHECK"
  | "VENTILATION_ACTIVE"
  | "WORK_IN_PROGRESS";

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
  | "maintenance_completed"
  | "work_order_opened"
  | "ventilation_started"
  | "permit_cleared"
  | "badge_entry";

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
  o2: number;
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
  gas: "h2s" | "co" | "ch4" | "o2";
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
 * IoT radio connectivity metadata.
 * Underground nodes use LoRaWAN (868 MHz) or NB-IoT (Band 8) with
 * slot-antennas in composite lids or curb-mounted repeaters.
 */
export interface ConnectivityInfo {
  /** Radio access technology. */
  protocol: "LoRaWAN" | "NB-IoT";
  /** Nearest gateway / base station ID. */
  gatewayId: string;
  /** Received signal strength indicator (dBm). More negative = weaker. */
  rssi: number;
  /** Signal-to-noise ratio (dB). */
  snr: number;
  /** LoRa spreading factor + bandwidth, e.g. "SF7BW125". Empty for NB-IoT. */
  spreadingFactor: string;
  /** Lithium thionyl chloride cell voltage. */
  batteryVolts: number;
  /** Battery state of charge, 0–100. */
  batteryPct: number;
}

/**
 * Identified worker record — populated on NFC badge tap at hatch collar.
 * Absent when no one is inside.
 */
export interface WorkerIdentity {
  /** Employee badge ID. */
  badgeId: string;
  /** Worker name. */
  name: string;
  /** Active Permit-to-Work number for this entry. */
  permitId: string;
  /** Method used to authenticate entry. */
  entryMethod: "NFC Badge" | "RFID" | "Manual Override";
}

/**
 * Active work order — created in the CMMS when maintenance is scheduled.
 * Only present when maintenance_state !== "IDLE".
 */
export interface ActiveWorkOrder {
  /** Work order number from CMMS. */
  id: string;
  /** Procedure type. */
  type: string;
  /** Assigned technician / crew. */
  crew: string;
  /** Ventilation blower state. */
  blowerStatus: "OFF" | "ACTIVE";
  /** Blower flow rate in CFM (present when blowerStatus === "ACTIVE"). */
  blowerCFM?: number;
  /** Lock-Out Tag-Out status. */
  lotoStatus: "CLEARED" | "TAGGED_OUT";
  /** Scheduled service date. */
  scheduledDate: string;
}

/**
 * Sewer pipe topology — maps each node's position in the drainage network.
 * Enables drawing pipe connections between manholes on the city map.
 */
export interface TopologyInfo {
  /** manhole_id of the upstream node, or null if this is a headworks inlet. */
  upstreamId: string | null;
  /** manhole_id of the downstream node, or null if this flows to outfall. */
  downstreamId: string | null;
  /** Human-readable drainage network name. */
  pipeNetwork: string;
  /** Hydraulic gradient of the connecting pipe, e.g. "1:200". */
  pipeGradient: string;
  /** Nominal pipe internal diameter in millimetres. */
  pipeDiameterMm: number;
}

/**
 * Full telemetry and lifecycle record for one manhole node.
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

  /** Current gas readings with computed statuses. O₂ mandatory per OSHA 1910.146. */
  gas: {
    h2s: GasReading;
    co: GasReading;
    ch4: GasReading;
    /** Oxygen — normal atmosphere 20.9 %vol. Low O₂ is primary confined-space killer. */
    o2: GasReading;
  };
  /** Derived from the worst of all four gas statuses. */
  overall_status: SafetyStatus;

  worker_status: WorkerStatus;
  /** Worker identity record — populated when worker_status === "INSIDE". */
  worker?: WorkerIdentity;

  /** Running timer while a worker is INSIDE (seconds). */
  elapsed_time_seconds: number;
  interlock_status: InterlockStatus;
  /** Live countdown while interlock is VERIFYING (seconds). */
  countdown_seconds: number | null;
  /** Dead-man's switch: seconds since the last worker check-in. */
  last_checkin_seconds_ago: number;
  sensor_fault: boolean;
  /** Milliseconds since epoch — used to derive connected vs "last seen". */
  last_seen: number;

  /** IoT radio link metadata. */
  connectivity: ConnectivityInfo;
  /** Maintenance work-order state machine. */
  maintenance_state: MaintenanceState;
  /** Active work order — present when maintenance_state !== "IDLE". */
  active_work_order?: ActiveWorkOrder;
  /** Sewer pipe topology position. */
  topology: TopologyInfo;

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

/** Thresholds per gas. O₂ uses inverted logic (low is dangerous). */
export interface GasThresholds {
  /** Display unit, e.g. "ppm" or "%vol". */
  unit: string;
  /** Reading >= safeMax means WARNING or worse (H₂S, CO, CH₄). */
  safeMax: number;
  /** Reading >= warningMax means DANGER (H₂S, CO, CH₄). */
  warningMax: number;
  /**
   * For O₂ only: reading <= safeMin triggers WARNING.
   * Not used for other gases (undefined).
   */
  safeMin?: number;
  /** For O₂ only: reading <= warningMin triggers DANGER. */
  warningMin?: number;
  /** Normal atmospheric baseline for display (O₂ = 20.9). */
  normalBaseline?: number;
}
