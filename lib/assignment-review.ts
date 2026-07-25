import type { AssignmentCardData, AssignmentStatus, KanbanColumnData } from "./types";
import { applyAssignmentStatusToColumns } from "./assignment-status-columns.ts";

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
  return applyAssignmentStatusToColumns(columns, assignmentId, status);
}
