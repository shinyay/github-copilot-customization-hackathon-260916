import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { getPublishedChallengeIds, loadCatalog } from "../scripts/lib/catalog.mjs";
import { readJson, REPOSITORY_ROOT, sha256, stableJson } from "../scripts/lib/fs-utils.mjs";
import { optionalRuntimeStatus } from "../scripts/lib/optional-routes.mjs";
import { computePackHash, validatePackDirectory, validatePackManifest } from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";
import { assertCliExit, runCli } from "../test-support/publication-fixtures.mjs";
import {
  assertPhase3Pack,
  packFor,
  PHASE3_IDS,
  PHASE3_SPECS,
} from "./support/phase3-contracts.mjs";

const legacyIds = [
  "HC-001", "HC-002", "HC-003", "HC-004", "HC-005", "HC-006",
  "HC-007", "HC-008", "HC-009", "HC-010", "HC-011", "HC-012",
  "HC-013", "HC-014", "HC-015", "HC-030",
];
const phase3PublishedIds = [
  ...Array.from({ length: 20 }, (_, index) => `HC-${String(index + 1).padStart(3, "0")}`),
  "HC-030",
];
const expectedLegacyCatalogDigest = "e990313020b5d54e39d9058a689dc1e02a958bdf5997aa0a9c210b643fe5d4e9";
const expectedIdentityDigest = "2512563b8baf9af3aa12957f65a1d258dcac88d0c18b0e79e9fd4f2c4830bdc8";
const expectedReleaseDigest = "0746431ffd9882a26b193883e73741a38aa039b770d3575e527366eb660590b9";
const expectedLegacyHashDigest = "a16720f35f3eb5b014c8c48cc60bebdc39cf5e17fc008bbae4cccaa78dcc4b53";

function assertPhase3Sets(catalog, manifests) {
  assert.deepEqual(
    getPublishedChallengeIds(catalog).filter((id) => phase3PublishedIds.includes(id)),
    phase3PublishedIds,
  );
  assert.ok(phase3PublishedIds.every((id) =>
    catalog.challenges.find((entry) => entry.id === id)?.status === "published"));
  assert.deepEqual(Object.keys(manifests), PHASE3_IDS);
  for (const id of PHASE3_IDS) {
    assert.deepEqual(manifests[id].conditions, PHASE3_SPECS[id].conditions, `${id}: exact conditions`);
    assert.deepEqual(
      catalog.challenges.find((entry) => entry.id === id).optionalRoutes.map(({ id: route }) => route),
      PHASE3_SPECS[id].routes,
      `${id}: exact optional routes`,
    );
  }
}

test("Phase3 publishes exactly HC-016 through HC-020 while preserving all existing identities and metadata", async () => {
  const catalog = await loadCatalog();
  const manifests = Object.fromEntries(await Promise.all(PHASE3_IDS.map(async (id) => [
    id,
    await readJson(path.join(packFor(id), "manifest.json")),
  ])));
  assertPhase3Sets(catalog, manifests);
  assert.equal(catalog.challenges.length, 45);
  assert.equal(
    sha256(stableJson(catalog.challenges.filter(({ id }) => legacyIds.includes(id)))),
    expectedLegacyCatalogDigest,
  );
  assert.equal(
    sha256(stableJson(catalog.challenges.map(({ id, track, sourceLab }) => ({ id, track, sourceLab })))),
    expectedIdentityDigest,
  );
  assert.equal(sha256(stableJson(catalog.releasePlan)), expectedReleaseDigest);
  assert.deepEqual(catalog.releasePlan.waves[2], PHASE3_IDS);

  const missingCondition = structuredClone(manifests);
  missingCondition["HC-017"].conditions.pop();
  assert.throws(() => assertPhase3Sets(catalog, missingCondition), /exact conditions/u);
  const missingRouteCatalog = structuredClone(catalog);
  missingRouteCatalog.challenges.find(({ id }) => id === "HC-019").optionalRoutes.pop();
  assert.throws(() => assertPhase3Sets(missingRouteCatalog, manifests), /exact optional routes/u);
  const missingPublication = structuredClone(catalog);
  missingPublication.challenges.find(({ id }) => id === "HC-020").status = "planned";
  assert.throws(() => assertPhase3Sets(missingPublication, manifests));
  assertPhase3Sets(catalog, manifests);
});

test("Phase3 exact aggregate counts are twelve conditions, twelve optional guides and forty-seven payloads", async () => {
  let conditions = 0;
  let routes = 0;
  let overlays = 0;
  let participantPlacements = 0;
  let evidencePlacements = 0;
  for (const id of PHASE3_IDS) {
    const { entry, manifest } = await assertPhase3Pack(id);
    conditions += manifest.conditions.length;
    routes += entry.optionalRoutes.length;
    overlays += manifest.overlay.length;
    for (const condition of manifest.conditions) {
      participantPlacements += PHASE3_SPECS[id].additions[condition].length;
      evidencePlacements += manifest.evidenceRequirements.filter(({ conditions: values }) =>
        values.includes(condition)).length;
    }
  }
  assert.deepEqual(
    { conditions, routes, overlays, participantPlacements, evidencePlacements },
    { conditions: 12, routes: 12, overlays: 47, participantPlacements: 39, evidencePlacements: 12 },
  );
});

