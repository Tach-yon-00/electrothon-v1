"use client";

// ============================================================================
// VENUS — useESP32Stream
// Subscribes to Supabase Realtime for MH-02 ESP32 hardware node.
// Returns the latest reading + a boolean indicating if it's "live" (< 30s old).
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { subscribeToReadings, fetchLatestReading } from "@/lib/supabase";
import type { ESP32Reading } from "@/lib/supabase";

const STALE_THRESHOLD_MS = 30_000; // 30 seconds — if no new reading, revert to mock

export interface ESP32StreamState {
  /** Latest reading from the ESP32, or null if never received */
  reading: ESP32Reading | null;
  /** True if reading is < 30s old (ESP32 is actively transmitting) */
  isLive: boolean;
  /** ISO timestamp of last received reading */
  lastReceivedAt: number | null;
}

export function useESP32Stream(manholeId: string): ESP32StreamState {
  const [reading, setReading] = useState<ESP32Reading | null>(null);
  const [lastReceivedAt, setLastReceivedAt] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const stalenessTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check staleness every 5s
  useEffect(() => {
    stalenessTimer.current = setInterval(() => {
      setIsLive((prev) => {
        if (!lastReceivedAt) return false;
        return Date.now() - lastReceivedAt < STALE_THRESHOLD_MS;
      });
    }, 5000);
    return () => {
      if (stalenessTimer.current) clearInterval(stalenessTimer.current);
    };
  }, [lastReceivedAt]);

  // Fetch the latest reading on mount (in case ESP32 posted before we loaded)
  useEffect(() => {
    fetchLatestReading(manholeId).then((r) => {
      if (!r) return;
      const age = Date.now() - new Date(r.created_at).getTime();
      if (age < STALE_THRESHOLD_MS) {
        setReading(r);
        setLastReceivedAt(Date.now() - age);
        setIsLive(true);
      }
    });
  }, [manholeId]);

  // Subscribe to realtime inserts
  useEffect(() => {
    const unsubscribe = subscribeToReadings(manholeId, (r) => {
      setReading(r);
      setLastReceivedAt(Date.now());
      setIsLive(true);
    });
    return unsubscribe;
  }, [manholeId]);

  return { reading, isLive, lastReceivedAt };
}
