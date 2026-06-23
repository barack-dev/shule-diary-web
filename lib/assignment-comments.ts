import type { AssignmentComment, CommentAuthorRole } from "./types";
import { createClient } from "./supabase/client";

type AssignmentCommentInsertInput = {
  assignmentId: string;
  authorName: string;
  authorRole: CommentAuthorRole;
  message: string;
};

type SupabaseAssignmentCommentRow = {
  id: string;
  assignment_id: string;
  author_name: string | null;
  author_role: string | null;
  message: string | null;
  created_at: string | null;
};

function normalizeCommentAuthorRole(role: string | null): CommentAuthorRole {
  return role?.trim().toLowerCase() === "parent" ? "Parent" : "Teacher";
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
  return {
    id: row.id,
    authorName: row.author_name?.trim() || "Demo Teacher",
    authorRole: normalizeCommentAuthorRole(row.author_role),
    message: row.message?.trim() || "",
    createdAt: formatCommentCreatedAt(row.created_at),
  };
}

export async function insertAssignmentComment({
  assignmentId,
  authorName,
  authorRole,
  message,
}: AssignmentCommentInsertInput): Promise<AssignmentComment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignment_comments")
    .insert({
      assignment_id: assignmentId,
      author_name: authorName,
      author_role: authorRole,
      message,
    })
    .select("id, assignment_id, author_name, author_role, message, created_at")
    .single();

  if (error) {
    const safeMessage = error.message?.trim() || "Unknown Supabase insert error.";
    throw new Error(`Supabase insert failed: ${safeMessage}`);
  }

  return mapCommentRowToComment(data as SupabaseAssignmentCommentRow);
}
