import assert from "node:assert/strict";
import test from "node:test";
import {
  applyTeacherReviewStatus,
  canReviewSubmittedAssignment,
  isTeacherReviewStatus,
} from "../lib/assignment-review.ts";
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
    status: "Submitted",
    ...overrides,
  };
}

test("canReviewSubmittedAssignment only allows teacher-enabled submitted assignments", () => {
  assert.equal(canReviewSubmittedAssignment(createAssignment(), true), true);
  assert.equal(canReviewSubmittedAssignment(createAssignment(), false), false);
  assert.equal(
    canReviewSubmittedAssignment(createAssignment({ status: "Reviewed" }), true),
    false,
  );
  assert.equal(
    canReviewSubmittedAssignment(createAssignment({ assignmentStudentId: " " }), true),
    false,
  );
});

test("isTeacherReviewStatus allows only teacher review target statuses", () => {
  assert.equal(isTeacherReviewStatus("Reviewed"), true);
  assert.equal(isTeacherReviewStatus("Needs Support"), true);
  assert.equal(isTeacherReviewStatus("Submitted"), false);
  assert.equal(isTeacherReviewStatus("Completed"), false);
});

test("applyTeacherReviewStatus moves a submitted assignment into the reviewed column", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Submitted",
      items: [createAssignment({ id: "assignment-1" })],
    },
    {
      title: "Reviewed",
      items: [],
    },
  ];

  const nextColumns = applyTeacherReviewStatus(columns, "assignment-1", "Reviewed");

  assert.equal(columns[0].items.length, 1);
  assert.equal(nextColumns[0].items.length, 0);
  assert.equal(nextColumns[1].items.length, 1);
  assert.equal(nextColumns[1].items[0].status, "Reviewed");
});

test("applyTeacherReviewStatus updates status in place when target column is missing", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Submitted",
      items: [createAssignment({ id: "assignment-1" })],
    },
  ];

  const nextColumns = applyTeacherReviewStatus(columns, "assignment-1", "Needs Support");

  assert.equal(nextColumns.length, 1);
  assert.equal(nextColumns[0].items.length, 1);
  assert.equal(nextColumns[0].items[0].status, "Needs Support");
});

test("applyTeacherReviewStatus leaves columns unchanged when assignment is missing", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Submitted",
      items: [createAssignment({ id: "assignment-1" })],
    },
  ];

  assert.equal(applyTeacherReviewStatus(columns, "missing-id", "Reviewed"), columns);
});
