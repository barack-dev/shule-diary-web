import DashboardExperience from "../components/DashboardExperience";
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
  const {
    teacherColumns,
    teacherMetrics,
    parentColumns,
    dashboardContext,
    parentProfile: resolvedParentProfile,
    parentMetrics: resolvedParentMetrics,
  } = await loadTeacherDashboardData();

  return (
    <DashboardExperience
      dashboardContext={dashboardContext}
      teacherMetrics={teacherMetrics}
      teacherColumns={teacherColumns}
      parentProfile={resolvedParentProfile}
      parentMetrics={resolvedParentMetrics}
      parentColumns={parentColumns}
    />
  );
}
