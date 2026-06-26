export default function LoginLoading() {
  return (
    <main className="relative min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-6 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-7 w-40 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-cyan-100" />
          </div>
        </section>
      </div>
    </main>
  );
}

