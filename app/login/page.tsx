import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-md">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            ShuleDiary
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your email and password to open your dashboard.
          </p>

          {error ? (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              We could not verify your current session right now. You can still sign in below.
            </p>
          ) : null}

          <div className="mt-6">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
