import type { AssignmentCardData } from "./types.ts";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnlyValue(value: string | null | undefined): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value?.trim() ?? "");
  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export function getAssignmentDueDate(assignment: AssignmentCardData): Date | null {
  return parseDateOnlyValue(assignment.dueDateRaw);
}

export function getStartOfLocalDay(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getDueSoonThreshold(now: Date, daysAhead = 3): Date {
  const threshold = getStartOfLocalDay(now);
  threshold.setDate(threshold.getDate() + daysAhead);
  return threshold;
}
