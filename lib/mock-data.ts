import type { AssignmentCardData, KanbanColumnData, SummaryMetric } from "./types";

export const summaryMetrics: SummaryMetric[] = [
  { label: "Total Students", value: "32" },
  { label: "Pending Assignments", value: "14" },
  { label: "Submitted Work", value: "21" },
  { label: "Needs Support", value: "5" },
];

export const kanbanColumns: KanbanColumnData[] = [
  {
    title: "Assigned",
    items: [
      { id: "a1", title: "Math worksheet", subject: "Math", student: "Amina", due: "Jun 23", comments: 2, status: "Assigned" },
    ],
  },
  {
    title: "Seen by Parent",
    items: [
      { id: "a2", title: "Science summary", subject: "Science", student: "Brian", due: "Jun 25", comments: 1, status: "Seen by Parent" },
    ],
  },
  {
    title: "In Progress",
    items: [
      { id: "a3", title: "History chart", subject: "History", student: "Chloe", due: "Jun 24", comments: 3, status: "In Progress" },
    ],
  },
  {
    title: "Submitted",
    items: [
      { id: "a4", title: "English essay", subject: "English", student: "Dawit", due: "Jun 22", comments: 4, status: "Submitted" },
    ],
  },
  {
    title: "Reviewed",
    items: [
      { id: "a5", title: "Art reflection", subject: "Art", student: "Emma", due: "Jun 20", comments: 0, status: "Reviewed" },
    ],
  },
  {
    title: "Completed",
    items: [
      { id: "a6", title: "Reading log", subject: "Literacy", student: "Felix", due: "Jun 19", comments: 2, status: "Completed" },
    ],
  },
];
