import assert from "node:assert/strict";
import test from "node:test";
import {
  filterKanbanColumns,
  isAssignmentDueSoon,
  isAssignmentOverdue,
  matchesAssignmentFilters,
  type AssignmentFilters,
} from "../lib/assignment-filters.ts";
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

const KANBAN_COLUMNS: KanbanColumnData[] = [
  {
    title: "Assigned",
    items: [
      createAssignment({
        id: "a-1",
        title: "Fractions Homework",
        subject: "Math",
        student: "Amina Otieno",
        description: "Complete questions 1 through 8",
        dueDateRaw: "2026-07-26",
      }),
      createAssignment({
        id: "a-2",
        title: "Plant Reflection",
        subject: "Science",
        student: "Brian Njoroge",
        description: "Write a paragraph about photosynthesis",
        dueDateRaw: "2026-07-20",
      }),
    ],
  },
  {
    title: "Completed",
    items: [
      createAssignment({
        id: "a-3",
        status: "Completed",
        title: "Reading Log",
        subject: "English",
        student: "Amina Otieno",
        description: "Summarize chapter four",
        dueDateRaw: "2026-07-22",
      }),
    ],
  },
];

function createFilters(overrides: Partial<AssignmentFilters> = {}): AssignmentFilters {
  return {
    query: "",
    status: "all",
    subject: "all",
    dueDateGroup: "all",
    ...overrides,
  };
}

test("text search matches title, subject, student, and description", () => {
  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[0],
      createFilters({ query: "fractions" }),
      NOW,
    ),
    true,
  );

  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[0],
      createFilters({ query: "math" }),
      NOW,
    ),
    true,
  );

  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[0],
      createFilters({ query: "amina" }),
      NOW,
    ),
    true,
  );

  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[1],
      createFilters({ query: "photosynthesis" }),
      NOW,
    ),
    true,
  );

  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[0],
      createFilters({ query: "history" }),
      NOW,
    ),
    false,
  );
});

test("status and subject filters are applied", () => {
  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[0],
      createFilters({ status: "Assigned" }),
      NOW,
    ),
    true,
  );

  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[0],
      createFilters({ status: "Completed" }),
      NOW,
    ),
    false,
  );

  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[0],
      createFilters({ subject: "Math" }),
      NOW,
    ),
    true,
  );

  assert.equal(
    matchesAssignmentFilters(
      KANBAN_COLUMNS[0].items[0],
      createFilters({ subject: "Science" }),
      NOW,
    ),
    false,
  );
});

test("due soon and overdue helpers use dueDateRaw and ignore completed statuses", () => {
  const dueSoonAssignment = KANBAN_COLUMNS[0].items[0];
  const overdueAssignment = KANBAN_COLUMNS[0].items[1];
  const completedAssignment = KANBAN_COLUMNS[1].items[0];

  assert.equal(isAssignmentDueSoon(dueSoonAssignment, NOW), true);
  assert.equal(isAssignmentOverdue(dueSoonAssignment, NOW), false);

  assert.equal(isAssignmentDueSoon(overdueAssignment, NOW), false);
  assert.equal(isAssignmentOverdue(overdueAssignment, NOW), true);

  assert.equal(isAssignmentDueSoon(completedAssignment, NOW), false);
  assert.equal(isAssignmentOverdue(completedAssignment, NOW), false);
});

test("due soon and overdue helpers ignore display-only due labels", () => {
  const displayOnlyDate = createAssignment({
    id: "display-only-date",
    due: "Jul 26",
    dueDateRaw: undefined,
  });

  assert.equal(isAssignmentDueSoon(displayOnlyDate, NOW), false);
  assert.equal(isAssignmentOverdue(displayOnlyDate, NOW), false);
});

test("filterKanbanColumns preserves column layout while filtering assignments", () => {
  const filtered = filterKanbanColumns(
    KANBAN_COLUMNS,
    createFilters({ dueDateGroup: "overdue" }),
    NOW,
  );

  assert.equal(filtered.length, KANBAN_COLUMNS.length);
  assert.equal(filtered[0].title, "Assigned");
  assert.equal(filtered[1].title, "Completed");
  assert.equal(filtered[0].items.length, 1);
  assert.equal(filtered[0].items[0].id, "a-2");
  assert.equal(filtered[1].items.length, 0);
});
