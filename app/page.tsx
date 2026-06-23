import DashboardExperience from "../components/DashboardExperience";
import {
  kanbanColumns,
  parentKanbanColumns,
  parentProfile,
  parentSummaryMetrics,
  summaryMetrics,
} from "../lib/mock-data";

export default function Home() {
  return (
    <DashboardExperience
      teacherMetrics={summaryMetrics}
      teacherColumns={kanbanColumns}
      parentProfile={parentProfile}
      parentMetrics={parentSummaryMetrics}
      parentColumns={parentKanbanColumns}
    />
  );
}
