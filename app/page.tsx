import { redirect } from "next/navigation";
import { getAuthProfileResult } from "../lib/supabase/auth-profile";

export const dynamic = "force-dynamic";

export default async function HomeRedirect() {
  const authResult = await getAuthProfileResult();

  if (authResult.status === "unauthenticated") {
    redirect("/login");
  }

  redirect("/dashboard");
}
