import { createClient } from "./client";

type SupabaseProfileRow = {
  id: string;
  full_name: string | null;
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
    .select("id, full_name, role")
    .eq("auth_user_id", user.id)
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

  return {
    supabase,
    authUserId: user.id,
    profileId: profile.id,
    fullName: profile.full_name?.trim() || null,
    role: profile.role?.trim() || null,
  };
}
