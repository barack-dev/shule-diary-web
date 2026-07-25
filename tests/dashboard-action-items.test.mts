import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardActionItems } from "../lib/dashboard-action-items.ts";
import type { AssignmentCardData, KanbanColumnData } from "../lib/types.ts";

const NOW = new Date(2026, 6, 25);

function createAssignment(overrides: Partial<AssignmentCardData> = {}): AssignmentCardData {
  return {
    id: "assignment-1",
    assignmentStudentId: "assignment-student-1",
    title: "Fractions Homework",
    subject: "Math",
    student: "Amina Otieno",
    due: "Jul 26",
    dueDateRaw: "2026-07-26",
    description: "Complete questions 1 through 8",
    comments: [],
    status: "Assigned",
    ...overrides,
  };
}

test("buildDashboardActionItems counts teacher review and support work", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Submitted",
      items: [
        createAssignment({
          id: "submitted-1",
          status: "Submitted",
          comments: [
            {
              id: "comment-1",
              authorName: "Mary",
              authorRole: "Parent",
              message: "Submitted.",
              createdAt: "Jul 25",
            },
          ],
        }),
        createAssignment({ id: "support-1", status: "Needs Support" }),
        createAssignment({
          id: "overdue-1",
          status: "Assigned",
          dueDateRaw: "2026-07-20",
        }),
      ],
    },
  ];

  const items = buildDashboardActionItems(columns, "teacher", NOW);

  assert.equal(items.find((item) => item.id === "teacher-submitted")?.value, 1);
  assert.equal(items.find((item) => item.id === "teacher-support")?.value, 1);
  assert.equal(items.find((item) => item.id === "teacher-overdue")?.value, 1);
  assert.equal(items.find((item) => item.id === "teacher-comments")?.value, 1);
});

test("buildDashboardActionItems counts parent start, active, and due work", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Assigned",
      items: [
        createAssignment({ id: "assigned-1", status: "Assigned" }),
        createAssignment({ id: "seen-1", status: "Seen by Parent" }),
        createAssignment({
          id: "progress-1",
          status: "In Progress",
          due: "Aug 15",
          dueDateRaw: "2026-08-15",
        }),
        createAssignment({
          id: "support-1",
          status: "Needs Support",
          due: "Aug 15",
          dueDateRaw: "2026-08-15",
        }),
        createAssignment({
          id: "overdue-1",
          status: "Assigned",
          dueDateRaw: "2026-07-20",
        }),
      ],
    },
  ];

  const items = buildDashboardActionItems(columns, "parent", NOW);

  assert.equal(items.find((item) => item.id === "parent-start")?.value, 3);
  assert.equal(items.find((item) => item.id === "parent-active")?.value, 2);
  assert.equal(items.find((item) => item.id === "parent-due-soon")?.value, 2);
  assert.equal(items.find((item) => item.id === "parent-overdue")?.value, 1);
});
