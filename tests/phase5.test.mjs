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
  assertPhase5Pack,
  packFor,
  PHASE5_IDS,
  PHASE5_SPECS,
} from "./support/phase5-contracts.mjs";

const protectedIds = [
  ...Array.from({ length: 25 }, (_, index) => `HC-${String(index + 1).padStart(3, "0")}`),
  "HC-030",
];
const phase5PublishedIds = Array.from(
  { length: 31 },
  (_, index) => `HC-${String(index + 1).padStart(3, "0")}`,
);
const PROTECTED_CATALOG_DIGEST = "a077d0bcc10dde3d29442c4caae54d9e22462b44f8885b09b6a43064678e058f";
const PROTECTED_HASH_DIGEST = "b640cceef2ced086f70a86034e85507a2ab19a0509b07e8e5aa6eda5a430a4b8";
const IDENTITY_DIGEST = "2512563b8baf9af3aa12957f65a1d258dcac88d0c18b0e79e9fd4f2c4830bdc8";
const RELEASE_DIGEST = "0746431ffd9882a26b193883e73741a38aa039b770d3575e527366eb660590b9";
const README_RECEIPTS = {
  "HC-026": [10374, "8de49c4f4d073c01baf28fbd67f9a9567407669531f03e7c73da2a0b73987d35"],
  "HC-027": [9660, "11772458cf758fdfeec0e62e35b1b4a93fab2e60b1ce778bf4c9b40597c75c79"],
  "HC-028": [9503, "fe3d141006744c736870fb1971e40025b586bcee26519df72f24bad917bf0a98"],
  "HC-029": [10610, "e358e14e703c182889206fe41d5de9c8781a53d4f3bfa9444b40f38461acd97a"],
  "HC-031": [11211, "1271198b79b4e0615ec0c1b10a7bc31ae9ffc3cabb2b37992cd7a447df54b311"],
};

function canonicalGitText(bytes) {
  const text = bytes.toString("utf8");
  assert.equal(/\r(?!\n)/u.test(text), false, "no lone CR");
  return Buffer.from(text.replace(/\r\n/gu, "\n"));
}

