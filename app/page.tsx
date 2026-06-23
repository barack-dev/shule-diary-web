import DashboardExperience from "../components/DashboardExperience";
import {
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

async function loadTeacherColumns() {
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
    return hasAssignments ? columns : getEmptyTeacherColumns();
  } catch (error) {
    if (isDevelopment) {
      console.warn(
        "[ShuleDiary] Falling back to mock dashboard assignments due to Supabase load error.",
      );
    }
    console.error("Unable to load dashboard assignments from Supabase.", error);
    return kanbanColumns;
  }
}

export default async function Home() {
  const teacherColumns = await loadTeacherColumns();

  return (
    <DashboardExperience
      teacherMetrics={summaryMetrics}
      teacherColumns={teacherColumns}
      parentProfile={parentProfile}
      parentMetrics={parentSummaryMetrics}
      parentColumns={parentKanbanColumns}
    />
  );
}
