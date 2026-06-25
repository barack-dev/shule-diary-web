import type { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  contextLine?: string;
  children?: ReactNode;
};

export default function DashboardHeader({
  title = "Teacher Dashboard",
  subtitle = "Track homework, parent comments, and student progress",
  contextLine,
  children,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          <h2 className="mt-2 max-w-3xl text-3xl font-semibold text-slate-950">
            {subtitle}
          </h2>
          {contextLine ? (
            <p className="mt-2 text-sm text-slate-600">{contextLine}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {children}
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
            Updated today
          </div>
        </div>
      </div>
    </section>
  );
}
