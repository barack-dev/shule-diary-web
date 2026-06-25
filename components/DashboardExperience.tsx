"use client";

import { useState } from "react";
import type {
  DashboardDirectoryData,
  DashboardRole,
  KanbanColumnData,
  ParentProfile,
  ParentSummaryMetric,
  SummaryMetric,
} from "../lib/types";
import DashboardHeader from "./DashboardHeader";
import KanbanBoard from "./KanbanBoard";
import LogoutButton from "./LogoutButton";
import ParentDashboard from "./ParentDashboard";
import RoleSwitcher from "./RoleSwitcher";
import Sidebar from "./Sidebar";
import SummaryCard from "./SummaryCard";

type Props = {
  initialRole: DashboardRole;
  allowedRoles?: DashboardRole[];
  signedInName?: string;
  dashboardContext: DashboardDirectoryData;
  teacherMetrics: SummaryMetric[];
  teacherColumns: KanbanColumnData[];
  parentProfile: ParentProfile;
  parentMetrics: ParentSummaryMetric[];
  parentColumns: KanbanColumnData[];
};

export default function DashboardExperience({
  initialRole,
  allowedRoles = ["teacher", "parent"],
  signedInName,
  dashboardContext,
  teacherMetrics,
  teacherColumns,
  parentProfile,
  parentMetrics,
  parentColumns,
}: Props) {
  const [role, setRole] = useState<DashboardRole>(initialRole);
  const roleIsAllowed = allowedRoles.includes(role);
  const activeRole = roleIsAllowed ? role : initialRole;
  const canSwitchRole = allowedRoles.length > 1;
  const handleRoleChange = (nextRole: DashboardRole) => {
    if (!allowedRoles.includes(nextRole)) {
      return;
    }
    setRole(nextRole);
  };
  const isParentView = activeRole === "parent";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar role={activeRole} />

        <main className="flex min-w-0 flex-1 flex-col gap-6">
          <DashboardHeader
            title={isParentView ? "My Child's Homework" : "Teacher Dashboard"}
            subtitle={
              isParentView
                ? "Track homework, teacher feedback, and learning progress"
                : "Track homework, parent comments, and student progress"
            }
            contextLine={
              isParentView
                ? dashboardContext.schoolName ?? undefined
                : [dashboardContext.schoolName, dashboardContext.teacherName]
                    .filter((value) => Boolean(value))
                    .join(" · ")
            }
          >
            {canSwitchRole ? (
              <RoleSwitcher role={activeRole} onRoleChange={handleRoleChange} />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {activeRole === "teacher" ? "Teacher View" : "Parent View"}
              </div>
            )}
            {signedInName ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                Signed in as <span className="font-semibold text-slate-900">{signedInName}</span>
              </div>
            ) : null}
            <LogoutButton />
          </DashboardHeader>

          {isParentView ? (
            <ParentDashboard
              profile={parentProfile}
              metrics={parentMetrics}
              columns={parentColumns}
              parentName={dashboardContext.parentName ?? undefined}
            />
          ) : (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {teacherMetrics.map((metric) => (
                  <SummaryCard key={metric.label} metric={metric} />
                ))}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <KanbanBoard
                  columns={teacherColumns}
                  commentAuthor={{
                    name: dashboardContext.teacherName ?? "Teacher",
                    role: "Teacher",
                  }}
                />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
