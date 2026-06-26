import DashboardExperience from "../../components/DashboardExperience";
import LogoutButton from "../../components/LogoutButton";
import { redirect } from "next/navigation";
import { getDashboardRouteDecision } from "../../lib/auth-routing";
import { createDashboardLoadError, type DashboardLoadError } from "../../lib/dashboard-errors";
import {
  buildParentSummaryMetrics,
  buildTeacherSummaryMetrics,
  getDashboardContextFromSupabase,
  getEmptyTeacherColumns,
  getTeacherColumnsFromSupabase,
} from "../../lib/dashboard-assignments";
import { getAuthProfileResult } from "../../lib/supabase/auth-profile";
import type {
  DashboardDirectoryData,
  DashboardRole,
  KanbanColumnData,
  ParentProfile,
  ParentSummaryMetric,
  SummaryMetric,
} from "../../lib/types";

export const dynamic = "force-dynamic";

const isDevelopment = process.env.NODE_ENV === "development";

const FALLBACK_PARENT_PROFILE: ParentProfile = {
  childName: "Student",
  grade: "Not set",
  className: "Class not set",
  classTeacher: "Teacher",
};

type DashboardLoadSuccess = {
  status: "ready";
  teacherColumns: KanbanColumnData[];
  teacherMetrics: SummaryMetric[];
  parentColumns: KanbanColumnData[];
  dashboardContext: DashboardDirectoryData;
  parentProfile: ParentProfile;
  parentMetrics: ParentSummaryMetric[];
};

type DashboardLoadResult =
  | DashboardLoadSuccess
  | {
      status: "error";
      error: DashboardLoadError;
    };

async function loadTeacherDashboardData(authenticatedProfile: {
  id: string;
  authUserId: string;
  role: DashboardRole;
}): Promise<DashboardLoadResult> {
  try {
    const viewer = {
      profileId: authenticatedProfile.id,
      authUserId: authenticatedProfile.authUserId,
      role: authenticatedProfile.role,
    };
    const dashboardContext = await getDashboardContextFromSupabase(viewer);
    const columns = await getTeacherColumnsFromSupabase({
      studentName: dashboardContext.studentName ?? undefined,
      teacherName: dashboardContext.teacherName ?? undefined,
      parentName: dashboardContext.parentName ?? undefined,
    }, viewer);
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
      ...FALLBACK_PARENT_PROFILE,
      childName: dashboardContext.studentName ?? FALLBACK_PARENT_PROFILE.childName,
      className: dashboardContext.className ?? FALLBACK_PARENT_PROFILE.className,
      classTeacher:
        dashboardContext.teacherName ?? FALLBACK_PARENT_PROFILE.classTeacher,
    };

    const resolvedParentMetrics = buildParentSummaryMetrics(teacherColumns, {
      studentName: dashboardContext.studentName ?? undefined,
      milestoneCount: dashboardContext.milestoneCount,
      milestoneTitle: dashboardContext.milestoneTitle,
    });

    return {
      status: "ready",
      teacherColumns,
      teacherMetrics: buildTeacherSummaryMetrics(teacherColumns),
      parentColumns: teacherColumns,
      dashboardContext,
      parentProfile: resolvedParentProfile,
      parentMetrics: resolvedParentMetrics,
    };
  } catch (error) {
    const dashboardError = createDashboardLoadError(error);
    console.error(
      "[ShuleDiary] Unable to load dashboard assignments from Supabase.",
      dashboardError.developerMessage,
    );
    return {
      status: "error",
      error: dashboardError,
    };
  }
}

function DashboardDataErrorState({ error }: { error: DashboardLoadError }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            ShuleDiary
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-amber-950">
            Dashboard data is unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            {error.userMessage}
          </p>
          {isDevelopment ? (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-white/70 px-3 py-2 text-xs leading-5 text-amber-900">
              Developer detail: {error.developerMessage}
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

export default async function DashboardPage() {
  const authResult = await getAuthProfileResult();
  const decision = getDashboardRouteDecision(authResult);

  if (decision.type === "redirect") {
    redirect(decision.destination);
  }

  if (authResult.status === "error") {
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

  if (authResult.status !== "authenticated") {
    redirect("/login");
  }

  const authenticatedProfile = authResult.profile;

  const dashboardData = await loadTeacherDashboardData(authenticatedProfile);

  if (dashboardData.status === "error") {
    return <DashboardDataErrorState error={dashboardData.error} />;
  }

  const allowedRoles: DashboardRole[] = [authenticatedProfile.role];

  return (
    <DashboardExperience
      initialRole={authenticatedProfile.role}
      allowedRoles={allowedRoles}
      signedInName={authenticatedProfile.fullName}
      dashboardContext={dashboardData.dashboardContext}
      teacherMetrics={dashboardData.teacherMetrics}
      teacherColumns={dashboardData.teacherColumns}
      parentProfile={dashboardData.parentProfile}
      parentMetrics={dashboardData.parentMetrics}
      parentColumns={dashboardData.parentColumns}
    />
  );
}
