import type { AssignmentStatus, KanbanColumnData } from "./types.ts";

export type AssignmentProgressStep = {
  status: AssignmentStatus;
  label: string;
  count: number;
  percentage: number;
};

export type AssignmentProgressSummary = {
  total: number;
  active: number;
  finished: number;
  completionPercentage: number;
  steps: AssignmentProgressStep[];
};

const PROGRESS_STATUSES: AssignmentStatus[] = [
  "Assigned",
  "Seen by Parent",
  "In Progress",
  "Submitted",
  "Reviewed",
  "Completed",
];

const FINISHED_STATUSES: ReadonlySet<AssignmentStatus> = new Set([
  "Submitted",
  "Reviewed",
  "Completed",
]);

function percentage(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

export function buildAssignmentProgressSummary(
  columns: KanbanColumnData[],
): AssignmentProgressSummary {
  const assignments = columns.flatMap((column) => column.items);
  const total = assignments.length;
  const finished = assignments.filter((assignment) =>
    FINISHED_STATUSES.has(assignment.status),
  ).length;
  const active = Math.max(0, total - finished);

  const steps = PROGRESS_STATUSES.map((status) => {
    const count = assignments.filter((assignment) => assignment.status === status).length;

    return {
      status,
      label: status,
      count,
      percentage: percentage(count, total),
    };
  });

  return {
    total,
    active,
    finished,
    completionPercentage: percentage(finished, total),
    steps,
  };
}
