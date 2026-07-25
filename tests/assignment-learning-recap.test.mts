import assert from "node:assert/strict";
import test from "node:test";
import { buildAssignmentLearningRecap } from "../lib/assignment-learning-recap.ts";
import type { AssignmentCardData, AssignmentComment } from "../lib/types.ts";

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

function createComment(overrides: Partial<AssignmentComment> = {}): AssignmentComment {
  return {
    id: "comment-1",
    authorName: "Mary",
    authorRole: "Parent",
    message: "We are working on it.",
    createdAt: "Jul 25",
    createdAtRaw: "2026-07-25T10:00:00.000Z",
    ...overrides,
  };
}

test("buildAssignmentLearningRecap summarizes due date, comment count, and next step", () => {
  const recap = buildAssignmentLearningRecap(
    createAssignment({
      due: "Jul 26",
      status: "In Progress",
      comments: [createComment()],
    }),
  );

  assert.equal(recap.dueLabel, "Jul 26");
  assert.equal(recap.commentCountLabel, "1 comment");
  assert.equal(recap.nextStep, "Family submits the completed work to the teacher.");
});

test("buildAssignmentLearningRecap chooses the latest raw comment timestamp", () => {
  const recap = buildAssignmentLearningRecap(
    createAssignment(),
    [
      createComment({
        id: "old-comment",
        message: "Old update.",
        createdAtRaw: "2026-07-24T10:00:00.000Z",
      }),
      createComment({
        id: "new-comment",
        authorRole: "Teacher",
        message: "New feedback.",
        createdAtRaw: "2026-07-25T10:00:00.000Z",
      }),
    ],
  );

  assert.equal(recap.latestUpdate, "Teacher: New feedback.");
});

test("buildAssignmentLearningRecap handles empty comments", () => {
  const recap = buildAssignmentLearningRecap(createAssignment());

  assert.equal(recap.commentCountLabel, "0 comments");
  assert.equal(recap.latestUpdate, "No comments yet.");
});
