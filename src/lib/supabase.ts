// ============================================================================
// Supabase Client Integration & Local Sync Provider
// Supports cloud Supabase tables with seamless fallback to local mock store
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import type { ManholeRecord, MaintenanceRecord, PeakGasRecord } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co"
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * SQL Schema for Supabase Setup:
 *
 * CREATE TABLE IF NOT EXISTS manholes (
 *   manhole_id TEXT PRIMARY KEY,
 *   location TEXT NOT NULL,
 *   lat DOUBLE PRECISION NOT NULL,
 *   lng DOUBLE PRECISION NOT NULL,
 *   overall_status TEXT NOT NULL,
 *   worker_status TEXT NOT NULL,
 *   interlock_status TEXT NOT NULL,
 *   sensor_fault BOOLEAN DEFAULT FALSE,
 *   specs JSONB,
 *   gas JSONB,
 *   peak_gas_records JSONB,
 *   maintenance_history JSONB,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 */

/** Fetch all manholes from Supabase, or return null if not available */
export async function fetchManholesFromSupabase(): Promise<ManholeRecord[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("manholes")
      .select("*")
      .order("manhole_id");

    if (error || !data || data.length === 0) {
      console.warn("Supabase fetch returned empty or error:", error?.message);
      return null;
    }

    return data.map((row) => ({
      manhole_id: row.manhole_id,
      location: row.location,
      coordinates: {
        lat: row.lat,
        lng: row.lng,
      },
      specs: row.specs || {
        depthMeters: 3.0,
        diameterCm: 60,
        installedYear: 2022,
        coverType: "Ductile Iron Class D400",
        drainageNetwork: "Primary Municipal Line",
        zone: "Central Metro",
      },
      peak_gas_records: row.peak_gas_records || [],
      maintenance_history: row.maintenance_history || [],
      gas: row.gas,
      overall_status: row.overall_status,
      worker_status: row.worker_status,
      elapsed_time_seconds: 0,
      interlock_status: row.interlock_status,
      countdown_seconds: null,
      last_checkin_seconds_ago: 0,
      sensor_fault: row.sensor_fault ?? false,
      last_seen: Date.now(),
      connectivity: row.connectivity || {
        protocol: "LoRaWAN",
        gatewayId: "GW-DEFAULT",
        rssi: -85,
        snr: 7.0,
        spreadingFactor: "SF7BW125",
        batteryVolts: 3.6,
        batteryPct: 85,
      },
      maintenance_state: row.maintenance_state || "IDLE",
      topology: row.topology || {
        upstreamId: null,
        downstreamId: null,
        pipeNetwork: "Municipal Trunk Line",
        pipeGradient: "1:200",
        pipeDiameterMm: 450,
      },
      history: [],
      alerts: [],
    })) as unknown as ManholeRecord[];
  } catch (err) {
    console.error("Failed to query Supabase:", err);
    return null;
  }
}

/** Sync or save a manhole record state to Supabase */
export async function upsertManholeToSupabase(m: ManholeRecord): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("manholes").upsert(
      {
        manhole_id: m.manhole_id,
        location: m.location,
        lat: m.coordinates.lat,
        lng: m.coordinates.lng,
        overall_status: m.overall_status,
        worker_status: m.worker_status,
        interlock_status: m.interlock_status,
        sensor_fault: m.sensor_fault,
        specs: m.specs,
        gas: m.gas,
        peak_gas_records: m.peak_gas_records,
        maintenance_history: m.maintenance_history,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "manhole_id" }
    );

    if (error) {
      console.error("Supabase upsert error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error upserting to Supabase:", err);
    return false;
  }
}
