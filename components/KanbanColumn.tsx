import type { AssignmentCardData, KanbanColumnData } from "../lib/types";
import AssignmentCard from "./AssignmentCard";

type Props = {
  column: KanbanColumnData;
  onSelectAssignment?: (assignment: AssignmentCardData) => void;
};

export default function KanbanColumn({ column, onSelectAssignment }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">
          {column.label ?? column.title}
        </h4>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500">
          {column.items.length}
        </span>
      </div>
      <div className="space-y-4">
        {column.items.map((item) => (
          <AssignmentCard key={item.id ?? item.title} item={item} onSelect={onSelectAssignment} />
        ))}
      </div>
    </div>
  );
}
