"use client";

// ============================================================================
// VENUS — Dashboard (client-only, no SSR)
// All time-dependent and sensor-driven renders live here.
// ============================================================================

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  CheckinCard,
  InterlockCard,
  WorkerCard,
  MaintenanceStateCard,
} from "@/components/Cards";
import { AlertLog } from "@/components/AlertLog";
import { DemoPanel } from "@/components/DemoPanel";
import { GasCards } from "@/components/GasCards";
import { HistoryChart } from "@/components/HistoryChart";
import { ManholeSelector } from "@/components/ManholeSelector";
import { StatusHeader } from "@/components/StatusHeader";
import { ManholeDetailModal } from "@/components/ManholeDetailModal";
import { useSimulation } from "@/hooks/useSimulation";
import { useESP32Stream } from "@/hooks/useESP32Stream";
import type { ManholeRecord } from "@/lib/types";
import {
  ShieldCheck,
  Gauge,
  MapTrifold,
  Broadcast,
  HardDrive,
} from "@phosphor-icons/react";

// Dynamically import Leaflet Map to avoid SSR window reference errors
const CityMap = dynamic(
  () => import("@/components/CityMap").then((mod) => mod.CityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] w-full items-center justify-center rounded-xl border border-[#eaeaea] bg-white text-xs text-[#787774]">
        Loading map...
      </div>
    ),
  }
);

