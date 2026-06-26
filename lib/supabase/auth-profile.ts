import {
  buildProfileOwnerFilter,
  buildSafeAuthMessage,
  hasCompleteProfileSetup,
  isExpectedLoggedOutAuthError,
  normalizeDashboardRole,
  normalizeText,
} from "../auth-utils";
import type { DashboardRole } from "../types";
import { createClient } from "./server";

export type AuthenticatedProfile = {
  id: string;
  authUserId: string;
  fullName: string;
  role: DashboardRole;
};

type SupabaseProfileRow = {
  id: string;
  user_id: string | null;
  auth_user_id: string | null;
  full_name: string | null;
  school_name: string | null;
  role: string | null;
};

export type AuthProfileResult =
  | {
      status: "unauthenticated";
    }
  | {
      status: "authenticated";
      profile: AuthenticatedProfile;
    }
  | {
      status: "missing-profile";
      authUserId: string;
      userEmail: string | null;
      message: string;
    }
  | {
      status: "error";
      message: string;
      authUserId: string | null;
      userEmail: string | null;
    };

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const result = await getAuthProfileResult();
  if (result.status !== "authenticated") {
    return null;
  }
  return result.profile;
}

export async function getAuthProfileResult(): Promise<AuthProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if (isExpectedLoggedOutAuthError(userError)) {
      return {
        status: "unauthenticated",
      };
    }

    return {
      status: "error",
      message: buildSafeAuthMessage(
        "Unable to verify your session.",
        userError.message,
      ),
      authUserId: null,
      userEmail: null,
    };
  }

  if (!user) {
    return {
      status: "unauthenticated",
    };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, auth_user_id, full_name, school_name, role")
    .or(buildProfileOwnerFilter(user.id))
    .maybeSingle();

  if (profileError) {
    return {
      status: "error",
      message: buildSafeAuthMessage(
        "Your account was found, but profile lookup failed.",
        profileError.message,
      ),
      authUserId: user.id,
      userEmail: normalizeText(user.email),
    };
  }

  if (!profileData) {
    return {
      status: "missing-profile",
      authUserId: user.id,
      userEmail: normalizeText(user.email),
      message:
        "Your account is signed in, but no profile setup was found yet.",
    };
  }

  const profile = profileData as SupabaseProfileRow;
  const role = normalizeDashboardRole(profile.role);
  if (!hasCompleteProfileSetup(profile) || !role) {
    return {
      status: "missing-profile",
      authUserId: user.id,
      userEmail: normalizeText(user.email),
      message:
        "Your account profile setup is incomplete. Please finish onboarding.",
    };
  }

  const fullName = normalizeText(profile.full_name) ?? "ShuleDiary User";

  return {
    status: "authenticated",
    profile: {
      id: profile.id,
      authUserId: user.id,
      fullName,
      role,
    },
  };
}
