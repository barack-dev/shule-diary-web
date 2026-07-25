import { buildRecentActivity, type DashboardActivityItem } from "../lib/dashboard-activity";
import type { KanbanColumnData } from "../lib/types";

type Props = {
  columns: KanbanColumnData[];
  title?: string;
  emptyMessage?: string;
};

const ACTIVITY_BADGE_STYLES: Record<
  DashboardActivityItem["type"],
  { label: string; className: string }
> = {
  "assignment-created": {
    label: "Created",
    className: "bg-sky-100 text-sky-700",
  },
  comment: {
    label: "Comment",
    className: "bg-emerald-100 text-emerald-700",
  },
  "due-soon": {
    label: "Due soon",
    className: "bg-amber-100 text-amber-700",
  },
  overdue: {
    label: "Overdue",
    className: "bg-rose-100 text-rose-700",
  },
};

export default function RecentActivityPanel({
  columns,
  title = "Recent Activity",
  emptyMessage = "No recent activity yet. New assignments, comments, and due-date updates will appear here.",
}: Props) {
  const activityItems = buildRecentActivity(columns);

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
          {title}
        </h4>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {activityItems.length}
        </span>
      </div>

      {activityItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          {emptyMessage}
        </div>
      ) : (
        <ul className="space-y-2">
          {activityItems.map((item) => {
            const badgeStyle = ACTIVITY_BADGE_STYLES[item.type];

            return (
              <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="truncate text-sm text-slate-600">{item.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${badgeStyle.className}`}
                  >
                    {badgeStyle.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
