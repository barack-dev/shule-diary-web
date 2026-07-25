import {
  buildDashboardQuickStats,
  type DashboardQuickStatTone,
} from "../lib/dashboard-quick-stats";
import type { KanbanColumnData } from "../lib/types";

type Props = {
  columns: KanbanColumnData[];
};

const STAT_TONE_CLASSES: Record<DashboardQuickStatTone, string> = {
  rose: "border-rose-200 bg-rose-50 text-rose-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  sky: "border-sky-200 bg-sky-50 text-sky-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export default function AssignmentQuickStatsPanel({ columns }: Props) {
  const stats = buildDashboardQuickStats(columns);

  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.key}
          className={`rounded-2xl border px-4 py-3 ${STAT_TONE_CLASSES[stat.tone]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                {stat.label}
              </p>
              <p className="mt-1 text-xs opacity-80">{stat.helper}</p>
            </div>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
