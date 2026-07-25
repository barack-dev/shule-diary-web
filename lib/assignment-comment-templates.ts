import type { AssignmentCardData, CommentAuthorRole } from "./types";

export function getAssignmentCommentTemplates(
  assignment: AssignmentCardData,
  role: CommentAuthorRole,
): string[] {
  if (role === "Teacher") {
    if (assignment.status === "Submitted") {
      return [
        "Thank you for submitting this work. I will review it and share feedback.",
        "Good progress. Please check the feedback and keep practicing.",
      ];
    }

    if (assignment.status === "Needs Support") {
      return [
        "Please revisit the highlighted areas and resubmit when ready.",
        "Let me know which question is causing trouble so I can support you.",
      ];
    }

    return [
      "Thank you for the update.",
      "Please keep me posted on progress.",
    ];
  }

  if (assignment.status === "Assigned") {
    return [
      "We have seen this assignment and will start it.",
      "Please confirm if there are any extra instructions.",
    ];
  }

  if (assignment.status === "In Progress") {
    return [
      "We are working on this and will submit it soon.",
      "We need a little more time to complete this carefully.",
    ];
  }

  if (assignment.status === "Needs Support") {
    return [
      "We will review the feedback and resubmit.",
      "Please share which part needs the most attention.",
    ];
  }

  return [
    "Thank you for the update.",
    "We will follow up on this assignment.",
  ];
}
