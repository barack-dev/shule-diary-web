import DashboardExperience from "../components/DashboardExperience";
import {
  buildTeacherSummaryMetrics,
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
    const columns = await getTeacherColumnsFromSupabase();
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

    return {
      teacherColumns,
      teacherMetrics: buildTeacherSummaryMetrics(teacherColumns),
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
    };
  }
}

export default async function Home() {
  const { teacherColumns, teacherMetrics } = await loadTeacherDashboardData();

  return (
    <DashboardExperience
      teacherMetrics={teacherMetrics}
      teacherColumns={teacherColumns}
      parentProfile={parentProfile}
      parentMetrics={parentSummaryMetrics}
      parentColumns={parentKanbanColumns}
    />
  );
}
