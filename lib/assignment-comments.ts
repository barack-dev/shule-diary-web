import type { AssignmentComment, CommentAuthorRole } from "./types";
import { createClient } from "./supabase/client";

type AssignmentCommentInsertInput = {
  assignmentStudentId: string;
  authorName: string;
  authorRole: CommentAuthorRole;
  message: string;
};

type SupabaseAssignmentCommentRow = {
  id: string;
  assignment_student_id: string | null;
  user_id: string | null;
  comment: string | null;
  created_at: string | null;
};

const DEMO_TEACHER_PROFILE_ID = "00000000-0000-0000-0000-000000001001";
const DEMO_PARENT_PROFILE_ID = "00000000-0000-0000-0000-000000001002";

function getDemoUserIdForRole(role: CommentAuthorRole): string {
  return role === "Parent" ? DEMO_PARENT_PROFILE_ID : DEMO_TEACHER_PROFILE_ID;
}

function formatCommentCreatedAt(dateValue: string | null): string {
  if (!dateValue) {
    return "";
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapCommentRowToComment(row: SupabaseAssignmentCommentRow): AssignmentComment {
  const normalizedRole =
    row.user_id === DEMO_PARENT_PROFILE_ID
      ? "Parent"
      : "Teacher";

  return {
    id: row.id,
    authorName: normalizedRole === "Parent" ? "Parent" : "Teacher",
    authorRole: normalizedRole,
    message: row.comment?.trim() || "",
    createdAt: formatCommentCreatedAt(row.created_at),
  };
}

export async function insertAssignmentComment({
  assignmentStudentId,
  authorName,
  authorRole,
  message,
}: AssignmentCommentInsertInput): Promise<AssignmentComment> {
  const trimmedComment = message.trim();
  if (!trimmedComment) {
    throw new Error("Comment cannot be empty.");
  }

  const trimmedAssignmentStudentId = assignmentStudentId.trim();
  if (!trimmedAssignmentStudentId) {
    throw new Error("This assignment is missing its student link. Please refresh and try again.");
  }

  const supabase = createClient();
  const userId = getDemoUserIdForRole(authorRole);
  const { data, error } = await supabase
    .from("comments")
    .insert({
      assignment_student_id: trimmedAssignmentStudentId,
      user_id: userId,
      comment: trimmedComment,
    })
    .select("id, assignment_student_id, user_id, comment, created_at")
    .single();

  if (error) {
    const safeMessage = error.message?.trim() || "Unknown Supabase insert error.";
    throw new Error(`Supabase insert failed: ${safeMessage}`);
  }

  const insertedComment = mapCommentRowToComment(data as SupabaseAssignmentCommentRow);
  return {
    ...insertedComment,
    authorName: authorName.trim() || insertedComment.authorName,
    authorRole,
  };
}
