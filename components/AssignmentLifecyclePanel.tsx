import { buildAssignmentLifecycleSteps } from "../lib/assignment-lifecycle";
import type { AssignmentCardData } from "../lib/types";

type Props = {
  assignment: AssignmentCardData;
};

const STATE_CLASSES = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  current: "border-sky-200 bg-sky-50 text-sky-700",
  attention: "border-amber-200 bg-amber-50 text-amber-800",
  upcoming: "border-slate-200 bg-slate-50 text-slate-500",
} as const;

export default function AssignmentLifecyclePanel({ assignment }: Props) {
  const steps = buildAssignmentLifecycleSteps(assignment);

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Assignment path
        </h4>
        <p className="mt-2 text-sm font-medium text-slate-900">
          Current status: {assignment.status}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.status}
            className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${STATE_CLASSES[step.state]}`}
          >
            {step.label}
          </div>
        ))}
      </div>
    </section>
  );
}
