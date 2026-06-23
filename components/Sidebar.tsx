import type { DashboardRole } from "../lib/types";

const navigation: Record<DashboardRole, string[]> = {
  teacher: ["Dashboard", "Classes", "Assignments", "Students", "Messages", "Settings"],
  parent: ["Home", "Homework", "Teacher Updates", "Progress", "Messages", "Settings"],
};

export default function Sidebar({ role = "teacher" }: { role?: DashboardRole }) {
  const items = navigation[role];

  return (
    <aside className="hidden w-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-slate-950">ShuleDiary</h1>
        <p className="mt-1 text-sm text-slate-500">
          {role === "teacher" ? "Teacher dashboard" : "Parent dashboard"}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-2 text-sm text-slate-700">
        {items.map((item, index) => (
          <a
            key={item}
            className={`rounded-2xl px-4 py-3 transition hover:bg-slate-100 ${
              index === 0 ? "bg-slate-100 font-semibold text-slate-900" : ""
            }`}
            href="#"
          >
            {item}
          </a>
        ))}
      </nav>
    </aside>
  );
}
