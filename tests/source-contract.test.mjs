import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  listFilesRecursively,
  readJson,
  REPOSITORY_ROOT,
} from "../scripts/lib/fs-utils.mjs";

function repositoryFile(relativePath) {
  return path.join(REPOSITORY_ROOT, ...relativePath.split("/"));
}

test("Challenge content contains no removed synthetic Java package", async () => {
  const challengeRoot = repositoryFile("challenges");
  const files = await listFilesRecursively(challengeRoot);

  for (const relativePath of files) {
    const contents = await readFile(
      path.join(challengeRoot, ...relativePath.split("/")),
      "utf8",
    );
    assert.doesNotMatch(contents, /com\/example\/hackathon|com\.example\.hackathon/u);
  }
});

test("HC-011 preserves the verified MCP tool and synthetic note contract", async () => {
  const server = await readFile(
    repositoryFile(
      "challenges/hc-011/pack/payload/tools/mcp/training-notes-server.mjs.template",
    ),
    "utf8",
  );
  const note = await readFile(
    repositoryFile(
      "challenges/hc-011/pack/payload/fixtures/operations-note.json.template",
    ),
    "utf8",
  );

  for (const expected of [
    '"2025-11-25"',
    '"lookup_training_note"',
    '"INVALID_ARGUMENT"',
    '"NOT_FOUND"',
    "structuredContent",
  ]) {
    assert.ok(server.includes(expected), expected);
  }
  for (const expected of [
    '"order-import-replay"',
    '"SYNTHETIC_TRAINING_ONLY"',
    '"TRAINING-OPS-017"',
    '"training-v1"',
    '"CODE_DERIVED_NOT_RUNTIME_TESTED"',
    '"NOT_PROVIDED"',
  ]) {
    assert.ok(note.includes(expected), expected);
  }
  assert.doesNotMatch(server + note, /TRAINING-001|order-import-replay\/training-v1/u);
});

test("HC-030 candidate metadata pins the authoritative paths and hashes", async () => {
  const metadata = await readJson(
    repositoryFile(
      "challenges/hc-030/pack/payload/candidates/candidates.json.template",
    ),
  );
  assert.equal(
    metadata.sourcePath,
    "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java",
  );
  assert.equal(
    metadata.baselineSha256,
    "9d1472b68fb32c4a1b76b974c7c7414f1489cdc199c35b8a1e5592caab66945a",
  );
  assert.deepEqual(
    metadata.candidates.map(({ id, postImageSha256 }) => [
      id,
      postImageSha256,
    ]),
    [
      [
        "candidate-a",
        "a464229ba011bae07b326c6e0454c807669a5d694945888b188be4cc4c0397eb",
      ],
      [
        "candidate-b",
        "1d395143d6b3fe3cf5c447190485260aa2f205adbd09ed87112287983c1109e1",
      ],
    ],
  );
  for (const candidate of metadata.candidates) {
    assert.match(
      candidate.patch,
      /^\.hackathon\/challenge\/hc-030\/starter\/candidate-[ab]\.patch\.template$/u,
    );
  }

  const candidateA = await readFile(
    repositoryFile(
      "challenges/hc-030/pack/payload/candidates/candidate-a.patch.template",
    ),
    "utf8",
  );
  const candidateB = await readFile(
    repositoryFile(
      "challenges/hc-030/pack/payload/candidates/candidate-b.patch.template",
    ),
    "utf8",
  );
  assert.match(
    candidateA,
    /new TreeMap<BigDecimal, BigDecimal>\(\)[\s\S]*new java\.util\.HashMap<BigDecimal, BigDecimal>\(\)/u,
  );
  assert.doesNotMatch(candidateA + candidateB, /\r/u);
  assert.match(
    candidateB,
    /return getNetAmount\(\)\.add\(getTaxAmount\(\)\);[\s\S]*return this\.getNetAmount\(\)\.add\(this\.getTaxAmount\(\)\);/u,
  );

  const instructions = await readFile(
    repositoryFile(
      "challenges/hc-030/pack/payload/customization/tax-review.instructions.md.template",
    ),
    "utf8",
  );
  for (const target of [
    metadata.sourcePath,
    "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java",
    "wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java",
    ...metadata.candidates.map(({ patch }) => patch),
  ]) {
    assert.ok(instructions.includes(target), `applyTo must include ${target}`);
  }

  const page = await readFile(
    repositoryFile("challenges/hc-030/README.md"),
    "utf8",
  );
  assert.doesNotMatch(page, /\| A \|[^\r\n]*finding、miss/u);
  assert.doesNotMatch(page, /\| B \|[^\r\n]*no-finding、false-positive/u);
  assert.doesNotMatch(page, /receiverを明示するだけ/u);
});

test("HC-007 investigator declares a real human-confirmed handoff", async () => {
  const investigator = await readFile(
    repositoryFile(
      "challenges/hc-007/pack/payload/customization/order-investigator.agent.md.template",
    ),
    "utf8",
  );
  assert.match(investigator, /^handoffs:$/mu);
  assert.match(investigator, /^\s+agent: order-reviewer$/mu);
  assert.match(investigator, /^\s+send: false$/mu);
});
