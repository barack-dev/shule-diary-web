"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[ShuleDiary] Dashboard route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
            ShuleDiary
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-rose-950">
            Dashboard could not open
          </h1>
          <p className="mt-3 text-sm leading-6 text-rose-900">
            Something went wrong while preparing your dashboard. Try again, and
            if it keeps happening, check the server logs for the matching error.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-6 rounded-2xl bg-rose-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </section>
      </div>
    </main>
  );
}

