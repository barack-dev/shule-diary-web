import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardQuickStats } from "../lib/dashboard-quick-stats.ts";
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

test("buildDashboardQuickStats counts attention and completed groups", () => {
  const columns: KanbanColumnData[] = [
    {
      title: "Assigned",
      items: [
        createAssignment({
          id: "overdue-1",
          due: "Jul 20",
          dueDateRaw: "2026-07-20",
        }),
        createAssignment({
          id: "due-soon-1",
          due: "Jul 27",
          dueDateRaw: "2026-07-27",
        }),
      ],
    },
    {
      title: "Needs Support",
      items: [
        createAssignment({
          id: "support-1",
          status: "Needs Support",
          due: "Aug 10",
          dueDateRaw: "2026-08-10",
        }),
      ],
    },
    {
      title: "Completed",
      items: [
        createAssignment({
          id: "completed-1",
          status: "Completed",
          due: "Jul 20",
          dueDateRaw: "2026-07-20",
        }),
      ],
    },
  ];

  const stats = buildDashboardQuickStats(columns, NOW);

  assert.deepEqual(
    Object.fromEntries(stats.map((stat) => [stat.key, stat.value])),
    {
      overdue: "1",
      "due-soon": "1",
      "needs-support": "1",
      completed: "1",
    },
  );
});
