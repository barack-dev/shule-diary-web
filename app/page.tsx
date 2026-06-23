export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex">
          <div className="mb-10">
            <h1 className="text-2xl font-semibold text-slate-950">ShuleDiary</h1>
            <p className="mt-1 text-sm text-slate-500">Teacher dashboard</p>
          </div>
          <nav className="flex flex-1 flex-col gap-2 text-sm text-slate-700">
            {[
              "Dashboard",
              "Classes",
              "Assignments",
              "Students",
              "Messages",
              "Settings",
            ].map((item) => (
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

        <main className="flex min-h-screen flex-1 flex-col gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                  Teacher Dashboard
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Track homework, parent comments, and student progress</h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                Updated today
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Students", value: "32" },
              { label: "Pending Assignments", value: "14" },
              { label: "Submitted Work", value: "21" },
              { label: "Needs Support", value: "5" },
            ].map((card) => (
              <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Assignment Kanban</h3>
                <p className="mt-1 text-sm text-slate-500">Quick view of task status across students and parents.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                Sample board
              </div>
            </div>

            <div className="space-y-4 md:space-y-0 md:overflow-x-auto">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                {[
                  {
                    title: "Assigned",
                    items: [
                      {
                        title: "Math worksheet",
                        subject: "Math",
                        student: "Amina",
                        due: "Jun 23",
                        comments: 2,
                      },
                    ],
                  },
                  {
                    title: "Seen by Parent",
                    items: [
                      {
                        title: "Science summary",
                        subject: "Science",
                        student: "Brian",
                        due: "Jun 25",
                        comments: 1,
                      },
                    ],
                  },
                  {
                    title: "In Progress",
                    items: [
                      {
                        title: "History chart",
                        subject: "History",
                        student: "Chloe",
                        due: "Jun 24",
                        comments: 3,
                      },
                    ],
                  },
                  {
                    title: "Submitted",
                    items: [
                      {
                        title: "English essay",
                        subject: "English",
                        student: "Dawit",
                        due: "Jun 22",
                        comments: 4,
                      },
                    ],
                  },
                  {
                    title: "Reviewed",
                    items: [
                      {
                        title: "Art reflection",
                        subject: "Art",
                        student: "Emma",
                        due: "Jun 20",
                        comments: 0,
                      },
                    ],
                  },
                  {
                    title: "Completed",
                    items: [
                      {
                        title: "Reading log",
                        subject: "Literacy",
                        student: "Felix",
                        due: "Jun 19",
                        comments: 2,
                      },
                    ],
                  },
                ].map((column) => (
                  <div key={column.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900">{column.title}</h4>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500">{column.items.length}</span>
                    </div>
                    <div className="space-y-4">
                      {column.items.map((item) => (
                        <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-2 text-sm text-slate-600">{item.subject} · {item.student}</p>
                          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                            <span>Due {item.due}</span>
                            <span>{item.comments} comments</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
