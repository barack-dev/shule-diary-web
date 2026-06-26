export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6">
        <aside className="hidden w-72 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:block">
          <div className="h-7 w-36 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-28 rounded bg-slate-100" />
          <div className="mt-10 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-11 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="mt-4 h-8 max-w-xl rounded bg-slate-100" />
            <div className="mt-3 h-4 w-56 rounded bg-slate-100" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="mt-5 h-8 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-44 rounded bg-slate-200" />
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl bg-slate-50 p-4">
                  <div className="h-5 w-28 rounded bg-slate-200" />
                  <div className="mt-5 space-y-4">
                    <div className="h-28 rounded-3xl bg-white" />
                    <div className="h-28 rounded-3xl bg-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

