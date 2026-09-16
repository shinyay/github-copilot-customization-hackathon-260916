import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sha256 } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase5Pack,
  assertPhase5PageAndGuides,
  fail,
  payloadFor,
  roundTripJson,
} from "./support/phase5-contracts.mjs";

const ASSETS = ["reading-rules", "analysis-package"];
const STATES = ["record-01", "record-02", "record-03", "record-04", "record-05"];
const RECORDS = STATES.flatMap((state) => ASSETS.map((asset) => `${state}:${asset}`)).sort();

function checkRecords(value) {
  if (JSON.stringify(value.assetIds) !== JSON.stringify(ASSETS)) fail("HC026_ASSET_SET");
  if (JSON.stringify(value.stateIds) !== JSON.stringify(STATES)) fail("HC026_STATE_SET");
  const ids = value.records.map(({ recordId }) => recordId).sort();
  if (JSON.stringify(ids) !== JSON.stringify(RECORDS)) fail("HC026_RECORD_SET");
  if (new Set(ids).size !== 10) fail("HC026_RECORD_SET");
  for (const state of STATES) {
    const assets = value.records
      .filter(({ stateId }) => stateId === state)
      .map(({ assetId }) => assetId)
      .sort();
    if (JSON.stringify(assets) !== JSON.stringify([...ASSETS].sort())) fail("HC026_RECORD_SET");
  }
}

function rollup(statuses) {
  if (statuses.some((status) => status === "fail")) return "fail";
  if (statuses.some((status) => status === "blocked")) return "blocked";
  if (statuses.every((status) => status === "pass")) return "pass";
  throw new Error("unknown status");
}

test("HC-026 has exact two conditions, thirteen inert payloads and one guide route", async () => {
  const { entry, manifest } = await assertPhase5Pack("HC-026");
  assert.deepEqual(manifest.conditions, ["baseline", "governed-design"]);
  assert.equal(manifest.overlay.length, 13);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), ["rollout-readiness"]);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
});

test("HC-026 page and guide preserve full asset coverage, restore evidence and fail-first rollup", async () => {
  const { text } = await assertPhase5PageAndGuides("HC-026");
  for (const phrase of [
    "2資産×5状態",
    "previous=v1とstale current=v1",
    "1件でも `fail`",
    "1件でも `blocked`",
    "SYNTHETIC_TRAINING_ONLY",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-026 register hashes exact version files and keeps previous, stale current and rollback distinct", async () => {
  const register = JSON.parse(await readFile(payloadFor("HC-026", "asset-register.json.template"), "utf8"));
  for (const asset of register.assets) {
    for (const version of Object.values(asset.versions)) {
      for (const file of version.files) {
        assert.equal(sha256(await readFile(payloadFor("HC-026", file.path))), file.sha256);
      }
    }
  }
  const records = JSON.parse(await readFile(payloadFor("HC-026", "scenario-records.json.template"), "utf8"));
  checkRecords(records);
  const healthy = records.records.find(({ recordId }) => recordId === "record-01:reading-rules");
  const stale = records.records.find(({ recordId }) => recordId === "record-03:reading-rules");
  const badRestore = records.records.find(({ recordId }) => recordId === "record-05:reading-rules");
  assert.deepEqual(
    [healthy.currentVersion, healthy.previousVersion, healthy.rollbackVersion],
    ["v2", "v1", "v1"],
  );
  assert.deepEqual(
    [stale.currentVersion, stale.expectedCurrentVersion, stale.previousVersion, stale.rollbackVersion],
    ["v1", "v2", "v1", "v1"],
  );
  assert.deepEqual(
    [badRestore.previousVersion, badRestore.rollbackVersion, badRestore.rollbackDigestVersion],
    ["v1", "v2", "v1"],
  );
});

test("HC-026 exact ten-record checker rejects missing, duplicate and same-count replacement post-images", async (t) => {
  const original = await readFile(payloadFor("HC-026", "scenario-records.json.template"));
  await t.test("one asset-state record is missing", () =>
    roundTripJson(
      original,
      checkRecords,
      (value) => value.records.pop(),
      (value) => {
        assert.equal(value.records.length, 9);
        assert.equal(value.records.some(({ recordId }) => recordId === "record-05:analysis-package"), false);
      },
      "HC026_RECORD_SET",
    ));
  await t.test("one record is duplicated", () =>
    roundTripJson(
      original,
      checkRecords,
      (value) => { value.records[9] = structuredClone(value.records[0]); },
      (value) => {
        assert.equal(value.records.length, 10);
        assert.equal(new Set(value.records.map(({ recordId }) => recordId)).size, 9);
      },
      "HC026_RECORD_SET",
    ));
  await t.test("same-count replacement introduces another asset", () =>
    roundTripJson(
      original,
      checkRecords,
      (value) => {
        value.records[9].assetId = "replacement-asset";
        value.records[9].recordId = "record-05:replacement-asset";
      },
      (value) => {
        assert.equal(value.records.length, 10);
        assert.equal(value.records.at(-1).recordId, "record-05:replacement-asset");
      },
      "HC026_RECORD_SET",
    ));
});

test("HC-026 aggregate rollup is independent from per-asset classification", () => {
  assert.equal(rollup(["pass", "fail"]), "fail");
  assert.equal(rollup(["blocked", "fail"]), "fail");
  assert.equal(rollup(["pass", "blocked"]), "blocked");
  assert.equal(rollup(["pass", "pass"]), "pass");
});
