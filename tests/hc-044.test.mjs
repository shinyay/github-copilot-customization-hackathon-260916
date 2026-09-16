import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPhase8Pack,
  assertPhase8PageAndGuides,
  readPayloadJson,
  readPayloadText,
} from "./support/phase8-contracts.mjs";

const TASKS = ["A01", "A02", "A03", "A04", "A05", "A06", "A07"];

function task(records, id) {
  return records.find((record) => record.id === id);
}

function fileMatches(pattern, file) {
  assert.equal(pattern, "wholesale-core/**");
  return file.startsWith("wholesale-core/");
}

function eventCanCount(event, policy) {
  return (
    policy.countTowardRequiredApprovals === true &&
    event.state === "APPROVED" &&
    event.actorEligibilityRecord === "recorded" &&
    event.targetHead === policy.targetHead &&
    !Object.hasOwn(event, "duplicateOf")
  );
}

test("HC-044 publishes exact approval conditions and one unobserved guide", async () => {
  const { entry, manifest } = await assertPhase8Pack("HC-044");
  assert.deepEqual(manifest.conditions, ["baseline", "approval-policy"]);
  assert.equal(manifest.overlay.length, 10);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), ["approvals"]);
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["not-checked"],
  );
});

test("HC-044 fixtures keep assessment, event eligibility and count separate", async () => {
  const policies = (await readPayloadJson(
    "HC-044",
    "policy-snapshot.json.template",
  )).tasks;
  const events = (await readPayloadJson(
    "HC-044",
    "review-events.json.template",
  )).tasks;
  assert.deepEqual(policies.map(({ id }) => id), TASKS);
  assert.deepEqual(events.map(({ id }) => id), TASKS);

  const a01 = task(events, "A01");
  assert.equal(a01.assessment.state, "positive");
  assert.equal(a01.reviewEvents.length, 0);

  const a02Policy = task(policies, "A02");
  const a02Event = task(events, "A02").reviewEvents[0];
  assert.equal(a02Event.state, "APPROVED");
  assert.equal(eventCanCount(a02Event, a02Policy), false);

  const a03Policy = task(policies, "A03");
  const a03Eligible = task(events, "A03").reviewEvents.filter((event) =>
    eventCanCount(event, a03Policy));
  assert.equal(a03Eligible.length, 1);
  assert.equal(a03Eligible.length >= a03Policy.requiredApprovalCount, false);
});

test("HC-044 all-files and count rollups are independent from per-event predicates", async () => {
  const policies = (await readPayloadJson(
    "HC-044",
    "policy-snapshot.json.template",
  )).tasks;
  const events = (await readPayloadJson(
    "HC-044",
    "review-events.json.template",
  )).tasks;

  const a04 = task(policies, "A04");
  const filePredicate = (file) =>
    a04.changedFilePatterns.some((pattern) => fileMatches(pattern, file));
  assert.equal(a04.changedFiles.some(filePredicate), true);
  assert.equal(a04.changedFiles.every(filePredicate), false);

  const a05Policy = task(policies, "A05");
  const a05Events = task(events, "A05").reviewEvents;
  assert.equal(
    a05Events.filter((event) => eventCanCount(event, a05Policy)).length,
    0,
  );
  assert.equal(
    new Set(a05Events.map(({ eventId, duplicateOf }) => duplicateOf ?? eventId))
      .size,
    1,
  );

  const a07 = task(policies, "A07");
  assert.equal(a07.otherMergeGates.ci, "unknown");
  assert.doesNotMatch(
    JSON.stringify({ policies, events }).toLowerCase(),
    /"expected"|"verdict"|"answerkey"|"pathseligible"|"samehead"/u,
  );
});

test("HC-044 decision template and page require per-event then rollup reasoning", async () => {
  const ledger = await readPayloadText(
    "HC-044",
    "starter/decision-ledger.md.template",
  );
  assert.deepEqual(
    [...ledger.matchAll(/^\| (A0[1-7]) \|/gmu)].map((match) => match[1]),
    TASKS,
  );
  const { text } = await assertPhase8PageAndGuides("HC-044");
  for (const phrase of [
    "assessment",
    "per-event eligibility",
    "all-files",
    "stale",
    "duplicate",
    "merge可能",
    "not-observed",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
