import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readJson, REPOSITORY_ROOT } from "../scripts/lib/fs-utils.mjs";
import {
  sourcePathSha256,
  validateSubmissionArtifacts,
} from "../scripts/lib/submission.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

function artifact(sourcePath = ".hackathon/evidence/hc-001/comparison.md") {
  const pathHash = sourcePathSha256(sourcePath);
  return {
    sourcePath,
    sourcePathSha256: pathHash,
    exportName: `comparison--${pathHash.slice(0, 12)}.md.template`,
    kind: "evidence",
    byteLength: 100,
    sha256: "a".repeat(64),
    redacted: true,
    containsSecrets: false,
  };
}

test("future Hub draft artifacts use bounded flattened inert names", () => {
  assert.deepEqual(validateSubmissionArtifacts([artifact()], 100), []);
});

test("renamed aggregation draft is explicitly non-normative and not a Runtime bundle validator", async () => {
  const schema = await readJson(path.join(REPOSITORY_ROOT, "schemas", "hub-result-draft.schema.json"));
  assert.match(schema.$id, /hub-result-draft\.schema\.json$/u);
  assert.match(schema.title, /non-normative/u);
  assert.match(schema.description, /NOT the Runtime exporter bundle/u);
  assert.match(schema.description, /no bundle upload, ingestion API or whole-document validator/u);
  assert.equal(schema.required.includes("participantTeam"), true);
  assert.equal(schema.required.includes("totalArtifactBytes"), true);
  await assert.rejects(
    readJson(path.join(REPOSITORY_ROOT, "schemas", "submission.schema.json")),
    { code: "ENOENT" },
  );
  // Artifact-only success says nothing about omitted document fields or an exported bundle.
  assert.deepEqual(validateSubmissionArtifacts([], 0), []);
});

test("submission rejects raw logs and non-derived export names", () => {
  const raw = artifact("logs/session.log");
  raw.exportName = "session--000000000000.txt.template";
  const errors = validateSubmissionArtifacts([raw], 100);
  assertErrorCode(errors, "SUBMISSION_DENIED_SOURCE");
  assertErrorCode(errors, "SUBMISSION_FLAT_NAME");
});

test("submission rejects root and nested environment files", () => {
  for (const sourcePath of [".env", ".env.local", "config/.env.production"]) {
    assertErrorCode(
      validateSubmissionArtifacts([artifact(sourcePath)], 100),
      "SUBMISSION_DENIED_SOURCE",
    );
  }
});

test("submission validates content digest format and supplied bytes", () => {
  const invalid = artifact();
  invalid.sha256 = "not-a-hash";
  assertErrorCode(
    validateSubmissionArtifacts([invalid], 100),
    "SUBMISSION_CONTENT_HASH",
  );

  const mismatch = artifact();
  const bytes = Buffer.from("actual bytes", "utf8");
  assertErrorCode(
    validateSubmissionArtifacts(
      [mismatch],
      100,
      new Map([[mismatch.sourcePath, bytes]]),
    ),
    "SUBMISSION_CONTENT_MISMATCH",
  );
});

test("submission rejects incorrect aggregate bytes", () => {
  assertErrorCode(
    validateSubmissionArtifacts([artifact()], 99),
    "SUBMISSION_TOTAL_BYTES",
  );
});
