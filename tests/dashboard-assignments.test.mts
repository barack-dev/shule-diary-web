import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTeacherColumnsFromAssignments,
  buildTeacherSummaryMetrics,
} from "../lib/dashboard-assignments.ts";
import type { AssignmentComment } from "../lib/types.ts";

const SAMPLE_COMMENT: AssignmentComment = {
  id: "comment-1",
  authorName: "Grace Wanjiku",
  authorRole: "Teacher",
  message: "Please show your working for question 3.",
  createdAt: "Jul 25, 10:30",
};

const TODAY = new Date("2026-07-25T10:00:00.000Z");

test("maps assignment detail fields and comments into teacher columns", () => {
  const columns = buildTeacherColumnsFromAssignments(
    [
      {
        assignment_student_id: "as-1",
        assignment_id: "a-1",
        student_id: "s-1",
        student_name: "Amina Otieno",
        title: "Fractions Homework",
        subject: "Math",
        due_date: "2026-08-14",
        status: "in_progress",
        description: "Complete questions 1 through 10 in your workbook.",
        created_at: "2026-07-20T08:00:00.000Z",
      },
    ],
    {
      "as-1": [SAMPLE_COMMENT],
    },
  );

  const inProgressColumn = columns.find((column) => column.title === "In Progress");
  assert.ok(inProgressColumn, "Expected In Progress column to be present");

  const card = inProgressColumn.items[0];
  assert.equal(card.title, "Fractions Homework");
  assert.equal(card.subject, "Math");
  assert.equal(card.description, "Complete questions 1 through 10 in your workbook.");
  assert.equal(card.status, "In Progress");
  assert.equal(card.student, "Amina Otieno");
  assert.equal(card.assignmentStudentId, "as-1");
  assert.equal(card.dueDateRaw, "2026-08-14");
  assert.ok(card.due.length > 0);
  assert.deepEqual(card.comments, [SAMPLE_COMMENT]);
});

test("uses safe fallback values for missing assignment detail fields", () => {
  const columns = buildTeacherColumnsFromAssignments(
    [
      {
        assignment_student_id: "as-2",
        assignment_id: "a-2",
        student_id: null,
        student_name: null,
        title: null,
        subject: null,
        due_date: null,
        status: "unknown_status",
        description: null,
        created_at: null,
      },
    ],
    {},
    {
      studentName: "Fallback Student",
    },
  );

  const assignedColumn = columns.find((column) => column.title === "Assigned");
  assert.ok(assignedColumn, "Expected Assigned column to be present");

  const card = assignedColumn.items[0];
  assert.equal(card.title, "Untitled assignment");
  assert.equal(card.subject, "General");
  assert.equal(card.description, "No description provided.");
  assert.equal(card.student, "Fallback Student");
  assert.equal(card.due, "No due date");
  assert.equal(card.status, "Assigned");
  assert.deepEqual(card.comments, []);
});

test("teacher summary needs support counts explicit and overdue support risk", () => {
  const columns = buildTeacherColumnsFromAssignments([
    {
      assignment_student_id: "as-3",
      assignment_id: "a-3",
      student_id: "s-3",
      student_name: "Amina Otieno",
      title: "Past Due Work",
      subject: "Math",
      due_date: "2026-07-20",
      status: "assigned",
      description: "Finish the worksheet.",
      created_at: "2026-07-10T08:00:00.000Z",
    },
    {
      assignment_student_id: "as-4",
      assignment_id: "a-4",
      student_id: "s-4",
      student_name: "Brian Otieno",
      title: "Support Work",
      subject: "English",
      due_date: "2026-08-01",
      status: "needs_support",
      description: "Revise the draft.",
      created_at: "2026-07-15T08:00:00.000Z",
    },
    {
      assignment_student_id: "as-5",
      assignment_id: "a-5",
      student_id: "s-5",
      student_name: "Chloe Otieno",
      title: "Completed Work",
      subject: "Science",
      due_date: "2026-07-20",
      status: "completed",
      description: "Already complete.",
      created_at: "2026-07-15T08:00:00.000Z",
    },
  ]);

  const metrics = buildTeacherSummaryMetrics(columns, TODAY);
  const needsSupport = metrics.find((metric) => metric.label === "Needs Support");

  assert.equal(needsSupport?.value, "2");
});
