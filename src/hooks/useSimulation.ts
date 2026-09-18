"use client";

// ============================================================================
// VENUS — Simulation Hook
// ----------------------------------------------------------------------------
// Owns all live state for the dashboard: the array of ManholeRecords, a 1s
// simulation tick, and every demo action. Components stay dumb/presentational.
//
// Hybrid mode for MH-02:
//   - When ESP32 is transmitting (Supabase Realtime), CO/CH₄ come from hardware.
//   - When ESP32 is offline (> 30s stale), full mock simulation resumes.
//   - H₂S and O₂ are always mock-simulated (no sensors on ESP32).
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { GAS_THRESHOLDS } from "@/lib/config";
import {
  computeOverallStatus,
  getInitialManholes,
  makeAlertEvent,
  makeReading,
  stepSimulation,
} from "@/lib/mockData";
import { useESP32Stream } from "./useESP32Stream";
import type { AlertEvent, ManholeRecord } from "@/lib/types";

/** Manhole ID wired to the ESP32 hardware node */
const ESP32_NODE_ID = "MH-02";

/** Map raw ADC value (0-4095 ESP32 12-bit) to approximate ppm/% using calibration curve */
function rawToCO(raw: number): number {
  // MQ-7 linear approximation for demo: 0 raw = 0 ppm, 4095 raw ≈ 500 ppm
  return Math.round((raw / 4095) * 500 * 10) / 10;
}
function rawToCH4(raw: number): number {
  // MQ-4 to %LEL approximation: 0 raw = 0%, 4095 raw ≈ 25% LEL
  return Math.round((raw / 4095) * 25 * 10) / 10;
}

