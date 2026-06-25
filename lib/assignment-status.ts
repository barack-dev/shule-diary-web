import type { AssignmentStatus, AssignmentStatusKey } from "./types";
import { ASSIGNMENT_STATUS_KEY_BY_STATUS } from "./types";
import { createClient } from "./supabase/client";

type AssignmentStatusUpdateInput = {
  assignmentStudentId: string;
  status: AssignmentStatus;
};

type UpdatedAssignmentStatusRow = {
  id: string;
  status: AssignmentStatusKey;
};

const ALLOWED_ASSIGNMENT_STATUS_KEYS: ReadonlySet<AssignmentStatusKey> = new Set([
  "assigned",
  "seen",
  "in_progress",
  "submitted",
  "reviewed",
  "completed",
  "needs_support",
  "overdue",
]);

function isAssignmentStatusKey(value: string): value is AssignmentStatusKey {
  return ALLOWED_ASSIGNMENT_STATUS_KEYS.has(value as AssignmentStatusKey);
}

function logStatusSaveAttempt(assignmentStudentId: string, status: AssignmentStatus): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.info("[ShuleDiary] Status save attempt", { assignmentStudentId, status });
}

function logStatusSaveSuccess(assignmentStudentId: string, status: AssignmentStatus): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.info("[ShuleDiary] Status save success", { assignmentStudentId, status });
}

function logStatusSaveFailure(
  assignmentStudentId: string,
  status: AssignmentStatus,
  message: string,
): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.error("[ShuleDiary] Status save failed", {
    assignmentStudentId,
    status,
    message,
  });
}

export async function updateAssignmentStatus({
  assignmentStudentId,
  status,
}: AssignmentStatusUpdateInput): Promise<UpdatedAssignmentStatusRow> {
  const trimmedAssignmentStudentId = assignmentStudentId.trim();
  if (!trimmedAssignmentStudentId) {
    throw new Error("Status save failed: missing assignment student id.");
  }

  const supabase = createClient();
  const statusKey = ASSIGNMENT_STATUS_KEY_BY_STATUS[status];

  logStatusSaveAttempt(trimmedAssignmentStudentId, status);

  const { data, error } = await supabase
    .from("assignment_students")
    .update({ status: statusKey })
    .eq("id", trimmedAssignmentStudentId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    const safeMessage = error.message?.trim() || "Unknown Supabase update error.";
    logStatusSaveFailure(trimmedAssignmentStudentId, status, safeMessage);
    throw new Error(`Supabase status update failed: ${safeMessage}`);
  }

  if (!data) {
    const safeMessage = "No assignment row was updated.";
    logStatusSaveFailure(trimmedAssignmentStudentId, status, safeMessage);
    throw new Error(`Supabase status update failed: ${safeMessage}`);
  }

  if (!isAssignmentStatusKey(data.status)) {
    const safeMessage = "Updated row returned an invalid status value.";
    logStatusSaveFailure(trimmedAssignmentStudentId, status, safeMessage);
    throw new Error(`Supabase status update failed: ${safeMessage}`);
  }

  const updatedRow: UpdatedAssignmentStatusRow = {
    id: data.id,
    status: data.status,
  };

  logStatusSaveSuccess(updatedRow.id, status);

  return updatedRow;
}
