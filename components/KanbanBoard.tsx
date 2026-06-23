"use client";

import React, { useMemo, useState } from "react";
import type { AssignmentCardData, AssignmentComment, KanbanColumnData } from "../lib/types";
import KanbanColumn from "./KanbanColumn";
import AssignmentDetailsPanel from "./AssignmentDetailsPanel";

type Props = {
  columns: KanbanColumnData[];
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

export default function KanbanBoard({ columns }: Props) {
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentCardData | null>(null);
  const [commentsByAssignment, setCommentsByAssignment] = useState<Record<string, AssignmentComment[]>>(() =>
    buildCommentsLookup(columns),
  );

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
      authorName: "Ms. Njeri",
      authorRole: "Teacher",
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

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">Assignment Kanban</h3>
          <p className="mt-1 text-sm text-slate-500">Quick view of task status across students and parents.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">Sample board</div>
      </div>

      <div className="space-y-4 md:space-y-0 md:overflow-x-auto">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {columnsWithLiveComments.map((col) => (
            <KanbanColumn key={col.title} column={col} onSelectAssignment={setSelectedAssignment} />
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
          />
        </>
      ) : null}
    </div>
  );
}
