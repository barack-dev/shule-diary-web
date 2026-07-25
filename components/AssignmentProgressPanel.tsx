import { buildAssignmentProgressSummary } from "../lib/assignment-progress";
import type { KanbanColumnData } from "../lib/types";

type Props = {
  columns: KanbanColumnData[];
};

export default function AssignmentProgressPanel({ columns }: Props) {
  const summary = buildAssignmentProgressSummary(columns);

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
            Progress Summary
          </h4>
          <p className="mt-1 text-sm text-slate-600">
            {summary.finished} of {summary.total} assignments are submitted, reviewed, or complete.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
          {summary.completionPercentage}% progressed
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${summary.completionPercentage}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {summary.steps.map((step) => (
          <div key={step.status} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-slate-700">{step.label}</p>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                {step.count}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-slate-500"
                style={{ width: `${step.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
