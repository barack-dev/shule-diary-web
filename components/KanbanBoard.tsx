import React from "react";
import type { KanbanColumnData } from "../lib/types";
import KanbanColumn from "./KanbanColumn";

export default function KanbanBoard({ columns }: { columns: KanbanColumnData[] }) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">Assignment Kanban</h3>
          <p className="mt-1 text-sm text-slate-500">Quick view of task status across students and parents.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">Sample board</div>
      </div>

      <div className="space-y-4 md:space-y-0 md:overflow-x-auto">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {columns.map((col) => (
            <KanbanColumn key={col.title} column={col} />
          ))}
        </div>
      </div>
    </div>
  );
}
