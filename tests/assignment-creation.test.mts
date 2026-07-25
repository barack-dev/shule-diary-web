import assert from "node:assert/strict";
import test from "node:test";
import {
  getTomorrowDateInputValue,
  validateFutureDueDateInput,
} from "../lib/assignment-creation.ts";

const TODAY = new Date(2026, 5, 28, 12, 0, 0);

test("empty due date is rejected", () => {
  assert.equal(validateFutureDueDateInput("", TODAY), "Due date is required.");
  assert.equal(validateFutureDueDateInput("   ", TODAY), "Due date is required.");
});

test("invalid due date is rejected", () => {
  assert.equal(
    validateFutureDueDateInput("2026-02-30", TODAY),
    "Due date must be a valid date.",
  );
  assert.equal(
    validateFutureDueDateInput("06/29/2026", TODAY),
    "Due date must be a valid date.",
  );
});

test("today is rejected", () => {
  assert.equal(
    validateFutureDueDateInput("2026-06-28", TODAY),
    "Due date must be in the future.",
  );
});

test("past date is rejected", () => {
  assert.equal(
    validateFutureDueDateInput("2026-06-27", TODAY),
    "Due date must be in the future.",
  );
});

test("tomorrow is accepted", () => {
  assert.equal(validateFutureDueDateInput("2026-06-29", TODAY), null);
});

test("future date is accepted", () => {
  assert.equal(validateFutureDueDateInput("2026-07-01", TODAY), null);
});

test("tomorrow date input value is formatted as yyyy-mm-dd", () => {
  assert.equal(getTomorrowDateInputValue(TODAY), "2026-06-29");
});
