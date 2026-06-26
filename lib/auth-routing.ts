import type { AuthProfileResult } from "./supabase/auth-profile";

export type RouteDecision =
  | {
      type: "allow";
    }
  | {
      type: "redirect";
      destination: "/login" | "/onboarding" | "/dashboard";
    }
  | {
      type: "error";
    };

export function getHomeRouteDecision(authResult: AuthProfileResult): RouteDecision {
  if (authResult.status === "unauthenticated") {
    return {
      type: "redirect",
      destination: "/login",
    };
  }

  if (authResult.status === "missing-profile") {
    return {
      type: "redirect",
      destination: "/onboarding",
    };
  }

  if (authResult.status === "error") {
    return {
      type: "error",
    };
  }

  return {
    type: "redirect",
    destination: "/dashboard",
  };
}

export function getDashboardRouteDecision(
  authResult: AuthProfileResult,
): RouteDecision {
  if (authResult.status === "unauthenticated") {
    return {
      type: "redirect",
      destination: "/login",
    };
  }

  if (authResult.status === "missing-profile") {
    return {
      type: "redirect",
      destination: "/onboarding",
    };
  }

  if (authResult.status === "error") {
    return {
      type: "error",
    };
  }

  return {
    type: "allow",
  };
}

export function getLoginRouteDecision(
  isAuthenticated: boolean,
  hasProfile: boolean,
): RouteDecision {
  if (!isAuthenticated) {
    return {
      type: "allow",
    };
  }

  return {
    type: "redirect",
    destination: hasProfile ? "/dashboard" : "/onboarding",
  };
}

export function getOnboardingRouteDecision(
  isAuthenticated: boolean,
  hasCompleteProfile: boolean,
): RouteDecision {
  if (!isAuthenticated) {
    return {
      type: "redirect",
      destination: "/login",
    };
  }

  if (hasCompleteProfile) {
    return {
      type: "redirect",
      destination: "/dashboard",
    };
  }

  return {
    type: "allow",
  };
}

