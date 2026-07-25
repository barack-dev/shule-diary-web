"use client";

import { useMemo, useState } from "react";
import { getAssignmentAttentionBadges } from "../lib/assignment-priority";
import {
  getParentProgressAction,
  type ParentProgressRequest,
} from "../lib/assignment-parent-workflow";
import {
  TEACHER_REVIEW_STATUS_OPTIONS,
  type AssignmentReviewRequest,
  type TeacherReviewStatus,
} from "../lib/assignment-review";
import type { AssignmentCardData, AssignmentComment } from "../lib/types";
import AssignmentLearningRecapPanel from "./AssignmentLearningRecapPanel";
import AssignmentLifecyclePanel from "./AssignmentLifecyclePanel";

type Props = {
  assignment: AssignmentCardData;
  comments: AssignmentComment[];
  onClose: () => void;
  onAddComment: (message: string) => Promise<void>;
  isSavingComment?: boolean;
  commentSaveError?: string | null;
  commentSaveSuccess?: string | null;
  commentsTitle?: string;
  commentPlaceholder?: string;
  commentButtonLabel?: string;
  commentTemplates?: string[];
  canReviewAssignment?: boolean;
  onReviewAssignment?: (request: AssignmentReviewRequest) => Promise<void>;
  isSavingReview?: boolean;
  reviewSaveError?: string | null;
  reviewSaveSuccess?: string | null;
  canUpdateParentProgress?: boolean;
  onUpdateParentProgress?: (request: ParentProgressRequest) => Promise<void>;
  isSavingParentProgress?: boolean;
  parentProgressSaveError?: string | null;
  parentProgressSaveSuccess?: string | null;
};

