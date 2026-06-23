import React from "react";
import type { AssignmentCardData } from "../lib/types";

export default function AssignmentCard({ item }: { item: AssignmentCardData }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
      <p className="mt-2 text-sm text-slate-600">{item.subject} · {item.student}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Due {item.due}</span>
        <span>{item.comments} comments</span>
      </div>
    </div>
  );
}
