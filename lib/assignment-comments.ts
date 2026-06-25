import type { AssignmentComment, CommentAuthorRole } from "./types";
import { getAuthenticatedClientProfile } from "./supabase/client-profile";

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
  return {
    id: row.id,
    authorName: "Teacher",
    authorRole: "Teacher",
    message: row.comment?.trim() || "",
    createdAt: formatCommentCreatedAt(row.created_at),
  };
}

function resolveCommentAuthorRoleFromProfile(role: string | null): CommentAuthorRole {
  return role?.trim().toLowerCase() === "parent" ? "Parent" : "Teacher";
}

export async function insertAssignmentComment({
  assignmentStudentId,
  authorName,
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

  const profile = await getAuthenticatedClientProfile();
  const resolvedRole = resolveCommentAuthorRoleFromProfile(profile.role);
  const supabase = profile.supabase;

  const { data, error } = await supabase
    .from("comments")
    .insert({
      assignment_student_id: trimmedAssignmentStudentId,
      user_id: profile.profileId,
      comment: trimmedComment,
    })
    .select("id, assignment_student_id, user_id, comment, created_at")
    .single();

  if (error) {
    const safeMessage = error.message?.trim() || "Unknown Supabase insert error.";
    throw new Error(`Supabase insert failed: ${safeMessage}`);
  }

  const insertedComment = mapCommentRowToComment(data as SupabaseAssignmentCommentRow);
  const fallbackAuthorName = authorName.trim() || insertedComment.authorName;
  return {
    ...insertedComment,
    authorName: profile.fullName ?? fallbackAuthorName,
    authorRole: resolvedRole,
  };
}
