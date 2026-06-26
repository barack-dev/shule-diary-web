"use server";

import { redirect } from "next/navigation";
import { buildProfileOwnerFilter } from "../../lib/auth-utils";
import { createClient } from "../../lib/supabase/server";
import type { OnboardingActionState } from "./state";

const ALLOWED_ONBOARDING_ROLES = new Set(["teacher", "parent", "student", "admin"]);

function normalizeOnboardingRole(value: string): string | null {
  const role = value.trim().toLowerCase();
  if (!ALLOWED_ONBOARDING_ROLES.has(role)) {
    return null;
  }
  return role;
}

export async function saveOnboardingProfile(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const schoolName = String(formData.get("schoolName") ?? "").trim();
  const roleValue = String(formData.get("role") ?? "");
  const role = normalizeOnboardingRole(roleValue);

  if (!fullName || !schoolName || !role) {
    return {
      error: "Full name, school name, and role are required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "You need to sign in again before completing profile setup.",
    };
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .or(buildProfileOwnerFilter(user.id))
    .maybeSingle();

  if (existingProfileError) {
    return {
      error: existingProfileError.message?.trim() || "Unable to load your profile setup status.",
    };
  }

  const payload = {
    user_id: user.id,
    auth_user_id: user.id,
    full_name: fullName,
    school_name: schoolName,
    role,
    updated_at: new Date().toISOString(),
  };

  if (existingProfile?.id) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", existingProfile.id);

    if (updateError) {
      return {
        error: updateError.message?.trim() || "Unable to save your profile setup.",
      };
    }
  } else {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert(payload);

    if (insertError) {
      return {
        error: insertError.message?.trim() || "Unable to create your profile setup.",
      };
    }
  }

  redirect("/dashboard");
}
