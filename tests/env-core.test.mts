import assert from "node:assert/strict";
import test from "node:test";
import { validatePublicEnv } from "../lib/env-core.ts";

test("validatePublicEnv accepts required public Supabase variables", () => {
  const env = validatePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  });

  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, "https://example.supabase.co");
  assert.equal(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "anon-key");
});

test("validatePublicEnv normalizes Supabase URLs to the project origin", () => {
  const env = validatePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/auth/v1",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  });

  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, "https://example.supabase.co");
});

test("validatePublicEnv fails loudly when required variables are missing", () => {
  assert.throws(
    () =>
      validatePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
  );
});

test("validatePublicEnv rejects invalid Supabase URLs", () => {
  assert.throws(
    () =>
      validatePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    /valid URL/,
  );
});
