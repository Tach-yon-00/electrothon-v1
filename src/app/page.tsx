"use client";

// ============================================================================
// Manhole Guardian — Dashboard (single screen, minimal scrolling)
// Real-time (simulated) safety monitoring for manhole workers.
// All state comes from useSimulation(); components are presentational.
// ============================================================================

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
import { Panel } from "@/components/ui";
import { useSimulation } from "@/hooks/useSimulation";

export default function Home() {
  const { manholes, selectedId, setSelectedId, selected, actions } =
    useSimulation();

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-4 text-zinc-100">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3">
        {/* Top bar + manhole selector */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-lg"
            >
              🛢
            </span>
            <div>
              <h1 className="text-lg font-black leading-tight tracking-tight">
                MANHOLE GUARDIAN
              </h1>
              <p className="text-[11px] text-zinc-500">
                Real-time confined-space safety monitoring · Live demo
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] text-zinc-400">
            {manholes.length} nodes · simulated feed · 1s refresh
          </span>
        </header>

        <ManholeSelector
          manholes={manholes}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Main grid */}
        <main className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Left column: status + gas + entry control */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <StatusHeader m={selected} />
            <GasCards gas={selected.gas} />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <InterlockCard m={selected} />
              <WorkerCard m={selected} />
              <CheckinCard m={selected} />
            </div>
          </div>

          {/* Right column: history chart + alert log */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <HistoryChart history={selected.history} />
            <Panel className="flex-1">
              <AlertLog events={selected.alerts} />
            </Panel>
          </div>
        </main>

        {/* Dev-only demo controls */}
        <DemoPanel selected={selected} actions={actions} />
      </div>
    </div>
  );
}
