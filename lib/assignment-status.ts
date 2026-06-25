import type { AssignmentStatus } from "./types";
import { createClient } from "./supabase/client";

type AssignmentStatusUpdateInput = {
  assignmentId: string;
  status: AssignmentStatus;
};

type UpdatedAssignmentStatusRow = {
  id: string;
  status: AssignmentStatus;
};

const ALLOWED_ASSIGNMENT_STATUSES: ReadonlySet<AssignmentStatus> = new Set([
  "Assigned",
  "Seen by Parent",
  "In Progress",
  "Submitted",
  "Reviewed",
  "Completed",
]);

function isAssignmentStatus(value: string): value is AssignmentStatus {
  return ALLOWED_ASSIGNMENT_STATUSES.has(value as AssignmentStatus);
}

function logStatusSaveAttempt(assignmentId: string, status: AssignmentStatus): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.info("[ShuleDiary] Status save attempt", { assignmentId, status });
}

function logStatusSaveSuccess(assignmentId: string, status: AssignmentStatus): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.info("[ShuleDiary] Status save success", { assignmentId, status });
}

function logStatusSaveFailure(
  assignmentId: string,
  status: AssignmentStatus,
  message: string,
): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.error("[ShuleDiary] Status save failed", {
    assignmentId,
    status,
    message,
  });
}

export async function updateAssignmentStatus({
  assignmentId,
  status,
}: AssignmentStatusUpdateInput): Promise<UpdatedAssignmentStatusRow> {
  const supabase = createClient();

  logStatusSaveAttempt(assignmentId, status);

  const { data, error } = await supabase
    .from("assignments")
    .update({ status })
    .eq("id", assignmentId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    const safeMessage = error.message?.trim() || "Unknown Supabase update error.";
    logStatusSaveFailure(assignmentId, status, safeMessage);
    throw new Error(`Supabase status update failed: ${safeMessage}`);
  }

  if (!data) {
    const safeMessage = "No assignment row was updated.";
    logStatusSaveFailure(assignmentId, status, safeMessage);
    throw new Error(`Supabase status update failed: ${safeMessage}`);
  }

  if (!isAssignmentStatus(data.status)) {
    const safeMessage = "Updated row returned an invalid status value.";
    logStatusSaveFailure(assignmentId, status, safeMessage);
    throw new Error(`Supabase status update failed: ${safeMessage}`);
  }

  const updatedRow: UpdatedAssignmentStatusRow = {
    id: data.id,
    status: data.status,
  };

  logStatusSaveSuccess(updatedRow.id, updatedRow.status);

  return updatedRow;
}
