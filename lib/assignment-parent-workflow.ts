import { applyAssignmentStatusToColumns } from "./assignment-status-columns.ts";
import type { AssignmentCardData, AssignmentStatus, KanbanColumnData } from "./types";

export type ParentProgressStatus = Extract<
  AssignmentStatus,
  "Seen by Parent" | "In Progress" | "Submitted"
>;

export type ParentProgressRequest = {
  status: ParentProgressStatus;
  updateMessage: string;
};

export type ParentProgressAction = {
  status: ParentProgressStatus;
  label: string;
  helper: string;
};

export function getParentProgressAction(
  assignment: AssignmentCardData,
  canUpdateParentProgress: boolean,
): ParentProgressAction | null {
  if (!canUpdateParentProgress || !assignment.assignmentStudentId?.trim()) {
    return null;
  }

  switch (assignment.status) {
    case "Assigned":
      return {
        status: "Seen by Parent",
        label: "Mark seen",
        helper: "Let the teacher know the family has opened this assignment.",
      };
    case "Seen by Parent":
      return {
        status: "In Progress",
        label: "Start work",
        helper: "Move this assignment into active work.",
      };
    case "In Progress":
      return {
        status: "Submitted",
        label: "Submit to teacher",
        helper: "Send this assignment back to the teacher for review.",
      };
    case "Needs Support":
      return {
        status: "Submitted",
        label: "Resubmit to teacher",
        helper: "Send the revised work back to the teacher.",
      };
    default:
      return null;
  }
}

export function applyParentProgressStatus(
  columns: KanbanColumnData[],
  assignmentId: string,
  status: ParentProgressStatus,
): KanbanColumnData[] {
  return applyAssignmentStatusToColumns(columns, assignmentId, status);
}
