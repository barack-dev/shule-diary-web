import assert from "node:assert/strict";
import test from "node:test";
import { createDashboardLoadError } from "../lib/dashboard-errors.ts";

test("dashboard load errors keep user copy friendly and developer copy useful", () => {
  const error = createDashboardLoadError(new Error("RLS denied comments"));

  assert.match(error.userMessage, /could not load your dashboard data/i);
  assert.equal(error.developerMessage, "RLS denied comments");
});

test("dashboard load errors handle unknown thrown values", () => {
  const error = createDashboardLoadError(null);

  assert.equal(error.developerMessage, "Unknown dashboard load error.");
});

