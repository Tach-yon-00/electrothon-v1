// ============================================================================
// VENUS — Supabase Client + ESP32 sensor data helpers
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

// ---------------------------------------------------------------------------
// ESP32 sensor reading shape (matches what the Arduino POSTs)
// ---------------------------------------------------------------------------
export interface ESP32Reading {
  id: number;
  manhole_id: string;
  co_raw: number;
  ch4_raw: number;
  co_status: "SAFE" | "WARNING" | "DANGER";
  ch4_status: "SAFE" | "WARNING" | "DANGER";
  overall_status: "SAFE" | "WARNING" | "DANGER";
  ir_active: boolean;
  button_pressed: boolean;
  timestamp: string;
  created_at: string;
}

/**
 * Fetch the latest reading for a given manhole from Supabase.
 */
export async function fetchLatestReading(manholeId: string): Promise<ESP32Reading | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("sensor_readings")
    .select("*")
    .eq("manhole_id", manholeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as ESP32Reading;
}

/**
 * Subscribe to realtime inserts — no row-level filter (avoids Supabase
 * Realtime filter index requirement). Filter by manholeId client-side.
 * Returns an unsubscribe function.
 */
export function subscribeToReadings(
  manholeId: string,
  onReading: (r: ESP32Reading) => void
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("sensor_readings_all")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "sensor_readings",
        // No filter here — filter client-side to avoid Realtime index requirement
      },
      (payload) => {
        const row = payload.new as ESP32Reading;
        if (row.manhole_id === manholeId) {
          onReading(row);
        }
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[VENUS] Supabase Realtime connected for", manholeId);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
