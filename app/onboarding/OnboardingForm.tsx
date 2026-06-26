"use client";

import { useActionState } from "react";
import { saveOnboardingProfile } from "./actions";
import { ONBOARDING_ACTION_INITIAL_STATE } from "./state";

type Props = {
  defaultFullName?: string;
  defaultSchoolName?: string;
  defaultRole?: string;
};

export default function OnboardingForm({
  defaultFullName,
  defaultSchoolName,
  defaultRole,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveOnboardingProfile,
    ONBOARDING_ACTION_INITIAL_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={defaultFullName}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
          placeholder="Grace Wanjiku"
        />
      </div>

      <div>
        <label htmlFor="schoolName" className="mb-1.5 block text-sm font-semibold text-slate-700">
          School name
        </label>
        <input
          id="schoolName"
          name="schoolName"
          type="text"
          required
          defaultValue={defaultSchoolName}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
          placeholder="Shule Primary"
        />
      </div>

      <div>
        <label htmlFor="role" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue={defaultRole ?? "teacher"}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
        >
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Teacher and Parent dashboards are available now. Student and Admin roles are saved for upcoming views.
      </p>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving profile..." : "Save profile"}
      </button>
    </form>
  );
}