export default function AssignmentDetailsPanel({
  assignment,
  comments,
  onClose,
  onAddComment,
  isSavingComment = false,
  commentSaveError,
  commentSaveSuccess,
  commentsTitle = "Comments",
  commentPlaceholder = "Write a comment...",
  commentButtonLabel = "Add comment",
  commentTemplates = [],
  canReviewAssignment = false,
  onReviewAssignment,
  isSavingReview = false,
  reviewSaveError,
  reviewSaveSuccess,
  canUpdateParentProgress = false,
  onUpdateParentProgress,
  isSavingParentProgress = false,
  parentProgressSaveError,
  parentProgressSaveSuccess,
}: Props) {
  const [draft, setDraft] = useState("");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [parentProgressMessage, setParentProgressMessage] = useState("");
  const attentionBadges = getAssignmentAttentionBadges(assignment);
  const canSubmitReview = canReviewAssignment && assignment.status === "Submitted";
  const parentProgressAction = getParentProgressAction(
    assignment,
    canUpdateParentProgress,
  );
  const showReviewSection =
    canReviewAssignment &&
    (assignment.status === "Submitted" ||
      isSavingReview ||
      Boolean(reviewSaveError) ||
      Boolean(reviewSaveSuccess));
  const showParentProgressSection =
    canUpdateParentProgress &&
    (Boolean(parentProgressAction) ||
      isSavingParentProgress ||
      Boolean(parentProgressSaveError) ||
      Boolean(parentProgressSaveSuccess));

  const commentCountLabel = useMemo(() => {
    return `${comments.length} comment${comments.length === 1 ? "" : "s"}`;
  }, [comments.length]);

  const handleAddComment = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    try {
      await onAddComment(trimmed);
      setDraft("");
    } catch {
      // Save error state is shown by the parent component.
    }
  };

  const handleUseCommentTemplate = (template: string) => {
    setDraft((currentDraft) => {
      const trimmedDraft = currentDraft.trim();
      return trimmedDraft ? `${trimmedDraft}\n\n${template}` : template;
    });
  };

  const handleReviewAssignment = async (status: TeacherReviewStatus) => {
    if (!onReviewAssignment || !canSubmitReview) {
      return;
    }

    try {
      await onReviewAssignment({
        status,
        feedbackMessage: reviewFeedback,
      });
      setReviewFeedback("");
    } catch {
      // Review save error state is shown by the parent component.
    }
  };

  const handleUpdateParentProgress = async () => {
    if (!onUpdateParentProgress || !parentProgressAction) {
      return;
    }

    try {
      await onUpdateParentProgress({
        status: parentProgressAction.status,
        updateMessage: parentProgressMessage,
      });
      setParentProgressMessage("");
    } catch {
      // Parent progress save error state is shown by the parent component.
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{assignment.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {assignment.subject} · {assignment.student}
          </p>
          {attentionBadges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {attentionBadges.map((badge) => (
                <span
                  key={badge.kind}
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    badge.tone === "high"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
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

        <AssignmentLifecyclePanel assignment={assignment} />

        <AssignmentLearningRecapPanel assignment={assignment} comments={comments} />

        <section className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Instructions
          </h4>
          <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            {assignment.description}
          </p>
        </section>

        {showReviewSection ? (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Teacher review
              </h4>
              <p className="mt-2 text-sm font-medium text-slate-900">
                Current status: {assignment.status}
              </p>
            </div>

            {canSubmitReview ? (
              <>
                <label htmlFor="teacher-review-feedback" className="sr-only">
                  Teacher feedback
                </label>
                <textarea
                  id="teacher-review-feedback"
                  value={reviewFeedback}
                  onChange={(event) => setReviewFeedback(event.target.value)}
                  disabled={isSavingReview}
                  placeholder="Optional feedback for the family..."
                  className="min-h-24 w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <div className="flex flex-wrap justify-end gap-2">
                  {TEACHER_REVIEW_STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleReviewAssignment(status)}
                      disabled={isSavingReview}
                      className={`rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        status === "Reviewed"
                          ? "bg-slate-900 text-white hover:bg-slate-700"
                          : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      }`}
                    >
                      {isSavingReview ? "Saving..." : status === "Reviewed" ? "Mark reviewed" : "Needs support"}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {reviewSaveError ? (
              <p className="text-sm text-rose-700">{reviewSaveError}</p>
            ) : reviewSaveSuccess ? (
              <p className="text-sm text-emerald-700">{reviewSaveSuccess}</p>
            ) : null}
          </section>
        ) : null}

        {showParentProgressSection ? (
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Family progress
              </h4>
              <p className="mt-2 text-sm font-medium text-slate-900">
                Current status: {assignment.status}
              </p>
            </div>

            {parentProgressAction ? (
              <>
                <p className="text-sm leading-6 text-slate-600">
                  {parentProgressAction.helper}
                </p>
                <label htmlFor="parent-progress-update" className="sr-only">
                  Family update
                </label>
                <textarea
                  id="parent-progress-update"
                  value={parentProgressMessage}
                  onChange={(event) => setParentProgressMessage(event.target.value)}
                  disabled={isSavingParentProgress}
                  placeholder="Optional update for the teacher..."
                  className="min-h-24 w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdateParentProgress}
                    disabled={isSavingParentProgress}
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingParentProgress ? "Saving..." : parentProgressAction.label}
                  </button>
                </div>
              </>
            ) : null}

            {parentProgressSaveError ? (
              <p className="text-sm text-rose-700">{parentProgressSaveError}</p>
            ) : parentProgressSaveSuccess ? (
              <p className="text-sm text-emerald-700">{parentProgressSaveSuccess}</p>
            ) : null}
          </section>
        ) : null}

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
        {commentTemplates.length > 0 ? (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Quick replies
            </p>
            <div className="grid gap-2">
              {commentTemplates.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => handleUseCommentTemplate(template)}
                  disabled={isSavingComment}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs leading-5 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <label htmlFor="new-comment" className="sr-only">
          Add comment
        </label>
        <textarea
          id="new-comment"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={isSavingComment}
          placeholder={commentPlaceholder}
          className="min-h-28 w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        {commentSaveError ? (
          <p className="mt-2 text-sm text-rose-700">{commentSaveError}</p>
        ) : commentSaveSuccess ? (
          <p className="mt-2 text-sm text-emerald-700">{commentSaveSuccess}</p>
        ) : null}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleAddComment}
            disabled={isSavingComment || draft.trim().length === 0}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {isSavingComment ? "Saving..." : commentButtonLabel}
          </button>
        </div>
      </div>
    </aside>
  );
}
