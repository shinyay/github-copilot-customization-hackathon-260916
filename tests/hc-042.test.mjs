import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPhase8Pack,
  assertPhase8PageAndGuides,
  readPayloadJson,
  readPayloadText,
} from "./support/phase8-contracts.mjs";

const TASKS = ["D01", "D02", "D03", "D04", "D05", "D06", "D07"];

test("HC-042 publishes exact diagnosis conditions and three unobserved guides", async () => {
  const { entry, manifest } = await assertPhase8Pack("HC-042");
  assert.deepEqual(manifest.conditions, ["baseline", "diagnosis-policy"]);
  assert.equal(manifest.overlay.length, 9);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["credentials", "firewall", "content-exclusion"],
  );
  assert.deepEqual(
    entry.optionalRoutes.flatMap(({ runtimeRequirements }) =>
      runtimeRequirements.map(({ status }) => status)),
    ["not-checked", "not-checked", "not-checked"],
  );
});

test("HC-042 packet set preserves all layers and unknown without secret values", async () => {
  const packet = await readPayloadJson("HC-042", "packet-set.json.template");
  assert.deepEqual(packet.packets.map(({ id }) => id), TASKS);
  assert.deepEqual(packet.presenceVocabulary, [
    "present",
    "absent",
    "unknown",
  ]);
  assert.deepEqual(packet.layers, [
    "discovery",
    "tool-selection-call",
    "network",
    "authentication",
    "authorization",
    "output-use",
  ]);
  assert.equal(packet.packets[0].facts.discoveryRecord.presence, "unknown");
  assert.notEqual(packet.packets[0].facts.discoveryRecord.presence, false);
  assert.equal(
    packet.packets[3].facts.attempts[0].authenticationResult,
    "failed",
  );
  assert.equal(
    packet.packets[3].facts.attempts[1].authorizationResult,
    "denied",
  );
  assert.notEqual(
    packet.packets[6].facts.responses[0].transportResult,
    packet.packets[6].facts.responses[1].transportResult,
  );
  const serialized = JSON.stringify(packet);
  assert.doesNotMatch(
    serialized,
    /"(?:value|valueHash|secretValue|credentialValue)"\s*:/u,
  );
  assert.doesNotMatch(
    serialized.toLowerCase(),
    /"expected"|"verdict"|"answerkey"/u,
  );
});

test("HC-042 participant templates keep the exact task and route boundaries", async () => {
  const decisions = await readPayloadText(
    "HC-042",
    "starter/decisions.md.template",
  );
  assert.deepEqual(
    [...decisions.matchAll(/^\| (D0[1-7]) \|/gmu)].map((match) => match[1]),
    TASKS,
  );
  const routeMap = await readPayloadText(
    "HC-042",
    "starter/route-map.md.template",
  );
  for (const layer of [
    "discovery",
    "tool selection/call",
    "network",
    "authentication",
    "authorization",
    "output use",
  ]) {
    assert.ok(routeMap.includes(`| ${layer} |`), layer);
  }
});

test("HC-042 page keeps source, firewall, trust and observation boundaries explicit", async () => {
  const { text } = await assertPhase8PageAndGuides("HC-042");
  for (const phrase of [
    "SYNTHETIC_TRAINING_ONLY",
    "`present` / `absent` / `unknown`",
    "Bash firewall",
    "server trust",
    "credential値",
    "runtimeBehavior",
    "educationalEffect",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
