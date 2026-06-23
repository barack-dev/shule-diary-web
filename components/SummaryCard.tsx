import React from "react";
import type { SummaryMetric } from "../lib/types";

export default function SummaryCard({ metric }: { metric: SummaryMetric }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{metric.label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{metric.value}</p>
    </div>
  );
}
