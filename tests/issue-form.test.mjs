import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { getPublishedChallengeIds, loadCatalog } from "../scripts/lib/catalog.mjs";
import { REPOSITORY_ROOT } from "../scripts/lib/fs-utils.mjs";
import { validateIssueFormText } from "../scripts/lib/issue-form.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

const issueFormPath = path.join(
  REPOSITORY_ROOT,
  ".github",
  "ISSUE_TEMPLATE",
  "challenge-result.yml",
);
const publishedIds = getPublishedChallengeIds(await loadCatalog());

test("Challenge Result Issue Form contains the complete common contract", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  assert.deepEqual(validateIssueFormText(contents, publishedIds), []);
});

test("Issue Form guard fails for the intended missing field mutation", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  const mutated = contents.replace(/^    id: challenge_design\r?$/mu, "");
  assert.notEqual(mutated, contents, "mutation must change the fixture");

  const errors = validateIssueFormText(mutated, publishedIds);
  assertErrorCode(errors, "ISSUE_FIELD_MISSING:challenge_design");
});

test("Issue Form guard fails when an exact label is weakened", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  const mutated = contents.replace(
    "      label: Baseline evidence",
    "      label: Evidence",
  );
  assert.notEqual(mutated, contents, "mutation must change the fixture");

  const errors = validateIssueFormText(mutated, publishedIds);
  assertErrorCode(errors, "ISSUE_FIELD_CONTRACT:baseline_evidence");
  assert.equal(
    errors.filter(
      ({ code }) => code === "ISSUE_FIELD_CONTRACT:baseline_evidence",
    ).length,
    1,
  );
});

test("Issue Form guard rejects list-form validations", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  const mutated = contents.replace(
    /^    validations:\r?\n      required: true$/mu,
    "    validations:\n      - required: true",
  );
  assert.notEqual(mutated, contents, "mutation must change the fixture");

  assertErrorCode(
    validateIssueFormText(mutated, publishedIds),
    "ISSUE_REQUIRED_VALIDATION",
  );
});

test("Issue Form requires catalog IDs and leaves all optional fields unperformed-capable", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  assertErrorCode(validateIssueFormText(contents), "ISSUE_CHALLENGE_EXPECTED_IDS");
  const mutated = contents.replace(
    /(id: optional_route[\s\S]*?validations:\s*\n      required:) false/u,
    "$1 true",
  );
  assert.match(mutated, /id: optional_route[\s\S]*?validations:\s*\n      required: true/u);
  assertErrorCode(validateIssueFormText(mutated, publishedIds), "ISSUE_OPTIONAL_VALIDATION");
});
