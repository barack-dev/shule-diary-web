import type {
  AssignmentCardData,
  AssignmentComment,
  AssignmentStatus,
  CommentAuthorRole,
  KanbanColumnData,
  SummaryMetric,
} from "./types";
import { createClient } from "./supabase/server";

const TEACHER_STATUSES: AssignmentStatus[] = [
  "Assigned",
  "Seen by Parent",
  "In Progress",
  "Submitted",
  "Reviewed",
  "Completed",
];

type SupabaseAssignmentRow = {
  id: string;
  title: string | null;
  subject: string | null;
  due_date: string | null;
  status: string | null;
  priority: string | null;
  description: string | null;
  created_at: string | null;
};

type SupabaseAssignmentCommentRow = {
  id: string;
  assignment_id: string;
  author_name: string | null;
  author_role: string | null;
  message: string | null;
  created_at: string | null;
};

function createEmptyTeacherColumns(): KanbanColumnData[] {
  return TEACHER_STATUSES.map((status) => ({
    title: status,
    items: [],
  }));
}

function formatShortDueDate(dueDate: string | null): string {
  if (!dueDate) {
    return "No due date";
  }

  const parsedDate = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dueDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function normalizeStatus(status: string | null): AssignmentStatus {
  switch (status?.trim().toLowerCase()) {
    case "assigned":
      return "Assigned";
    case "seen by parent":
      return "Seen by Parent";
    case "seen":
      return "Seen by Parent";
    case "in progress":
      return "In Progress";
    case "in_progress":
      return "In Progress";
    case "submitted":
      return "Submitted";
    case "reviewed":
      return "Reviewed";
    case "completed":
      return "Completed";
    default:
      return "Assigned";
  }
}

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

function mapCommentRowToComment(
  row: SupabaseAssignmentCommentRow,
): AssignmentComment {
  return {
    id: row.id,
    authorName: row.author_name?.trim() || "Demo Teacher",
    authorRole: normalizeCommentAuthorRole(row.author_role),
    message: row.message?.trim() || "",
    createdAt: formatCommentCreatedAt(row.created_at),
  };
}

function mapRowToAssignment(
  row: SupabaseAssignmentRow,
  commentsByAssignmentId: Record<string, AssignmentComment[]>,
): AssignmentCardData {
  const status = normalizeStatus(row.status);

  return {
    id: row.id,
    title: row.title?.trim() || "Untitled assignment",
    subject: row.subject?.trim() || "General",
    student: "Demo Student",
    due: formatShortDueDate(row.due_date),
    description: row.description?.trim() || "No description provided.",
    comments: commentsByAssignmentId[row.id] ?? [],
    status,
  };
}

export function buildTeacherColumnsFromAssignments(
  rows: SupabaseAssignmentRow[],
  commentsByAssignmentId: Record<string, AssignmentComment[]> = {},
): KanbanColumnData[] {
  const columns = createEmptyTeacherColumns();
  const statusToIndex = new Map<AssignmentStatus, number>(
    columns.map((column, index) => [column.title, index]),
  );

  for (const row of rows) {
    const assignment = mapRowToAssignment(row, commentsByAssignmentId);
    const index = statusToIndex.get(assignment.status) ?? 0;
    columns[index].items.push(assignment);
  }

  return columns;
}

export async function getTeacherColumnsFromSupabase(): Promise<KanbanColumnData[]> {
  const supabase = await createClient();
  const { data: assignmentData, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, status, priority, description, created_at")
    .order("created_at", { ascending: false });

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignmentRows = (assignmentData ?? []) as SupabaseAssignmentRow[];
  const assignmentIds = assignmentRows.map((row) => row.id);

  if (assignmentIds.length === 0) {
    return buildTeacherColumnsFromAssignments(assignmentRows);
  }

  const { data: commentData, error: commentError } = await supabase
    .from("assignment_comments")
    .select("id, assignment_id, author_name, author_role, message, created_at")
    .in("assignment_id", assignmentIds)
    .order("created_at", { ascending: true });

  if (commentError) {
    console.warn(
      "[ShuleDiary] Unable to load assignment comments from Supabase; continuing with empty comments.",
    );
    return buildTeacherColumnsFromAssignments(assignmentRows);
  }

  const commentRows = (commentData ?? []) as SupabaseAssignmentCommentRow[];
  const commentsByAssignmentId = commentRows.reduce<Record<string, AssignmentComment[]>>(
    (lookup, row) => {
      const comment = mapCommentRowToComment(row);
      const current = lookup[row.assignment_id] ?? [];
      lookup[row.assignment_id] = [...current, comment];
      return lookup;
    },
    {},
  );

  return buildTeacherColumnsFromAssignments(assignmentRows, commentsByAssignmentId);
}

export function getEmptyTeacherColumns(): KanbanColumnData[] {
  return createEmptyTeacherColumns();
}

export function buildTeacherSummaryMetrics(columns: KanbanColumnData[]): SummaryMetric[] {
  const assignments = columns.flatMap((column) => column.items);
  const students = new Set(
    assignments
      .map((assignment) => assignment.student.trim())
      .filter((studentName) => studentName.length > 0),
  );

  const pendingAssignments = assignments.filter(
    (assignment) =>
      assignment.status !== "Submitted" &&
      assignment.status !== "Reviewed" &&
      assignment.status !== "Completed",
  ).length;

  const submittedWork = assignments.filter(
    (assignment) => assignment.status === "Submitted",
  ).length;

  const noDueDateCount = assignments.filter((assignment) => {
    const dueValue = assignment.due.trim().toLowerCase();
    return dueValue.length === 0 || dueValue === "no due date";
  }).length;

  // TODO: Include overdue assignment detection once due dates are stored in a
  // stable machine-readable format (e.g., full ISO date) in card data.
  const needsSupport = noDueDateCount;

  return [
    { label: "Total Students", value: String(students.size) },
    { label: "Pending Assignments", value: String(pendingAssignments) },
    { label: "Submitted Work", value: String(submittedWork) },
    { label: "Needs Support", value: String(needsSupport) },
  ];
}