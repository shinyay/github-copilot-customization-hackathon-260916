import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPhase8Pack,
  assertPhase8PageAndGuides,
  PHASE8_SPECS,
  readPayloadJson,
  readPayloadText,
} from "./support/phase8-contracts.mjs";

const TASKS = ["H01", "H02", "H03", "H04", "H05", "H06"];

test("HC-045 publishes exact handoff conditions, source paths and blocked route", async () => {
  const { entry, manifest } = await assertPhase8Pack("HC-045");
  assert.deepEqual(manifest.conditions, ["baseline", "handoff-policy"]);
  assert.equal(manifest.overlay.length, 11);
  assert.equal(entry.sourceKind, "baseline");
  assert.deepEqual(entry.sourcePaths, PHASE8_SPECS["HC-045"].sourcePaths);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), ["cloud-handoff"]);
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(
      ({ capability, status }) => [capability, status]),
    [["cross-branch-handoff", "blocked"]],
  );
  assert.deepEqual(manifest.allowedMutations, []);
});

test("HC-045 candidate material pins neutral diffs and exact source/post-image hashes", async () => {
  const candidates = await readPayloadJson(
    "HC-045",
    "candidate-diffs.json.template",
  );
  assert.equal(candidates.materialLabel, "SYNTHETIC_ADAPTED_TRAINING_ONLY");
  assert.deepEqual(
    candidates.candidates.map(({ id }) => id),
    ["candidate-01", "candidate-02"],
  );
  assert.deepEqual(
    candidates.candidates.map(({ sourceAnchorOccurrences }) =>
      sourceAnchorOccurrences),
    [1, 1],
  );
  assert.equal(
    candidates.source.baselineRawSha256,
    "9d1472b68fb32c4a1b76b974c7c7414f1489cdc199c35b8a1e5592caab66945a",
  );
  assert.deepEqual(
    candidates.candidates.map(({ postImageSha256 }) => postImageSha256),
    [
      "a464229ba011bae07b326c6e0454c807669a5d694945888b188be4cc4c0397eb",
      "1d395143d6b3fe3cf5c447190485260aa2f205adbd09ed87112287983c1109e1",
    ],
  );
  assert.deepEqual(
    candidates.candidates.flatMap(({ requestedChangePaths }) =>
      requestedChangePaths),
    [
      PHASE8_SPECS["HC-045"].sourcePaths[0],
      PHASE8_SPECS["HC-045"].sourcePaths[0],
    ],
  );
  assert.doesNotMatch(
    JSON.stringify(candidates).toLowerCase(),
    /"classification"|"normal-candidate"|"expected"|"answerkey"/u,
  );
});

test("HC-045 sent claims remain separate from transmission, acceptance and application evidence", async () => {
  const events = await readPayloadJson(
    "HC-045",
    "handoff-events.json.template",
  );
  assert.deepEqual(events.tasks.map(({ id }) => id), TASKS);
  for (const id of ["H02", "H05"]) {
    const event = events.tasks.find((item) => item.id === id);
    assert.equal(event.claims.sent, true);
    assert.equal(event.evidence.transmission, null);
    assert.equal(event.claims.accepted, false);
    assert.equal(event.evidence.acceptance, null);
    assert.equal(event.claims.applied, false);
    assert.equal(event.evidence.application, null);
  }
  const h03 = events.tasks.find(({ id }) => id === "H03");
  assert.equal(
    h03.returned.changedPaths.includes(PHASE8_SPECS["HC-045"].sourcePaths[1]),
    true,
  );
  assert.equal(h03.evidence.application, null);
});

test("HC-045 draft and validation templates preserve target/read-only scope and non-claims", async () => {
  const draft = await readPayloadText(
    "HC-045",
    "starter/request-draft.txt.template",
  );
  assert.match(draft, /^STATUS: DRAFT - NOT SENT/mu);
  assert.ok(draft.includes(PHASE8_SPECS["HC-045"].sourcePaths[0]));
  for (const readOnly of PHASE8_SPECS["HC-045"].sourcePaths.slice(1)) {
    assert.ok(draft.includes(readOnly), readOnly);
  }
  const { text } = await assertPhase8PageAndGuides("HC-045");
  for (const phrase of [
    "allowedMutations",
    "cross-branch-handoff",
    "draft",
    "sent",
    "TaxAmounts",
    "Money",
    "CommonRulesTest",
    "not-observed",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
