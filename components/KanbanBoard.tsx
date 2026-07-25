"use client";

import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState, useSyncExternalStore } from "react";
import { countAssignmentsNeedingAttention } from "../lib/assignment-priority";
import {
  countKanbanAssignments,
  filterKanbanColumns,
  type AssignmentDueDateGroup,
} from "../lib/assignment-filters";
import { insertAssignmentComment } from "../lib/assignment-comments";
import { updateAssignmentStatus } from "../lib/assignment-status";
import type {
  AssignmentCardData,
  AssignmentComment,
  AssignmentStatus,
  CommentAuthorRole,
  KanbanColumnData,
} from "../lib/types";
import AssignmentDetailsPanel from "./AssignmentDetailsPanel";
import AssignmentProgressPanel from "./AssignmentProgressPanel";
import AssignmentQuickStatsPanel from "./AssignmentQuickStatsPanel";
import AssignmentCard from "./AssignmentCard";
import KanbanColumn from "./KanbanColumn";
import RecentActivityPanel from "./RecentActivityPanel";

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
  statusChangeToPersist: {
    assignmentStudentId: string;
    status: AssignmentStatus;
  } | null;
  persistenceBlockedReason: string | null;
};

function buildCommentsLookup(data: KanbanColumnData[]): Record<string, AssignmentComment[]> {
  const entries = data.flatMap((column) =>
    column.items
      .filter((item): item is AssignmentCardData & { id: string } => Boolean(item.id))
      .map((item) => [item.id, item.comments] as const),
  );

  return Object.fromEntries(entries);
}

