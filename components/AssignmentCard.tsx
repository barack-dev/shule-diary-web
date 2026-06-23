import React from "react";
import type { AssignmentCardData } from "../lib/types";

type Props = {
  item: AssignmentCardData;
  onSelect?: (item: AssignmentCardData) => void;
};

export default function AssignmentCard({ item, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
      <p className="mt-2 text-sm text-slate-600">{item.subject} · {item.student}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Due {item.due}</span>
        <span>{item.comments.length} comments</span>
      </div>
    </button>
  );
}
