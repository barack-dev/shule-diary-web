export type AssignmentStatus =
  | "Assigned"
  | "Seen by Parent"
  | "In Progress"
  | "Submitted"
  | "Reviewed"
  | "Completed";

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
  title: string;
  subject: string;
  student: string;
  due: string;
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
