import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";
import {
  buildProfileOwnerFilter,
  hasCompleteProfileSetup,
} from "../../lib/auth-utils";
import { getOnboardingRouteDecision } from "../../lib/auth-routing";
import { createClient } from "../../lib/supabase/server";

type ExistingProfileRow = {
  id: string;
  full_name: string | null;
  school_name: string | null;
  role: string | null;
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, school_name, role")
    .or(buildProfileOwnerFilter(user.id))
    .maybeSingle();

  if (profileError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-xl">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              ShuleDiary
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-amber-950">Unable to load profile setup</h1>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              {profileError.message?.trim() || "Please try refreshing this page."}
            </p>
          </section>
        </div>
      </main>
    );
  }

  const existingProfile = (profileData ?? null) as ExistingProfileRow | null;
  const decision = getOnboardingRouteDecision(
    true,
    hasCompleteProfileSetup(existingProfile),
  );

  if (decision.type === "redirect") {
    redirect(decision.destination);
  }

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
              <h1 className="text-2xl font-semibold text-slate-950">Set up your profile</h1>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            This is a one-time setup so we can personalize your dashboard and load your data.
          </p>

          <div className="mt-6">
            <OnboardingForm
              defaultFullName={existingProfile?.full_name ?? undefined}
              defaultSchoolName={existingProfile?.school_name ?? undefined}
              defaultRole={existingProfile?.role ?? undefined}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
