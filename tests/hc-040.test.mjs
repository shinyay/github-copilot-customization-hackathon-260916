import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sha256 } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase7Pack,
  assertPhase7PageAndGuides,
  fail,
  payloadFor,
  PHASE7_SPECS,
  readPayloadJson,
} from "./support/phase7-contracts.mjs";

const CONTENT_CELLS = ["baseline", "plugin-package"].flatMap((condition) =>
  ["v1", "v2"].flatMap((revision) =>
    ["same-key-check", "changed-payload-check"].map(
      (task) => `${condition}/${revision}/${task}`,
    ))).sort();
const LIFECYCLE_CELLS = ["baseline", "plugin-package"].flatMap((condition) =>
  ["prepare-v1", "update-v2", "restore-v1"].map(
    (state) => `${condition}/${state}`,
  )).sort();

function lifecycleCells(text) {
  const [contentPart, statePart] = text.split("## Lifecycle states");
  const content = [...contentPart.matchAll(
    /^\| (baseline|plugin-package) \| (v[12]) \| (same-key-check|changed-payload-check) \|/gmu,
  )].map((match) => `${match[1]}/${match[2]}/${match[3]}`).sort();
  const states = [...statePart.matchAll(
    /^\| (baseline|plugin-package) \| (prepare-v1|update-v2|restore-v1) \|/gmu,
  )].map((match) => `${match[1]}/${match[2]}`).sort();
  if (
    JSON.stringify(content) !== JSON.stringify(CONTENT_CELLS) ||
    new Set(content).size !== 8 ||
    JSON.stringify(states) !== JSON.stringify(LIFECYCLE_CELLS) ||
    new Set(states).size !== 6
  ) {
    fail("HC040_LIFECYCLE_SET");
  }
  return { content, states };
}

test("HC-040 publishes exact distribution conditions and one blocked live route", async () => {
  const { entry, manifest } = await assertPhase7Pack("HC-040");
  assert.deepEqual(manifest.conditions, ["baseline", "plugin-package"]);
  assert.equal(manifest.overlay.length, 9);
  assert.equal(entry.sourceKind, "baseline");
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["plugin-lifecycle-live"],
  );
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["not-checked", "blocked"],
  );
});

test("HC-040 starter package is Agent Plugins 1.0 metadata for one Skill only", async () => {
  const plugin = await readPayloadJson("HC-040", "input/plugin.json.template");
  assert.deepEqual(Object.keys(plugin), [
    "$schema",
    "name",
    "version",
    "description",
  ]);
  assert.equal(
    plugin.$schema,
    "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  );
  assert.equal(plugin.name, "training-order-evidence");
  assert.deepEqual(
    PHASE7_SPECS["HC-040"].payloads.filter((file) =>
      file.endsWith("SKILL.md.template")),
    ["input/SKILL.md.template"],
  );
  for (const key of ["mcpServers", "hooks", "agents", "commands", "lspServers"]) {
    assert.equal(Object.hasOwn(plugin, key), false, key);
  }
});

test("HC-040 lifecycle statically exposes eight identity cells and six state rows", async () => {
  const text = await readFile(
    payloadFor("HC-040", "input/lifecycle.md.template"),
    "utf8",
  );
  const cells = lifecycleCells(text);
  assert.equal(cells.content.length, 8);
  assert.equal(cells.states.length, 6);
  for (const phrase of [
    "manual Skill SHA-256",
    "package Skill SHA-256",
    "byteEqual",
    "UTF-8 BOM absence",
    "one `plugin.json` and one Skill",
    "not-observed",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});

test("HC-040 frozen starter Skill bytes are explicit and inactive", async () => {
  const skill = await readFile(payloadFor("HC-040", "input/SKILL.md.template"));
  assert.equal(
    sha256(skill),
    "8f1d638a90d86c993aa6285aa5756f25fc38a7a0fbd9eda80363746f82ef075e",
  );
  assert.match(skill.toString("utf8"), /name: training-order-evidence/u);
  assert.match(skill.toString("utf8"), /SYNTHETIC_TRAINING_ONLY/u);
  assert.equal(skill.includes(13), false);
  assert.equal(
    skill.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
    false,
  );
});

test("HC-040 page holds knowledge constant and compares distribution burden", async () => {
  const { text } = await assertPhase7PageAndGuides("HC-040");
  for (const phrase of [
    "2 tasks × 2 revisions × 2 conditions",
    "8内容点検セル",
    "計6状態行",
    "完全に同じraw bytes",
    "MCP、Hook、agent、command、LSP",
    "planned copy=1",
    "実取得版",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
