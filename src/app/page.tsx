"use client";

// ============================================================================
// VENUS — Real-Time Municipal Confined-Space Safety Dashboard
// Clean light theme, minimal chrome, maximum readability
// ============================================================================

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  CheckinCard,
  InterlockCard,
  WorkerCard,
} from "@/components/Cards";
import { AlertLog } from "@/components/AlertLog";
import { DemoPanel } from "@/components/DemoPanel";
import { GasCards } from "@/components/GasCards";
import { HistoryChart } from "@/components/HistoryChart";
import { ManholeSelector } from "@/components/ManholeSelector";
import { StatusHeader } from "@/components/StatusHeader";
import { ManholeDetailModal } from "@/components/ManholeDetailModal";
import { useSimulation } from "@/hooks/useSimulation";
import type { ManholeRecord } from "@/lib/types";
import {
  ShieldCheck,
  Gauge,
  MapTrifold,
  Broadcast,
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

export default function Home() {
  const { manholes, selectedId, setSelectedId, selected, actions } =
    useSimulation();

  const [activeView, setActiveView] = useState<"dashboard" | "map">("dashboard");
  const [modalManhole, setModalManhole] = useState<ManholeRecord | null>(null);

  return (
    <div className="min-h-[100dvh] bg-[#f7f6f3] text-[#111111]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3 sm:p-6">

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white border border-[#eaeaea] px-5 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf3ec] text-emerald-700">
              <ShieldCheck size={22} weight="bold" />
            </div>
            <div>
              <h1 className="font-mono text-base sm:text-lg font-bold tracking-tight text-[#111]">
                VENUS
              </h1>
              <p className="text-xs text-[#787774]">
                Vehicular & Environmental Network Utility System
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View switcher */}
            <div className="flex rounded-xl bg-[#f7f6f3] p-0.5 text-xs">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
                  activeView === "dashboard"
                    ? "bg-white text-[#111] shadow-xs border border-[#eaeaea]"
                    : "text-[#787774] hover:text-[#111]"
                }`}
              >
                <Gauge size={14} weight="bold" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveView("map")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
                  activeView === "map"
                    ? "bg-white text-[#111] shadow-xs border border-[#eaeaea]"
                    : "text-[#787774] hover:text-[#111]"
                }`}
              >
                <MapTrifold size={14} weight="bold" />
                <span>City Map ({manholes.length})</span>
              </button>
            </div>

            {/* Live telemetry badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-[#edf3ec] border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Broadcast size={12} weight="bold" className="animate-pulse" />
              <span>Live · 1s</span>
            </div>
          </div>
        </header>

        {/* City Map View */}
        {activeView === "map" && (
          <CityMap
            manholes={manholes}
            selectedId={selectedId}
            onSelectManhole={(id: string) => setSelectedId(id)}
            onOpenHistory={(m: ManholeRecord) => setModalManhole(m)}
          />
        )}

        {/* Dashboard View */}
        {activeView === "dashboard" && (
          <>
            <ManholeSelector
              manholes={manholes}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            <main className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: Status + Gas + Safety Cards */}
              <div className="flex flex-col gap-4 lg:col-span-7">
                <StatusHeader m={selected} />
                <GasCards gas={selected.gas} />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InterlockCard m={selected} />
                  <WorkerCard m={selected} />
                  <CheckinCard m={selected} />
                </div>
              </div>

              {/* Right: Chart + Log */}
              <div className="flex flex-col gap-4 lg:col-span-5">
                <HistoryChart history={selected.history} />
                <AlertLog events={selected.alerts} />
              </div>
            </main>

            <DemoPanel selected={selected} actions={actions} />
          </>
        )}

        {/* Manhole Detail Modal */}
        {modalManhole ? (
          <ManholeDetailModal
            manhole={modalManhole}
            onClose={() => setModalManhole(null)}
            onSelectForMonitoring={(id) => {
              setSelectedId(id);
              setActiveView("dashboard");
            }}
          />
        ) : null}

        {/* Footer */}
        <footer className="mt-2 flex flex-wrap items-center justify-between border-t border-[#eaeaea] pt-4 text-xs text-[#787774]">
          <span>VENUS — Municipal Confined-Space Safety Infrastructure</span>
          <span>ISO 45001 Confined Space Safety</span>
        </footer>
      </div>
    </div>
  );
}
