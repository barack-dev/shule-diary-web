import assert from "node:assert/strict";
import test from "node:test";
import { buildAssignmentProgressSummary } from "../lib/assignment-progress.ts";
import type { AssignmentCardData, KanbanColumnData } from "../lib/types.ts";

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

test("buildAssignmentProgressSummary counts active and finished assignments", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Assigned",
      items: [
        createAssignment({ id: "assigned-1", status: "Assigned" }),
        createAssignment({ id: "progress-1", status: "In Progress" }),
      ],
    },
    {
      title: "Submitted",
      items: [
        createAssignment({ id: "submitted-1", status: "Submitted" }),
        createAssignment({ id: "reviewed-1", status: "Reviewed" }),
        createAssignment({ id: "completed-1", status: "Completed" }),
      ],
    },
  ];

  const summary = buildAssignmentProgressSummary(columns);

  assert.equal(summary.total, 5);
  assert.equal(summary.active, 2);
  assert.equal(summary.finished, 3);
  assert.equal(summary.completionPercentage, 60);
});

test("buildAssignmentProgressSummary returns status step percentages", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Assigned",
      items: [
        createAssignment({ id: "assigned-1", status: "Assigned" }),
        createAssignment({ id: "assigned-2", status: "Assigned" }),
        createAssignment({ id: "completed-1", status: "Completed" }),
        createAssignment({ id: "support-1", status: "Needs Support" }),
      ],
    },
  ];

  const summary = buildAssignmentProgressSummary(columns);
  const assignedStep = summary.steps.find((step) => step.status === "Assigned");
  const completedStep = summary.steps.find((step) => step.status === "Completed");

  assert.equal(assignedStep?.count, 2);
  assert.equal(assignedStep?.percentage, 50);
  assert.equal(completedStep?.count, 1);
  assert.equal(completedStep?.percentage, 25);
});

test("buildAssignmentProgressSummary handles empty assignment lists", () => {
  const summary = buildAssignmentProgressSummary([
    {
      title: "Assigned",
      items: [],
    },
  ]);

  assert.equal(summary.total, 0);
  assert.equal(summary.active, 0);
  assert.equal(summary.finished, 0);
  assert.equal(summary.completionPercentage, 0);
  assert.equal(summary.steps.every((step) => step.percentage === 0), true);
});
