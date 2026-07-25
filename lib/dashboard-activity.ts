import { isAssignmentDueSoon, isAssignmentOverdue } from "./assignment-filters.ts";
import { getAssignmentDueDate } from "./assignment-dates.ts";
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
const MAX_ACTIVITY_ITEMS = 6;

type DashboardActivityCandidate = DashboardActivityItem & {
  assignmentKey: string;
  sortTimestamp: number | null;
};

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

function byActivitySortTimestampDescending(
  left: DashboardActivityCandidate,
  right: DashboardActivityCandidate,
): number {
  const leftValue = left.sortTimestamp ?? Number.NEGATIVE_INFINITY;
  const rightValue = right.sortTimestamp ?? Number.NEGATIVE_INFINITY;
  return rightValue - leftValue;
}

function getAssignmentActivityKey(assignment: AssignmentCardData): string {
  return (
    assignment.assignmentStudentId?.trim() ||
    assignment.id?.trim() ||
    `${assignment.title.trim().toLowerCase()}:${assignment.student.trim().toLowerCase()}`
  );
}

function toActivityItem(candidate: DashboardActivityCandidate): DashboardActivityItem {
  return {
    id: candidate.id,
    type: candidate.type,
    title: candidate.title,
    description: candidate.description,
    meta: candidate.meta,
    timestamp: candidate.timestamp,
  };
}

function compactActivityItems(
  candidates: DashboardActivityCandidate[],
): DashboardActivityItem[] {
  const seenAssignmentKeys = new Set<string>();

  return candidates
    .sort(byActivitySortTimestampDescending)
    .filter((candidate) => {
      if (seenAssignmentKeys.has(candidate.assignmentKey)) {
        return false;
      }

      seenAssignmentKeys.add(candidate.assignmentKey);
      return true;
    })
    .slice(0, MAX_ACTIVITY_ITEMS)
    .map(toActivityItem);
}

function buildRecentCommentActivities(assignments: AssignmentCardData[]): DashboardActivityCandidate[] {
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
      assignmentKey: getAssignmentActivityKey(assignment),
      type: "comment",
      title: `${comment.authorName} commented`,
      description: `${assignment.title} - ${preview}`,
      meta: comment.createdAt || "New comment",
      timestamp,
      sortTimestamp: timestamp,
    };
  });
}

function buildRecentCreatedAssignmentActivities(
  assignments: AssignmentCardData[],
): DashboardActivityCandidate[] {
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
        assignmentKey: getAssignmentActivityKey(assignment),
        type: "assignment-created",
        title: `New assignment: ${assignment.title}`,
        description: `${assignment.subject} - ${assignment.student}`,
        meta: `Created ${createdLabel}`,
        timestamp,
        sortTimestamp: timestamp,
      };
    });
}

function buildDueSoonActivities(
  assignments: AssignmentCardData[],
  now: Date,
): DashboardActivityCandidate[] {
  return assignments
    .filter((assignment) => isAssignmentDueSoon(assignment, now))
    .map((assignment) => ({
      assignment,
      dueDate: getAssignmentDueDate(assignment),
    }))
    .sort((left, right) => {
      const leftValue = left.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
      const rightValue = right.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
      return leftValue - rightValue;
    })
    .slice(0, MAX_RECENT_ITEMS_PER_GROUP)
    .map(({ assignment, dueDate }) => ({
      id: `due-soon:${assignment.id ?? assignment.title}`,
      assignmentKey: getAssignmentActivityKey(assignment),
      type: "due-soon",
      title: `Due soon: ${assignment.title}`,
      description: `${assignment.subject} - ${assignment.student}`,
      meta: `Due ${assignment.due}`,
      timestamp: dueDate ? dueDate.getTime() : null,
      sortTimestamp: null,
    }));
}

function buildOverdueActivities(
  assignments: AssignmentCardData[],
  now: Date,
): DashboardActivityCandidate[] {
  return assignments
    .filter((assignment) => isAssignmentOverdue(assignment, now))
    .map((assignment) => ({
      assignment,
      dueDate: getAssignmentDueDate(assignment),
    }))
    .sort((left, right) => {
      const leftValue = left.dueDate?.getTime() ?? Number.NEGATIVE_INFINITY;
      const rightValue = right.dueDate?.getTime() ?? Number.NEGATIVE_INFINITY;
      return rightValue - leftValue;
    })
    .slice(0, MAX_RECENT_ITEMS_PER_GROUP)
    .map(({ assignment, dueDate }) => ({
      id: `overdue:${assignment.id ?? assignment.title}`,
      assignmentKey: getAssignmentActivityKey(assignment),
      type: "overdue",
      title: `Overdue: ${assignment.title}`,
      description: `${assignment.subject} - ${assignment.student}`,
      meta: `Due ${assignment.due}`,
      timestamp: dueDate ? dueDate.getTime() : null,
      sortTimestamp: null,
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

  return compactActivityItems([
    ...commentActivities,
    ...createdActivities,
    ...dueSoonActivities,
    ...overdueActivities,
  ]);
}
