import assert from "node:assert/strict";

export function assertErrorCode(errors, expectedCode) {
  assert.ok(
    errors.some(({ code }) => code === expectedCode),
    `expected ${expectedCode}, got ${errors.map(({ code }) => code).join(", ")}`,
  );
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
