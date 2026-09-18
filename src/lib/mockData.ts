// ============================================================================
// Manhole Guardian — Mock Data Source
// ----------------------------------------------------------------------------
// This module is THE ONLY place that fabricates telemetry. UI components never
// touch raw mock logic — they consume ManholeRecord objects through the same
// accessor functions (getInitialManholes, stepSimulation) that a real backend
// (Firebase listeners / REST polling / WebSocket) would later implement.
// Swap strategy: keep the function signatures, replace the bodies.
// ============================================================================

import {
  CHECKIN_INTERVAL_SECONDS,
  GAS_THRESHOLDS,
  HEARTBEAT_MS,
  HISTORY_SAMPLE_MS,
  HISTORY_WINDOW_MS,
} from "./config";
import type {
  AlertEvent,
  AlertEventType,
  GasReading,
  GasStatus,
  ManholeRecord,
  SafetyStatus,
} from "./types";

/** Compute per-gas status from thresholds. */
export function computeGasStatus(
  gas: "h2s" | "co" | "ch4",
  value: number
): GasStatus {
  const t = GAS_THRESHOLDS[gas];
  if (value >= t.warningMax) return "DANGER";
  if (value >= t.safeMax) return "WARNING";
  return "SAFE";
}

export function makeReading(
  gas: "h2s" | "co" | "ch4",
  value: number
): GasReading {
  return { value, status: computeGasStatus(gas, value) };
}

/** Overall status = worst of the three gases. */
export function computeOverallStatus(
  h2s: GasStatus,
  co: GasStatus,
  ch4: GasStatus
): SafetyStatus {
  if (h2s === "DANGER" || co === "DANGER" || ch4 === "DANGER") return "DANGER";
  if (h2s === "WARNING" || co === "WARNING" || ch4 === "WARNING")
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

// ---------------------------------------------------------------------------
// Random walk helpers
// ---------------------------------------------------------------------------

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/**
 * Drift each gas toward its "target" band with some noise.
 * Positive bias => rising trend (used for the WARNING manhole's H2S).
 */
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
// Seed scenarios — 3 manholes with distinct demo states
// ---------------------------------------------------------------------------

interface SeedSpec {
  id: string;
  location: string;
  base: { h2s: number; co: number; ch4: number };
  /** Per-gas drift bias per sample (positive = rising trend on the chart). */
  bias: { h2s: number; co: number; ch4: number };
  sensorFault: boolean;
}

const SEEDS: SeedSpec[] = [
  {
    id: "MH-01",
    location: "Sector 4 · Main Road Junction",
    base: { h2s: 4, co: 18, ch4: 1.8 },
    bias: { h2s: 0.02, co: 0.05, ch4: 0.005 },
    sensorFault: false,
  },
  {
    id: "MH-02",
    location: "Sector 7 · Market Street",
    // H2S equilibrium sits at base + bias/0.1 ≈ 12 ppm → solid WARNING,
    // with the history chart visibly crossing the 10 ppm line midway.
    base: { h2s: 9, co: 30, ch4: 3.2 },
    bias: { h2s: 0.3, co: 0.02, ch4: 0.01 },
    sensorFault: false,
  },
  {
    id: "MH-03",
    location: "Sector 2 · Industrial Estate",
    base: { h2s: 22, co: 85, ch4: 12 },
    bias: { h2s: 0, co: 0, ch4: 0 },
    sensorFault: false,
  },
];

/**
 * Deterministic-ish history generator for the last 2 hours (~1 sample/min).
 * Uses a per-manhole phase so the three charts don't look identical.
 */
function generateHistory(spec: SeedSpec, now: number) {
  const samples = 120; // 2h @ 1/min
  const intervalMs = HISTORY_WINDOW_MS / samples;
  const phase = spec.id.charCodeAt(3) * 1.7; // stable per manhole

  const history = [];
  for (let i = samples - 1; i >= 0; i--) {
    const t = now - i * intervalMs;
    const x = (t - now) / HISTORY_WINDOW_MS; // -1..0 across the window

    // H2S: slow sine + rising ramp for MH-02 (the WARNING demo scenario).
    const ramp = spec.bias.h2s > 0.05 ? (x + 1) * 5 : 0; // 0→5 ppm rise
    const h2s = clamp(
      spec.base.h2s + ramp + Math.sin(x * 6 + phase) * 1.5 + rand(-0.4, 0.4),
      0.5,
      60
    );

    const co = clamp(
      spec.base.co + Math.sin(x * 4 + phase * 2) * 6 + rand(-2, 2),
      1,
      200
    );

    const ch4 = clamp(
      spec.base.ch4 + Math.cos(x * 5 + phase) * 1 + rand(-0.3, 0.3),
      0.1,
      40
    );

    history.push({ timestamp: t, h2s, co, ch4 });
  }
  return history;
}

/** Pre-seeded alert log for each scenario. */
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
      makeAlertEvent(
        "gas_warning",
        "H2S trending upward (11.8 ppm)",
        m(26)
      ),
      makeAlertEvent("entry", "Worker entered manhole", m(41)),
      makeAlertEvent("interlock_unlocked", "Interlock unlocked (15s verify)", m(42)),
      makeAlertEvent(
        "checkin_reset",
        "Worker check-in confirmed",
        m(55)
      ),
    ];
  }
  if (spec.id === "MH-02") {
    return [
      makeAlertEvent("gas_warning", "H2S at 12.8 ppm — WARNING level", m(2)),
      makeAlertEvent("entry", "Worker entered manhole", m(34)),
      makeAlertEvent(
        "interlock_unlocked",
        "Interlock unlocked (15s verify)",
        m(35)
      ),
      makeAlertEvent("checkin_reset", "Worker check-in confirmed", m(70)),
      makeAlertEvent("gas_warning", "H2S trending upward (9.6 ppm)", m(96)),
      makeAlertEvent("sensor_fault", "CH4 sensor returned anomalous reading", m(110)),
    ];
  }
  return [
    makeAlertEvent("entry", "Worker entered manhole", m(18)),
    makeAlertEvent("interlock_unlocked", "Interlock unlocked (15s verify)", m(19)),
    makeAlertEvent("checkin_reset", "Worker check-in confirmed", m(40)),
    makeAlertEvent("exit", "Worker exited manhole", m(64)),
    makeAlertEvent("interlock_locked", "Entry interlock re-locked", m(64)),
    makeAlertEvent("checkin_reset", "Worker check-in confirmed", m(90)),
  ];
}

