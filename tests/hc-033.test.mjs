import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase6Pack,
  assertPhase6PageAndGuides,
  fail,
  payloadFor,
  readPayloadJson,
  roundTripJson,
} from "./support/phase6-contracts.mjs";

function frontmatterBody(bytes) {
  const match = /^---\n[\s\S]*?\n---\n\n([\s\S]+)$/u.exec(bytes.toString("utf8"));
  if (!match) fail("HC033_SKILL_FRONTMATTER");
  return match[1].trimEnd();
}

function between(text, start, end) {
  const pattern = new RegExp(
    `${start.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\n([\\s\\S]*?)\\n${end.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}`,
    "u",
  );
  const match = pattern.exec(text);
  if (!match) fail("HC033_MANUAL_SECTIONS");
  return match[1];
}

function checkPacketSets(value) {
  const inputIds = value.inputCards.map(({ id }) => id);
  const observationIds = value.observationPackets.map(({ id }) => id);
  if (
    JSON.stringify(inputIds) !==
      JSON.stringify(["R33-01", "R33-02", "R33-03"]) ||
    new Set(inputIds).size !== 3 ||
    JSON.stringify(observationIds) !==
      JSON.stringify(["P33-01", "P33-02", "P33-03", "P33-04"]) ||
    new Set(observationIds).size !== 4
  ) {
    fail("HC033_PACKET_SET");
  }
  return { inputIds, observationIds };
}

test("HC-033 publishes exact Skill conditions, tasks and two guide routes", async () => {
  const { entry, manifest } = await assertPhase6Pack("HC-033");
  assert.deepEqual(manifest.conditions, [
    "baseline",
    "skill-package",
    "manual-equivalent",
  ]);
  assert.equal(manifest.overlay.length, 9);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["cloud-skill", "review-skill"],
  );
  assert.equal(entry.optionalRoutes[0].runtimeRequirements[0].status, "blocked");
  assert.equal(entry.optionalRoutes[1].runtimeRequirements[0].status, "not-checked");
});

test("HC-033 manual bundle contains the exact Skill body and checklist sections", async () => {
  const skill = await readFile(payloadFor("HC-033", "SKILL.md.template"));
  const checklist = await readFile(payloadFor("HC-033", "checklist.md.template"));
  const manual = await readFile(
    payloadFor("HC-033", "manual-bundle.md.template"),
    "utf8",
  );
  assert.equal(
    between(
      manual,
      "<!-- MANUAL_SKILL_BODY_START -->",
      "<!-- MANUAL_SKILL_BODY_END -->",
    ),
    frontmatterBody(skill),
  );
  assert.equal(
    between(
      manual,
      "<!-- MANUAL_CHECKLIST_START -->",
      "<!-- MANUAL_CHECKLIST_END -->",
    ),
    checklist.toString("utf8").trimEnd(),
  );
});

test("HC-033 packets keep three input cards and four observation stages neutral", async (t) => {
  const original = await readFile(payloadFor("HC-033", "packets.json.template"));
  const fixture = await readPayloadJson("HC-033");
  checkPacketSets(fixture);
  assert.equal(fixture.observationPackets[0].bodyObserved, false);
  assert.equal(fixture.observationPackets[2].resourcesObserved, true);
  assert.equal(fixture.observationPackets[3].scriptObserved, "not-observed");
  assert.doesNotMatch(
    JSON.stringify(fixture).toLowerCase(),
    /"expected"|"verdict"|"answerkey"|"canonicaldigest"/u,
  );

  await t.test("same-count duplicate packet ID is rejected", () =>
    roundTripJson(
      original,
      checkPacketSets,
      (value) => {
        value.observationPackets[3].id = "P33-03";
      },
      (value) => {
        assert.equal(value.observationPackets.length, 4);
        assert.equal(
          new Set(value.observationPackets.map(({ id }) => id)).size,
          3,
        );
      },
      "HC033_PACKET_SET",
    ));
});

test("HC-033 resource ledger separates body, resource, manual sections and script", async () => {
  const ledger = await readFile(
    payloadFor("HC-033", "resource-ledger.md.template"),
    "utf8",
  );
  for (const phrase of [
    "SKILL body",
    "checklist file",
    "manual Skill body",
    "manual checklist",
    "| script | none |",
    "not-observed",
  ]) {
    assert.ok(ledger.includes(phrase), phrase);
  }
});

test("HC-033 page keeps replay and journal tasks independent from Skill stages", async () => {
  const { text } = await assertPhase6PageAndGuides("HC-033");
  for (const phrase of [
    "`replay-plan`",
    "`journal-boundary`",
    "description / body / resources / script",
    "前taskの回答を後taskの前提にしない",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
