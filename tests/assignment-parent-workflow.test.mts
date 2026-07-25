import assert from "node:assert/strict";
import test from "node:test";
import {
  applyParentProgressStatus,
  getParentProgressAction,
} from "../lib/assignment-parent-workflow.ts";
import type { AssignmentCardData, KanbanColumnData } from "../lib/types.ts";

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

test("getParentProgressAction returns the next allowed parent status", () => {
  assert.equal(
    getParentProgressAction(createAssignment({ status: "Assigned" }), true)?.status,
    "Seen by Parent",
  );
  assert.equal(
    getParentProgressAction(createAssignment({ status: "Seen by Parent" }), true)?.status,
    "In Progress",
  );
  assert.equal(
    getParentProgressAction(createAssignment({ status: "In Progress" }), true)?.status,
    "Submitted",
  );
  assert.equal(
    getParentProgressAction(createAssignment({ status: "Needs Support" }), true)?.status,
    "Submitted",
  );
});

test("getParentProgressAction hides unsupported or disabled parent actions", () => {
  assert.equal(getParentProgressAction(createAssignment(), false), null);
  assert.equal(
    getParentProgressAction(createAssignment({ assignmentStudentId: " " }), true),
    null,
  );
  assert.equal(
    getParentProgressAction(createAssignment({ status: "Reviewed" }), true),
    null,
  );
  assert.equal(
    getParentProgressAction(createAssignment({ status: "Submitted" }), true),
    null,
  );
});

test("applyParentProgressStatus moves an assignment into the target column", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "In Progress",
      items: [createAssignment({ id: "assignment-1", status: "In Progress" })],
    },
    {
      title: "Submitted",
      items: [],
    },
  ];

  const nextColumns = applyParentProgressStatus(columns, "assignment-1", "Submitted");

  assert.equal(columns[0].items.length, 1);
  assert.equal(nextColumns[0].items.length, 0);
  assert.equal(nextColumns[1].items.length, 1);
  assert.equal(nextColumns[1].items[0].status, "Submitted");
});
