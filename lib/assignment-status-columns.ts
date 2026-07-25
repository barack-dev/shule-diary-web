import type { AssignmentCardData, AssignmentStatus, KanbanColumnData } from "./types";

export function applyAssignmentStatusToColumns(
  columns: KanbanColumnData[],
  assignmentId: string,
  status: AssignmentStatus,
): KanbanColumnData[] {
  const trimmedAssignmentId = assignmentId.trim();
  if (!trimmedAssignmentId) {
    return columns;
  }

  const sourceColumnIndex = columns.findIndex((column) =>
    column.items.some((item) => item.id === trimmedAssignmentId),
  );

  if (sourceColumnIndex < 0) {
    return columns;
  }

  const sourceAssignment = columns[sourceColumnIndex].items.find(
    (item) => item.id === trimmedAssignmentId,
  );

  if (!sourceAssignment) {
    return columns;
  }

  const updatedAssignment: AssignmentCardData = {
    ...sourceAssignment,
    status,
  };

  const targetColumnIndex = columns.findIndex((column) => column.title === status);
  if (targetColumnIndex < 0 || targetColumnIndex === sourceColumnIndex) {
    return columns.map((column, columnIndex) =>
      columnIndex === sourceColumnIndex
        ? {
            ...column,
            items: column.items.map((item) =>
              item.id === trimmedAssignmentId ? updatedAssignment : item,
            ),
          }
        : column,
    );
  }

  return columns.map((column, columnIndex) => {
    if (columnIndex === sourceColumnIndex) {
      return {
        ...column,
        items: column.items.filter((item) => item.id !== trimmedAssignmentId),
      };
    }

    if (columnIndex === targetColumnIndex) {
      return {
        ...column,
        items: [...column.items, updatedAssignment],
      };
    }

    return column;
  });
}
