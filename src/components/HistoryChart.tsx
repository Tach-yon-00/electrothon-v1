"use client";

// ============================================================================
// History Chart — 2-hour multi-gas telemetry trend (Light Theme)
// ============================================================================

import { useIsClient, useNow } from "@/hooks/useIsClient";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { HISTORY_WINDOW_MS } from "@/lib/config";
import { formatTime } from "@/lib/format";
import type { HistoryPoint } from "@/lib/types";
import { Panel } from "./ui";

const SERIES = [
  { key: "h2s", name: "H₂S (ppm)",  color: "#059669", strokeWidth: 2 },
  { key: "co",  name: "CO (ppm)",   color: "#0284c7", strokeWidth: 2 },
  { key: "ch4", name: "CH₄ (%LEL)", color: "#d97706", strokeWidth: 2 },
] as const;

export function HistoryChart({ history }: { history: HistoryPoint[] }) {
  const isClient = useIsClient();
  const now = useNow(10_000);

  const data = isClient
    ? history
        .filter((p) => now - p.timestamp <= HISTORY_WINDOW_MS)
        .map((p) => ({ ...p, timeLabel: formatTime(p.timestamp) }))
    : [];

  return (
    <Panel
      title="Atmospheric Trend (2-Hour Window)"
      right={
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] text-[#787774]">60s resolution</span>
        </div>
      }
    >
      <div className="h-64 w-full pt-1">
        {isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#f0eeeb" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fill: "#b0aaa0", fontSize: 10, fontFamily: "monospace" }}
                tickLine={false}
                axisLine={{ stroke: "#eaeaea" }}
                minTickGap={45}
              />
              <YAxis
                tick={{ fill: "#b0aaa0", fontSize: 10, fontFamily: "monospace" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #eaeaea",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                  fontSize: 12,
                  color: "#111111",
                }}
                labelStyle={{ color: "#111111", fontFamily: "monospace", fontWeight: 700, marginBottom: 4 }}
                itemStyle={{ paddingTop: 2, paddingBottom: 2, fontSize: 11, fontFamily: "monospace" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 12, color: "#787774" }}
                iconType="circle"
              />
              <ReferenceLine
                y={10}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: "H₂S limit (10ppm)", fill: "#f43f5e", fontSize: 10, position: "right", fontWeight: 600 }}
              />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: s.color, stroke: "#ffffff", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#787774]">
            Initializing telemetry stream...
          </div>
        )}
      </div>
    </Panel>
  );
}
