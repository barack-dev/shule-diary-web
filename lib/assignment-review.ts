import type { AssignmentCardData, AssignmentStatus, KanbanColumnData } from "./types";

export type TeacherReviewStatus = Extract<AssignmentStatus, "Reviewed" | "Needs Support">;

export type AssignmentReviewRequest = {
  status: TeacherReviewStatus;
  feedbackMessage: string;
};

export const TEACHER_REVIEW_STATUS_OPTIONS: readonly TeacherReviewStatus[] = [
  "Reviewed",
  "Needs Support",
];

export function isTeacherReviewStatus(status: AssignmentStatus): status is TeacherReviewStatus {
  return status === "Reviewed" || status === "Needs Support";
}

export function canReviewSubmittedAssignment(
  assignment: AssignmentCardData,
  canReviewAssignments: boolean,
): boolean {
  return (
    canReviewAssignments &&
    assignment.status === "Submitted" &&
    Boolean(assignment.assignmentStudentId?.trim())
  );
}

export function applyTeacherReviewStatus(
  columns: KanbanColumnData[],
  assignmentId: string,
  status: TeacherReviewStatus,
): KanbanColumnData[] {
  const trimmedAssignmentId = assignmentId.trim();
  if (!trimmedAssignmentId) {
    return columns;
  }

  const sourceColumnIndex = columns.findIndex((column) =>
    column.items.some((item) => item.id === trimmedAssignmentId),
  );

  if (sourceColumnIndex < 0) {
    return columns;
  }

  const sourceAssignment = columns[sourceColumnIndex].items.find(
    (item) => item.id === trimmedAssignmentId,
  );

  if (!sourceAssignment) {
    return columns;
  }

  const updatedAssignment: AssignmentCardData = {
    ...sourceAssignment,
    status,
  };

  const targetColumnIndex = columns.findIndex((column) => column.title === status);
  if (targetColumnIndex < 0 || targetColumnIndex === sourceColumnIndex) {
    return columns.map((column, columnIndex) =>
      columnIndex === sourceColumnIndex
        ? {
            ...column,
            items: column.items.map((item) =>
              item.id === trimmedAssignmentId ? updatedAssignment : item,
            ),
          }
        : column,
    );
  }

  return columns.map((column, columnIndex) => {
    if (columnIndex === sourceColumnIndex) {
      return {
        ...column,
        items: column.items.filter((item) => item.id !== trimmedAssignmentId),
      };
    }

    if (columnIndex === targetColumnIndex) {
      return {
        ...column,
        items: [...column.items, updatedAssignment],
      };
    }

    return column;
  });
}
