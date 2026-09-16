import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { sha256 } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase3Pack,
  assertPhase3PageAndGuides,
  assertRawMaterial,
  fail,
  packFor,
  payloadFor,
  roundTripBuffer,
  roundTripJson,
} from "./support/phase3-contracts.mjs";

const DRAFT_HASH = "d4a38010c92779e5d43cdfefcfbfe3d630684d47d0d0600021f9f51a2022bcd6";
const INVENTORY_HASH = "32210963fa1985b1997771744a045e31bf6d416b002d0c243c5d0debb548cddb";
const FIXED_DERIVATION_HASH = "fb1aecfc6e2a1538f917eeed80b2dd022837587b7a1d9aa7b380987ca957a1ea";
const WRAPPER = `---
description: "Synthetic contradiction for evaluating instruction diagnostics"
applyTo: "**"
---
`;

function checkDraft(bytes) {
  if (bytes.length !== 92 || sha256(bytes) !== DRAFT_HASH) fail("HC019_DRAFT");
  if (bytes.toString("utf8").split("\n").filter(Boolean).length !== 2) fail("HC019_LINE_PAIR");
}

function checkWrapper(bytes) {
  if (bytes.toString("utf8") !== WRAPPER) fail("HC019_WRAPPER");
}

function checkInventory(value) {
  if (
    value.schemaVersion !== 1 ||
    value.evidenceKind !== "synthetic" ||
    value.selectedHarness !== "local-agent" ||
    value.viewHarness !== "local-agent"
  ) fail("HC019_INVENTORY_HEADER");
  if (JSON.stringify(value.entries.map(({ name }) => name)) !== JSON.stringify(["lab19-safe", "profile-only"])) {
    fail("HC019_INVENTORY_SET");
  }
  if (value.entries.some(({ applied }) => applied !== null)) fail("HC019_APPLIED_UNKNOWN");
  if (
    value.entries[0].source !== ".github/instructions/lab19-safe.instructions.md" ||
    value.entries[1].source !== "vscode-profile-user-data/instructions/profile-only.instructions.md"
  ) fail("HC019_INVENTORY_SOURCE");
}

test("HC-019 has exact two conditions, nine payloads and condition-specific inactive repair outputs", async () => {
  const { entry, manifest } = await assertPhase3Pack("HC-019");
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(manifest.conditions, ["baseline", "checklist-review"]);
});

test("HC-019 preserves the accepted README and exactly four guide-only diagnostic boundaries", async () => {
  const { entry, text } = await assertPhase3PageAndGuides("HC-019");
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), [
    "customization-editor", "diagnostic-evaluation", "waza-readiness", "copy-migration",
  ]);
  for (const phrase of [
    "SYNTHETIC_TRAINING_ONLY", "構文、location、harness、意味、discovery、application、usefulness",
    "一種類のanswer key", "applied: null", "原本削除", "runtimeBehavior",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-019 preserves the exact contradiction, wrapper and synthetic inventory without distributing a fixed answer", async () => {
  const draft = await assertRawMaterial("HC-019", "draft-p.txt.template", 92, DRAFT_HASH);
  checkDraft(draft);
  const wrapper = await readFile(payloadFor("HC-019", "wrapper.txt.template"));
  checkWrapper(wrapper);
  const inventoryBytes = await assertRawMaterial("HC-019", "inventory.json.template", 697, INVENTORY_HASH);
  checkInventory(JSON.parse(inventoryBytes));
  const payloadFiles = (await readdir(payloadFor("HC-019", ""))).sort();
  assert.equal(payloadFiles.includes("contradiction-fixed.txt.template"), false);
  assert.equal(payloadFiles.includes("answer-key.json.template"), false);

  const derived = Buffer.from(draft.toString("utf8").replace(
    "Never include a heading named Unknowns.\n",
    "",
  ));
  assert.equal(derived.length, 52);
  assert.equal(sha256(derived), FIXED_DERIVATION_HASH);
  assert.equal(derived.toString("utf8"), "Use exactly the two headings Evidence and Unknowns.\n");
});

test("HC-019 negative post-images keep each mutation isolated and restore the full source", async (t) => {
  const draft = await readFile(payloadFor("HC-019", "draft-p.txt.template"));
  await t.test("required line is deleted with the contradictory line", () => roundTripBuffer(
    draft,
    checkDraft,
    () => Buffer.from(""),
    (bytes) => assert.equal(bytes.length, 0),
    "HC019_DRAFT",
  ));
  const wrapper = await readFile(payloadFor("HC-019", "wrapper.txt.template"));
  await t.test("wrapper scope changes while body input remains separate", () => roundTripBuffer(
    wrapper,
    checkWrapper,
    (bytes) => Buffer.from(bytes.toString("utf8").replace('applyTo: "**"', 'applyTo: "**/*.md"')),
    (bytes) => {
      assert.ok(bytes.includes(Buffer.from('applyTo: "**/*.md"')));
      assert.ok(bytes.includes(Buffer.from("Synthetic contradiction")));
    },
    "HC019_WRAPPER",
  ));
  const inventory = await readFile(payloadFor("HC-019", "inventory.json.template"));
  await t.test("listed is promoted to applied", () => roundTripJson(
    inventory,
    checkInventory,
    (value) => { value.entries[0].applied = true; },
    (value) => {
      assert.equal(value.entries[0].listed, true);
      assert.equal(value.entries[0].applied, true);
      assert.equal(value.entries[1].applied, null);
    },
    "HC019_APPLIED_UNKNOWN",
  ));
  await t.test("another harness inventory is substituted", () => roundTripJson(
    inventory,
    checkInventory,
    (value) => { value.viewHarness = "agent-host"; },
    (value) => {
      assert.equal(value.selectedHarness, "local-agent");
      assert.equal(value.viewHarness, "agent-host");
    },
    "HC019_INVENTORY_HEADER",
  ));
  assert.ok(packFor("HC-019"));
});
