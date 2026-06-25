"use client";

import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
import { insertAssignmentComment } from "../lib/assignment-comments";
import type {
  AssignmentCardData,
  AssignmentComment,
  CommentAuthorRole,
  KanbanColumnData,
} from "../lib/types";
import AssignmentDetailsPanel from "./AssignmentDetailsPanel";
import AssignmentCard from "./AssignmentCard";
import KanbanColumn from "./KanbanColumn";

type Props = {
  columns: KanbanColumnData[];
  title?: string;
  description?: string;
  badgeLabel?: string;
  commentAuthor?: {
    name: string;
    role: CommentAuthorRole;
  };
  commentsTitle?: string;
  commentPlaceholder?: string;
  commentButtonLabel?: string;
};

type DragEndOverData = {
  type?: string;
  status?: string;
};

type DragEndEvent = {
  active: { id: string | number };
  over: {
    id: string | number;
    data: {
      current?: DragEndOverData;
    };
  } | null;
};

type DragComputationResult = {
  nextColumns: KanbanColumnData[];
};

function buildCommentsLookup(data: KanbanColumnData[]): Record<string, AssignmentComment[]> {
  const entries = data.flatMap((column) =>
    column.items
      .filter((item): item is AssignmentCardData & { id: string } => Boolean(item.id))
      .map((item) => [item.id, item.comments] as const),
  );

  return Object.fromEntries(entries);
}

