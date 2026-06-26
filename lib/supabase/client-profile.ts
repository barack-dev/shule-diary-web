import { createClient } from "./client";
import {
  buildProfileOwnerFilter,
  hasCompleteProfileSetup,
  normalizeText,
} from "../auth-utils";

type SupabaseProfileRow = {
  id: string;
  user_id: string | null;
  auth_user_id: string | null;
  full_name: string | null;
  school_name: string | null;
  role: string | null;
};

export type AuthenticatedClientProfile = {
  supabase: ReturnType<typeof createClient>;
  authUserId: string;
  profileId: string;
  fullName: string | null;
  role: string | null;
};

export async function getAuthenticatedClientProfile(): Promise<AuthenticatedClientProfile> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to perform this action.");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, auth_user_id, full_name, school_name, role")
    .or(buildProfileOwnerFilter(user.id))
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Unable to resolve your profile: ${profileError.message ?? "Unknown query error."}`,
    );
  }

  const profile = profileData as SupabaseProfileRow | null;
  if (!profile?.id) {
    throw new Error("Your account is signed in but no profile mapping was found.");
  }

  if (!hasCompleteProfileSetup(profile)) {
    throw new Error("Your profile setup is incomplete. Please finish onboarding.");
  }

  return {
    supabase,
    authUserId: user.id,
    profileId: profile.id,
    fullName: normalizeText(profile.full_name),
    role: normalizeText(profile.role),
  };
}
