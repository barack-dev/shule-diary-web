import { buildDashboardActionItems } from "../lib/dashboard-action-items";
import type { DashboardRole, KanbanColumnData } from "../lib/types";

type Props = {
  columns: KanbanColumnData[];
  role: DashboardRole;
};

const TONE_CLASSES = {
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  amber: "border-amber-100 bg-amber-50 text-amber-800",
  sky: "border-sky-100 bg-sky-50 text-sky-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
} as const;

export default function AssignmentActionItemsPanel({ columns, role }: Props) {
  const items = buildDashboardActionItems(columns, role);

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Action items
          </h4>
          <p className="mt-1 text-sm text-slate-600">
            {role === "teacher"
              ? "Review submitted work and support students who are stuck."
              : "Keep homework moving toward teacher review."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-3 ${TONE_CLASSES[item.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{item.label}</p>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                {item.value}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 opacity-90">{item.helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
