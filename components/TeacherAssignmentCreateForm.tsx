"use client";

import { useActionState, useState } from "react";
import { createTeacherAssignment } from "../app/dashboard/actions";
import {
  CREATE_ASSIGNMENT_INITIAL_STATE,
  getTomorrowDateInputValue,
  type AssignmentTargetOption,
} from "../lib/assignment-creation";

type Props = {
  targetOptions: AssignmentTargetOption[];
};

export default function TeacherAssignmentCreateForm({ targetOptions }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createTeacherAssignment,
    CREATE_ASSIGNMENT_INITIAL_STATE,
  );

  const hasTargets = targetOptions.length > 0;
  const minimumDueDate = getTomorrowDateInputValue();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Create assignment</h3>
          <p className="mt-1 text-sm text-slate-600">
            Add a new assignment for one class or one student.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="rounded-2xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2"
        >
          {isOpen ? "Close" : "Create assignment"}
        </button>
      </div>

      {isOpen ? (
        <form action={formAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="assignment-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Title
            </label>
            <input
              id="assignment-title"
              name="title"
              type="text"
              required
              placeholder="Math worksheet"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label htmlFor="assignment-subject" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Subject
            </label>
            <input
              id="assignment-subject"
              name="subject"
              type="text"
              required
              placeholder="Mathematics"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label htmlFor="assignment-due-date" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Due date
            </label>
            <input
              id="assignment-due-date"
              name="dueDate"
              type="date"
              min={minimumDueDate}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label htmlFor="assignment-target" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Target
            </label>
            <select
              id="assignment-target"
              name="target"
              required
              disabled={!hasTargets}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              defaultValue=""
            >
              <option value="" disabled>
                {hasTargets ? "Select class or student" : "No available class or student targets"}
              </option>
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="assignment-description" className="mb-1.5 block text-sm font-semibold text-slate-700">
              Instructions
            </label>
            <textarea
              id="assignment-description"
              name="description"
              required
              rows={4}
              placeholder="Write clear instructions for students and families."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {state.error ? (
            <p className="md:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {state.success}
            </p>
          ) : null}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending || !hasTargets}
              className="rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? "Saving assignment..." : "Save assignment"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
