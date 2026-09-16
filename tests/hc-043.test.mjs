import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPhase8Pack,
  assertPhase8PageAndGuides,
  readPayloadJson,
  readPayloadText,
} from "./support/phase8-contracts.mjs";

const TASKS = ["E01", "E02", "E03", "E04", "E05"];

test("HC-043 publishes exact automation conditions and one unobserved guide", async () => {
  const { entry, manifest } = await assertPhase8Pack("HC-043");
  assert.deepEqual(manifest.conditions, ["baseline", "automation-policy"]);
  assert.equal(manifest.overlay.length, 10);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["event-trigger"],
  );
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["not-checked"],
  );
});

test("HC-043 teaching operations separate read and write effects without API claims", async () => {
  const packet = await readPayloadJson(
    "HC-043",
    "automation-packet.json.template",
  );
  assert.match(packet.schemaBoundary, /not GitHub tool IDs or API schema/u);
  assert.deepEqual(
    packet.teachingOperations
      .filter(({ effect }) => effect === "read")
      .map(({ id }) => id),
    ["read-pr-summary", "read-diff-summary"],
  );
  assert.deepEqual(
    packet.teachingOperations
      .filter(({ effect }) => effect === "write")
      .map(({ id }) => id),
    ["update-label", "post-review", "push-commit"],
  );
  assert.notEqual(
    packet.automation.configurationVisibility,
    packet.automation.sessionVisibility,
  );
  assert.equal(packet.automation.billing.observedAmounts, null);
});

test("HC-043 event sequence preserves actors, duplicate events, new heads and stop risk", async () => {
  const sequence = await readPayloadJson(
    "HC-043",
    "event-sequence.json.template",
  );
  assert.deepEqual(sequence.tasks.map(({ id }) => id), TASKS);
  assert.equal(sequence.tasks[0].events[0].actor, "actor-maintainer");
  assert.equal(sequence.tasks[1].events[0].actor, "actor-contributor");
  const e04 = sequence.tasks[3].events;
  assert.equal(e04[1].duplicateOf, e04[0].eventId);
  assert.notEqual(e04[2].head, e04[2].previousHead);
  assert.equal(sequence.tasks[4].creatorAvailability, "unknown");
  assert.ok(
    sequence.tasks[4].events.some(({ kind }) => kind === "stop-requested"),
  );
  assert.doesNotMatch(
    JSON.stringify(sequence).toLowerCase(),
    /"expected"|"verdict"|"answerkey"/u,
  );
});

test("HC-043 event ledger exposes all five tasks and no live-write claim", async () => {
  const ledger = await readPayloadText(
    "HC-043",
    "starter/event-ledger.md.template",
  );
  assert.deepEqual(
    [...ledger.matchAll(/^\| (E0[1-5]) \|/gmu)].map((match) => match[1]),
    TASKS,
  );
  const { text } = await assertPhase8PageAndGuides("HC-043");
  for (const phrase of [
    "creator",
    "session visibility",
    "Actions minutes",
    "AI credits",
    "実登録",
    "label更新",
    "not-observed",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
