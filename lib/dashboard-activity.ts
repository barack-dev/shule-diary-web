import { isAssignmentDueSoon, isAssignmentOverdue } from "./assignment-filters.ts";
import type { AssignmentCardData, AssignmentComment, KanbanColumnData } from "./types";

export type DashboardActivityType =
  | "assignment-created"
  | "comment"
  | "due-soon"
  | "overdue";

export type DashboardActivityItem = {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  meta: string;
  timestamp: number | null;
};

type AssignmentCommentContext = {
  assignment: AssignmentCardData;
  comment: AssignmentComment;
  timestamp: number | null;
};

const MAX_RECENT_ITEMS_PER_GROUP = 2;

function parseDateValue(value: string | null | undefined): Date | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function parseAssignmentDueDate(assignment: AssignmentCardData): Date | null {
  if (assignment.dueDateRaw) {
    const parsedRawDate = new Date(`${assignment.dueDateRaw}T00:00:00`);
    if (!Number.isNaN(parsedRawDate.getTime())) {
      return parsedRawDate;
    }
  }

  return parseDateValue(assignment.due);
}

function parseAssignmentCreatedAt(assignment: AssignmentCardData): Date | null {
  return parseDateValue(assignment.createdAtRaw);
}

function parseCommentCreatedAt(comment: AssignmentComment): Date | null {
  const rawDate = parseDateValue(comment.createdAtRaw);
  if (rawDate) {
    return rawDate;
  }
  return parseDateValue(comment.createdAt);
}

function formatActivityTimestamp(value: string | null | undefined): string | null {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return null;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function byTimestampDescending<T extends { timestamp: number | null }>(left: T, right: T): number {
  const leftValue = left.timestamp ?? Number.NEGATIVE_INFINITY;
  const rightValue = right.timestamp ?? Number.NEGATIVE_INFINITY;
  return rightValue - leftValue;
}

function getAllAssignments(columns: KanbanColumnData[]): AssignmentCardData[] {
  return columns.flatMap((column) => column.items);
}

function buildRecentCommentActivities(assignments: AssignmentCardData[]): DashboardActivityItem[] {
  const recentComments = assignments
    .flatMap<AssignmentCommentContext>((assignment) =>
      assignment.comments.map((comment) => {
        const parsedCreatedAt = parseCommentCreatedAt(comment);
        return {
          assignment,
          comment,
          timestamp: parsedCreatedAt ? parsedCreatedAt.getTime() : null,
        };
      }),
    )
    .sort(byTimestampDescending)
    .slice(0, MAX_RECENT_ITEMS_PER_GROUP);

  return recentComments.map(({ assignment, comment, timestamp }) => {
    const preview = comment.message.length > 72
      ? `${comment.message.slice(0, 69)}...`
      : comment.message;

    return {
      id: `comment:${comment.id}`,
      type: "comment",
      title: `${comment.authorName} commented`,
      description: `${assignment.title} · ${preview}`,
      meta: comment.createdAt || "New comment",
      timestamp,
    };
  });
}

function buildRecentCreatedAssignmentActivities(
  assignments: AssignmentCardData[],
): DashboardActivityItem[] {
  return assignments
    .map((assignment) => {
      const createdAt = parseAssignmentCreatedAt(assignment);
      return {
        assignment,
        createdAt,
        timestamp: createdAt ? createdAt.getTime() : null,
      };
    })
    .filter((entry) => entry.createdAt)
    .sort(byTimestampDescending)
    .slice(0, MAX_RECENT_ITEMS_PER_GROUP)
    .map(({ assignment, timestamp }) => {
      const createdLabel = formatActivityTimestamp(assignment.createdAtRaw) ?? "recently";

      return {
        id: `created:${assignment.id ?? assignment.title}`,
        type: "assignment-created",
        title: `New assignment: ${assignment.title}`,
        description: `${assignment.subject} · ${assignment.student}`,
        meta: `Created ${createdLabel}`,
        timestamp,
      };
    });
}

function buildDueSoonActivities(
  assignments: AssignmentCardData[],
  now: Date,
): DashboardActivityItem[] {
  return assignments
    .filter((assignment) => isAssignmentDueSoon(assignment, now))
    .map((assignment) => ({
      assignment,
      dueDate: parseAssignmentDueDate(assignment),
    }))
    .sort((left, right) => {
      const leftValue = left.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
      const rightValue = right.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
      return leftValue - rightValue;
    })
    .slice(0, MAX_RECENT_ITEMS_PER_GROUP)
    .map(({ assignment, dueDate }) => ({
      id: `due-soon:${assignment.id ?? assignment.title}`,
      type: "due-soon",
      title: `Due soon: ${assignment.title}`,
      description: `${assignment.subject} · ${assignment.student}`,
      meta: `Due ${assignment.due}`,
      timestamp: dueDate ? dueDate.getTime() : null,
    }));
}

function buildOverdueActivities(
  assignments: AssignmentCardData[],
  now: Date,
): DashboardActivityItem[] {
  return assignments
    .filter((assignment) => isAssignmentOverdue(assignment, now))
    .map((assignment) => ({
      assignment,
      dueDate: parseAssignmentDueDate(assignment),
    }))
    .sort((left, right) => {
      const leftValue = left.dueDate?.getTime() ?? Number.NEGATIVE_INFINITY;
      const rightValue = right.dueDate?.getTime() ?? Number.NEGATIVE_INFINITY;
      return rightValue - leftValue;
    })
    .slice(0, MAX_RECENT_ITEMS_PER_GROUP)
    .map(({ assignment, dueDate }) => ({
      id: `overdue:${assignment.id ?? assignment.title}`,
      type: "overdue",
      title: `Overdue: ${assignment.title}`,
      description: `${assignment.subject} · ${assignment.student}`,
      meta: `Due ${assignment.due}`,
      timestamp: dueDate ? dueDate.getTime() : null,
    }));
}

export function buildRecentActivity(
  columns: KanbanColumnData[],
  now: Date = new Date(),
): DashboardActivityItem[] {
  const assignments = getAllAssignments(columns);

  const commentActivities = buildRecentCommentActivities(assignments);
  const createdActivities = buildRecentCreatedAssignmentActivities(assignments);
  const dueSoonActivities = buildDueSoonActivities(assignments, now);
  const overdueActivities = buildOverdueActivities(assignments, now);

  return [
    ...commentActivities,
    ...createdActivities,
    ...dueSoonActivities,
    ...overdueActivities,
  ];
}
