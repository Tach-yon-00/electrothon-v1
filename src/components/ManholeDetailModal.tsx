"use client";

// ============================================================================
// Manhole Detail Modal — Lifecycle history, specs & live telemetry (Light Theme)
// ============================================================================

import React, { useState } from "react";
import type { ManholeRecord } from "@/lib/types";
import {
  X,
  MapPin,
  Flame,
  Wrench,
  ShieldCheck,
  Clock,
  User,
  Calendar,
  Compass,
  Sliders,
  CheckCircle,
  FileText,
} from "@phosphor-icons/react";

interface Props {
  manhole: ManholeRecord | null;
  onClose: () => void;
  onSelectForMonitoring?: (id: string) => void;
}

export function ManholeDetailModal({ manhole, onClose, onSelectForMonitoring }: Props) {
  const [activeTab, setActiveTab] = useState<"history" | "peaks" | "specs" | "telemetry">("history");

  if (!manhole) return null;

  const statusBadge = {
    SAFE:    "bg-[#edf3ec] text-emerald-700 border-emerald-200",
    WARNING: "bg-[#fbf3db] text-amber-700 border-amber-200",
    DANGER:  "bg-[#fdebec] text-red-700 border-red-200",
  }[manhole.overall_status];

  const tabs = [
    { key: "history",   icon: Wrench,      label: `Maintenance (${manhole.maintenance_history.length})` },
    { key: "peaks",     icon: Flame,       label: `Gas Peaks (${manhole.peak_gas_records.length})` },
    { key: "specs",     icon: Compass,     label: "Specifications" },
    { key: "telemetry", icon: ShieldCheck, label: "Live Atmosphere" },
  ] as const;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-[#eaeaea] bg-white overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#eaeaea] p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5" id="modal-title">
              <span className="font-mono text-sm font-bold text-[#111]">{manhole.manhole_id}</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge}`}>
                {manhole.overall_status}
              </span>
              <span className="rounded-full bg-[#f7f6f3] border border-[#eaeaea] px-2.5 py-0.5 text-xs text-[#787774]">
                {manhole.specs.zone}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#787774]">
              <MapPin size={13} className="text-[#bbb]" />
              <span>{manhole.location}</span>
              <span className="font-mono text-[#ccc]">({manhole.coordinates.lat.toFixed(4)}, {manhole.coordinates.lng.toFixed(4)})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSelectForMonitoring && (
              <button
                onClick={() => { onSelectForMonitoring(manhole.manhole_id); onClose(); }}
                className="flex items-center gap-1.5 rounded-lg bg-[#111] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#333] transition-colors cursor-pointer active:scale-[0.98]"
              >
                <Sliders size={13} />
                <span>Monitor Live</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#787774] hover:bg-[#f7f6f3] hover:text-[#111] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#eaeaea] px-5 overflow-x-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === key
                  ? "border-[#111] text-[#111] font-semibold"
                  : "border-transparent text-[#787774] hover:text-[#111]"
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Maintenance History */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-[#787774]">Service Logs</h4>
                <span className="text-xs text-[#bbb]">{manhole.maintenance_history.length} records</span>
              </div>

              {manhole.maintenance_history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#eaeaea] p-8 text-center">
                  <FileText size={22} className="mx-auto text-[#ccc] mb-2" />
                  <p className="text-sm font-medium text-[#555]">No records yet</p>
                  <p className="text-xs text-[#bbb] mt-1">Inspections run on a 90-day cycle.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {manhole.maintenance_history.map((record) => (
                    <div key={record.id} className="flex flex-col gap-2 rounded-xl border border-[#eaeaea] bg-[#f7f6f3] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#111]">{record.id}</span>
                          <span className="rounded-full bg-white border border-[#eaeaea] px-2 py-0.5 text-[10px] text-[#555]">{record.type}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle size={13} weight="fill" />
                          {record.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#555] leading-relaxed">{record.notes}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-[#eaeaea] text-[10px] text-[#787774] font-mono">
                        <span className="flex items-center gap-1"><User size={11} /> {record.technician}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {record.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gas Peaks */}
          {activeTab === "peaks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-[#787774]">All-Time Peak Readings</h4>
                <span className="text-xs text-[#bbb]">OSHA / NIOSH calibrated</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {manhole.peak_gas_records.map((peak) => {
                  const gasName = { h2s: "Hydrogen Sulfide", co: "Carbon Monoxide", ch4: "Methane" }[peak.gas];
                  return (
                    <div key={peak.gas} className="rounded-xl border border-[#eaeaea] bg-[#f7f6f3] p-4 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#787774]">{peak.gas.toUpperCase()}</div>
                        <div className="text-xs font-semibold text-[#555] mt-0.5">{gasName}</div>
                      </div>
                      <div className="my-3">
                        <div className="font-mono text-2xl font-bold text-[#111] tracking-tight">
                          {peak.maxValue} <span className="text-xs font-normal text-[#787774]">{peak.unit}</span>
                        </div>
                      </div>
                      <div className="space-y-1 pt-2 border-t border-[#eaeaea] text-[10px] text-[#787774]">
                        <div className="flex items-center justify-between">
                          <span>Recorded</span>
                          <span className="font-mono text-[#555]">{new Date(peak.recordedAt).toLocaleDateString()}</span>
                        </div>
                        {peak.incidentId && (
                          <div className="flex items-center justify-between">
                            <span>Incident</span>
                            <span className="font-mono font-medium text-red-600">{peak.incidentId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-amber-200 bg-[#fbf3db] p-3 text-xs text-amber-700">
                Any peak exceeding OSHA PEL (H₂S &gt; 20ppm, CO &gt; 50ppm, CH₄ &gt; 10% LEL) triggers mandatory chamber venting before entry.
              </div>
            </div>
          )}

          {/* Specifications */}
          {activeTab === "specs" && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[#787774]">Engineering Specifications</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Shaft Depth", value: `${manhole.specs.depthMeters} m` },
                  { label: "Cover Diameter", value: `${manhole.specs.diameterCm} cm` },
                  { label: "Commissioned", value: String(manhole.specs.installedYear) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-[#eaeaea] bg-[#f7f6f3] p-3">
                    <div className="text-[10px] text-[#787774]">{label}</div>
                    <div className="mt-1 font-mono text-lg font-bold text-[#111]">{value}</div>
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-3 rounded-xl border border-[#eaeaea] bg-[#f7f6f3] p-3 space-y-2">
                  {[
                    ["Cover Spec", manhole.specs.coverType],
                    ["Drainage Network", manhole.specs.drainageNetwork],
                    ["Municipal Zone", manhole.specs.zone],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-[#787774]">{label}</span>
                      <span className="font-medium text-[#555]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live Telemetry */}
          {activeTab === "telemetry" && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[#787774]">Real-Time Sensor Values</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "H₂S", val: manhole.gas.h2s.value, unit: "ppm", status: manhole.gas.h2s.status },
                  { label: "CO",  val: manhole.gas.co.value,  unit: "ppm", status: manhole.gas.co.status  },
                  { label: "CH₄", val: manhole.gas.ch4.value, unit: "%LEL",status: manhole.gas.ch4.status },
                ].map(({ label, val, unit, status }) => (
                  <div key={label} className="rounded-xl border border-[#eaeaea] bg-[#f7f6f3] p-3">
                    <div className="text-xs text-[#787774]">{label}</div>
                    <div className="mt-1 font-mono text-xl font-bold text-[#111]">
                      {val.toFixed(1)} <span className="text-xs font-normal text-[#787774]">{unit}</span>
                    </div>
                    <div className="mt-1 text-[10px] font-semibold text-emerald-700">{status}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[#eaeaea] bg-[#f7f6f3] p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#787774]">Personnel</div>
                  <div className="font-semibold text-[#111] text-sm mt-0.5">
                    {manhole.worker_status === "INSIDE" ? "Worker present" : "No personnel inside"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#787774]">Hatch</div>
                  <div className="font-mono text-sm font-bold text-[#111] mt-0.5">{manhole.interlock_status}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#eaeaea] px-5 py-3 text-xs text-[#787774]">
          <span>VENUS IoT Telemetry</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#eaeaea] bg-[#f7f6f3] px-3 py-1.5 font-medium text-[#555] hover:bg-[#eaeaea] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  manhole: ManholeRecord | null;
  onClose: () => void;
  onSelectForMonitoring?: (id: string) => void;
}

