import type { DashboardRole } from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProfileCompletenessInput = {
  full_name: string | null;
  school_name: string | null;
  role: string | null;
};

export function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function normalizeDashboardRole(value: string | null): DashboardRole | null {
  const role = value?.trim().toLowerCase();
  if (role === "teacher" || role === "admin") {
    return "teacher";
  }
  if (role === "parent" || role === "student") {
    return "parent";
  }
  return null;
}

export function isExpectedLoggedOutAuthError(error: {
  message?: string;
  name?: string;
}): boolean {
  const name = error.name?.trim().toLowerCase() ?? "";
  const message = error.message?.trim().toLowerCase() ?? "";

  return (
    name.includes("authsessionmissingerror") ||
    message.includes("auth session missing") ||
    message.includes("session missing")
  );
}

export function buildSafeAuthMessage(
  prefix: string,
  detail: string | null | undefined,
): string {
  const safeDetail = detail?.trim();
  if (!safeDetail) {
    return prefix;
  }
  return `${prefix} ${safeDetail}`;
}

export function hasCompleteProfileSetup(
  profile: ProfileCompletenessInput | null | undefined,
): boolean {
  return Boolean(
    normalizeText(profile?.full_name) &&
      normalizeText(profile?.school_name) &&
      normalizeDashboardRole(profile?.role ?? null),
  );
}

export function assertSafeAuthUserId(authUserId: string): string {
  if (!UUID_PATTERN.test(authUserId)) {
    throw new Error("Authenticated user id is not a valid UUID.");
  }
  return authUserId;
}

export function buildProfileOwnerFilter(authUserId: string): string {
  const safeAuthUserId = assertSafeAuthUserId(authUserId);
  return `user_id.eq.${safeAuthUserId},auth_user_id.eq.${safeAuthUserId}`;
}

