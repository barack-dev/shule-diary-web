export type AssignmentStatus =
  | "Assigned"
  | "Seen by Parent"
  | "In Progress"
  | "Submitted"
  | "Reviewed"
  | "Completed";

export type AssignmentStatusKey =
  | "assigned"
  | "seen"
  | "in_progress"
  | "submitted"
  | "reviewed"
  | "completed";

export const ASSIGNMENT_STATUS_KEY_BY_STATUS: Record<AssignmentStatus, AssignmentStatusKey> = {
  Assigned: "assigned",
  "Seen by Parent": "seen",
  "In Progress": "in_progress",
  Submitted: "submitted",
  Reviewed: "reviewed",
  Completed: "completed",
};

export type CommentAuthorRole = "Teacher" | "Parent";

export type DashboardRole = "teacher" | "parent";

export interface AssignmentComment {
  id: string;
  authorName: string;
  authorRole: CommentAuthorRole;
  message: string;
  createdAt: string;
}

export interface AssignmentCardData {
  id?: string;
  assignmentStudentId?: string;
  title: string;
  subject: string;
  student: string;
  due: string;
  dueDateRaw?: string;
  description: string;
  comments: AssignmentComment[];
  status: AssignmentStatus;
}

export interface SummaryMetric {
  label: string;
  value: string;
}

export interface KanbanColumnData {
  title: AssignmentStatus;
  label?: string;
  items: AssignmentCardData[];
}

export type ParentSummaryTone = "amber" | "rose" | "sky" | "emerald";

export interface ParentSummaryMetric extends SummaryMetric {
  helper: string;
  tone: ParentSummaryTone;
}

export interface ParentProfile {
  childName: string;
  grade: string;
  className: string;
  classTeacher: string;
}

export interface DashboardDirectoryData {
  schoolName: string | null;
  teacherName: string | null;
  parentName: string | null;
  studentName: string | null;
  className: string | null;
  milestoneTitle: string | null;
  milestoneCount: number | null;
}
