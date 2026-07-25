import assert from "node:assert/strict";
import test from "node:test";
import { buildAssignmentLifecycleSteps } from "../lib/assignment-lifecycle.ts";
import type { AssignmentCardData } from "../lib/types.ts";

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

test("buildAssignmentLifecycleSteps marks previous stages complete and current stage current", () => {
  const steps = buildAssignmentLifecycleSteps(
    createAssignment({ status: "Submitted" }),
  );

  assert.equal(steps.find((step) => step.status === "Assigned")?.state, "complete");
  assert.equal(steps.find((step) => step.status === "Seen by Parent")?.state, "complete");
  assert.equal(steps.find((step) => step.status === "In Progress")?.state, "complete");
  assert.equal(steps.find((step) => step.status === "Submitted")?.state, "current");
  assert.equal(steps.find((step) => step.status === "Reviewed")?.state, "upcoming");
});

test("buildAssignmentLifecycleSteps treats needs support as attention", () => {
  const steps = buildAssignmentLifecycleSteps(
    createAssignment({ status: "Needs Support" }),
  );

  assert.equal(steps.find((step) => step.status === "Submitted")?.state, "complete");
  assert.equal(steps.find((step) => step.status === "Needs Support")?.state, "attention");
  assert.equal(steps.find((step) => step.status === "Reviewed")?.state, "upcoming");
});

test("buildAssignmentLifecycleSteps maps overdue to the in-progress attention stage", () => {
  const steps = buildAssignmentLifecycleSteps(createAssignment({ status: "Overdue" }));
  const inProgress = steps.find((step) => step.status === "In Progress");

  assert.equal(inProgress?.label, "Overdue");
  assert.equal(inProgress?.state, "attention");
});
