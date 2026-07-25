import type { KanbanColumnData } from "./types.ts";

export function buildKanbanBoardStateKey(columns: KanbanColumnData[]): string {
  return columns
    .map((column) => {
      const itemKeys = column.items
        .map((item) => {
          const commentKeys = item.comments.map((comment) => comment.id).join(",");
          return [
            item.id ?? "",
            item.assignmentStudentId ?? "",
            item.status,
            item.dueDateRaw ?? "",
            item.createdAtRaw ?? "",
            commentKeys,
          ].join("/");
        })
        .join(",");

      return `${column.title}:${itemKeys}`;
    })
    .join("|");
}
