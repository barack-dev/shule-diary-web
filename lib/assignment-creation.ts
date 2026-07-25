export type AssignmentTargetOption = {
  value: string;
  label: string;
};

export type CreateAssignmentActionState = {
  error: string | null;
  success: string | null;
};

export const CREATE_ASSIGNMENT_INITIAL_STATE: CreateAssignmentActionState = {
  error: null,
  success: null,
};

const HTML_DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

type DateOnlyParts = {
  year: number;
  month: number;
  day: number;
};

function parseHtmlDateInput(value: string): DateOnlyParts | null {
  const match = HTML_DATE_INPUT_PATTERN.exec(value.trim());
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

  if (month < 1 || month > 12 || day < 1) {
    return null;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

function toDateOnlyDayNumber(parts: DateOnlyParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day) / MILLISECONDS_PER_DAY;
}

function getLocalDateOnlyParts(date: Date): DateOnlyParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function formatHtmlDateInput(parts: DateOnlyParts): string {
  const year = String(parts.year).padStart(4, "0");
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateFutureDueDateInput(
  value: string,
  today: Date = new Date(),
): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "Due date is required.";
  }

  const dueDateParts = parseHtmlDateInput(trimmedValue);
  if (!dueDateParts) {
    return "Due date must be a valid date.";
  }

  const dueDateDayNumber = toDateOnlyDayNumber(dueDateParts);
  const todayDayNumber = toDateOnlyDayNumber(getLocalDateOnlyParts(today));

  if (dueDateDayNumber <= todayDayNumber) {
    return "Due date must be in the future.";
  }

  return null;
}

export function getTomorrowDateInputValue(today: Date = new Date()): string {
  const todayParts = getLocalDateOnlyParts(today);
  const tomorrow = new Date(
    Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day + 1),
  );

  return formatHtmlDateInput({
    year: tomorrow.getUTCFullYear(),
    month: tomorrow.getUTCMonth() + 1,
    day: tomorrow.getUTCDate(),
  });
}
