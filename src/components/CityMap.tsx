"use client";

// ============================================================================
// City-Wide Manhole Geographic Map (Light Theme)
// Interactive node map with real-time gas telemetry on hover
// ============================================================================

import React, { useState, useMemo, useEffect, useRef } from "react";
import type { ManholeRecord } from "@/lib/types";
import {
  MagnifyingGlass,
  MapPin,
  Flame,
  Warning,
  ShieldCheck,
  Compass,
  ArrowSquareOut,
} from "@phosphor-icons/react";

interface Props {
  manholes: ManholeRecord[];
  selectedId: string;
  onSelectManhole: (id: string) => void;
  onOpenHistory: (manhole: ManholeRecord) => void;
}

function MapInternal({
  manholes,
  selectedId,
  onSelectManhole,
  onOpenHistory,
  searchQuery,
}: Props & { searchQuery: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const pipeLinesRef = useRef<any[]>([]);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => setL(leaflet.default));
  }, []);

  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946] as [number, number],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        subdomains: "abc",
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstanceRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    // Draw sewer pipe topology lines between connected nodes
    const coordMap = new Map(
      manholes.map((m) => [m.manhole_id, [m.coordinates.lat, m.coordinates.lng] as [number, number]])
    );
    pipeLinesRef.current.forEach((line) => line.remove());
    pipeLinesRef.current = [];

    const drawnPairs = new Set<string>();
    manholes.forEach((m) => {
      const downId = m.topology.downstreamId;
      if (!downId) return;
      const pairKey = [m.manhole_id, downId].sort().join("-");
      if (drawnPairs.has(pairKey)) return;
      drawnPairs.add(pairKey);

      const from = coordMap.get(m.manhole_id);
      const to = coordMap.get(downId);
      if (!from || !to) return;

      const line = L.polyline([from, to], {
        color: "#b0b0b0",
        weight: 2,
        dashArray: "5 5",
        opacity: 0.7,
      }).addTo(map);

      const downNode = manholes.find((n) => n.manhole_id === downId);
      if (downNode) {
        line.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;font-size:10px;color:#555;">
            <strong style="font-size:11px;color:#111;">${m.topology.pipeNetwork}</strong><br/>
            ${m.manhole_id} → ${downId}<br/>
            Ø${m.topology.pipeDiameterMm}mm · Grade ${m.topology.pipeGradient}
          </div>`,
          { sticky: true, opacity: 1 }
        );
      }
      pipeLinesRef.current.push(line);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
      pipeLinesRef.current = [];
    };
  }, [L, manholes]);

  const filteredManholes = useMemo(() => {
    if (!searchQuery.trim()) return manholes;
    const q = searchQuery.toLowerCase();
    return manholes.filter(
      (m) =>
        m.manhole_id.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.specs.zone.toLowerCase().includes(q)
    );
  }, [manholes, searchQuery]);

  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;
    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;
    const visibleIds = new Set(filteredManholes.map((m) => m.manhole_id));

    for (const [id, marker] of currentMarkers.entries()) {
      if (!visibleIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    filteredManholes.forEach((m) => {
      const isSelected = m.manhole_id === selectedId;
      const colorMap = {
        SAFE:    { bg: "#059669", ring: "rgba(5,150,105,0.2)",   shadow: "rgba(5,150,105,0.3)"  },
        WARNING: { bg: "#d97706", ring: "rgba(217,119,6,0.25)",  shadow: "rgba(217,119,6,0.35)" },
        DANGER:  { bg: "#dc2626", ring: "rgba(220,38,38,0.25)",  shadow: "rgba(220,38,38,0.4)"  },
      }[m.overall_status];

      const pinIcon = L.divIcon({
        className: "custom-manhole-pin",
        html: `<div style="
            position:relative;width:${isSelected?36:28}px;height:${isSelected?36:28}px;
            border-radius:9999px;background:${colorMap.bg};
            border:2.5px solid #fff;
            box-shadow:0 4px 10px -2px ${colorMap.shadow},0 0 0 ${isSelected?"5px":"2px"} ${colorMap.ring};
            display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <span style="font-family:monospace;font-size:${isSelected?11:9}px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
            ${m.manhole_id.replace("MH-","")}
          </span>
          ${m.worker_status==="INSIDE"?`<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:9999px;background:#0284c7;border:2px solid #fff;"></div>`:""}
        </div>`,
        iconSize: [isSelected?36:28, isSelected?36:28],
        iconAnchor: [isSelected?18:14, isSelected?18:14],
      });

      const tooltipContent = `
        <div style="font-family:system-ui,sans-serif;min-width:180px;color:#111;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eaeaea;padding-bottom:5px;margin-bottom:6px;">
            <strong style="font-family:monospace;font-size:13px;font-weight:800;">${m.manhole_id}</strong>
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;background:${
              m.overall_status==="SAFE"?"#edf3ec;color:#059669":m.overall_status==="WARNING"?"#fbf3db;color:#d97706":"#fdebec;color:#dc2626"
            };">${m.overall_status}</span>
          </div>
          <div style="font-size:11px;color:#787774;margin-bottom:8px;line-height:1.4;">${m.location}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;background:#f7f6f3;padding:6px;border-radius:6px;font-size:10px;text-align:center;">
            <div><div style="color:#787774;font-weight:600;">H₂S</div><div style="font-family:monospace;font-weight:800;font-size:11px;">${m.gas.h2s.value.toFixed(1)}</div></div>
            <div><div style="color:#787774;font-weight:600;">CO</div><div style="font-family:monospace;font-weight:800;font-size:11px;">${m.gas.co.value.toFixed(1)}</div></div>
            <div><div style="color:#787774;font-weight:600;">CH₄</div><div style="font-family:monospace;font-weight:800;font-size:11px;">${m.gas.ch4.value.toFixed(1)}</div></div>
          </div>
          <div style="margin-top:6px;font-size:9px;color:#bbb;text-align:center;">Click for history &amp; specs</div>
        </div>`;

      let marker = currentMarkers.get(m.manhole_id);
      if (marker) {
        marker.setIcon(pinIcon);
        marker.setTooltipContent(tooltipContent);
      } else {
        marker = L.marker([m.coordinates.lat, m.coordinates.lng], { icon: pinIcon }).addTo(map);
        marker.bindTooltip(tooltipContent, {
          direction: "top", offset: [0, -12], opacity: 1,
          className: "leaflet-custom-tooltip",
        });
        marker.on("click", () => { onSelectManhole(m.manhole_id); onOpenHistory(m); });
        currentMarkers.set(m.manhole_id, marker);
      }
    });
  }, [filteredManholes, selectedId, L, onSelectManhole, onOpenHistory]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#eaeaea] bg-[#f7f6f3]" style={{ height: 400 }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      <div className="absolute bottom-3 left-3 z-[400] bg-white border border-[#eaeaea] rounded-lg p-2.5 text-xs space-y-1.5">
        <div className="font-semibold text-[#787774] text-[10px] uppercase tracking-wider">Legend</div>
        <div className="flex items-center gap-3 text-[11px] text-[#555]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Safe</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600 inline-block" /> Warning</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600 inline-block" /> Danger</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-600 inline-block" /> Worker</span>
        </div>
      </div>
    </div>
  );
}

export function CityMap(props: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "SAFE" | "WARNING" | "DANGER">("ALL");

  const filteredList = useMemo(() => {
    return props.manholes.filter((m) => {
      const matchesSearch =
        !searchQuery.trim() ||
        m.manhole_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.specs.zone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || m.overall_status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [props.manholes, searchQuery, filterStatus]);

  return (
    <div className="rounded-xl bg-white border border-[#eaeaea] p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[#787774]" />
            <h3 className="text-sm font-semibold text-[#111]">City-Wide Manhole Network</h3>
            <span className="rounded-full bg-[#f7f6f3] border border-[#eaeaea] px-2 py-0.5 text-[10px] font-semibold text-[#787774]">
              {props.manholes.length} assets
            </span>
          </div>
          <p className="text-xs text-[#787774] mt-0.5">
            Hover markers for live gas readings. Click for maintenance history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb]" />
            <input
              type="text"
              placeholder="Search ID, street, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-56 rounded-lg border border-[#eaeaea] bg-[#f7f6f3] pl-8 pr-3 text-xs text-[#111] placeholder:text-[#bbb] focus:border-[#ccc] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex rounded-lg bg-[#f7f6f3] p-0.5 text-xs">
            {(["ALL", "SAFE", "WARNING", "DANGER"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                  filterStatus === st
                    ? "bg-white text-[#111] border border-[#eaeaea] font-semibold"
                    : "text-[#787774] hover:text-[#111]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <MapInternal {...props} searchQuery={searchQuery} />

      {/* Quick search result cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        {filteredList.map((m) => {
          const isSelected = m.manhole_id === props.selectedId;
          const statusBg = {
            SAFE:    "hover:bg-[#edf3ec]",
            WARNING: "hover:bg-[#fbf3db]",
            DANGER:  "hover:bg-[#fdebec]",
          }[m.overall_status];

          return (
            <button
              key={m.manhole_id}
              type="button"
              data-testid={`manhole-card-${m.manhole_id}`}
              onClick={() => { props.onSelectManhole(m.manhole_id); props.onOpenHistory(m); }}
              className={`flex flex-col justify-between p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                isSelected ? "border-emerald-300 bg-[#edf3ec]" : `border-[#eaeaea] bg-[#f7f6f3] ${statusBg}`
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-xs font-bold text-[#111]">{m.manhole_id}</span>
                <span className={`text-[10px] font-bold ${
                  m.overall_status === "SAFE" ? "text-emerald-600" : m.overall_status === "WARNING" ? "text-amber-600" : "text-red-600"
                }`}>
                  {m.overall_status}
                </span>
              </div>
              <div className="text-[11px] text-[#787774] truncate mt-1 w-full">
                {m.location.split("·")[0]}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#787774] font-mono mt-2 pt-1.5 border-t border-[#eaeaea] w-full">
                <span>H₂S {m.gas.h2s.value.toFixed(1)}</span>
                <ArrowSquareOut size={11} className="text-[#bbb]" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Under Maintenance Section */}
      {(() => {
        const underMaintenance = props.manholes.filter(
          (m) => m.maintenance_state !== "IDLE"
        );

        if (underMaintenance.length === 0) return null;

        return (
          <div className="mt-4 rounded-xl bg-white border border-[#eaeaea] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-amber-600" weight="bold" />
                <h4 className="text-xs font-semibold text-[#111]">Under Maintenance at This Moment</h4>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  {underMaintenance.length} active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {underMaintenance.map((m) => {
                const latestMaintenance = m.maintenance_history[0];
                const isActive = m.worker_status === "INSIDE";

                return (
                  <button
                    key={m.manhole_id}
                    type="button"
                    onClick={() => { props.onSelectManhole(m.manhole_id); props.onOpenHistory(m); }}
                    className="flex flex-col gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50/30 hover:bg-amber-50 text-left cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#111]">{m.manhole_id}</span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
                          </span>
                          WORKER INSIDE
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#555] leading-relaxed">
                      {isActive ? (
                        <>Worker on-site · Elapsed {Math.floor(m.elapsed_time_seconds / 60)}m {m.elapsed_time_seconds % 60}s</>
                      ) : (
                        <>Recent: {latestMaintenance?.type || "Inspection"}</>
                      )}
                    </div>

                    {latestMaintenance && (
                      <div className="pt-2 border-t border-amber-200/50 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#787774]">Technician</span>
                          <span className="font-medium text-[#555]">{latestMaintenance.technician}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#787774]">Date</span>
                          <span className="font-mono text-[#555]">{latestMaintenance.date}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 text-[10px] font-mono">
                      <span className="text-[#787774]">H₂S {m.gas.h2s.value.toFixed(1)} ppm</span>
                      <span className={`font-bold ${
                        m.overall_status === "SAFE" ? "text-emerald-600" :
                        m.overall_status === "WARNING" ? "text-amber-600" : "text-red-600"
                      }`}>
                        {m.overall_status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

interface Props {
  manholes: ManholeRecord[];
  selectedId: string;
  onSelectManhole: (id: string) => void;
  onOpenHistory: (manhole: ManholeRecord) => void;
}

// Inner Leaflet Map Component (Client-Side Only) - Fixed flicker & persistent map
