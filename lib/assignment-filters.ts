import type { AssignmentCardData, AssignmentStatus, KanbanColumnData } from "./types";

export type AssignmentDueDateGroup = "all" | "due-soon" | "overdue";

export type AssignmentFilters = {
  query: string;
  status: AssignmentStatus | "all";
  subject: string | "all";
  dueDateGroup: AssignmentDueDateGroup;
};

const COMPLETED_STATUSES: ReadonlySet<AssignmentStatus> = new Set([
  "Submitted",
  "Reviewed",
  "Completed",
]);

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function parseAssignmentDueDate(assignment: AssignmentCardData): Date | null {
  if (assignment.dueDateRaw) {
    const parsedRawDate = new Date(`${assignment.dueDateRaw}T00:00:00`);
    if (!Number.isNaN(parsedRawDate.getTime())) {
      return parsedRawDate;
    }
  }

  const fallbackParsedDate = new Date(assignment.due);
  if (!Number.isNaN(fallbackParsedDate.getTime())) {
    return fallbackParsedDate;
  }

  return null;
}

function getStartOfToday(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function isAssignmentDueSoon(
  assignment: AssignmentCardData,
  now: Date = new Date(),
): boolean {
  if (COMPLETED_STATUSES.has(assignment.status)) {
    return false;
  }

  const dueDate = parseAssignmentDueDate(assignment);
  if (!dueDate) {
    return false;
  }

  const startOfToday = getStartOfToday(now);
  const dueSoonThreshold = new Date(startOfToday);
  dueSoonThreshold.setDate(dueSoonThreshold.getDate() + 3);

  return dueDate >= startOfToday && dueDate <= dueSoonThreshold;
}

export function isAssignmentOverdue(
  assignment: AssignmentCardData,
  now: Date = new Date(),
): boolean {
  if (COMPLETED_STATUSES.has(assignment.status)) {
    return false;
  }

  const dueDate = parseAssignmentDueDate(assignment);
  if (!dueDate) {
    return false;
  }

  const startOfToday = getStartOfToday(now);
  return dueDate < startOfToday;
}

export function matchesAssignmentFilters(
  assignment: AssignmentCardData,
  filters: AssignmentFilters,
  now: Date = new Date(),
): boolean {
  const normalizedQuery = normalizeSearchText(filters.query);
  if (normalizedQuery) {
    const searchableText = [
      assignment.title,
      assignment.subject,
      assignment.student,
      assignment.description,
    ]
      .join(" ")
      .toLowerCase();

    if (!searchableText.includes(normalizedQuery)) {
      return false;
    }
  }

  if (filters.status !== "all" && assignment.status !== filters.status) {
    return false;
  }

  if (filters.subject !== "all" && assignment.subject !== filters.subject) {
    return false;
  }

  if (filters.dueDateGroup === "due-soon") {
    return isAssignmentDueSoon(assignment, now);
  }

  if (filters.dueDateGroup === "overdue") {
    return isAssignmentOverdue(assignment, now);
  }

  return true;
}

export function filterKanbanColumns(
  columns: KanbanColumnData[],
  filters: AssignmentFilters,
  now: Date = new Date(),
): KanbanColumnData[] {
  return columns.map((column) => ({
    ...column,
    items: column.items.filter((assignment) =>
      matchesAssignmentFilters(assignment, filters, now),
    ),
  }));
}

export function countKanbanAssignments(columns: KanbanColumnData[]): number {
  return columns.reduce((total, column) => total + column.items.length, 0);
}