function subscribeToClientHydration(onStoreChange: () => void) {
  onStoreChange();
  return () => {};
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
  const isMounted = useSyncExternalStore(
    subscribeToClientHydration,
    () => true,
    () => false,
  );

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
  const [commentSaveSuccess, setCommentSaveSuccess] = useState<string | null>(null);
  const [statusSaveError, setStatusSaveError] = useState<string | null>(null);
  const [statusSaveSuccess, setStatusSaveSuccess] = useState<string | null>(null);
  const [statusSaveInFlightCount, setStatusSaveInFlightCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState<string | "all">("all");
  const [dueDateFilter, setDueDateFilter] = useState<AssignmentDueDateGroup>("all");

  const isSavingStatus = statusSaveInFlightCount > 0;

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
      setCommentSaveSuccess(null);
      return;
    }

    setCommentSaveError(null);
    setCommentSaveSuccess(null);
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
      setCommentSaveSuccess("Comment saved.");
    } catch (error) {
      if (error instanceof Error) {
        console.error("[ShuleDiary] Unable to save assignment comment:", error.message);
        setCommentSaveError(error.message || "Could not save comment. Please try again.");
      } else {
        console.error("[ShuleDiary] Unable to save assignment comment:", error);
        setCommentSaveError("Could not save comment. Please try again.");
      }
      setCommentSaveSuccess(null);
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

  const statusFilterOptions = useMemo(() => {
    return Array.from(new Set(boardColumns.map((column) => column.title)));
  }, [boardColumns]);

  const subjectFilterOptions = useMemo(() => {
    return Array.from(
      new Set(
        boardColumns.flatMap((column) =>
          column.items
            .map((item) => item.subject.trim())
            .filter((subject) => subject.length > 0),
        ),
      ),
    ).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
  }, [boardColumns]);

  const activeFiltersCount =
    (searchQuery.trim().length > 0 ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (subjectFilter !== "all" ? 1 : 0) +
    (dueDateFilter !== "all" ? 1 : 0);

  const filteredColumnsWithLiveComments = useMemo(() => {
    return filterKanbanColumns(columnsWithLiveComments, {
      query: searchQuery,
      status: statusFilter,
      subject: subjectFilter,
      dueDateGroup: dueDateFilter,
    });
  }, [columnsWithLiveComments, dueDateFilter, searchQuery, statusFilter, subjectFilter]);

  const totalAssignmentCount = useMemo(() => {
    return countKanbanAssignments(columnsWithLiveComments);
  }, [columnsWithLiveComments]);

  const filteredAssignmentCount = useMemo(() => {
    return countKanbanAssignments(filteredColumnsWithLiveComments);
  }, [filteredColumnsWithLiveComments]);

  const needsAttentionCount = useMemo(() => {
    return countAssignmentsNeedingAttention(columnsWithLiveComments);
  }, [columnsWithLiveComments]);

  const hasFilteredMatches = filteredAssignmentCount > 0;

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSubjectFilter("all");
    setDueDateFilter("all");
  };

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

  const handleSelectAssignment = (assignment: AssignmentCardData) => {
    setSelectedAssignmentId(assignment.id ?? null);
    setCommentSaveError(null);
    setCommentSaveSuccess(null);
  };

  const handleCloseAssignment = () => {
    setSelectedAssignmentId(null);
    setCommentSaveError(null);
    setCommentSaveSuccess(null);
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
        statusChangeToPersist: null,
        persistenceBlockedReason: null,
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

    const assignmentStudentId = movedItem.assignmentStudentId?.trim() ?? "";
    const statusChangeToPersist = assignmentStudentId
      ? {
          assignmentStudentId,
          status: targetColumn.title,
        }
      : null;

    return {
      nextColumns,
      statusChangeToPersist,
      persistenceBlockedReason: statusChangeToPersist
        ? null
        : "Status changed locally but this assignment is missing a Supabase assignment-student id.",
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

    const previousColumns = boardColumns;
    setBoardColumns(dragResult.nextColumns);

    if (dragResult.persistenceBlockedReason) {
      setStatusSaveError(`${dragResult.persistenceBlockedReason} Please refresh and try again.`);
      setStatusSaveSuccess(null);
      setBoardColumns(previousColumns);
      return;
    }

    if (!dragResult.statusChangeToPersist) {
      setStatusSaveError(null);
      setStatusSaveSuccess(null);
      return;
    }

    setStatusSaveError(null);
    setStatusSaveSuccess(null);
    setStatusSaveInFlightCount((current) => current + 1);
    void updateAssignmentStatus(dragResult.statusChangeToPersist)
      .then(() => {
        setStatusSaveSuccess("Status saved.");
      })
      .catch(() => {
        setBoardColumns(previousColumns);
        setStatusSaveSuccess(null);
        setStatusSaveError("Could not save assignment status. The card was moved back to its previous column.");
      })
      .finally(() => {
        setStatusSaveInFlightCount((current) => Math.max(0, current - 1));
      });
  };

  const columnGridClass =
    boardColumns.length <= 4
      ? "md:grid-cols-2 xl:grid-cols-4"
      : "md:grid-cols-2 xl:grid-cols-6";

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
          {statusSaveError ? (
            <p className="mt-2 text-sm text-rose-700">{statusSaveError}</p>
          ) : isSavingStatus ? (
            <p className="mt-2 text-sm text-slate-600">Saving status...</p>
          ) : statusSaveSuccess ? (
            <p className="mt-2 text-sm text-emerald-700">{statusSaveSuccess}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
            {badgeLabel}
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
            <span className="font-medium">Needs Attention</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-rose-700">
              {needsAttentionCount}
            </span>
          </div>
        </div>
      </div>

      <AssignmentQuickStatsPanel columns={columnsWithLiveComments} />

      <AssignmentProgressPanel columns={columnsWithLiveComments} />

      <RecentActivityPanel columns={columnsWithLiveComments} />

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="xl:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title, subject, student, or instructions"
              className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as AssignmentStatus | "all")}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">All statuses</option>
              {statusFilterOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Subject
            </span>
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">All subjects</option>
              {subjectFilterOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Due Date
            </span>
            <select
              value={dueDateFilter}
              onChange={(event) => setDueDateFilter(event.target.value as AssignmentDueDateGroup)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">All due dates</option>
              <option value="due-soon">Due soon</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Showing {filteredAssignmentCount} of {totalAssignmentCount} assignments
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={activeFiltersCount === 0}
            className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear filters
          </button>
        </div>
      </section>

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
          <div className="space-y-4">
            {!hasFilteredMatches ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No assignments match these filters yet. Try clearing or adjusting your search.
              </div>
            ) : null}

            <div className="md:overflow-x-auto">
              <div className={`grid gap-4 ${columnGridClass}`}>
                {filteredColumnsWithLiveComments.map((column) => (
                  <KanbanColumn
                    key={column.title}
                    column={column}
                    onSelectAssignment={handleSelectAssignment}
                  />
                ))}
              </div>
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
            onClick={handleCloseAssignment}
            aria-label="Close assignment details"
          />
          <AssignmentDetailsPanel
            assignment={{
              ...selectedAssignment,
              comments: selectedComments,
            }}
            comments={selectedComments}
            onClose={handleCloseAssignment}
            onAddComment={handleAddComment}
            isSavingComment={isSavingComment}
            commentSaveError={commentSaveError}
            commentSaveSuccess={commentSaveSuccess}
            commentsTitle={commentsTitle}
            commentPlaceholder={commentPlaceholder}
            commentButtonLabel={commentButtonLabel}
          />
        </>
      ) : null}
    </div>
  );
}
