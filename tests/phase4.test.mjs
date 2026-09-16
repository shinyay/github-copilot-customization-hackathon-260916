import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { getPublishedChallengeIds, loadCatalog } from "../scripts/lib/catalog.mjs";
import { readJson, REPOSITORY_ROOT, sha256, stableJson } from "../scripts/lib/fs-utils.mjs";
import { optionalRuntimeStatus } from "../scripts/lib/optional-routes.mjs";
import { computePackHash, validatePackManifest } from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";
import { assertCliExit, runCli } from "../test-support/publication-fixtures.mjs";
import {
  assertPhase4Pack,
  packFor,
  PHASE4_IDS,
  PHASE4_SPECS,
} from "./support/phase4-contracts.mjs";

const protectedIds = [
  ...Array.from({ length: 20 }, (_, index) => `HC-${String(index + 1).padStart(3, "0")}`),
  "HC-030",
];
const phase4PublishedIds = [
  ...Array.from({ length: 25 }, (_, index) => `HC-${String(index + 1).padStart(3, "0")}`),
  "HC-030",
];
const PROTECTED_CATALOG_DIGEST = "43a1f0566030cc180945c9a5d8e94256cb7b8534afaf2dba611e669c0a3c327a";
const IDENTITY_DIGEST = "2512563b8baf9af3aa12957f65a1d258dcac88d0c18b0e79e9fd4f2c4830bdc8";
const RELEASE_DIGEST = "0746431ffd9882a26b193883e73741a38aa039b770d3575e527366eb660590b9";
const PROTECTED_HASH_DIGEST = "2c7d9f7a40530e7036432c3588d482123d7cb40ea0ab1342c0bde9e2b81c4e09";

test("Phase4 publishes exact HC-021 through HC-025 and preserves prior catalog identities", async () => {
  const catalog = await loadCatalog();
  assert.deepEqual(
    getPublishedChallengeIds(catalog).filter((id) => phase4PublishedIds.includes(id)),
    phase4PublishedIds,
  );
  assert.equal(catalog.challenges.length, 45);
  assert.equal(
    sha256(stableJson(catalog.challenges.filter(({ id }) => protectedIds.includes(id)))),
    PROTECTED_CATALOG_DIGEST,
  );
  assert.equal(
    sha256(stableJson(catalog.challenges.map(({ id, track, sourceLab }) => ({ id, track, sourceLab })))),
    IDENTITY_DIGEST,
  );
  assert.equal(sha256(stableJson(catalog.releasePlan)), RELEASE_DIGEST);
  assert.deepEqual(catalog.releasePlan.waves[3], PHASE4_IDS);
});

test("Phase4 aggregate is exactly seventeen conditions, four optional guides and seventy-nine payloads", async () => {
  let conditions = 0;
  let routes = 0;
  let overlays = 0;
  let participantPlacements = 0;
  let evidencePlacements = 0;
  for (const id of PHASE4_IDS) {
    const { entry, manifest } = await assertPhase4Pack(id);
    conditions += manifest.conditions.length;
    routes += entry.optionalRoutes.length;
    overlays += manifest.overlay.length;
    for (const condition of manifest.conditions) {
      participantPlacements += PHASE4_SPECS[id].additions[condition].length;
      evidencePlacements += manifest.evidenceRequirements.filter(({ conditions: values }) =>
        values.includes(condition)).length;
    }
  }
  assert.deepEqual(
    { conditions, routes, overlays, participantPlacements, evidencePlacements },
    { conditions: 17, routes: 4, overlays: 79, participantPlacements: 76, evidencePlacements: 17 },
  );
});

test("all twenty-six published core Packs build plans and Phase4 optional routes remain guide-only", async () => {
  const catalog = await loadCatalog();
  let newConditions = 0;
  for (const entry of catalog.challenges.filter(({ status }) => status === "published")) {
    const manifest = await readJson(path.join(REPOSITORY_ROOT, ...entry.pack.split("/"), "manifest.json"));
    for (const condition of manifest.conditions) {
      const plan = buildRunPlan(catalog, manifest, {
        challengeId: entry.id,
        condition,
        team: "phase4-regression",
        runId: `${entry.id.toLowerCase()}-${condition}-regression`,
      });
      assert.equal(plan.mode, "dry-run");
      assert.equal(plan.condition, condition);
      assert.deepEqual(plan.participantChanges.allowedMutations, manifest.allowedMutations);
      assert.ok(plan.filesToInject.length > 0);
      assert.ok(plan.filesToInject.every(({ allowOverwrite }) => allowOverwrite === false));
      if (PHASE4_IDS.includes(entry.id)) newConditions++;
    }
  }
  assert.equal(newConditions, 17);

  let routeCount = 0;
  for (const id of PHASE4_IDS) {
    const entry = catalog.challenges.find((challenge) => challenge.id === id);
    for (const route of entry.optionalRoutes) {
      const plan = buildRunPlan(catalog, null, { challengeId: id, route: route.id });
      assert.equal(plan.mode, "optional-guide");
      assert.equal(plan.liveStatus, "live-unobserved");
      assert.equal(plan.readiness.status, optionalRuntimeStatus(route));
      for (const key of [
        "condition",
        "template",
        "filesToInject",
        "participantChanges",
        "runStateEvidence",
        "proposedRepositoryName",
      ]) assert.equal(Object.hasOwn(plan, key), false, `${id}/${route.id}: no ${key}`);
      routeCount++;
    }
  }
  assert.equal(routeCount, 4);
});

