import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase7Pack,
  assertPhase7PageAndGuides,
  fail,
  payloadFor,
  readPayloadJson,
} from "./support/phase7-contracts.mjs";

const TASKS = [
  "root-rules",
  "org-instructions",
  "org-profile",
  "enterprise-profile",
];
const RECORDS = ["record-01", "record-02", "record-03"];
const CELLS = ["baseline", "governed-design"].flatMap((condition) =>
  TASKS.flatMap((task) =>
    RECORDS.map((record) => `${condition}/${task}/${record}`))).sort();

function checkCells(text) {
  const rows = [...text.matchAll(
    /^\| (baseline|governed-design) \| (root-rules|org-instructions|org-profile|enterprise-profile) \| (record-0[123]) \|/gmu,
  )].map((match) => `${match[1]}/${match[2]}/${match[3]}`).sort();
  if (
    rows.length !== 24 ||
    new Set(rows).size !== 24 ||
    JSON.stringify(rows) !== JSON.stringify(CELLS)
  ) {
    fail("HC039_CELL_SET");
  }
  return rows;
}

test("HC-039 publishes exact governance conditions and two optional routes", async () => {
  const { entry, manifest } = await assertPhase7Pack("HC-039");
  assert.deepEqual(manifest.conditions, ["baseline", "governed-design"]);
  assert.equal(manifest.overlay.length, 9);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["org-instructions-live", "shared-profiles-live"],
  );
  assert.deepEqual(
    entry.optionalRoutes.map(({ runtimeRequirements }) =>
      runtimeRequirements.map(({ status }) => status)),
    [["not-checked"], ["not-checked", "blocked"]],
  );
});

test("HC-039 ownership ledger and design preserve the exact twelve records per condition", async () => {
  const design = await readFile(payloadFor("HC-039", "design.md.template"), "utf8");
  assert.equal(checkCells(design).length, 24);
  const ledger = await readPayloadJson("HC-039", "input/ownership.json.template");
  assert.equal(ledger.records.length, 12);
  assert.deepEqual(
    ledger.records.map(({ task, record }) => `${task}/${record}`).sort(),
    TASKS.flatMap((task) =>
      RECORDS.map((record) => `${task}/${record}`)).sort(),
  );
  assert.equal(new Set(ledger.records.map(({ task, record }) => `${task}/${record}`)).size, 12);
  assert.ok(ledger.records.some(({ owner }) => owner === null));
  assert.ok(
    ledger.records.some(
      ({ selectedRef, recordedRevision }) => selectedRef !== recordedRevision,
    ),
  );
  assert.ok(ledger.records.every(({ proposal }) => proposal === null));
  assert.ok(ledger.records.every(({ proposalApproved }) => proposalApproved === false));
});

test("HC-039 mechanism map separates Instructions precedence from profile deduplication", async () => {
  const map = await readFile(
    payloadFor("HC-039", "input/mechanism-map.md.template"),
    "utf8",
  );
  for (const phrase of [
    "## Instructions precedence",
    "repository Instructions take precedence over organization Instructions",
    "## Profile name deduplication",
    "1. repository",
    "2. organization",
    "3. enterprise",
    "Storage repository ACL",
    "usage scope",
    "Public Preview",
  ]) {
    assert.ok(map.includes(phrase), phrase);
  }
});

test("HC-039 page preserves owner, ACL, scope, revision and Preview boundaries", async () => {
  const { text } = await assertPhase7PageAndGuides("HC-039");
  for (const phrase of [
    "owner不明",
    "保存repositoryのACL",
    "利用scope",
    "repo、organization、enterprise",
    "同じ処理ではありません",
    "Public Preview",
    "実organization設定",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
