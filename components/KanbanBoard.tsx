"use client";

import { useMemo, useState } from "react";
import type {
  AssignmentCardData,
  AssignmentComment,
  CommentAuthorRole,
  KanbanColumnData,
} from "../lib/types";
import AssignmentDetailsPanel from "./AssignmentDetailsPanel";
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

function formatNow(): string {
  const now = new Date();
  return now.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    name: "Ms. Njeri",
    role: "Teacher",
  },
  commentsTitle,
  commentPlaceholder,
  commentButtonLabel,
}: Props) {
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentCardData | null>(null);
  const [commentsByAssignment, setCommentsByAssignment] = useState<
    Record<string, AssignmentComment[]>
  >(() => buildCommentsLookup(columns));

  const selectedComments = useMemo(() => {
    if (!selectedAssignment?.id) {
      return [];
    }
    return commentsByAssignment[selectedAssignment.id] ?? selectedAssignment.comments;
  }, [commentsByAssignment, selectedAssignment]);

  const handleAddComment = (message: string) => {
    const assignmentId = selectedAssignment?.id;
    if (!assignmentId) {
      return;
    }

    const newComment: AssignmentComment = {
      id: `${assignmentId}-${Date.now()}`,
      authorName: commentAuthor.name,
      authorRole: commentAuthor.role,
      message,
      createdAt: formatNow(),
    };

    setCommentsByAssignment((previous) => {
      const existing = previous[assignmentId] ?? [];
      return {
        ...previous,
        [assignmentId]: [...existing, newComment],
      };
    });
  };

  const columnsWithLiveComments = useMemo(
    () =>
      columns.map((column) => ({
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
      })),
    [columns, commentsByAssignment],
  );

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

      <div className="space-y-4 md:space-y-0 md:overflow-x-auto">
        <div className={`grid gap-4 ${columnGridClass}`}>
          {columnsWithLiveComments.map((column) => (
            <KanbanColumn
              key={column.title}
              column={column}
              onSelectAssignment={setSelectedAssignment}
            />
          ))}
        </div>
      </div>

      {selectedAssignment ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/20"
            onClick={() => setSelectedAssignment(null)}
            aria-label="Close assignment details"
          />
          <AssignmentDetailsPanel
            assignment={{
              ...selectedAssignment,
              comments: selectedComments,
            }}
            comments={selectedComments}
            onClose={() => setSelectedAssignment(null)}
            onAddComment={handleAddComment}
            commentsTitle={commentsTitle}
            commentPlaceholder={commentPlaceholder}
            commentButtonLabel={commentButtonLabel}
          />
        </>
      ) : null}
    </div>
  );
}
