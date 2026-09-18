// ============================================================================
// VENUS — City-Scale Mock Data Source
// ----------------------------------------------------------------------------
// Supplies city-wide manhole locations with coordinates, detailed specs,
// historical maintenance logs, record high gas peaks, live simulation,
// IoT connectivity metadata, worker badge/PTW records, maintenance work orders,
// and sewer pipe topology for the city map.
// ============================================================================

import {
  CHECKIN_INTERVAL_SECONDS,
  GAS_THRESHOLDS,
  HEARTBEAT_MS,
  HISTORY_SAMPLE_MS,
  HISTORY_WINDOW_MS,
} from "./config";
import type {
  ActiveWorkOrder,
  AlertEvent,
  AlertEventType,
  ConnectivityInfo,
  GasReading,
  GasStatus,
  MaintenanceRecord,
  MaintenanceState,
  ManholeRecord,
  ManholeSpecs,
  PeakGasRecord,
  SafetyStatus,
  TopologyInfo,
  WorkerIdentity,
} from "./types";

/** Compute per-gas status from thresholds. O₂ uses inverted logic (low = danger). */
export function computeGasStatus(
  gas: "h2s" | "co" | "ch4" | "o2",
  value: number
): GasStatus {
  if (gas === "o2") {
    const t = GAS_THRESHOLDS.o2;
    if (value <= (t.warningMin ?? 18.0)) return "DANGER";
    if (value <= (t.safeMin ?? 19.5)) return "WARNING";
    return "SAFE";
  }
  const t = GAS_THRESHOLDS[gas];
  if (value >= t.warningMax) return "DANGER";
  if (value >= t.safeMax) return "WARNING";
  return "SAFE";
}

export function makeReading(
  gas: "h2s" | "co" | "ch4" | "o2",
  value: number
): GasReading {
  return { value, status: computeGasStatus(gas, value) };
}

/** Overall status = worst of all four gases. */
export function computeOverallStatus(
  h2s: GasStatus,
  co: GasStatus,
  ch4: GasStatus,
  o2: GasStatus = "SAFE"
): SafetyStatus {
  if (h2s === "DANGER" || co === "DANGER" || ch4 === "DANGER" || o2 === "DANGER") return "DANGER";
  if (h2s === "WARNING" || co === "WARNING" || ch4 === "WARNING" || o2 === "WARNING")
    return "WARNING";
  return "SAFE";
}