test("Phase4 hash ledger, Issue Form and schema are exact while prior hash records stay protected", async () => {
  const hashes = await readJson(path.join(REPOSITORY_ROOT, "catalog", "pack-hashes.json"));
  assert.deepEqual(
    hashes.packs
      .filter(({ challengeId }) => phase4PublishedIds.includes(challengeId))
      .map(({ challengeId }) => challengeId),
    phase4PublishedIds,
  );
  assert.equal(
    sha256(stableJson(hashes.packs.filter(({ challengeId }) => protectedIds.includes(challengeId)))),
    PROTECTED_HASH_DIGEST,
  );
  assert.ok(hashes.packs.length >= 26);
  for (const id of PHASE4_IDS) {
    const record = hashes.packs.find(({ challengeId }) => challengeId === id);
    const computed = await computePackHash(packFor(id));
    assert.equal(record.sha256, computed.hash);
    assert.equal(record.fileCount, computed.records.length);
    assert.equal(
      record.byteLength,
      computed.records.reduce((total, item) => total + item.byteLength, 0),
    );
  }
  const form = await readFile(
    path.join(REPOSITORY_ROOT, ".github", "ISSUE_TEMPLATE", "challenge-result.yml"),
    "utf8",
  );
  const dropdown = form.match(/id: challenge_id[\s\S]*?options:\s*\n([\s\S]*?)    validations:/u)[1];
  assert.deepEqual(
    [...dropdown.matchAll(/- (HC-\d{3})/gu)]
      .map((match) => match[1])
      .filter((id) => phase4PublishedIds.includes(id)),
    phase4PublishedIds,
  );
  const schema = await readFile(path.join(REPOSITORY_ROOT, "schemas", "challenge-pack.schema.json"));
  assert.equal(schema.length, 9616);
  assert.equal(sha256(schema), "183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e");
});

test("Phase4 manifests reject unknown conditions, active baseline paths and traversal without weakening originals", async () => {
  for (const id of PHASE4_IDS) {
    const original = await readJson(path.join(packFor(id), "manifest.json"));
    assert.deepEqual(validatePackManifest(original, id), []);

    const unknown = structuredClone(original);
    unknown.overlay[0].conditions = ["missing-condition"];
    assert.deepEqual(unknown.overlay[0].conditions, ["missing-condition"]);
    assertErrorCode(validatePackManifest(unknown, id), "PACK_CONDITION_UNKNOWN");

    const active = structuredClone(original);
    active.allowedAdditions.push({ pattern: "AGENTS.md", conditions: ["baseline"] });
    assert.equal(active.allowedAdditions.at(-1).pattern, "AGENTS.md");
    assertErrorCode(validatePackManifest(active, id), "PACK_BASELINE_ACTIVE_CUSTOMIZATION");

    const traversal = structuredClone(original);
    traversal.overlay[0].destination = "../outside.template";
    assert.equal(traversal.overlay[0].destination, "../outside.template");
    assertErrorCode(validatePackManifest(traversal, id), "PACK_INERT_DESTINATION");

    assert.deepEqual(validatePackManifest(structuredClone(original), id), []);
  }
});

async function createBuildSnapshot(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "hc-phase4-build "));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  for (const entry of ["catalog", "scripts", "schemas", "fixtures"]) {
    await cp(path.join(REPOSITORY_ROOT, entry), path.join(root, entry), { recursive: true });
  }
  for (const id of PHASE4_IDS) {
    await cp(
      path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase()),
      path.join(root, "challenges", id.toLowerCase()),
      { recursive: true },
    );
  }
  return root;
}

test("five Phase4 Packs each build once in a fresh target and refuse overwrite", async (t) => {
  const root = await createBuildSnapshot(t);
  for (const id of PHASE4_IDS) {
    const output = path.join(root, ".runtime", "packs", `${id.toLowerCase()}-v1`);
    await assert.rejects(stat(output), { code: "ENOENT" });
    const built = runCli(root, "build-pack.mjs", ["--challenge", id, "--output", ".runtime/packs"]);
    assert.equal(Number.isInteger(built.pid) && built.pid > 0, true);
    assertCliExit(built, 0);
    assert.equal(built.stderr, "");
    assert.deepEqual(
      await computePackHash(output),
      await computePackHash(path.join(root, "challenges", id.toLowerCase(), "pack")),
    );
    const repeated = runCli(root, "build-pack.mjs", ["--challenge", id, "--output", ".runtime/packs"]);
    assert.equal(Number.isInteger(repeated.pid) && repeated.pid > 0, true);
    assertCliExit(repeated, 1);
    assert.match(repeated.stderr, /Pack output already exists/u);
  }
});