// ---------------------------------------------------------------------------
// Public API — these are the functions the UI consumes (swap-friendly)
// ---------------------------------------------------------------------------

/**
 * Build the initial 3 mock manholes.
 * In production this becomes a one-time fetch (or a Firebase `get()`).
 */
export function getInitialManholes(): ManholeRecord[] {
  const now = Date.now();
  return SEEDS.map((spec) => {
    const history = generateHistory(spec, now);
    const last = history[history.length - 1];

    const h2s = makeReading("h2s", last.h2s);
    const co = makeReading("co", last.co);
    const ch4 = makeReading("ch4", last.ch4);

    // MH-02 has a worker INSIDE running a timer; MH-01 empty, MH-03 evacuated.
    const workerInside = spec.id === "MH-02";
    const interlock: ManholeRecord["interlock_status"] = workerInside
      ? "UNLOCKED"
      : "LOCKED";

    return {
      manhole_id: spec.id,
      location: spec.location,
      gas: { h2s, co, ch4 },
      overall_status: computeOverallStatus(h2s.status, co.status, ch4.status),
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

/**
 * Advance ONE second of simulation for a manhole.
 * In production this becomes a real-time listener update instead.
 */
export function stepSimulation(m: ManholeRecord): ManholeRecord {
  const history = [...m.history];

  // ~every 60s, append a new history point from the current live reading.
  const lastPoint = history[history.length - 1];
  const shouldSample = Date.now() - lastPoint.timestamp >= HISTORY_SAMPLE_MS;
  if (shouldSample) {
    history.push({
      timestamp: Date.now(),
      h2s: m.gas.h2s.value,
      co: m.gas.co.value,
      ch4: m.gas.ch4.value,
    });
    while (history.length > 120) history.shift();
  }

  const drift = (gas: "h2s" | "co" | "ch4"): GasReading => {
    const t = GAS_THRESHOLDS[gas];
    const current = m.gas[gas].value;
    const spec = SEEDS.find((s) => s.id === m.manhole_id);
    const bias = spec ? spec.bias[gas] : 0;
    const target = spec ? spec.base[gas] : current;
    const next =
      m.overall_status === "DANGER" && current >= t.warningMax
        // Stay pinned in DANGER until a demo reset (keeps the story stable).
        ? current + rand(-0.3, 0.5)
        : driftValue(current, target, bias, gas === "ch4" ? 0.25 : 1.2, 0.5, 200);
    return makeReading(gas, next);
  };

  const h2s = drift("h2s");
  const co = drift("co");
  const ch4 = drift("ch4");

  // Interlock VERIFYING countdown.
  let interlock = m.interlock_status;
  let countdown = m.countdown_seconds;
  if (interlock === "VERIFYING") {
    countdown = (countdown ?? 0) - 1;
    if (countdown <= 0) {
      interlock = "UNLOCKED";
      countdown = null;
    }
  }

  // Worker elapsed timer.
  const elapsed =
    m.worker_status === "INSIDE" ? m.elapsed_time_seconds + 1 : 0;

  // Dead-man's switch: count up while INSIDE; fire MAN DOWN after 2 misses.
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

  // Connection heartbeat.
  const lastSeen = Date.now();

  return {
    ...m,
    gas: { h2s, co, ch4 },
    overall_status: computeOverallStatus(h2s.status, co.status, ch4.status),
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
