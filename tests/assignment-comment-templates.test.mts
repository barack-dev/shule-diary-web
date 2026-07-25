import assert from "node:assert/strict";
import test from "node:test";
import { getAssignmentCommentTemplates } from "../lib/assignment-comment-templates.ts";
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

test("getAssignmentCommentTemplates returns teacher review templates for submitted work", () => {
  const templates = getAssignmentCommentTemplates(
    createAssignment({ status: "Submitted" }),
    "Teacher",
  );

  assert.equal(templates.length, 2);
  assert.equal(templates.some((template) => template.includes("review")), true);
});

test("getAssignmentCommentTemplates returns parent progress templates for active work", () => {
  const templates = getAssignmentCommentTemplates(
    createAssignment({ status: "In Progress" }),
    "Parent",
  );

  assert.equal(templates.length, 2);
  assert.equal(templates.some((template) => template.includes("working")), true);
});

test("getAssignmentCommentTemplates returns support templates for needs support status", () => {
  const parentTemplates = getAssignmentCommentTemplates(
    createAssignment({ status: "Needs Support" }),
    "Parent",
  );
  const teacherTemplates = getAssignmentCommentTemplates(
    createAssignment({ status: "Needs Support" }),
    "Teacher",
  );

  assert.equal(parentTemplates.some((template) => template.includes("resubmit")), true);
  assert.equal(teacherTemplates.some((template) => template.includes("revisit")), true);
});