export function Dashboard() {
  const { manholes, selectedId, setSelectedId, selected, actions } =
    useSimulation();

  const [activeView, setActiveView] = useState<"dashboard" | "map">("dashboard");
  const [modalManhole, setModalManhole] = useState<ManholeRecord | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const { isLive: esp32Live, reading: esp32Reading, lastReceivedAt } = useESP32Stream("MH-02");

  return (
    <div className="min-h-[100dvh] bg-[#f7f6f3] text-[#111111]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:gap-4 p-3 sm:p-5 lg:p-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="slide-down flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-[#eaeaea] px-4 py-3 sm:px-5 sm:py-3.5">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-[#edf3ec] text-emerald-700">
              <ShieldCheck size={20} weight="bold" />
            </div>
            <div>
              <h1 className="font-mono text-sm sm:text-base font-bold tracking-tight text-[#111]">
                VENUS
              </h1>
              <p className="hidden sm:block text-[11px] text-[#787774]">
                Vehicular &amp; Environmental Network Utility System
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View switcher */}
            <div className="flex rounded-xl bg-[#f7f6f3] p-0.5 text-xs">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all duration-200 cursor-pointer touch-target ${
                  activeView === "dashboard"
                    ? "bg-white text-[#111] shadow-xs border border-[#eaeaea]"
                    : "text-[#787774] hover:text-[#111]"
                }`}
              >
                <Gauge size={13} weight="bold" />
                <span className="hidden xs:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveView("map")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all duration-200 cursor-pointer touch-target ${
                  activeView === "map"
                    ? "bg-white text-[#111] shadow-xs border border-[#eaeaea]"
                    : "text-[#787774] hover:text-[#111]"
                }`}
              >
                <MapTrifold size={13} weight="bold" />
                <span className="hidden xs:inline">Map</span>
                <span className="text-[10px] tabular-nums text-[#787774]">({manholes.length})</span>
              </button>
            </div>

            {/* Live badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-[#edf3ec] border border-emerald-200 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700">
              <Broadcast size={11} weight="bold" className="animate-pulse" />
              <span className="hidden sm:inline">Live ·</span>
              <span>1s</span>
            </div>

            {/* ESP32 badge */}
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-500 ${
              esp32Live
                ? "bg-sky-50 border-sky-200 text-sky-700"
                : "bg-[#f7f6f3] border-[#eaeaea] text-[#787774]"
            }`}>
              <HardDrive size={11} weight="bold" />
              <span className="hidden sm:inline">{esp32Live ? "MH-02 · ESP32 Live" : "MH-02 · Mock"}</span>
              <span className="sm:hidden">{esp32Live ? "Live" : "Mock"}</span>
              <span className={`h-1.5 w-1.5 rounded-full bg-sky-400 transition-all duration-500 ${esp32Live ? "opacity-100 animate-pulse" : "opacity-0"}`} />
            </div>
          </div>
        </header>

        {/* ── Debug Panel ───────────────────────────────────────────────── */}
        <details className="fade-up stagger-1 rounded-xl border border-[#eaeaea] bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#787774] hover:text-[#111] transition-colors">
            🔧 ESP32 Connection Debug
          </summary>
          <div className="border-t border-[#eaeaea] p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#787774]">Status:</span>
              <span className={esp32Live ? "text-emerald-700 font-bold" : "text-[#787774]"}>
                {esp32Live ? "✅ ESP32 Live" : "⚪ Mock Mode"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#787774]">Last Reading:</span>
              <span className="text-[#555]">
                {esp32Reading ? new Date(esp32Reading.created_at).toLocaleTimeString() : "Never"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#787774]">Data Age:</span>
              <span className="text-[#555]">
                {lastReceivedAt ? `${Math.round((Date.now() - lastReceivedAt) / 1000)}s ago` : "N/A"}
              </span>
            </div>
            {esp32Reading && (
              <>
                <div className="flex justify-between">
                  <span className="text-[#787774]">CO Raw:</span>
                  <span className="text-[#555]">{esp32Reading.co_raw}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787774]">CH₄ Raw:</span>
                  <span className="text-[#555]">{esp32Reading.ch4_raw}</span>
                </div>
              </>
            )}
            <div className="pt-2 border-t border-[#eaeaea] text-[#787774]">
              <div>Console logs: Check F12 → Console for:</div>
              <div className="pl-2 mt-1 text-[10px]">
                <div>• [VENUS] Realtime status</div>
                <div>• [ESP32] New reading received</div>
              </div>
            </div>
          </div>
        </details>

        {/* ── City Map View ─────────────────────────────────────────────── */}
        {activeView === "map" && (
          <div className="view-enter">
            <CityMap
              manholes={manholes}
              selectedId={selectedId}
              onSelectManhole={(id: string) => setSelectedId(id)}
              onOpenHistory={(m: ManholeRecord) => setModalManhole(m)}
            />
          </div>
        )}

        {/* ── Dashboard View ────────────────────────────────────────────── */}
        {activeView === "dashboard" && (
          <div className="view-enter flex flex-col gap-3 sm:gap-4">
            {/* Node selector */}
            <div className="fade-up stagger-1">
              <ManholeSelector
                manholes={manholes}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>

            <main className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
              {/* Left column */}
              <div className="flex flex-col gap-3 sm:gap-4 lg:col-span-7">
                <div className="fade-up stagger-2">
                  <StatusHeader m={selected} />
                </div>
                <div className="fade-up stagger-3">
                  <GasCards gas={selected.gas} />
                </div>
                <div className="fade-up stagger-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                  <InterlockCard m={selected} />
                  <WorkerCard m={selected} />
                  <CheckinCard m={selected} />
                  <MaintenanceStateCard m={selected} />
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-3 sm:gap-4 lg:col-span-5">
                <div className="fade-up stagger-3">
                  <HistoryChart history={selected.history} />
                </div>
                <div className="fade-up stagger-4">
                  <AlertLog events={selected.alerts} />
                </div>
              </div>
            </main>

            <div className="fade-up stagger-5">
              <DemoPanel selected={selected} actions={actions} />
            </div>
          </div>
        )}

        {/* ── Modal ─────────────────────────────────────────────────────── */}
        {modalManhole && (
          <ManholeDetailModal
            manhole={modalManhole}
            onClose={() => setModalManhole(null)}
            onSelectForMonitoring={(id) => {
              setSelectedId(id);
              setActiveView("dashboard");
            }}
          />
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="fade-up stagger-6 flex flex-wrap items-center justify-between border-t border-[#eaeaea] pt-3 pb-1 text-[10px] sm:text-xs text-[#787774] gap-2">
          <span>VENUS — Municipal Confined-Space Safety Infrastructure</span>
          <span className="hidden sm:inline">ISO 45001 Confined Space Safety</span>
        </footer>
      </div>
    </div>
  );
}
