"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { AssignmentCardData } from "../lib/types";

type Props = {
  item: AssignmentCardData;
  onSelect?: (item: AssignmentCardData) => void;
  isDragOverlay?: boolean;
};

type CardBodyProps = {
  item: AssignmentCardData;
  dragging?: boolean;
};

function CardBody({ item, dragging = false }: CardBodyProps) {
  return (
    <>
      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
      <p className="mt-2 text-sm text-slate-600">
        {item.subject} · {item.student}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>Due {item.due}</span>
        <span>
          {item.comments.length} comment{item.comments.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {dragging ? "Moving" : "Click to open · Drag to move"}
      </div>
    </>
  );
}

export default function AssignmentCard({ item, onSelect, isDragOverlay = false }: Props) {
  const itemId = item.id ?? item.title;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
    data: {
      type: "assignment",
      assignmentId: itemId,
      status: item.status,
    },
    disabled: isDragOverlay,
  });

  if (isDragOverlay) {
    return (
      <div className="w-full rounded-3xl border border-slate-300 bg-white p-4 text-left shadow-xl">
        <CardBody item={item} dragging />
      </div>
    );
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect?.(item)}
      className="w-full cursor-grab rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:cursor-grabbing"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <CardBody item={item} dragging={isDragging} />
    </button>
  );
}
