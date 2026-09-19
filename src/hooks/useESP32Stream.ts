"use client";

// ============================================================================
// VENUS — useESP32Stream
// Subscribes to Supabase Realtime for MH-02 ESP32 hardware node.
// Falls back to polling every 6s if Realtime WebSocket doesn't fire.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { subscribeToReadings, fetchLatestReading } from "@/lib/supabase";
import type { ESP32Reading } from "@/lib/supabase";

const STALE_THRESHOLD_MS = 30_000;
const POLL_INTERVAL_MS   = 6_000;

export interface ESP32StreamState {
  reading: ESP32Reading | null;
  isLive: boolean;
  lastReceivedAt: number | null;
}

export function useESP32Stream(manholeId: string): ESP32StreamState {
  const [reading, setReading] = useState<ESP32Reading | null>(null);
  const [isLive, setIsLive]   = useState(false);
  const lastAtRef             = useRef<number | null>(null);
  const lastIdRef             = useRef<number | null>(null);

  function applyReading(r: ESP32Reading) {
    // Only update if this is actually a new row
    if (r.id === lastIdRef.current) return;
    lastIdRef.current  = r.id;
    lastAtRef.current  = Date.now();
    setReading(r);
    setIsLive(true);
  }

  // Staleness watchdog — runs every 5s
  useEffect(() => {
    const id = setInterval(() => {
      const last = lastAtRef.current;
      setIsLive(last !== null && Date.now() - last < STALE_THRESHOLD_MS);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchLatestReading(manholeId).then((r) => {
      if (!r) return;
      const age = Date.now() - new Date(r.created_at).getTime();
      if (age < STALE_THRESHOLD_MS) {
        lastIdRef.current = r.id;
        lastAtRef.current = Date.now() - age;
        setReading(r);
        setIsLive(true);
      }
    });
  }, [manholeId]);

  // Realtime WebSocket subscription
  useEffect(() => {
    const unsubscribe = subscribeToReadings(manholeId, applyReading);
    return unsubscribe;
  }, [manholeId]);

  // Polling fallback — catches rows if Realtime doesn't fire
  useEffect(() => {
    const id = setInterval(async () => {
      const r = await fetchLatestReading(manholeId);
      if (r) applyReading(r);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [manholeId]);

  return { reading, isLive, lastReceivedAt: lastAtRef.current };
}
