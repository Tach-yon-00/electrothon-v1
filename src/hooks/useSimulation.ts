"use client";

// ============================================================================
// Manhole Guardian — Simulation Hook
// ----------------------------------------------------------------------------
// Owns all live state for the dashboard: the array of ManholeRecords, a 1s
// simulation tick, and every demo action. Components stay dumb/presentational.
// The record shape + accessor pattern mirrors what a Firebase realtime
// listener would provide — swap the internals, keep this hook's API.
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
import type { AlertEvent, ManholeRecord } from "@/lib/types";

export function useSimulation() {
  // Lazy initializer so the mock "DB fetch" only runs once per client session.
  // NOTE: returns clock-seeded data; first paint is hydrate-gated in the page
  // (see useIsClient) so SSR/client timestamp differences never mismatch.
  const [manholes, setManholes] = useState<ManholeRecord[]>(() =>
    getInitialManholes()
  );
  const [selectedId, setSelectedId] = useState("MH-01");

  // --- 1s simulation heartbeat --------------------------------------------
  useEffect(() => {
    const id = setInterval(() => {
      setManholes((prev) => prev.map(stepSimulation));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const selected =
    manholes.find((m) => m.manhole_id === selectedId) ?? manholes[0];

  const patch = useCallback(
    (id: string, fn: (m: ManholeRecord) => ManholeRecord) => {
      setManholes((prev) => prev.map((m) => (m.manhole_id === id ? fn(m) : m)));
    },
    []
  );

  // --- Demo actions --------------------------------------------------------
  // Each mutates the selected manhole the way a real event stream would.

  const triggerGasWarning = useCallback(() => {
    patch(selectedId, (m) => {
      const gas = {
        h2s: makeReading("h2s", GAS_THRESHOLDS.h2s.safeMax + 3),
        co: m.gas.co,
        ch4: m.gas.ch4,
      };
      return {
        ...m,
        gas,
        overall_status: computeOverallStatus(
          gas.h2s.status,
          gas.co.status,
          gas.ch4.status
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
