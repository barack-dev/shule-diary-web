import type {
  AssignmentCardData,
  AssignmentStatus,
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

function mapRowToAssignment(row: SupabaseAssignmentRow): AssignmentCardData {
  const status = normalizeStatus(row.status);

  return {
    id: row.id,
    title: row.title?.trim() || "Untitled assignment",
    subject: row.subject?.trim() || "General",
    student: "Demo Student",
    due: formatShortDueDate(row.due_date),
    description: row.description?.trim() || "No description provided.",
    comments: [],
    status,
  };
}

export function buildTeacherColumnsFromAssignments(rows: SupabaseAssignmentRow[]): KanbanColumnData[] {
  const columns = createEmptyTeacherColumns();
  const statusToIndex = new Map<AssignmentStatus, number>(
    columns.map((column, index) => [column.title, index]),
  );

  for (const row of rows) {
    const assignment = mapRowToAssignment(row);
    const index = statusToIndex.get(assignment.status) ?? 0;
    columns[index].items.push(assignment);
  }

  return columns;
}

export async function getTeacherColumnsFromSupabase(): Promise<KanbanColumnData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("id, title, subject, due_date, status, priority, description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SupabaseAssignmentRow[];
  return buildTeacherColumnsFromAssignments(rows);
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