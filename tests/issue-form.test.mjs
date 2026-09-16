import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { getPublishedChallengeIds, loadCatalog } from "../scripts/lib/catalog.mjs";
import { CHALLENGE_IDS } from "../scripts/lib/constants.mjs";
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
const expectedLabels = ["challenge-result", "workshop-260916"];

function fieldBlock(contents, fieldId) {
  return contents.match(
    new RegExp(
      `^    id:\\s*${fieldId}\\s*$([\\s\\S]*?)(?=^  - type:|(?![\\s\\S]))`,
      "mu",
    ),
  )?.[1] ?? "";
}

function fieldOptions(contents, fieldId) {
  const optionBlock = fieldBlock(contents, fieldId).match(
    /^      options:\s*$([\s\S]*?)(?=^    validations:)/mu,
  )?.[1] ?? "";
  return [...optionBlock.matchAll(/^        - ([^\r\n]+)$/gmu)].map(
    (match) => match[1].trim(),
  );
}

function issueLabels(contents) {
  const labelBlock = contents.match(
    /^labels:\s*$([\s\S]*?)(?=^body:)/mu,
  )?.[1] ?? "";
  return [...labelBlock.matchAll(/^  - ([^\r\n]+)$/gmu)].map(
    (match) => match[1].trim(),
  );
}

function assertNestedCheckboxOptionsRequired(contents, fieldId) {
  const optionsBlock = fieldBlock(contents, fieldId).match(
    /^      options:\s*$([\s\S]*?)(?=^    validations:)/mu,
  )?.[1] ?? "";
  const optionCount = [...optionsBlock.matchAll(/^        - label:/gmu)].length;
  const requiredCount = [
    ...optionsBlock.matchAll(/^          required: true\s*$/gmu),
  ].length;
  assert.ok(optionCount > 0, `${fieldId} must contain a checkbox option`);
  assert.equal(
    requiredCount,
    optionCount,
    `${fieldId} checkbox options must each declare required: true`,
  );
}

function assertIssueFormMetadata(contents) {
  assert.match(contents, /^name: Challenge Result\s*$/mu);
  assert.match(contents, /^title: "\[Challenge Result\]: "\s*$/mu);
  assert.deepEqual(issueLabels(contents), expectedLabels);
}

test("Challenge Result Issue Form contains the complete common contract", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  assert.deepEqual(validateIssueFormText(contents, publishedIds), []);
  assertIssueFormMetadata(contents);
  assert.equal(publishedIds.length, 45);
  assert.deepEqual(publishedIds, CHALLENGE_IDS);
  assert.deepEqual(fieldOptions(contents, "challenge_id"), CHALLENGE_IDS);
  assertNestedCheckboxOptionsRequired(contents, "privacy_confirmation");
  assertNestedCheckboxOptionsRequired(contents, "safety_confirmation");
  assert.match(contents, /respectful, non-harassing/u);
  assert.match(contents, /Repository members can read submitted Issues/u);
  assert.match(contents, /public-safe team name or alias/u);
  assert.match(contents, /not-observed results/u);
});

test("Issue Form guard fails for each new required field mutation", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  for (const fieldId of ["open_question", "reproduction_steps"]) {
    const mutated = contents.replace(
      new RegExp(`^    id: ${fieldId}\\r?$`, "mu"),
      "",
    );
    assert.notEqual(
      mutated,
      contents,
      `${fieldId} mutation must change the fixture`,
    );

    const errors = validateIssueFormText(mutated, publishedIds);
    assertErrorCode(errors, `ISSUE_FIELD_MISSING:${fieldId}`);
  }
});

test("Issue Form requires both exact repository labels", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  assertIssueFormMetadata(contents);

  const mutated = contents.replace(
    "  - workshop-260916",
    "  - workshop-260916-disabled",
  );
  assert.notEqual(mutated, contents, "label mutation must change the fixture");
  assert.throws(() => assertIssueFormMetadata(mutated));
});

test("Issue Form Challenge dropdown is exactly HC-001 through HC-045", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  assert.deepEqual(fieldOptions(contents, "challenge_id"), CHALLENGE_IDS);

  const mutated = contents.replace("        - HC-045", "        - HC-044");
  assert.notEqual(
    mutated,
    contents,
    "Challenge option mutation must change the fixture",
  );
  assertErrorCode(
    validateIssueFormText(mutated, publishedIds),
    "ISSUE_CHALLENGE_OPTIONS",
  );
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

test("Issue Form guard rejects a new core field made optional", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  const mutated = contents.replace(
    /(id: reproduction_steps[\s\S]*?validations:\s*\r?\n      required:) true/u,
    "$1 false",
  );
  assert.notEqual(
    mutated,
    contents,
    "required mutation must change the fixture",
  );
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

test("Issue Form requires each confirmation checkbox option", async () => {
  const contents = await readFile(issueFormPath, "utf8");
  assertNestedCheckboxOptionsRequired(contents, "privacy_confirmation");
  assertNestedCheckboxOptionsRequired(contents, "safety_confirmation");

  const mutated = contents.replace(
    /(id: privacy_confirmation[\s\S]*?options:\s*\r?\n        - label:[^\r\n]+\r?\n          required:) true/u,
    "$1 false",
  );
  assert.notEqual(
    mutated,
    contents,
    "nested checkbox mutation must change the fixture",
  );
  assert.throws(() =>
    assertNestedCheckboxOptionsRequired(mutated, "privacy_confirmation"),
  );
});
