export type DashboardLoadError = {
  userMessage: string;
  developerMessage: string;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return "Unknown dashboard load error.";
}

export function createDashboardLoadError(error: unknown): DashboardLoadError {
  return {
    userMessage:
      "We could not load your dashboard data right now. Please refresh the page or try again in a moment.",
    developerMessage: getErrorMessage(error),
  };
}

