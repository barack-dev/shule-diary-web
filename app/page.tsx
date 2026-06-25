import DashboardExperience from "../components/DashboardExperience";
import LogoutButton from "../components/LogoutButton";
import { redirect } from "next/navigation";
import {
  buildParentSummaryMetrics,
  buildTeacherSummaryMetrics,
  getDashboardContextFromSupabase,
  getEmptyTeacherColumns,
  getTeacherColumnsFromSupabase,
} from "../lib/dashboard-assignments";
import {
  kanbanColumns,
  parentKanbanColumns,
  parentProfile,
  parentSummaryMetrics,
  summaryMetrics,
} from "../lib/mock-data";
import { getAuthProfileResult } from "../lib/supabase/auth-profile";
import type { DashboardRole } from "../lib/types";

export const dynamic = "force-dynamic";

const isDevelopment = process.env.NODE_ENV === "development";

async function loadTeacherDashboardData() {
  try {
    const dashboardContext = await getDashboardContextFromSupabase();
    const columns = await getTeacherColumnsFromSupabase({
      studentName: dashboardContext.studentName ?? undefined,
      teacherName: dashboardContext.teacherName ?? undefined,
      parentName: dashboardContext.parentName ?? undefined,
    });
    if (isDevelopment) {
      const loadedAssignments = columns.reduce(
        (total, column) => total + column.items.length,
        0,
      );
      console.log(
        `[ShuleDiary] Loaded ${loadedAssignments} Supabase assignment(s) for dashboard.`,
      );
    }
    const hasAssignments = columns.some((column) => column.items.length > 0);
    const teacherColumns = hasAssignments ? columns : getEmptyTeacherColumns();
    const resolvedParentProfile = {
      ...parentProfile,
      childName: dashboardContext.studentName ?? parentProfile.childName,
      className: dashboardContext.className ?? parentProfile.className,
      classTeacher: dashboardContext.teacherName ?? parentProfile.classTeacher,
    };

    const resolvedParentMetrics = buildParentSummaryMetrics(teacherColumns, {
      studentName: dashboardContext.studentName ?? undefined,
      milestoneCount: dashboardContext.milestoneCount,
      milestoneTitle: dashboardContext.milestoneTitle,
    });

    return {
      teacherColumns,
      teacherMetrics: buildTeacherSummaryMetrics(teacherColumns),
      parentColumns: teacherColumns,
      dashboardContext,
      parentProfile: resolvedParentProfile,
      parentMetrics: resolvedParentMetrics,
    };
  } catch (error) {
    if (isDevelopment) {
      console.warn(
        "[ShuleDiary] Falling back to mock dashboard assignments due to Supabase load error.",
      );
    }
    console.error("Unable to load dashboard assignments from Supabase.", error);

    return {
      teacherColumns: kanbanColumns,
      teacherMetrics: summaryMetrics,
      parentColumns: parentKanbanColumns,
      dashboardContext: {
        schoolName: null,
        teacherName: null,
        parentName: null,
        studentName: null,
        className: null,
        milestoneTitle: null,
        milestoneCount: null,
      },
      parentProfile,
      parentMetrics: parentSummaryMetrics,
    };
  }
}

export default async function Home() {
  const authResult = await getAuthProfileResult();

  if (authResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (authResult.status === "missing-profile" || authResult.status === "error") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              ShuleDiary
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-amber-950">
              Unable to open dashboard profile
            </h1>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              {authResult.message}
            </p>
            {authResult.userEmail ? (
              <p className="mt-2 text-sm text-amber-900">
                Signed in as <span className="font-semibold">{authResult.userEmail}</span>
              </p>
            ) : null}
            <div className="mt-6">
              <LogoutButton />
            </div>
          </section>
        </div>
      </main>
    );
  }

  const authenticatedProfile = authResult.profile;

  const {
    teacherColumns,
    teacherMetrics,
    parentColumns,
    dashboardContext,
    parentProfile: resolvedParentProfile,
    parentMetrics: resolvedParentMetrics,
  } = await loadTeacherDashboardData();

  const allowedRoles: DashboardRole[] = [authenticatedProfile.role];

  return (
    <DashboardExperience
      initialRole={authenticatedProfile.role}
      allowedRoles={allowedRoles}
      signedInName={authenticatedProfile.fullName}
      dashboardContext={dashboardContext}
      teacherMetrics={teacherMetrics}
      teacherColumns={teacherColumns}
      parentProfile={resolvedParentProfile}
      parentMetrics={resolvedParentMetrics}
      parentColumns={parentColumns}
    />
  );
}