test("Phase5 publishes exact HC-026 through HC-031 set and preserves prior identities", async () => {
  const catalog = await loadCatalog();
  assert.deepEqual(
    getPublishedChallengeIds(catalog).filter((id) => phase5PublishedIds.includes(id)),
    phase5PublishedIds,
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
  assert.deepEqual(catalog.releasePlan.waves[4], PHASE5_IDS);
});

test("Phase5 aggregate is exactly thirteen conditions, six guides, fifty-six payloads and sixty-one submissions", async () => {
  let conditions = 0;
  let routes = 0;
  let payloads = 0;
  let submissionPlacements = 0;
  for (const id of PHASE5_IDS) {
    const { entry, manifest } = await assertPhase5Pack(id);
    conditions += manifest.conditions.length;
    routes += entry.optionalRoutes.length;
    payloads += manifest.overlay.length;
    for (const condition of manifest.conditions) {
      submissionPlacements += manifest.submissionFiles.filter(({ conditions: values }) =>
        values.includes(condition)).length;
    }
  }
  assert.deepEqual(
    { conditions, routes, payloads, submissionPlacements },
    { conditions: 13, routes: 6, payloads: 56, submissionPlacements: 61 },
  );
});

test("all current core Packs build plans and Phase5 optional CLI statuses are real process exits", async () => {
  const catalog = await loadCatalog();
  let newConditions = 0;
  for (const entry of catalog.challenges.filter(({ status }) => status === "published")) {
    const manifest = await readJson(path.join(REPOSITORY_ROOT, ...entry.pack.split("/"), "manifest.json"));
    for (const condition of manifest.conditions) {
      const plan = buildRunPlan(catalog, manifest, {
        challengeId: entry.id,
        condition,
        team: "phase5-regression",
        runId: `${entry.id.toLowerCase()}-${condition}-regression`,
      });
      assert.equal(plan.mode, "dry-run");
      assert.equal(plan.condition, condition);
      assert.deepEqual(plan.participantChanges.allowedMutations, manifest.allowedMutations);
      assert.ok(plan.filesToInject.length > 0);
      assert.ok(plan.filesToInject.every(({ allowOverwrite }) => allowOverwrite === false));
      if (PHASE5_IDS.includes(entry.id)) newConditions++;
    }
  }
  assert.equal(newConditions, 13);

  let routeCount = 0;
  for (const id of PHASE5_IDS) {
    const entry = catalog.challenges.find((challenge) => challenge.id === id);
    for (const route of entry.optionalRoutes) {
      const expectedStatus = optionalRuntimeStatus(route) === "blocked" ? 2 : 0;
      const result = runCli(REPOSITORY_ROOT, "plan-run.mjs", [
        "--dry-run",
        "--challenge",
        id,
        "--route",
        route.id,
      ]);
      assert.equal(Number.isInteger(result.pid) && result.pid > 0, true);
      assertCliExit(result, expectedStatus);
      const plan = JSON.parse(result.stdout);
      assert.equal(plan.mode, "optional-guide");
      assert.equal(plan.liveStatus, "live-unobserved");
      assert.equal(plan.readiness.status, optionalRuntimeStatus(route));
      if (expectedStatus === 2) assert.match(result.stderr, /^OPTIONAL_ROUTE_BLOCKED:/u);
      else assert.equal(result.stderr, "");
      routeCount++;
    }
  }
  assert.equal(routeCount, 6);
});

test("Phase5 hash ledger, README bytes, Issue Form and schema are exact while prior records stay protected", async () => {
  const hashes = await readJson(path.join(REPOSITORY_ROOT, "catalog", "pack-hashes.json"));
  assert.deepEqual(
    hashes.packs
      .filter(({ challengeId }) => phase5PublishedIds.includes(challengeId))
      .map(({ challengeId }) => challengeId),
    phase5PublishedIds,
  );
  assert.equal(
    sha256(stableJson(hashes.packs.filter(({ challengeId }) => protectedIds.includes(challengeId)))),
    PROTECTED_HASH_DIGEST,
  );
  assert.ok(hashes.packs.length >= 31);
  for (const id of PHASE5_IDS) {
    const record = hashes.packs.find(({ challengeId }) => challengeId === id);
    const computed = await computePackHash(packFor(id));
    assert.equal(record.sha256, computed.hash);
    assert.equal(record.fileCount, computed.records.length);
    assert.equal(
      record.byteLength,
      computed.records.reduce((total, item) => total + item.byteLength, 0),
    );
    const readme = canonicalGitText(
      await readFile(path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase(), "README.md")),
    );
    assert.equal(readme.length, README_RECEIPTS[id][0]);
    assert.equal(sha256(readme), README_RECEIPTS[id][1]);
  }
  const form = await readFile(
    path.join(REPOSITORY_ROOT, ".github", "ISSUE_TEMPLATE", "challenge-result.yml"),
    "utf8",
  );
  const dropdown = form.match(/id: challenge_id[\s\S]*?options:\s*\n([\s\S]*?)    validations:/u)[1];
  assert.deepEqual(
    [...dropdown.matchAll(/- (HC-\d{3})/gu)]
      .map((match) => match[1])
      .filter((id) => phase5PublishedIds.includes(id)),
    phase5PublishedIds,
  );
  const schema = await readFile(path.join(REPOSITORY_ROOT, "schemas", "challenge-pack.schema.json"));
  assert.equal(schema.length, 9616);
  assert.equal(sha256(schema), "183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e");
});

test("Phase5 manifests reject unknown conditions, active baseline paths and traversal without weakening originals", async () => {
  for (const id of PHASE5_IDS) {
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
  const root = await mkdtemp(path.join(os.tmpdir(), "hc-phase5-build "));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  for (const entry of ["catalog", "scripts", "schemas", "fixtures"]) {
    await cp(path.join(REPOSITORY_ROOT, entry), path.join(root, entry), { recursive: true });
  }
  for (const id of PHASE5_IDS) {
    await cp(
      path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase()),
      path.join(root, "challenges", id.toLowerCase()),
      { recursive: true },
    );
  }
  return root;
}

test("five Phase5 Packs each build once in a fresh target and refuse overwrite", async (t) => {
  const root = await createBuildSnapshot(t);
  for (const id of PHASE5_IDS) {
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
