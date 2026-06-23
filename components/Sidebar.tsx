import React from "react";

export default function Sidebar() {
  return (
    <aside className="hidden w-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-slate-950">ShuleDiary</h1>
        <p className="mt-1 text-sm text-slate-500">Teacher dashboard</p>
      </div>
      <nav className="flex flex-1 flex-col gap-2 text-sm text-slate-700">
        {["Dashboard", "Classes", "Assignments", "Students", "Messages", "Settings"].map((item) => (
          <a
            key={item}
            className={`rounded-2xl px-4 py-3 transition hover:bg-slate-100 ${
              item === "Dashboard" ? "bg-slate-100 font-semibold text-slate-900" : ""
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