test("all twenty-one published core Packs still build run plans and Phase3 optional routes expose no execution grants", async () => {
  const catalog = await loadCatalog();
  let legacyConditions = 0;
  let newConditions = 0;
  for (const entry of catalog.challenges.filter(({ status }) => status === "published")) {
    const manifest = await readJson(path.join(REPOSITORY_ROOT, ...entry.pack.split("/"), "manifest.json"));
    for (const condition of manifest.conditions) {
      const plan = buildRunPlan(catalog, manifest, {
        challengeId: entry.id,
        condition,
        team: "phase3-regression",
        runId: `${entry.id.toLowerCase()}-${condition}-regression`,
      });
      assert.equal(plan.mode, "dry-run");
      assert.equal(plan.condition, condition);
      assert.deepEqual(plan.participantChanges.allowedMutations, manifest.allowedMutations);
      assert.ok(plan.filesToInject.length > 0);
      assert.ok(plan.filesToInject.every(({ allowOverwrite }) => allowOverwrite === false));
      if (PHASE3_IDS.includes(entry.id)) newConditions++;
      else legacyConditions++;
    }
  }
  assert.equal(newConditions, 12);
  assert.ok(legacyConditions > 0);

  let routeCount = 0;
  for (const id of PHASE3_IDS) {
    const entry = catalog.challenges.find((challenge) => challenge.id === id);
    for (const route of entry.optionalRoutes) {
      const plan = buildRunPlan(catalog, null, { challengeId: id, route: route.id });
      assert.equal(plan.mode, "optional-guide");
      assert.equal(plan.liveStatus, "live-unobserved");
      assert.equal(plan.readiness.status, optionalRuntimeStatus(route));
      for (const key of [
        "condition", "template", "filesToInject", "participantChanges",
        "runStateEvidence", "proposedRepositoryName",
      ]) assert.equal(Object.hasOwn(plan, key), false, `${id}/${route.id}: no ${key}`);
      routeCount++;
    }
  }
  assert.equal(routeCount, 12);
});

test("Phase3 hash ledger, Issue Form, schema and accepted README sets are exact", async () => {
  const hashes = await readJson(path.join(REPOSITORY_ROOT, "catalog", "pack-hashes.json"));
  assert.deepEqual(
    hashes.packs.filter(({ challengeId }) => phase3PublishedIds.includes(challengeId))
      .map(({ challengeId }) => challengeId),
    phase3PublishedIds,
  );
  assert.equal(
    sha256(stableJson(hashes.packs.filter(({ challengeId }) => legacyIds.includes(challengeId)))),
    expectedLegacyHashDigest,
  );
  assert.ok(hashes.packs.length >= phase3PublishedIds.length);
  for (const id of PHASE3_IDS) {
    const record = hashes.packs.find(({ challengeId }) => challengeId === id);
    const computed = await computePackHash(packFor(id));
    assert.equal(record.sha256, computed.hash);
    assert.equal(record.fileCount, computed.records.length);
    assert.equal(
      record.byteLength,
      computed.records.reduce((total, item) => total + item.byteLength, 0),
    );
    const readme = await readFile(path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase(), "README.md"));
    const normalizedReadme = Buffer.from(readme.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    assert.equal(sha256(normalizedReadme), PHASE3_SPECS[id].readmeSha256);
  }
  const form = await readFile(
    path.join(REPOSITORY_ROOT, ".github", "ISSUE_TEMPLATE", "challenge-result.yml"),
    "utf8",
  );
  const dropdown = form.match(/id: challenge_id[\s\S]*?options:\s*\n([\s\S]*?)    validations:/u)[1];
  assert.deepEqual(
    [...dropdown.matchAll(/- (HC-\d{3})/gu)].map((match) => match[1])
      .filter((id) => phase3PublishedIds.includes(id)),
    phase3PublishedIds,
  );
  const schema = await readFile(path.join(REPOSITORY_ROOT, "schemas", "challenge-pack.schema.json"));
  assert.equal(schema.length, 9616);
  assert.equal(sha256(schema), "183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e");
});