let eventSeq = 0;
export function makeAlertEvent(
  type: AlertEventType,
  message: string,
  timestamp: number = Date.now()
): AlertEvent {
  eventSeq += 1;
  return { id: `evt-${eventSeq}`, type, timestamp, message };
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function driftValue(
  current: number,
  target: number,
  bias: number,
  noise: number,
  min: number,
  max: number
): number {
  const pull = (target - current) * 0.1;
  return clamp(current + pull + bias + rand(-noise, noise), min, max);
}

// ---------------------------------------------------------------------------
// Seed Specs for City-Wide Manholes (Grid across municipal sectors)
// ---------------------------------------------------------------------------

interface SeedSpec {
  id: string;
  location: string;
  lat: number;
  lng: number;
  base: { h2s: number; co: number; ch4: number; o2: number };
  bias: { h2s: number; co: number; ch4: number; o2: number };
  sensorFault: boolean;
  specs: ManholeSpecs;
  peakGasRecords: PeakGasRecord[];
  maintenanceHistory: MaintenanceRecord[];
  connectivity: ConnectivityInfo;
  topology: TopologyInfo;
  maintenanceState: MaintenanceState;
  activeWorkOrder?: ActiveWorkOrder;
  worker?: WorkerIdentity;
}

const SEEDS: SeedSpec[] = [
  {
    id: "MH-01",
    location: "Sector 4 · Main Road Junction & Central Avenue",
    lat: 12.9716,
    lng: 77.5946,
    base: { h2s: 4.2, co: 18, ch4: 1.8, o2: 20.7 },
    bias: { h2s: 0.02, co: 0.05, ch4: 0.005, o2: -0.001 },
    sensorFault: false,
    connectivity: {
      protocol: "LoRaWAN",
      gatewayId: "GW-BLR-CENTRAL-02",
      rssi: -82,
      snr: 9.1,
      spreadingFactor: "SF7BW125",
      batteryVolts: 3.58,
      batteryPct: 82,
    },
    topology: {
      upstreamId: "MH-04",
      downstreamId: "MH-05",
      pipeNetwork: "Central Trunk Line B",
      pipeGradient: "1:180",
      pipeDiameterMm: 450,
    },
    maintenanceState: "IDLE",
    specs: {
      depthMeters: 3.5,
      diameterCm: 60,
      installedYear: 2021,
      coverType: "Ductile Iron Class D400 (Heavy Traffic)",
      drainageNetwork: "Central Trunk Line B",
      zone: "Sector 4 - Downtown Civic District",
    },
    peakGasRecords: [
      { gas: "h2s", maxValue: 14.2, unit: "ppm", recordedAt: "2025-10-12T14:32:00Z", incidentId: "INC-8891" },
      { gas: "co", maxValue: 48.0, unit: "ppm", recordedAt: "2025-08-04T09:15:00Z" },
      { gas: "ch4", maxValue: 6.5, unit: "%LEL", recordedAt: "2025-11-20T18:45:00Z" },
    ],
    maintenanceHistory: [
      { id: "MNT-401", date: "2026-01-15", technician: "Marcus Vance", type: "Sensor Calibration", notes: "Electrochemical sensor calibrated with span gas standard.", status: "Completed" },
      { id: "MNT-320", date: "2025-11-02", technician: "Elena Rostova", type: "Routine Inspection", notes: "No structural degradation. Gasket seal lubricated.", status: "Completed" },
      { id: "MNT-288", date: "2025-07-19", technician: "Devon Reed", type: "Seal & Hatch Service", notes: "Electronic solenoid interlock serviced.", status: "Completed" },
    ],
  },
  {
    id: "MH-02",
    location: "Sector 7 · Market Street & Food Promenade",
    lat: 12.9785,
    lng: 77.6012,
    base: { h2s: 9.8, co: 32, ch4: 3.4, o2: 19.4 },
    bias: { h2s: 0.25, co: 0.02, ch4: 0.01, o2: -0.005 },
    sensorFault: false,
    connectivity: {
      protocol: "LoRaWAN",
      gatewayId: "GW-BLR-NORTH-04",
      rssi: -88,
      snr: 6.4,
      spreadingFactor: "SF9BW125",
      batteryVolts: 3.41,
      batteryPct: 61,
    },
    topology: {
      upstreamId: "MH-01",
      downstreamId: "MH-03",
      pipeNetwork: "Commercial Wastewater Line 7A",
      pipeGradient: "1:220",
      pipeDiameterMm: 525,
    },
    maintenanceState: "WORK_IN_PROGRESS",
    activeWorkOrder: {
      id: "WO-2026-0419",
      type: "Emergency Venting & Sludge Clearance",
      crew: "Devon Reed",
      blowerStatus: "ACTIVE",
      blowerCFM: 450,
      lotoStatus: "CLEARED",
      scheduledDate: "2026-09-18",
    },
    worker: {
      badgeId: "EMP-8812",
      name: "Devon Reed",
      permitId: "PTW-2026-0941",
      entryMethod: "NFC Badge",
    },
    specs: {
      depthMeters: 4.2,
      diameterCm: 75,
      installedYear: 2019,
      coverType: "Composite Reinforced Locking Cover",
      drainageNetwork: "Commercial Wastewater Line 7A",
      zone: "Sector 7 - Commercial & Dining Core",
    },
    peakGasRecords: [
      { gas: "h2s", maxValue: 26.4, unit: "ppm", recordedAt: "2026-02-14T11:20:00Z", incidentId: "INC-9402" },
      { gas: "co", maxValue: 65.0, unit: "ppm", recordedAt: "2025-12-01T20:10:00Z" },
      { gas: "ch4", maxValue: 9.8, unit: "%LEL", recordedAt: "2026-01-29T16:05:00Z" },
    ],
    maintenanceHistory: [
      { id: "MNT-412", date: "2026-02-28", technician: "Devon Reed", type: "Emergency Venting", notes: "High organic decomposition buildup cleared via forced blower.", status: "Completed" },
      { id: "MNT-390", date: "2025-12-10", technician: "Marcus Vance", type: "Routine Inspection", notes: "Sludge buildup detected at base inlet. Scheduled cleanout.", status: "Completed" },
    ],
  },
  {
    id: "MH-03",
    location: "Sector 2 · Industrial Estate & Chemical Corridor",
    lat: 12.9642,
    lng: 77.5835,
    base: { h2s: 23.5, co: 88, ch4: 12.5, o2: 19.1 },
    bias: { h2s: 0, co: 0, ch4: 0, o2: 0 },
    sensorFault: false,
    connectivity: {
      protocol: "NB-IoT",
      gatewayId: "BS-BLR-SOUTH-07",
      rssi: -103,
      snr: 2.1,
      spreadingFactor: "",
      batteryVolts: 3.29,
      batteryPct: 44,
    },
    topology: {
      upstreamId: "MH-02",
      downstreamId: null,
      pipeNetwork: "Industrial Effluent Channel 2-South",
      pipeGradient: "1:120",
      pipeDiameterMm: 675,
    },
    maintenanceState: "VENTILATION_ACTIVE",
    activeWorkOrder: {
      id: "WO-2026-0388",
      type: "Emergency Hazmat Venting & Scrubbing",
      crew: "Specialist Hazmat Unit",
      blowerStatus: "ACTIVE",
      blowerCFM: 850,
      lotoStatus: "TAGGED_OUT",
      scheduledDate: "2026-09-18",
    },
    specs: {
      depthMeters: 5.0,
      diameterCm: 90,
      installedYear: 2017,
      coverType: "Heavy Gas-Tight Bolted Cover",
      drainageNetwork: "Industrial Effluent Channel 2-South",
      zone: "Sector 2 - Heavy Chemical & Fabrication Zone",
    },
    peakGasRecords: [
      { gas: "h2s", maxValue: 44.8, unit: "ppm", recordedAt: "2026-03-01T04:12:00Z", incidentId: "INC-9910" },
      { gas: "co", maxValue: 145.0, unit: "ppm", recordedAt: "2025-09-18T13:40:00Z", incidentId: "INC-8201" },
      { gas: "ch4", maxValue: 22.0, unit: "%LEL", recordedAt: "2026-02-20T22:30:00Z", incidentId: "INC-9550" },
    ],
    maintenanceHistory: [
      { id: "MNT-425", date: "2026-03-05", technician: "Specialist Hazmat Unit", type: "Emergency Venting", notes: "Automated lockout engaged after sensor alarm. Scrubbing unit deployed.", status: "Completed" },
      { id: "MNT-380", date: "2025-11-28", technician: "Elena Rostova", type: "Structural Repair", notes: "Masonry chamber lined with acid-resistant polymer coating.", status: "Completed" },
    ],
  },
  {
    id: "MH-04",
    location: "Sector 9 · Technology Park & Metro Link",
    lat: 12.9830,
    lng: 77.5910,
    base: { h2s: 2.1, co: 12, ch4: 0.9, o2: 20.8 },
    bias: { h2s: 0.01, co: 0.01, ch4: 0.002, o2: 0 },
    sensorFault: false,
    connectivity: {
      protocol: "LoRaWAN",
      gatewayId: "GW-BLR-TECH-01",
      rssi: -74,
      snr: 11.3,
      spreadingFactor: "SF7BW125",
      batteryVolts: 3.71,
      batteryPct: 94,
    },
    topology: {
      upstreamId: "MH-06",
      downstreamId: "MH-01",
      pipeNetwork: "Stormwater Bypass Line 9",
      pipeGradient: "1:250",
      pipeDiameterMm: 375,
    },
    maintenanceState: "IDLE",
    specs: {
      depthMeters: 2.8,
      diameterCm: 60,
      installedYear: 2023,
      coverType: "Smart IoT Telemetry Instrumented Cover",
      drainageNetwork: "Stormwater Bypass Line 9",
      zone: "Sector 9 - Tech Park North",
    },
    peakGasRecords: [
      { gas: "h2s", maxValue: 7.1, unit: "ppm", recordedAt: "2025-06-11T09:00:00Z" },
      { gas: "co", maxValue: 24.0, unit: "ppm", recordedAt: "2025-05-18T14:22:00Z" },
      { gas: "ch4", maxValue: 3.2, unit: "%LEL", recordedAt: "2025-07-01T11:15:00Z" },
    ],
    maintenanceHistory: [
      { id: "MNT-430", date: "2026-01-20", technician: "Elena Rostova", type: "Sensor Calibration", notes: "Annual baseline calibration and solar harvester check.", status: "Completed" },
    ],
  },
  {
    id: "MH-05",
    location: "Sector 1 · Old City Quarters & Heritage Gate",
    lat: 12.9680,
    lng: 77.6080,
    base: { h2s: 6.5, co: 25, ch4: 2.1, o2: 20.2 },
    bias: { h2s: 0.04, co: 0.03, ch4: 0.01, o2: -0.002 },
    sensorFault: false,
    connectivity: {
      protocol: "NB-IoT",
      gatewayId: "BS-BLR-EAST-03",
      rssi: -96,
      snr: 4.8,
      spreadingFactor: "",
      batteryVolts: 3.48,
      batteryPct: 71,
    },
    topology: {
      upstreamId: "MH-01",
      downstreamId: "MH-02",
      pipeNetwork: "Heritage Gravity Trunk North",
      pipeGradient: "1:160",
      pipeDiameterMm: 450,
    },
    maintenanceState: "IDLE",
    specs: {
      depthMeters: 4.8,
      diameterCm: 70,
      installedYear: 2015,
      coverType: "Cast Iron Standard Ribbed",
      drainageNetwork: "Heritage Gravity Trunk North",
      zone: "Sector 1 - Historic Quarter",
    },
    peakGasRecords: [
      { gas: "h2s", maxValue: 19.5, unit: "ppm", recordedAt: "2025-10-30T17:10:00Z" },
      { gas: "co", maxValue: 52.0, unit: "ppm", recordedAt: "2025-09-12T08:45:00Z" },
      { gas: "ch4", maxValue: 7.9, unit: "%LEL", recordedAt: "2025-12-18T19:00:00Z" },
    ],
    maintenanceHistory: [
      { id: "MNT-405", date: "2026-02-01", technician: "Marcus Vance", type: "Routine Inspection", notes: "Silt clearance conducted; depth sounding verified at 4.8m.", status: "Completed" },
    ],
  },
  {
    id: "MH-06",
    location: "Sector 11 · University Campus & Botanical Ring",
    lat: 12.9610,
    lng: 77.5990,
    base: { h2s: 1.8, co: 9, ch4: 0.6, o2: 20.9 },
    bias: { h2s: 0.01, co: 0.01, ch4: 0.001, o2: 0 },
    sensorFault: false,
    connectivity: {
      protocol: "LoRaWAN",
      gatewayId: "GW-BLR-CAMPUS-05",
      rssi: -71,
      snr: 12.6,
      spreadingFactor: "SF7BW125",
      batteryVolts: 3.74,
      batteryPct: 97,
    },
    topology: {
      upstreamId: null,
      downstreamId: "MH-04",
      pipeNetwork: "Campus Stormwater Sub-basin",
      pipeGradient: "1:300",
      pipeDiameterMm: 300,
    },
    maintenanceState: "IDLE",
    specs: {
      depthMeters: 3.1,
      diameterCm: 60,
      installedYear: 2022,
      coverType: "Ductile Iron Class C250 (Pedestrian Area)",
      drainageNetwork: "Campus Stormwater Sub-basin",
      zone: "Sector 11 - Education District",
    },
    peakGasRecords: [
      { gas: "h2s", maxValue: 5.4, unit: "ppm", recordedAt: "2025-04-19T10:30:00Z" },
      { gas: "co", maxValue: 18.0, unit: "ppm", recordedAt: "2025-06-25T15:10:00Z" },
      { gas: "ch4", maxValue: 2.1, unit: "%LEL", recordedAt: "2025-08-14T12:00:00Z" },
    ],
    maintenanceHistory: [
      { id: "MNT-399", date: "2025-12-22", technician: "Devon Reed", type: "Routine Inspection", notes: "Clean flow, no residue observed.", status: "Completed" },
    ],
  },
];

// Deterministic initial history (Zero random math during SSR / initial hydration)
function generateDeterministicInitialHistory(spec: SeedSpec, now: number) {
  const samples = 120;
  const intervalMs = HISTORY_WINDOW_MS / samples;
  const phase = spec.id.charCodeAt(3) * 1.7;

  const history = [];
  for (let i = samples - 1; i >= 0; i--) {
    const t = now - i * intervalMs;
    const x = (t - now) / HISTORY_WINDOW_MS;

    const ramp = spec.bias.h2s > 0.05 ? (x + 1) * 5 : 0;
    const h2s = clamp(
      spec.base.h2s + ramp + Math.sin(x * 6 + phase) * 1.5,
      0.5,
      60
    );

    const co = clamp(
      spec.base.co + Math.sin(x * 4 + phase * 2) * 6,
      1,
      200
    );

    const ch4 = clamp(
      spec.base.ch4 + Math.cos(x * 5 + phase) * 1,
      0.1,
      40
    );

    // O₂ drifts slightly inverse to CH₄ (displacement effect)
    const o2 = clamp(
      spec.base.o2 - Math.cos(x * 5 + phase) * 0.3,
      16.0,
      21.0
    );

    history.push({ timestamp: t, h2s, co, ch4, o2 });
  }
  return history;
}

function seedAlerts(spec: SeedSpec, now: number): AlertEvent[] {
  const m = (minsAgo: number) => now - minsAgo * 60_000;
  if (spec.id === "MH-03") {
    return [
      makeAlertEvent(
        "gas_danger",
        "H2S spiked to 24.6 ppm — DANGER threshold breached",
        m(3)
      ),
      makeAlertEvent(
        "gas_danger",
        "CO reached 91 ppm — DANGER threshold breached",
        m(4)
      ),
      makeAlertEvent("interlock_locked", "Entry interlock auto-locked", m(4)),
      makeAlertEvent(
        "gas_warning",
        "CH4 at 10.2 %LEL — WARNING threshold breached",
        m(11)
      ),
      makeAlertEvent("exit", "Worker exited manhole", m(14)),
    ];
  }
  if (spec.id === "MH-02") {
    return [
      makeAlertEvent("gas_warning", "H2S at 12.8 ppm — WARNING level", m(2)),
      makeAlertEvent("entry", "Worker entered manhole", m(34)),
      makeAlertEvent("interlock_unlocked", "Interlock unlocked (15s verify)", m(35)),
      makeAlertEvent("checkin_reset", "Worker check-in confirmed", m(70)),
      makeAlertEvent("gas_warning", "H2S trending upward (9.6 ppm)", m(96)),
    ];
  }
  return [
    makeAlertEvent("entry", "Worker entered manhole", m(18)),
    makeAlertEvent("interlock_unlocked", "Interlock unlocked (15s verify)", m(19)),
    makeAlertEvent("checkin_reset", "Worker check-in confirmed", m(40)),
    makeAlertEvent("exit", "Worker exited manhole", m(64)),
    makeAlertEvent("interlock_locked", "Entry interlock re-locked", m(64)),
  ];
}

// 1700000000000 is a fixed reference timestamp for initial hydration consistency
const FIXED_INITIAL_EPOCH = 1700000000000;

export function getInitialManholes(): ManholeRecord[] {
  const now = FIXED_INITIAL_EPOCH;
  return SEEDS.map((spec) => {
    const history = generateDeterministicInitialHistory(spec, now);

    // Initial gas readings match exact deterministic seed baseline (no Math.random())
    const h2s = makeReading("h2s", spec.base.h2s);
    const co = makeReading("co", spec.base.co);
    const ch4 = makeReading("ch4", spec.base.ch4);
    const o2 = makeReading("o2", spec.base.o2);

    const workerInside = spec.id === "MH-02";
    const interlock: ManholeRecord["interlock_status"] = workerInside
      ? "UNLOCKED"
      : "LOCKED";

    return {
      manhole_id: spec.id,
      location: spec.location,
      coordinates: { lat: spec.lat, lng: spec.lng },
      specs: spec.specs,
      peak_gas_records: spec.peakGasRecords,
      maintenance_history: spec.maintenanceHistory,
      connectivity: spec.connectivity,
      topology: spec.topology,
      maintenance_state: spec.maintenanceState,
      active_work_order: spec.activeWorkOrder,
      worker: spec.worker,
      gas: { h2s, co, ch4, o2 },
      overall_status: computeOverallStatus(h2s.status, co.status, ch4.status, o2.status),
      worker_status: workerInside ? "INSIDE" : "OUTSIDE",
      elapsed_time_seconds: workerInside ? 34 * 60 + 12 : 0,
      interlock_status: interlock,
      countdown_seconds: null,
      last_checkin_seconds_ago: workerInside ? 45 : 0,
      sensor_fault: spec.sensorFault,
      last_seen: now - HEARTBEAT_MS / 2,
      history,
      alerts: seedAlerts(spec, now),
      _consecutive_missed_checkins: 0,
    } satisfies ManholeRecord;
  });
}

export function stepSimulation(m: ManholeRecord): ManholeRecord {
  const history = [...m.history];

  const lastPoint = history[history.length - 1];
  const shouldSample = Date.now() - (lastPoint?.timestamp ?? 0) >= HISTORY_SAMPLE_MS;
  if (shouldSample) {
    history.push({
      timestamp: Date.now(),
      h2s: m.gas.h2s.value,
      co: m.gas.co.value,
      ch4: m.gas.ch4.value,
      o2: m.gas.o2.value,
    });
    while (history.length > 120) history.shift();
  }

  const spec = SEEDS.find((s) => s.id === m.manhole_id);
  const isVentilating = m.maintenance_state === "VENTILATION_ACTIVE";

  const drift = (gas: "h2s" | "co" | "ch4"): GasReading => {
    const t = GAS_THRESHOLDS[gas];
    const current = m.gas[gas].value;
    const bias = spec ? spec.bias[gas] : 0;
    const target = spec ? spec.base[gas] : current;

    // Ventilation accelerates drift toward safe baseline
    const pullFactor = isVentilating ? 0.3 : 0.1;
    const noiseFactor = gas === "ch4" ? 0.25 : 1.2;

    const pull = (target - current) * pullFactor;
    const next =
      m.overall_status === "DANGER" && current >= t.warningMax
        ? current + rand(-0.3, 0.5)
        : clamp(current + pull + bias + rand(-noiseFactor, noiseFactor), 0.5, 200);
    return makeReading(gas, next);
  };

  // O₂ drift — inverse correlation with CH₄ (displacement), ventilation restores it
  const driftO2 = (): GasReading => {
    const current = m.gas.o2.value;
    const target = spec ? spec.base.o2 : 20.9;
    const bias = spec ? spec.bias.o2 : 0;
    const ch4Delta = m.gas.ch4.value - (spec?.base.ch4 ?? 1);
    const displacement = -ch4Delta * 0.02; // high CH4 slightly lowers O₂

    const pullFactor = isVentilating ? 0.4 : 0.1;
    const pull = (target - current) * pullFactor;
    const next = clamp(current + pull + bias + displacement + rand(-0.05, 0.05), 16.0, 21.0);
    return makeReading("o2", next);
  };

  const h2s = drift("h2s");
  const co = drift("co");
  const ch4 = drift("ch4");
  const o2 = driftO2();

  // Drift connectivity metadata
  const connectivity = {
    ...m.connectivity,
    rssi: m.connectivity.rssi + rand(-2, 2), // jitter ±2 dBm
    batteryVolts: Math.max(2.8, m.connectivity.batteryVolts - 0.0001), // slow drain
    batteryPct: Math.max(0, Math.round(((m.connectivity.batteryVolts - 2.8) / (3.7 - 2.8)) * 100)),
  };

  let interlock = m.interlock_status;
  let countdown = m.countdown_seconds;
  if (interlock === "VERIFYING") {
    countdown = (countdown ?? 0) - 1;
    if (countdown <= 0) {
      interlock = "UNLOCKED";
      countdown = null;
    }
  }

  const elapsed =
    m.worker_status === "INSIDE" ? m.elapsed_time_seconds + 1 : 0;

  let checkin = m.last_checkin_seconds_ago;
  let missed = m._consecutive_missed_checkins ?? 0;
  let alerts = m.alerts;
  if (m.worker_status === "INSIDE") {
    checkin += 1;
    if (checkin >= CHECKIN_INTERVAL_SECONDS) {
      missed += 1;
      checkin = 0;
      if (missed >= 2) {
        alerts = [
          makeAlertEvent(
            "man_down",
            "MAN DOWN — no worker check-in for 2 consecutive intervals"
          ),
          ...alerts,
        ];
      } else {
        alerts = [
          makeAlertEvent(
            "gas_warning",
            "Check-in missed (1/2) — awaiting worker response"
          ),
          ...alerts,
        ];
      }
    }
  }

  const lastSeen = Date.now();

  return {
    ...m,
    gas: { h2s, co, ch4, o2 },
    overall_status: computeOverallStatus(h2s.status, co.status, ch4.status, o2.status),
    connectivity,
    elapsed_time_seconds: elapsed,
    interlock_status: interlock,
    countdown_seconds: countdown,
    last_checkin_seconds_ago: checkin,
    last_seen: lastSeen,
    history,
    alerts,
    _consecutive_missed_checkins: missed,
  };
}
