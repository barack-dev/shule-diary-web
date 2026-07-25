import assert from "node:assert/strict";
import test from "node:test";
import { buildKanbanBoardStateKey } from "../lib/kanban-board-state.ts";
import type { KanbanColumnData } from "../lib/types.ts";

const BASE_COLUMNS: KanbanColumnData[] = [
  {
    title: "Assigned",
    items: [
      {
        id: "assignment-1",
        assignmentStudentId: "assignment-student-1",
        title: "Fractions Homework",
        subject: "Math",
        student: "Amina Otieno",
        due: "Jul 26",
        dueDateRaw: "2026-07-26",
        createdAtRaw: "2026-07-25T07:00:00.000Z",
        description: "Complete questions 1 through 8",
        comments: [],
        status: "Assigned",
      },
    ],
  },
];

test("kanban board state key changes when server-loaded assignments change", () => {
  const nextColumns: KanbanColumnData[] = [
    {
      ...BASE_COLUMNS[0],
      items: [
        ...BASE_COLUMNS[0].items,
        {
          ...BASE_COLUMNS[0].items[0],
          id: "assignment-2",
          assignmentStudentId: "assignment-student-2",
        },
      ],
    },
  ];

  assert.notEqual(
    buildKanbanBoardStateKey(BASE_COLUMNS),
    buildKanbanBoardStateKey(nextColumns),
  );
});

test("kanban board state key changes when server-loaded comments change", () => {
  const nextColumns: KanbanColumnData[] = [
    {
      ...BASE_COLUMNS[0],
      items: [
        {
          ...BASE_COLUMNS[0].items[0],
          comments: [
            {
              id: "comment-1",
              authorName: "Grace Wanjiku",
              authorRole: "Teacher",
              message: "Please show your working.",
              createdAt: "Jul 25, 08:30",
              createdAtRaw: "2026-07-25T08:30:00.000Z",
            },
          ],
        },
      ],
    },
  ];

  assert.notEqual(
    buildKanbanBoardStateKey(BASE_COLUMNS),
    buildKanbanBoardStateKey(nextColumns),
  );
});
