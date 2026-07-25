import { getAssignmentAttentionBadges } from "./assignment-priority.ts";
import type { DashboardRole, KanbanColumnData } from "./types";

export type DashboardActionItemTone = "rose" | "amber" | "sky" | "emerald";

export type DashboardActionItem = {
  id: string;
  label: string;
  value: number;
  helper: string;
  tone: DashboardActionItemTone;
};

function allAssignments(columns: KanbanColumnData[]) {
  return columns.flatMap((column) => column.items);
}

export function buildDashboardActionItems(
  columns: KanbanColumnData[],
  role: DashboardRole,
  now: Date = new Date(),
): DashboardActionItem[] {
  const assignments = allAssignments(columns);
  const overdue = assignments.filter((assignment) =>
    getAssignmentAttentionBadges(assignment, now).some((badge) => badge.kind === "overdue"),
  ).length;
  const dueSoon = assignments.filter((assignment) =>
    getAssignmentAttentionBadges(assignment, now).some((badge) => badge.kind === "due-soon"),
  ).length;

  if (role === "teacher") {
    const submitted = assignments.filter((assignment) => assignment.status === "Submitted").length;
    const needsSupport = assignments.filter(
      (assignment) => assignment.status === "Needs Support",
    ).length;
    const familyComments = assignments.reduce(
      (total, assignment) =>
        total +
        assignment.comments.filter((comment) => comment.authorRole === "Parent").length,
      0,
    );

    return [
      {
        id: "teacher-submitted",
        label: "To review",
        value: submitted,
        helper: "Submitted assignments waiting for teacher review.",
        tone: "sky",
      },
      {
        id: "teacher-support",
        label: "Needs support",
        value: needsSupport,
        helper: "Assignments already marked for extra help.",
        tone: "amber",
      },
      {
        id: "teacher-overdue",
        label: "Overdue",
        value: overdue,
        helper: "Open work past its due date.",
        tone: "rose",
      },
      {
        id: "teacher-comments",
        label: "Family comments",
        value: familyComments,
        helper: "Parent updates across visible assignments.",
        tone: "emerald",
      },
    ];
  }

  const toStart = assignments.filter(
    (assignment) => assignment.status === "Assigned" || assignment.status === "Seen by Parent",
  ).length;
  const activeWork = assignments.filter(
    (assignment) => assignment.status === "In Progress" || assignment.status === "Needs Support",
  ).length;

  return [
    {
      id: "parent-start",
      label: "To start",
      value: toStart,
      helper: "Assignments ready for the family to begin.",
      tone: "sky",
    },
    {
      id: "parent-active",
      label: "Active work",
      value: activeWork,
      helper: "Assignments currently being worked on.",
      tone: "amber",
    },
    {
      id: "parent-due-soon",
      label: "Due soon",
      value: dueSoon,
      helper: "Assignments due in the next few days.",
      tone: "emerald",
    },
    {
      id: "parent-overdue",
      label: "Overdue",
      value: overdue,
      helper: "Assignments that need quick attention.",
      tone: "rose",
    },
  ];
}
