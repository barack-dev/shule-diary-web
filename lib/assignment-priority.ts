import { isAssignmentDueSoon, isAssignmentOverdue } from "./assignment-filters.ts";
import type { AssignmentCardData, AssignmentStatus, KanbanColumnData } from "./types.ts";

export type AssignmentAttentionKind = "overdue" | "due-soon" | "needs-support";

export type AssignmentAttentionBadge = {
  kind: AssignmentAttentionKind;
  label: string;
  tone: "high" | "medium";
};

const NON_URGENT_STATUSES: ReadonlySet<AssignmentStatus> = new Set([
  "Submitted",
  "Reviewed",
  "Completed",
]);

function hasStatus(status: AssignmentStatus, expected: AssignmentStatus): boolean {
  return status === expected;
}

export function getAssignmentAttentionBadges(
  assignment: AssignmentCardData,
  now: Date = new Date(),
): AssignmentAttentionBadge[] {
  if (NON_URGENT_STATUSES.has(assignment.status)) {
    return [];
  }

  const badges: AssignmentAttentionBadge[] = [];
  const isOverdue =
    hasStatus(assignment.status, "Overdue") || isAssignmentOverdue(assignment, now);

  if (isOverdue) {
    badges.push({
      kind: "overdue",
      label: "Overdue",
      tone: "high",
    });
  }

  if (hasStatus(assignment.status, "Needs Support")) {
    badges.push({
      kind: "needs-support",
      label: "Needs Support",
      tone: "high",
    });
  }

  if (!isOverdue && isAssignmentDueSoon(assignment, now)) {
    badges.push({
      kind: "due-soon",
      label: "Due Soon",
      tone: "medium",
    });
  }

  return badges;
}

export function assignmentNeedsAttention(
  assignment: AssignmentCardData,
  now: Date = new Date(),
): boolean {
  return getAssignmentAttentionBadges(assignment, now).length > 0;
}

export function countAssignmentsNeedingAttention(
  columns: KanbanColumnData[],
  now: Date = new Date(),
): number {
  return columns.reduce((total, column) => {
    const needsAttentionInColumn = column.items.filter((assignment) =>
      assignmentNeedsAttention(assignment, now),
    ).length;

    return total + needsAttentionInColumn;
  }, 0);
}
