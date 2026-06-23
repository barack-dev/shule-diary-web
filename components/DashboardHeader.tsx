import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
};

export default function DashboardHeader({
  title = "Teacher Dashboard",
  subtitle = "Track homework, parent comments, and student progress",
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">{title}</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">{subtitle}</h2>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Updated today</div>
      </div>
    </section>
  );
}
