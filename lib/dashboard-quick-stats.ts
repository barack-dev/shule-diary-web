import { getAssignmentAttentionBadges } from "./assignment-priority.ts";
import type { AssignmentCardData, KanbanColumnData } from "./types.ts";

export type DashboardQuickStatTone = "rose" | "amber" | "sky" | "emerald";

export type DashboardQuickStat = {
  key: "overdue" | "due-soon" | "needs-support" | "completed";
  label: string;
  value: string;
  helper: string;
  tone: DashboardQuickStatTone;
};

function getAssignments(columns: KanbanColumnData[]): AssignmentCardData[] {
  return columns.flatMap((column) => column.items);
}

function hasAttentionKind(
  assignment: AssignmentCardData,
  kind: "overdue" | "due-soon" | "needs-support",
  now: Date,
): boolean {
  return getAssignmentAttentionBadges(assignment, now).some((badge) => badge.kind === kind);
}

export function buildDashboardQuickStats(
  columns: KanbanColumnData[],
  now: Date = new Date(),
): DashboardQuickStat[] {
  const assignments = getAssignments(columns);
  const overdueCount = assignments.filter((assignment) =>
    hasAttentionKind(assignment, "overdue", now),
  ).length;
  const dueSoonCount = assignments.filter((assignment) =>
    hasAttentionKind(assignment, "due-soon", now),
  ).length;
  const needsSupportCount = assignments.filter((assignment) =>
    hasAttentionKind(assignment, "needs-support", now),
  ).length;
  const completedCount = assignments.filter(
    (assignment) => assignment.status === "Completed",
  ).length;

  return [
    {
      key: "overdue",
      label: "Overdue",
      value: String(overdueCount),
      helper: "Past due and still open",
      tone: "rose",
    },
    {
      key: "due-soon",
      label: "Due Soon",
      value: String(dueSoonCount),
      helper: "Due in the next 3 days",
      tone: "amber",
    },
    {
      key: "needs-support",
      label: "Needs Support",
      value: String(needsSupportCount),
      helper: "Requires teacher or family attention",
      tone: "sky",
    },
    {
      key: "completed",
      label: "Completed",
      value: String(completedCount),
      helper: "Marked fully complete",
      tone: "emerald",
    },
  ];
}