test("Phase3 producer negatives reject missing, extra and changed payloads, then restore the exact Pack", async (t) => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "hc-phase3-negative-"));
  t.after(() => rm(fixture, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  await cp(packFor("HC-016"), fixture, { recursive: true });
  const originalHash = await computePackHash(fixture);
  const assertRestored = async () => {
    assert.deepEqual((await validatePackDirectory(fixture, "HC-016")).errors, []);
    assert.deepEqual(await computePackHash(fixture), originalHash);
  };
  await assertRestored();

  const missing = path.join(fixture, "payload", "cards.md.template");
  const missingBytes = await readFile(missing);
  await unlink(missing);
  assertErrorCode((await validatePackDirectory(fixture, "HC-016")).errors, "PACK_OVERLAY_SOURCE_MISSING");
  await writeFile(missing, missingBytes);
  await assertRestored();

  const extra = path.join(fixture, "payload", "extra.md.template");
  await writeFile(extra, "extra\n", "utf8");
  assertErrorCode((await validatePackDirectory(fixture, "HC-016")).errors, "PACK_UNREFERENCED_PAYLOAD");
  await unlink(extra);
  await assertRestored();

  const evidence = path.join(fixture, "payload", "evidence", "comparison.md.template");
  const evidenceBytes = await readFile(evidence);
  const changed = Buffer.from(evidenceBytes.toString("utf8").replace("## Outcome\n", "## Changed outcome\n"));
  assert.match(changed.toString("utf8"), /^## Changed outcome$/mu);
  assert.doesNotMatch(changed.toString("utf8"), /^## Outcome$/mu);
  await writeFile(evidence, changed);
  assertErrorCode((await validatePackDirectory(fixture, "HC-016")).errors, "PACK_EVIDENCE_TEMPLATE_HASH");
  await writeFile(evidence, evidenceBytes);
  await assertRestored();
});

test("Phase3 manifest negatives reject wrong conditions, active baseline paths, traversal and collisions", async () => {
  for (const id of PHASE3_IDS) {
    const original = await readJson(path.join(packFor(id), "manifest.json"));
    assert.deepEqual(validatePackManifest(original, id), []);
    const mutations = [
      {
        code: "PACK_CONDITION_UNKNOWN",
        change(value) { value.overlay[0].conditions = ["missing-condition"]; },
        inspect(value) { assert.deepEqual(value.overlay[0].conditions, ["missing-condition"]); },
      },
      {
        code: "PACK_BASELINE_ACTIVE_CUSTOMIZATION",
        change(value) { value.allowedAdditions.push({ pattern: "AGENTS.md", conditions: ["baseline"] }); },
        inspect(value) { assert.equal(value.allowedAdditions.at(-1).pattern, "AGENTS.md"); },
      },
      {
        code: "PACK_INERT_DESTINATION",
        change(value) { value.overlay[0].destination = "../outside.template"; },
        inspect(value) { assert.equal(value.overlay[0].destination, "../outside.template"); },
      },
      {
        code: "PACK_ADDITION_COLLISION",
        change(value) {
          const first = value.allowedAdditions[0];
          value.allowedAdditions.push({
            pattern: first.pattern.replace(/^participant/u, "Participant"),
            conditions: [...first.conditions],
          });
        },
        inspect(value) {
          assert.notEqual(value.allowedAdditions.at(-1).pattern, value.allowedAdditions[0].pattern);
          assert.equal(
            value.allowedAdditions.at(-1).pattern.toLowerCase(),
            value.allowedAdditions[0].pattern.toLowerCase(),
          );
        },
      },
    ];
    for (const { code, change, inspect } of mutations) {
      const value = structuredClone(original);
      change(value);
      inspect(value);
      assertErrorCode(validatePackManifest(value, id), code);
      assert.deepEqual(validatePackManifest(structuredClone(original), id), []);
    }
  }
});

async function createBuildSnapshot(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "hc-phase3-build "));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  for (const entry of ["catalog", "scripts", "schemas", "fixtures"]) {
    await cp(path.join(REPOSITORY_ROOT, entry), path.join(root, entry), { recursive: true });
  }
  for (const id of PHASE3_IDS) {
    await cp(
      path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase()),
      path.join(root, "challenges", id.toLowerCase()),
      { recursive: true },
    );
  }
  return root;
}

test("five Phase3 Packs build byte-identically in two fresh targets and refuse destination reuse", async (t) => {
  const roots = await Promise.all([createBuildSnapshot(t), createBuildSnapshot(t)]);
  for (const id of PHASE3_IDS) {
    const observed = [];
    for (const root of roots) {
      const output = path.join(root, ".runtime", "packs", `${id.toLowerCase()}-v1`);
      await assert.rejects(stat(output), { code: "ENOENT" });
      const built = runCli(root, "build-pack.mjs", ["--challenge", id, "--output", ".runtime/packs"]);
      assertCliExit(built, 0);
      assert.equal(built.stderr, "");
      const hash = await computePackHash(output);
      assert.deepEqual(hash, await computePackHash(path.join(root, "challenges", id.toLowerCase(), "pack")));
      observed.push(hash);
      const repeated = runCli(root, "build-pack.mjs", ["--challenge", id, "--output", ".runtime/packs"]);
      assertCliExit(repeated, 1);
      assert.match(repeated.stderr, /Pack output already exists/u);
      assert.deepEqual(await computePackHash(output), hash);
    }
    assert.deepEqual(observed[0], observed[1], `${id}: independent fresh builds`);
  }
});
