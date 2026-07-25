import type { AssignmentCardData, AssignmentComment, AssignmentStatus } from "./types";

export type AssignmentLearningRecap = {
  dueLabel: string;
  commentCountLabel: string;
  latestUpdate: string;
  nextStep: string;
};

function getNextStep(status: AssignmentStatus): string {
  switch (status) {
    case "Assigned":
      return "Family opens the assignment and confirms it has been seen.";
    case "Seen by Parent":
      return "Family starts the assignment.";
    case "In Progress":
      return "Family submits the completed work to the teacher.";
    case "Submitted":
      return "Teacher reviews the submitted work.";
    case "Reviewed":
      return "Family reads the teacher feedback.";
    case "Completed":
      return "No action needed right now.";
    case "Needs Support":
      return "Family revises the work and resubmits it.";
    case "Overdue":
      return "Family submits the work or sends an update to the teacher.";
  }
}

function getLatestComment(comments: AssignmentComment[]): AssignmentComment | null {
  if (comments.length === 0) {
    return null;
  }

  return [...comments].sort((left, right) => {
    const leftTime = left.createdAtRaw ? Date.parse(left.createdAtRaw) : Number.NaN;
    const rightTime = right.createdAtRaw ? Date.parse(right.createdAtRaw) : Number.NaN;

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0;
    }

    if (Number.isNaN(leftTime)) {
      return 1;
    }

    if (Number.isNaN(rightTime)) {
      return -1;
    }

    return rightTime - leftTime;
  })[0] ?? null;
}

export function buildAssignmentLearningRecap(
  assignment: AssignmentCardData,
  comments: AssignmentComment[] = assignment.comments,
): AssignmentLearningRecap {
  const latestComment = getLatestComment(comments);
  const commentCountLabel = `${comments.length} comment${comments.length === 1 ? "" : "s"}`;
  const latestUpdate = latestComment
    ? `${latestComment.authorRole}: ${latestComment.message}`
    : "No comments yet.";

  return {
    dueLabel: assignment.due,
    commentCountLabel,
    latestUpdate,
    nextStep: getNextStep(assignment.status),
  };
}
