"use client";

import dynamic from "next/dynamic";

// Import the entire dashboard client-only — eliminates all SSR/hydration
// mismatches from time-dependent renders (timestamps, sensor values, etc.)
const Dashboard = dynamic(
  () => import("@/components/Dashboard").then((m) => m.Dashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f6f3] text-xs text-[#787774]">
        Loading VENUS...
      </div>
    ),
  }
);

export default function Home() {
  return <Dashboard />;
}
