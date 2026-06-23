"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { AssignmentCardData, KanbanColumnData } from "../lib/types";
import AssignmentCard from "./AssignmentCard";

type Props = {
  column: KanbanColumnData;
  onSelectAssignment?: (assignment: AssignmentCardData) => void;
};

export default function KanbanColumn({ column, onSelectAssignment }: Props) {
  const columnId = `column:${column.title}`;
  const itemIds = column.items.map((item) => item.id ?? item.title);
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
    data: {
      type: "column",
      status: column.title,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-3xl border p-4 transition ${
        isOver ? "border-slate-400 bg-slate-100" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">
          {column.label ?? column.title}
        </h4>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500">
          {column.items.length}
        </span>
      </div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {column.items.map((item) => (
            <AssignmentCard key={item.id ?? item.title} item={item} onSelect={onSelectAssignment} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
