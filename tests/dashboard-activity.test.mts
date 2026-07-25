import assert from "node:assert/strict";
import test from "node:test";
import { buildRecentActivity } from "../lib/dashboard-activity.ts";
import type { AssignmentCardData, KanbanColumnData } from "../lib/types.ts";

const NOW = new Date("2026-07-25T10:00:00.000Z");

function createAssignment(overrides: Partial<AssignmentCardData>): AssignmentCardData {
  return {
    id: "assignment-1",
    assignmentStudentId: "assignment-student-1",
    title: "Fractions Homework",
    subject: "Math",
    student: "Amina Otieno",
    due: "Jul 26",
    dueDateRaw: "2026-07-26",
    createdAtRaw: "2026-07-22T09:00:00.000Z",
    description: "Complete questions 1 through 8",
    comments: [],
    status: "Assigned",
    ...overrides,
  };
}

test("buildRecentActivity derives items from assignments, comments, due soon, and overdue", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Assigned",
      items: [
        createAssignment({
          id: "a-1",
          title: "Fractions Homework",
          createdAtRaw: "2026-07-25T07:00:00.000Z",
          dueDateRaw: "2026-07-26",
          comments: [
            {
              id: "c-1",
              authorName: "Grace Wanjiku",
              authorRole: "Teacher",
              message: "Please show your working for question 3.",
              createdAt: "Jul 25, 08:30",
              createdAtRaw: "2026-07-25T08:30:00.000Z",
            },
          ],
        }),
        createAssignment({
          id: "a-2",
          title: "Plant Reflection",
          subject: "Science",
          student: "Brian Njoroge",
          createdAtRaw: "2026-07-24T10:00:00.000Z",
          dueDateRaw: "2026-07-20",
        }),
      ],
    },
  ];

  const activity = buildRecentActivity(columns, NOW);

  assert.ok(activity.some((item) => item.type === "comment"));
  assert.ok(activity.some((item) => item.type === "assignment-created"));
  assert.ok(activity.some((item) => item.type === "due-soon"));
  assert.ok(activity.some((item) => item.type === "overdue"));
});

test("buildRecentActivity returns empty when there are no assignments", () => {
  const activity = buildRecentActivity(
    [
      {
        title: "Assigned",
        items: [],
      },
      {
        title: "Completed",
        items: [],
      },
    ],
    NOW,
  );

  assert.deepEqual(activity, []);
});

test("buildRecentActivity limits each event group for compact display", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Assigned",
      items: [
        createAssignment({
          id: "a-1",
          createdAtRaw: "2026-07-25T10:00:00.000Z",
          dueDateRaw: "2026-07-26",
          comments: [
            {
              id: "c-1",
              authorName: "Teacher A",
              authorRole: "Teacher",
              message: "Comment one",
              createdAt: "Jul 25, 10:00",
              createdAtRaw: "2026-07-25T10:00:00.000Z",
            },
          ],
        }),
        createAssignment({
          id: "a-2",
          createdAtRaw: "2026-07-25T09:00:00.000Z",
          dueDateRaw: "2026-07-27",
          comments: [
            {
              id: "c-2",
              authorName: "Teacher B",
              authorRole: "Teacher",
              message: "Comment two",
              createdAt: "Jul 25, 09:00",
              createdAtRaw: "2026-07-25T09:00:00.000Z",
            },
          ],
        }),
        createAssignment({
          id: "a-3",
          createdAtRaw: "2026-07-25T08:00:00.000Z",
          dueDateRaw: "2026-07-20",
          comments: [
            {
              id: "c-3",
              authorName: "Teacher C",
              authorRole: "Teacher",
              message: "Comment three",
              createdAt: "Jul 25, 08:00",
              createdAtRaw: "2026-07-25T08:00:00.000Z",
            },
          ],
        }),
      ],
    },
  ];

  const activity = buildRecentActivity(columns, NOW);

  const commentItems = activity.filter((item) => item.type === "comment");
  const createdItems = activity.filter((item) => item.type === "assignment-created");

  assert.equal(commentItems.length, 2);
  assert.equal(createdItems.length, 2);
});
