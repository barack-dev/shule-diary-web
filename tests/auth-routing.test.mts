import assert from "node:assert/strict";
import test from "node:test";
import {
  getDashboardRouteDecision,
  getHomeRouteDecision,
  getLoginRouteDecision,
  getOnboardingRouteDecision,
} from "../lib/auth-routing.ts";

test("logged-out dashboard users are redirected to login", () => {
  assert.deepEqual(getDashboardRouteDecision({ status: "unauthenticated" }), {
    type: "redirect",
    destination: "/login",
  });
});

test("logged-in users without profiles are redirected to onboarding", () => {
  assert.deepEqual(
    getDashboardRouteDecision({
      status: "missing-profile",
      authUserId: "00000000-0000-4000-8000-000000000001",
      userEmail: "teacher@example.com",
      message: "Missing profile",
    }),
    {
      type: "redirect",
      destination: "/onboarding",
    },
  );
});

test("logged-in users with complete profiles can access dashboard", () => {
  assert.deepEqual(
    getDashboardRouteDecision({
      status: "authenticated",
      profile: {
        id: "00000000-0000-4000-8000-000000000010",
        authUserId: "00000000-0000-4000-8000-000000000001",
        fullName: "Grace Wanjiku",
        role: "teacher",
      },
    }),
    {
      type: "allow",
    },
  );
});

test("home route sends authenticated profile users to dashboard", () => {
  assert.deepEqual(
    getHomeRouteDecision({
      status: "authenticated",
      profile: {
        id: "00000000-0000-4000-8000-000000000010",
        authUserId: "00000000-0000-4000-8000-000000000001",
        fullName: "Mary Otieno",
        role: "parent",
      },
    }),
    {
      type: "redirect",
      destination: "/dashboard",
    },
  );
});

test("login route sends authenticated users without profiles to onboarding", () => {
  assert.deepEqual(getLoginRouteDecision(true, false), {
    type: "redirect",
    destination: "/onboarding",
  });
});

test("onboarding route only redirects complete profiles to dashboard", () => {
  assert.deepEqual(getOnboardingRouteDecision(true, false), {
    type: "allow",
  });
  assert.deepEqual(getOnboardingRouteDecision(true, true), {
    type: "redirect",
    destination: "/dashboard",
  });
});

