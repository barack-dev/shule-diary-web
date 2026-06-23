import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import SummaryCard from "../components/SummaryCard";
import KanbanBoard from "../components/KanbanBoard";
import { summaryMetrics, kanbanColumns } from "../lib/mock-data";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />

        <main className="flex min-h-screen flex-1 flex-col gap-6">
          <DashboardHeader />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryMetrics.map((metric) => (
              <SummaryCard key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <KanbanBoard columns={kanbanColumns} />
          </section>
        </main>
      </div>
    </div>
  );
}
