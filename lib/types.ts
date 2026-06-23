export type AssignmentStatus =
  | "Assigned"
  | "Seen by Parent"
  | "In Progress"
  | "Submitted"
  | "Reviewed"
  | "Completed";

export interface AssignmentCardData {
  id?: string;
  title: string;
  subject: string;
  student: string;
  due: string;
  comments: number;
  status: AssignmentStatus;
}

export interface SummaryMetric {
  label: string;
  value: string;
}

export interface KanbanColumnData {
  title: AssignmentStatus;
  items: AssignmentCardData[];
}