export default function KanbanBoard({
  columns,
  title = "Assignment Kanban",
  description = "Quick view of task status across students and parents.",
  badgeLabel = "Sample board",
  commentAuthor = {
    name: "Demo Teacher",
    role: "Teacher",
  },
  commentsTitle,
  commentPlaceholder,
  commentButtonLabel,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [boardColumns, setBoardColumns] = useState<KanbanColumnData[]>(columns);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [commentsByAssignment, setCommentsByAssignment] = useState<
    Record<string, AssignmentComment[]>
  >(() => buildCommentsLookup(columns));
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [commentSaveError, setCommentSaveError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setBoardColumns(columns);
    setCommentsByAssignment(buildCommentsLookup(columns));
    setSelectedAssignmentId(null);
    setActiveAssignmentId(null);
    setIsSavingComment(false);
    setCommentSaveError(null);
  }, [columns]);

  useEffect(() => {
    setCommentSaveError(null);
  }, [selectedAssignmentId]);

  const assignmentsById = useMemo(() => {
    const entries = boardColumns.flatMap((column) =>
      column.items
        .filter((item): item is AssignmentCardData & { id: string } => Boolean(item.id))
        .map((item) => [item.id, item] as const),
    );
    return Object.fromEntries(entries);
  }, [boardColumns]);

  const selectedAssignment = selectedAssignmentId ? assignmentsById[selectedAssignmentId] ?? null : null;
  const activeAssignment = activeAssignmentId ? assignmentsById[activeAssignmentId] ?? null : null;

  const selectedComments = useMemo(() => {
    if (!selectedAssignment?.id) {
      return [];
    }
    return commentsByAssignment[selectedAssignment.id] ?? selectedAssignment.comments;
  }, [commentsByAssignment, selectedAssignment]);

  const handleAddComment = async (message: string) => {
    const assignmentId = selectedAssignment?.id;
    const assignmentStudentId = selectedAssignment?.assignmentStudentId;
    if (!assignmentId || !assignmentStudentId) {
      setCommentSaveError("This assignment cannot accept comments right now. Please refresh and try again.");
      return;
    }

    setCommentSaveError(null);
    setIsSavingComment(true);

    try {
      const newComment = await insertAssignmentComment({
        assignmentStudentId,
        authorName: commentAuthor.name,
        authorRole: commentAuthor.role,
        message,
      });

      setCommentsByAssignment((previous) => {
        const existing = previous[assignmentId] ?? [];
        return {
          ...previous,
          [assignmentId]: [...existing, newComment],
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error("[ShuleDiary] Unable to save assignment comment:", error.message);
        setCommentSaveError(error.message || "Could not save comment. Please try again.");
      } else {
        console.error("[ShuleDiary] Unable to save assignment comment:", error);
        setCommentSaveError("Could not save comment. Please try again.");
      }
      throw new Error("COMMENT_SAVE_FAILED");
    } finally {
      setIsSavingComment(false);
    }
  };

  const columnsWithLiveComments = useMemo(() => {
    return boardColumns.map((column) => ({
      ...column,
      items: column.items.map((item) => {
          if (!item.id) {
            return item;
          }
          return {
            ...item,
            comments: commentsByAssignment[item.id] ?? item.comments,
          };
        }),
    }));
  }, [boardColumns, commentsByAssignment]);

  const findColumnIndexByCardId = (state: KanbanColumnData[], assignmentId: string) => {
    return state.findIndex((column) => column.items.some((item) => item.id === assignmentId));
  };

  const findColumnIndexByStatus = (state: KanbanColumnData[], status: string) => {
    return state.findIndex((column) => column.title === status);
  };

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setActiveAssignmentId(String(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveAssignmentId(null);
  };

  const computeDragResult = (
    previous: KanbanColumnData[],
    activeId: string,
    overId: string,
    overType: string | undefined,
    overStatus: string | undefined,
  ): DragComputationResult | null => {
    const sourceColumnIndex = findColumnIndexByCardId(previous, activeId);
    if (sourceColumnIndex < 0) {
      return null;
    }

    const sourceItems = previous[sourceColumnIndex].items;
    const sourceItemIndex = sourceItems.findIndex((item) => item.id === activeId);
    if (sourceItemIndex < 0) {
      return null;
    }

    let targetColumnIndex = -1;
    if (overType === "column" && overStatus) {
      targetColumnIndex = findColumnIndexByStatus(previous, overStatus);
    } else {
      targetColumnIndex = findColumnIndexByCardId(previous, overId);
    }

    if (targetColumnIndex < 0) {
      return null;
    }

    const isColumnDrop = overType === "column";
    const sourceColumn = previous[sourceColumnIndex];
    const targetColumn = previous[targetColumnIndex];

    if (sourceColumnIndex === targetColumnIndex) {
      if (isColumnDrop) {
        return null;
      }

      const targetItemIndex = sourceColumn.items.findIndex((item) => item.id === overId);
      if (targetItemIndex < 0 || targetItemIndex === sourceItemIndex) {
        return null;
      }

      const reorderedItems = arrayMove(sourceColumn.items, sourceItemIndex, targetItemIndex);
      const nextColumns = previous.map((column, index) =>
        index === sourceColumnIndex ? { ...column, items: reorderedItems } : column,
      );

      return {
        nextColumns,
      };
    }

    const nextSourceItems = [...sourceColumn.items];
    const [movedItem] = nextSourceItems.splice(sourceItemIndex, 1);
    if (!movedItem) {
      return null;
    }

    const nextTargetItems = [...targetColumn.items];
    const targetItemIndex = isColumnDrop
      ? nextTargetItems.length
      : nextTargetItems.findIndex((item) => item.id === overId);

    const movedWithStatus: AssignmentCardData = {
      ...movedItem,
      status: targetColumn.title,
    };

    if (targetItemIndex < 0) {
      nextTargetItems.push(movedWithStatus);
    } else {
      nextTargetItems.splice(targetItemIndex, 0, movedWithStatus);
    }

    const nextColumns = previous.map((column, index) => {
      if (index === sourceColumnIndex) {
        return { ...column, items: nextSourceItems };
      }
      if (index === targetColumnIndex) {
        return { ...column, items: nextTargetItems };
      }
      return column;
    });

    return {
      nextColumns,
    };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const over = event.over;

    setActiveAssignmentId(null);

    if (!over) {
      return;
    }

    const overId = String(over.id);
    const overType = over.data.current?.type;
    const overStatus = over.data.current?.status;

    const dragResult = computeDragResult(
      boardColumns,
      activeId,
      overId,
      overType,
      overStatus,
    );

    if (!dragResult) {
      return;
    }

    setBoardColumns(dragResult.nextColumns);
  };

  const columnGridClass =
    columns.length <= 4
      ? "md:grid-cols-2 xl:grid-cols-4"
      : "md:grid-cols-2 xl:grid-cols-6";

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
          {badgeLabel}
        </div>
      </div>

      {!isMounted ? (
        <div className="space-y-4 md:space-y-0 md:overflow-x-auto">
          <div className={`grid gap-4 ${columnGridClass}`}>
            {columns.map((column) => (
              <div key={column.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">{column.label ?? column.title}</h4>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500">
                    {column.items.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {column.items.map((item) => (
                    <div key={item.id ?? item.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                      <div className="mt-4 h-3 w-1/3 animate-pulse rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isMounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4 md:space-y-0 md:overflow-x-auto">
            <div className={`grid gap-4 ${columnGridClass}`}>
              {columnsWithLiveComments.map((column) => (
                <KanbanColumn
                  key={column.title}
                  column={column}
                  onSelectAssignment={(assignment) =>
                    setSelectedAssignmentId(assignment.id ?? null)
                  }
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeAssignment ? <AssignmentCard item={activeAssignment} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      {selectedAssignment ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/20"
            onClick={() => setSelectedAssignmentId(null)}
            aria-label="Close assignment details"
          />
          <AssignmentDetailsPanel
            assignment={{
              ...selectedAssignment,
              comments: selectedComments,
            }}
            comments={selectedComments}
            onClose={() => setSelectedAssignmentId(null)}
            onAddComment={handleAddComment}
            isSavingComment={isSavingComment}
            commentSaveError={commentSaveError}
            commentsTitle={commentsTitle}
            commentPlaceholder={commentPlaceholder}
            commentButtonLabel={commentButtonLabel}
          />
        </>
      ) : null}
    </div>
  );
}
