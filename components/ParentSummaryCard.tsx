import type { ParentSummaryMetric, ParentSummaryTone } from "../lib/types";

const toneStyles: Record<
  ParentSummaryTone,
  { dot: string; panel: string; value: string }
> = {
  amber: {
    dot: "bg-amber-500",
    panel: "bg-amber-50",
    value: "text-amber-950",
  },
  rose: {
    dot: "bg-rose-500",
    panel: "bg-rose-50",
    value: "text-rose-950",
  },
  sky: {
    dot: "bg-sky-500",
    panel: "bg-sky-50",
    value: "text-sky-950",
  },
  emerald: {
    dot: "bg-emerald-500",
    panel: "bg-emerald-50",
    value: "text-emerald-950",
  },
};

export default function ParentSummaryCard({
  metric,
}: {
  metric: ParentSummaryMetric;
}) {
  const tone = toneStyles[metric.tone];

  return (
    <article className={`rounded-3xl border border-slate-200 p-5 shadow-sm ${tone.panel}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600">{metric.label}</p>
      </div>
      <p className={`mt-4 text-3xl font-semibold ${tone.value}`}>{metric.value}</p>
      <p className="mt-1 text-sm text-slate-500">{metric.helper}</p>
    </article>
  );
}
