"use client";

// ============================================================================
// History Chart — 2h H2S / CO / CH4 line chart (recharts)
// Mounted client-side only to avoid SSR/timezone hydration issues.
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
} from "recharts";
import { HISTORY_WINDOW_MS } from "@/lib/config";
import { formatTime } from "@/lib/format";
import type { HistoryPoint } from "@/lib/types";
import { Panel } from "./ui";

const SERIES = [
  { key: "h2s", name: "H₂S (ppm)", color: "#f87171" },
  { key: "co", name: "CO (ppm)", color: "#fbbf24" },
  { key: "ch4", name: "CH₄ (%LEL)", color: "#38bdf8" },
] as const;

export function HistoryChart({ history }: { history: HistoryPoint[] }) {
  const isClient = useIsClient();
  const now = useNow(10_000); // aging clock to prune old points, low frequency

  // Restrict to the trailing 2h window and shape labels once per point.
  const data = history
    .filter((p) => now - p.timestamp <= HISTORY_WINDOW_MS)
    .map((p) => ({
      ...p,
      timeLabel: formatTime(p.timestamp),
    }));

  return (
    <Panel
      title="2-Hour Gas History"
      right={
        <span className="text-[10px] text-zinc-500">
          sampled ~every minute · live
        </span>
      }
    >
      <div className="h-64 w-full">
        {isClient ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="timeLabel"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                minTickGap={48}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }}
                iconType="plainline"
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
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">
            Loading chart…
          </div>
        )}
      </div>
    </Panel>
  );
}
