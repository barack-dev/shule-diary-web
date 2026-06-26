import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import {
  buildProfileOwnerFilter,
  hasCompleteProfileSetup,
  isExpectedLoggedOutAuthError,
} from "../../lib/auth-utils";
import { createClient } from "../../lib/supabase/server";
import { getLoginRouteDecision } from "../../lib/auth-routing";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, school_name, role")
      .or(buildProfileOwnerFilter(user.id))
      .maybeSingle();
    const decision = getLoginRouteDecision(
      true,
      hasCompleteProfileSetup(profileData),
    );

    if (decision.type === "redirect") {
      redirect(decision.destination);
    }
  }

  const showSessionWarning = error ? !isExpectedLoggedOutAuthError(error) : false;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-amber-200/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-6 text-slate-900 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-700 text-base font-bold text-white">
              SD
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                ShuleDiary
              </p>
              <h1 className="text-2xl font-semibold text-slate-950">Welcome back</h1>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            Sign in to view assignment progress, comments, and the latest class updates.
          </p>

          {showSessionWarning ? (
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
