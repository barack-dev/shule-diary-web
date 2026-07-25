import assert from "node:assert/strict";
import test from "node:test";
import {
  assignmentNeedsAttention,
  countAssignmentsNeedingAttention,
  getAssignmentAttentionBadges,
} from "../lib/assignment-priority.ts";
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
    description: "Complete questions 1 through 8",
    comments: [],
    status: "Assigned",
    ...overrides,
  };
}

test("overdue assignments return a high attention badge", () => {
  const assignment = createAssignment({
    id: "overdue-1",
    dueDateRaw: "2026-07-20",
    due: "Jul 20",
    status: "Assigned",
  });

  const badges = getAssignmentAttentionBadges(assignment, NOW);

  assert.deepEqual(badges, [
    {
      kind: "overdue",
      label: "Overdue",
      tone: "high",
    },
  ]);
});

test("needs support status returns a needs support badge", () => {
  const assignment = createAssignment({
    id: "needs-support-1",
    status: "Needs Support",
    dueDateRaw: "2026-07-29",
    due: "Jul 29",
  });

  const badges = getAssignmentAttentionBadges(assignment, NOW);

  assert.equal(
    badges.some((badge) => badge.kind === "needs-support" && badge.label === "Needs Support"),
    true,
  );
});

test("due soon assignments return a due soon badge", () => {
  const assignment = createAssignment({
    id: "due-soon-1",
    dueDateRaw: "2026-07-27",
    due: "Jul 27",
    status: "Assigned",
  });

  const badges = getAssignmentAttentionBadges(assignment, NOW);

  assert.deepEqual(badges, [
    {
      kind: "due-soon",
      label: "Due Soon",
      tone: "medium",
    },
  ]);
});

test("completed, reviewed, and submitted assignments do not return urgent badges", () => {
  const submitted = createAssignment({
    id: "submitted-1",
    status: "Submitted",
    dueDateRaw: "2026-07-20",
    due: "Jul 20",
  });
  const reviewed = createAssignment({
    id: "reviewed-1",
    status: "Reviewed",
    dueDateRaw: "2026-07-20",
    due: "Jul 20",
  });
  const completed = createAssignment({
    id: "completed-1",
    status: "Completed",
    dueDateRaw: "2026-07-20",
    due: "Jul 20",
  });

  assert.deepEqual(getAssignmentAttentionBadges(submitted, NOW), []);
  assert.deepEqual(getAssignmentAttentionBadges(reviewed, NOW), []);
  assert.deepEqual(getAssignmentAttentionBadges(completed, NOW), []);
});

test("status overdue still returns overdue badge when due date is missing", () => {
  const assignment = createAssignment({
    id: "status-overdue-1",
    status: "Overdue",
    dueDateRaw: undefined,
    due: "No due date",
  });

  const badges = getAssignmentAttentionBadges(assignment, NOW);

  assert.deepEqual(badges, [
    {
      kind: "overdue",
      label: "Overdue",
      tone: "high",
    },
  ]);
});

test("needs attention count uses loaded board columns", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Assigned",
      items: [
        createAssignment({ id: "count-1", dueDateRaw: "2026-07-27", due: "Jul 27" }),
        createAssignment({ id: "count-2", dueDateRaw: "2026-08-02", due: "Aug 2" }),
      ],
    },
    {
      title: "Needs Support",
      items: [
        createAssignment({
          id: "count-3",
          status: "Needs Support",
          dueDateRaw: "2026-07-30",
          due: "Jul 30",
        }),
      ],
    },
    {
      title: "Completed",
      items: [
        createAssignment({
          id: "count-4",
          status: "Completed",
          dueDateRaw: "2026-07-20",
          due: "Jul 20",
        }),
      ],
    },
  ];

  assert.equal(assignmentNeedsAttention(columns[0].items[0], NOW), true);
  assert.equal(assignmentNeedsAttention(columns[0].items[1], NOW), false);
  assert.equal(assignmentNeedsAttention(columns[1].items[0], NOW), true);
  assert.equal(assignmentNeedsAttention(columns[2].items[0], NOW), false);
  assert.equal(countAssignmentsNeedingAttention(columns, NOW), 2);
});