export function useSimulation() {
  const [manholes, setManholes] = useState<ManholeRecord[]>(() =>
    getInitialManholes()
  );
  const [selectedId, setSelectedId] = useState("MH-01");

  // --- ESP32 hardware stream for MH-02 ------------------------------------
  const { reading: esp32Reading, isLive: esp32Live } = useESP32Stream(ESP32_NODE_ID);

  // --- 1s simulation heartbeat --------------------------------------------
  useEffect(() => {
    const id = setInterval(() => {
      setManholes((prev) => prev.map(stepSimulation));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // --- Merge ESP32 data into MH-02 when live ------------------------------
  useEffect(() => {
    if (!esp32Live || !esp32Reading) return;

    setManholes((prev) =>
      prev.map((m) => {
        if (m.manhole_id !== ESP32_NODE_ID) return m;

        // Override CO and CH₄ with real hardware values
        const co  = makeReading("co",  rawToCO(esp32Reading.co_raw));
        const ch4 = makeReading("ch4", rawToCH4(esp32Reading.ch4_raw));
        // H₂S and O₂ continue from mock simulation
        const h2s = m.gas.h2s;
        const o2  = m.gas.o2;

        const overall = computeOverallStatus(h2s.status, co.status, ch4.status, o2.status);

        // Add alert if status changed due to hardware reading
        const alerts =
          overall !== m.overall_status
            ? [
                makeAlertEvent(
                  overall === "DANGER" ? "gas_danger" : overall === "WARNING" ? "gas_warning" : "checkin_reset",
                  `ESP32 hardware: CO ${co.value.toFixed(1)} ppm · CH₄ ${ch4.value.toFixed(1)} %LEL — ${overall}`
                ),
                ...m.alerts,
              ]
            : m.alerts;

        return {
          ...m,
          gas: { h2s, co, ch4, o2 },
          overall_status: overall,
          alerts,
          last_seen: new Date(esp32Reading.created_at).getTime(),
          // Show hardware source in connectivity metadata
          connectivity: {
            ...m.connectivity,
            gatewayId: "ESP32-DIRECT",
            protocol: "LoRaWAN" as const,
            rssi: -72, // direct WiFi is stronger than LoRa
          },
        };
      })
    );
  }, [esp32Reading, esp32Live]);

  const selected =
    manholes.find((m) => m.manhole_id === selectedId) ?? manholes[0];

  const patch = useCallback(
    (id: string, fn: (m: ManholeRecord) => ManholeRecord) => {
      setManholes((prev) => prev.map((m) => (m.manhole_id === id ? fn(m) : m)));
    },
    []
  );
  // Each mutates the selected manhole the way a real event stream would.

  const triggerGasWarning = useCallback(() => {
    patch(selectedId, (m) => {
      const gas = {
        h2s: makeReading("h2s", GAS_THRESHOLDS.h2s.safeMax + 3),
        co: m.gas.co,
        ch4: m.gas.ch4,
        o2: m.gas.o2,
      };
      return {
        ...m,
        gas,
        overall_status: computeOverallStatus(
          gas.h2s.status,
          gas.co.status,
          gas.ch4.status,
          gas.o2.status
        ),
        alerts: [
          makeAlertEvent(
            "gas_warning",
            `H2S at ${gas.h2s.value.toFixed(1)} ppm — WARNING threshold breached`
          ),
          ...m.alerts,
        ],
      };
    });
  }, [patch, selectedId]);

  const triggerGasDanger = useCallback(() => {
    patch(selectedId, (m) => {
      const gas = {
        h2s: makeReading("h2s", GAS_THRESHOLDS.h2s.warningMax + 8),
        co: makeReading("co", GAS_THRESHOLDS.co.warningMax + 15),
        ch4: makeReading("ch4", GAS_THRESHOLDS.ch4.warningMax + 2),
        o2: makeReading("o2", 17.8), // O₂ depleted in danger scenario
      };
      return {
        ...m,
        gas,
        overall_status: "DANGER" as const,
        alerts: [
          makeAlertEvent(
            "gas_danger",
            `H2S at ${gas.h2s.value.toFixed(1)} ppm — DANGER! Evacuate immediately`
          ),
          ...m.alerts,
        ],
      };
    });
  }, [patch, selectedId]);

  const resetToSafe = useCallback(() => {
    patch(selectedId, (m) => {
      const gas = {
        h2s: makeReading("h2s", 4.2),
        co: makeReading("co", 18),
        ch4: makeReading("ch4", 1.6),
        o2: makeReading("o2", 20.7),
      };
      return {
        ...m,
        gas,
        overall_status: "SAFE" as const,
        _consecutive_missed_checkins: 0,
        alerts: [
          makeAlertEvent("checkin_reset", "Air quality back to SAFE levels"),
          ...m.alerts,
        ],
      };
    });
  }, [patch, selectedId]);

  const simulateEntry = useCallback(() => {
    patch(selectedId, (m) => ({
      ...m,
      worker_status: "INSIDE" as const,
      elapsed_time_seconds: 0,
      last_checkin_seconds_ago: 0,
      _consecutive_missed_checkins: 0,
      interlock_status: "UNLOCKED" as const,
      countdown_seconds: null,
      alerts: [makeAlertEvent("entry", "Worker entered manhole"), ...m.alerts],
    }));
  }, [patch, selectedId]);

  const simulateExit = useCallback(() => {
    patch(selectedId, (m) => ({
      ...m,
      worker_status: "OUTSIDE" as const,
      elapsed_time_seconds: 0,
      last_checkin_seconds_ago: 0,
      _consecutive_missed_checkins: 0,
      interlock_status: "LOCKED" as const,
      countdown_seconds: null,
      alerts: [
        makeAlertEvent("exit", "Worker exited manhole — interlock re-locked"),
        ...m.alerts,
      ],
    }));
  }, [patch, selectedId]);

  const triggerMissedCheckin = useCallback(() => {
    patch(selectedId, (m) => {
      if (m.worker_status !== "INSIDE") {
        return {
          ...m,
          alerts: [
            makeAlertEvent(
              "gas_warning",
              "No worker INSIDE — check-in simulation ignored"
            ),
            ...m.alerts,
          ],
        };
      }
      const missed = (m._consecutive_missed_checkins ?? 0) + 1;
      const alerts: AlertEvent[] = [
        makeAlertEvent(
          missed >= 2 ? "man_down" : "gas_warning",
          missed >= 2
            ? "MAN DOWN — no worker check-in for 2 consecutive intervals"
            : "Check-in missed (1/2) — awaiting worker response"
        ),
        ...m.alerts,
      ];
      return {
        ...m,
        last_checkin_seconds_ago: 0,
        _consecutive_missed_checkins: missed,
        alerts,
      };
    });
  }, [patch, selectedId]);

  const toggleSensorFault = useCallback(() => {
    patch(selectedId, (m) => {
      const sensor_fault = !m.sensor_fault;
      return {
        ...m,
        sensor_fault,
        alerts: [
          makeAlertEvent(
            "sensor_fault",
            sensor_fault
              ? "Sensor fault reported — readings unreliable"
              : "Sensor recovered — readings nominal"
          ),
          ...m.alerts,
        ],
      };
    });
  }, [patch, selectedId]);

  const startVerify = useCallback(() => {
    patch(selectedId, (m) => ({
      ...m,
      interlock_status: "VERIFYING" as const,
      countdown_seconds: 15,
      alerts: [
        makeAlertEvent(
          "interlock_unlocked",
          "Interlock verification started (15s)"
        ),
        ...m.alerts,
      ],
    }));
  }, [patch, selectedId]);

  const workerCheckin = useCallback(() => {
    patch(selectedId, (m) => ({
      ...m,
      last_checkin_seconds_ago: 0,
      _consecutive_missed_checkins: 0,
      alerts: [
        makeAlertEvent("checkin_reset", "Worker check-in confirmed"),
        ...m.alerts,
      ],
    }));
  }, [patch, selectedId]);

  return {
    manholes,
    selectedId,
    setSelectedId,
    selected,
    actions: {
      triggerGasWarning,
      triggerGasDanger,
      resetToSafe,
      simulateEntry,
      simulateExit,
      triggerMissedCheckin,
      toggleSensorFault,
      startVerify,
      workerCheckin,
    },
  };
}
