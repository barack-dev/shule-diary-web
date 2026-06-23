"use client";

import { useState } from "react";
import type {
  DashboardRole,
  KanbanColumnData,
  ParentProfile,
  ParentSummaryMetric,
  SummaryMetric,
} from "../lib/types";
import DashboardHeader from "./DashboardHeader";
import KanbanBoard from "./KanbanBoard";
import ParentDashboard from "./ParentDashboard";
import RoleSwitcher from "./RoleSwitcher";
import Sidebar from "./Sidebar";
import SummaryCard from "./SummaryCard";

type Props = {
  teacherMetrics: SummaryMetric[];
  teacherColumns: KanbanColumnData[];
  parentProfile: ParentProfile;
  parentMetrics: ParentSummaryMetric[];
  parentColumns: KanbanColumnData[];
};

export default function DashboardExperience({
  teacherMetrics,
  teacherColumns,
  parentProfile,
  parentMetrics,
  parentColumns,
}: Props) {
  const [role, setRole] = useState<DashboardRole>("teacher");
  const isParentView = role === "parent";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar role={role} />

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <DashboardHeader
            title={isParentView ? "My Child's Homework" : "Teacher Dashboard"}
            subtitle={
              isParentView
                ? "Track homework, teacher feedback, and learning progress"
                : "Track homework, parent comments, and student progress"
            }
          >
            <RoleSwitcher role={role} onRoleChange={setRole} />
          </DashboardHeader>

          {isParentView ? (
            <ParentDashboard
              profile={parentProfile}
              metrics={parentMetrics}
              columns={parentColumns}
            />
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {teacherMetrics.map((metric) => (
                  <SummaryCard key={metric.label} metric={metric} />
                ))}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <KanbanBoard columns={teacherColumns} />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
