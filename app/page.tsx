import { redirect } from "next/navigation";
import { getHomeRouteDecision } from "../lib/auth-routing";
import { getAuthProfileResult } from "../lib/supabase/auth-profile";

export const dynamic = "force-dynamic";

export default async function HomeRedirect() {
  const authResult = await getAuthProfileResult();
  const decision = getHomeRouteDecision(authResult);

  if (decision.type === "redirect") {
    redirect(decision.destination);
  }

  redirect("/login");
}
