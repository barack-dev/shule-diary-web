import type { AssignmentCardData, AssignmentStatus } from "./types";

export type AssignmentLifecycleStepState = "complete" | "current" | "attention" | "upcoming";

export type AssignmentLifecycleStep = {
  status: Exclude<AssignmentStatus, "Overdue">;
  label: string;
  state: AssignmentLifecycleStepState;
};

const LIFECYCLE_STATUSES: AssignmentLifecycleStep["status"][] = [
  "Assigned",
  "Seen by Parent",
  "In Progress",
  "Submitted",
  "Needs Support",
  "Reviewed",
  "Completed",
];

function getComparableStatus(status: AssignmentStatus): AssignmentLifecycleStep["status"] {
  return status === "Overdue" ? "In Progress" : status;
}

function shouldCountAsComplete(
  stepStatus: AssignmentLifecycleStep["status"],
  currentStatus: AssignmentStatus,
): boolean {
  if (stepStatus === "Needs Support") {
    return currentStatus === "Needs Support";
  }

  if (currentStatus === "Needs Support") {
    return ["Assigned", "Seen by Parent", "In Progress", "Submitted"].includes(stepStatus);
  }

  if (currentStatus === "Overdue") {
    return stepStatus === "Assigned" || stepStatus === "Seen by Parent";
  }

  const currentIndex = LIFECYCLE_STATUSES.indexOf(getComparableStatus(currentStatus));
  const stepIndex = LIFECYCLE_STATUSES.indexOf(stepStatus);
  return stepIndex >= 0 && currentIndex >= 0 && stepIndex < currentIndex;
}

export function buildAssignmentLifecycleSteps(
  assignment: AssignmentCardData,
): AssignmentLifecycleStep[] {
  return LIFECYCLE_STATUSES.map((status) => {
    if (assignment.status === "Overdue" && status === "In Progress") {
      return {
        status,
        label: "Overdue",
        state: "attention",
      };
    }

    if (assignment.status === "Needs Support" && status === "Needs Support") {
      return {
        status,
        label: status,
        state: "attention",
      };
    }

    if (assignment.status === status) {
      return {
        status,
        label: status,
        state: "current",
      };
    }

    return {
      status,
      label: status,
      state: shouldCountAsComplete(status, assignment.status) ? "complete" : "upcoming",
    };
  });
}
