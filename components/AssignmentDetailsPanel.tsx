"use client";

import { useMemo, useState } from "react";
import type { AssignmentCardData, AssignmentComment } from "../lib/types";

type Props = {
  assignment: AssignmentCardData;
  comments: AssignmentComment[];
  onClose: () => void;
  onAddComment: (message: string) => void;
  commentsTitle?: string;
  commentPlaceholder?: string;
  commentButtonLabel?: string;
};

export default function AssignmentDetailsPanel({
  assignment,
  comments,
  onClose,
  onAddComment,
  commentsTitle = "Comments",
  commentPlaceholder = "Write a comment...",
  commentButtonLabel = "Add comment",
}: Props) {
  const [draft, setDraft] = useState("");

  const commentCountLabel = useMemo(() => {
    return `${comments.length} comment${comments.length === 1 ? "" : "s"}`;
  }, [comments.length]);

  const handleAddComment = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    onAddComment(trimmed);
    setDraft("");
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{assignment.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {assignment.subject} · {assignment.student}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          aria-label="Close assignment details"
        >
          Close
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Due date</dt>
              <dd className="font-medium text-slate-900">{assignment.due}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Current status</dt>
              <dd className="font-medium text-slate-900">{assignment.status}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Comment count</dt>
              <dd className="font-medium text-slate-900">{commentCountLabel}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Instructions
          </h4>
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            {assignment.description}
          </p>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {commentsTitle}
          </h4>
          {comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No comments yet.
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{comment.authorName}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {comment.authorRole}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{comment.message}</p>
                  <p className="mt-3 text-xs text-slate-500">{comment.createdAt}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="border-t border-slate-200 bg-white p-6">
        <label htmlFor="new-comment" className="sr-only">
          Add comment
        </label>
        <textarea
          id="new-comment"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={commentPlaceholder}
          className="min-h-28 w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleAddComment}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {commentButtonLabel}
          </button>
        </div>
      </div>
    </aside>
  );
}
