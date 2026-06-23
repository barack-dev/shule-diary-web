import type {
  KanbanColumnData,
  ParentProfile,
  ParentSummaryMetric,
} from "../lib/types";
import KanbanBoard from "./KanbanBoard";
import ParentSummaryCard from "./ParentSummaryCard";

type Props = {
  profile: ParentProfile;
  metrics: ParentSummaryMetric[];
  columns: KanbanColumnData[];
};

export default function ParentDashboard({ profile, metrics, columns }: Props) {
  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white">
              {profile.childName
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Learning overview for</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                {profile.childName}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {profile.grade} · {profile.className}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            Class teacher{" "}
            <span className="font-semibold text-slate-900">{profile.classTeacher}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <ParentSummaryCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <KanbanBoard
          columns={columns}
          title={`${profile.childName.split(" ")[0]}'s assignments`}
          description="Open an assignment to read instructions and see the latest teacher feedback."
          badgeLabel="This week"
          commentAuthor={{
            name: "Amina's Parent",
            role: "Parent",
          }}
          commentsTitle="Teacher & family comments"
          commentPlaceholder="Ask the teacher a question or share an update..."
          commentButtonLabel="Send comment"
        />
      </section>
    </>
  );
}
