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
  auth_user_id: string | null;
  full_name: string | null;
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

function normalizeProfileRole(value: string | null): DashboardRole | null {
  const role = value?.trim().toLowerCase();
  if (role === "teacher" || role === "parent") {
    return role;
  }
  return null;
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function buildSafeAuthMessage(prefix: string, detail: string | null | undefined): string {
  const safeDetail = detail?.trim();
  if (!safeDetail) {
    return prefix;
  }
  return `${prefix} ${safeDetail}`;
}

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
    .select("id, auth_user_id, full_name, role")
    .eq("auth_user_id", user.id)
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
        "Your account is signed in, but no matching profile was found in public.profiles.",
    };
  }

  const profile = profileData as SupabaseProfileRow;
  const role = normalizeProfileRole(profile.role);
  if (!role) {
    return {
      status: "missing-profile",
      authUserId: user.id,
      userEmail: normalizeText(user.email),
      message:
        "Your account profile has an unsupported role. Please contact support.",
    };
  }

  const fullName =
    normalizeText(profile.full_name) ?? normalizeText(user.email) ?? "ShuleDiary User";

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
