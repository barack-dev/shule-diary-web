import { buildAssignmentLearningRecap } from "../lib/assignment-learning-recap";
import type { AssignmentCardData, AssignmentComment } from "../lib/types";

type Props = {
  assignment: AssignmentCardData;
  comments: AssignmentComment[];
};

export default function AssignmentLearningRecapPanel({ assignment, comments }: Props) {
  const recap = buildAssignmentLearningRecap(assignment, comments);

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Learning recap
      </h4>
      <dl className="grid grid-cols-1 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Latest update</dt>
          <dd className="mt-1 text-slate-700">{recap.latestUpdate}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Next step</dt>
          <dd className="mt-1 font-medium text-slate-900">{recap.nextStep}</dd>
        </div>
      </dl>
    </section>
  );
}
