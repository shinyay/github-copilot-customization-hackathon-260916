import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { getPublishedChallengeIds, loadCatalog } from "../scripts/lib/catalog.mjs";
import { readJson, REPOSITORY_ROOT, sha256 } from "../scripts/lib/fs-utils.mjs";
import { computePackHash, validatePackDirectory } from "../scripts/lib/packs.mjs";
import { assertCliExit, createPublicationFixture, runCli } from "../test-support/publication-fixtures.mjs";

const phase1 = new Map([
  ["HC-002", ["baseline", "customized", "manual-equivalent"]],
  ["HC-003", ["baseline", "customized", "manual-equivalent"]],
  ["HC-004", ["baseline", "customized", "manual-equivalent"]],
  ["HC-005", ["baseline", "scope-design"]],
  ["HC-008", ["baseline", "subagents", "manual-conversations"]],
]);
const published = ["HC-001", "HC-002", "HC-003", "HC-004", "HC-005", "HC-006",
  "HC-007", "HC-008", "HC-009", "HC-011", "HC-030"];
const routes = new Map([
  ["HC-002", []],
  ["HC-003", ["nested-discovery", "parent-discovery"]],
  ["HC-004", ["claude-variants"]],
  ["HC-005", ["user-scope", "task-generation", "organization-scope"]],
  ["HC-008", []],
]);
const activePaths = new Map([
  ["HC-002", [".github/instructions/hc002-java.instructions.md", ".github/instructions/hc002-xml.instructions.md"]],
  ["HC-003", ["AGENTS.md"]],
  ["HC-004", ["CLAUDE.md"]],
  ["HC-005", []],
  ["HC-008", []],
]);
const packPath = (id, root = REPOSITORY_ROOT) => path.join(root, "challenges", id.toLowerCase(), "pack");

async function sourceSnapshot(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "hc-phase1-build-"));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  await Promise.all(["catalog", "challenges", "scripts", "schemas", "fixtures"].map((entry) =>
    cp(path.join(REPOSITORY_ROOT, entry), path.join(root, entry), { recursive: true })));
  return root;
}

test("Phase1's eleven-ID fixture stays exact while its published content remains available", async (t) => {
  const fixture = await createPublicationFixture(t, published);
  assert.deepEqual(getPublishedChallengeIds(fixture.catalog), published);
  assert.equal(fixture.catalog.challenges.filter(({ status }) => status === "planned").length, 34);
  const catalog = await loadCatalog();
  assert.deepEqual(getPublishedChallengeIds(catalog).filter((id) => published.includes(id)), published);
  assert.equal(catalog.challenges.length, 45);
  assert.deepEqual(catalog.releasePlan.waves[0], [...phase1.keys()]);
  assert.equal(catalog.releasePlan.waves.flat().length, 39);
  assert.equal(new Set(catalog.releasePlan.waves.flat()).size, 39);
  assert.equal(catalog.releasePlan.reviewBetweenWaves, true);
  assert.equal(catalog.releasePlan.participantPrerequisite, false);
  for (const [id, expected] of routes) {
    const challenge = catalog.challenges.find((entry) => entry.id === id);
    assert.deepEqual(challenge.optionalRoutes.map((route) => route.id), expected);
    assert.equal(challenge.pack, `challenges/${id.toLowerCase()}/pack`);
    assert.equal(challenge.sourceKind, id === "HC-005" ? "synthetic" : "baseline");
    if (id === "HC-005") assert.deepEqual(challenge.sourcePaths, []);
  }
});

test("all five v1 Packs leave source immutable and grant active files only in the three customized conditions", async () => {
  for (const [id, expectedConditions] of phase1) {
    const { errors, manifest, files } = await validatePackDirectory(packPath(id), id);
    assert.deepEqual(errors, [], id);
    assert.deepEqual(manifest.conditions, expectedConditions, id);
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.challengeVersion, 1);
    assert.equal(manifest.minimumTemplateVersion, 1);
    assert.deepEqual(manifest.allowedMutations, [], id);
    assert.deepEqual(manifest.forbiddenActiveCustomizations, [], "shared default deny remains in force");
    assert.equal(manifest.isolation.conditionStrategy, "separate-repository");
    assert.equal(manifest.isolation.branchSafe, false);
    for (const key of ["freshRepository", "freshWorkspace", "freshConversation", "freshProfile"]) {
      assert.equal(manifest.isolation[key], true, `${id}: ${key}`);
    }
    const active = manifest.allowedAdditions.filter(({ pattern }) => !pattern.startsWith("participant/"));
    assert.deepEqual(active.map(({ pattern }) => pattern).sort(), [...activePaths.get(id)].sort(), id);
    for (const entry of active) assert.deepEqual(entry.conditions, ["customized"]);
    for (const { pattern } of manifest.allowedAdditions) {
      assert.equal(pattern.includes("*"), false, `${id}: exact additions only`);
      assert.equal(pattern.startsWith(".hackathon/"), false, "evidence is not an addition");
      if (!activePaths.get(id).includes(pattern)) {
        assert.ok(pattern.startsWith(`participant/${id.toLowerCase()}/`), pattern);
      }
    }
    for (const entry of manifest.overlay) {
      assert.ok(entry.destination.startsWith(`.hackathon/challenge/${id.toLowerCase()}/`));
      assert.ok(entry.source.endsWith(".template"));
      assert.ok(entry.destination.endsWith(".template"));
      assert.equal(entry.allowOverwrite, false);
    }
    for (const file of files) {
      const bytes = await readFile(path.join(packPath(id), ...file.split("/")));
      assert.equal(bytes.includes(Buffer.from("\r\n")), false, `${id}/${file} must be stable LF bytes on Windows and Linux`);
    }
    assert.ok(manifest.evidenceRequirements.length > 0);
    for (const requirement of manifest.evidenceRequirements) {
      assert.equal(requirement.stage, "submitted");
      assert.ok(requirement.path.startsWith(`.hackathon/evidence/${id.toLowerCase()}/`));
      assert.deepEqual(requirement.conditions, expectedConditions);
      const template = manifest.overlay.find(({ destination }) =>
        destination.endsWith(`/${path.posix.basename(requirement.path)}.template`));
      assert.ok(template, requirement.path);
      const bytes = await readFile(path.join(packPath(id), ...template.source.split("/")));
      assert.equal(requirement.templateSha256, sha256(bytes));
      const headings = [...bytes.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]);
      for (const heading of requirement.requiredHeadings) assert.ok(headings.includes(heading), heading);
      for (const condition of requirement.conditions) {
        assert.ok(manifest.submissionFiles.some(({ pattern, conditions }) =>
          pattern === requirement.path && conditions.includes(condition)), `${id}/${condition}: evidence export`);
      }
    }
  }
});

test("all fourteen new core CLI plans preserve run-state evidence, default deny and non-observed cleanup", async () => {
  let count = 0;
  for (const [id, conditions] of phase1) {
    for (const condition of conditions) {
      const result = runCli(REPOSITORY_ROOT, "plan-run.mjs", [
        "--dry-run", "--challenge", id, "--condition", condition, "--team", "phase1-check", "--run", "one",
      ]);
      assertCliExit(result, 0);
      assert.equal(result.stderr, "");
      const plan = JSON.parse(result.stdout);
      assert.equal(plan.mode, "dry-run");
      assert.equal(plan.condition, condition);
      assert.equal(plan.template.minimumVersion, 1);
      assert.equal(plan.postCreateSettings.remoteCreation, "deferred");
      assert.equal(plan.isolation.conditionStrategy, "separate-repository");
      assert.deepEqual(plan.participantChanges.allowedMutations, []);
      assert.equal(plan.participantChanges.activeCustomizationsDefault, "deny");
      const allowedActive = plan.participantChanges.allowedAdditions
        .filter(({ pattern }) => !pattern.startsWith("participant/")).map(({ pattern }) => pattern).sort();
      assert.deepEqual(allowedActive, condition === "customized" ? [...activePaths.get(id)].sort() : []);
      assert.ok(plan.filesToInject.length > 0);
      assert.ok(plan.filesToInject.every(({ allowOverwrite, ownership }) =>
        allowOverwrite === false && ownership === "pack-applied"));
      assert.ok(plan.runStateEvidence.every(({ stage }) => stage === "submitted"));
      assert.ok(plan.cleanup.checks.every(({ verification }) => verification === "not-observed"));
      count++;
    }
  }
  assert.equal(count, 14);
});

test("six actual optional routes report only not-checked or the known settings block, never executable readiness", () => {
  let count = 0;
  for (const [id, ids] of routes) {
    for (const route of ids) {
      const knownBlock = route === "task-generation";
      const result = runCli(REPOSITORY_ROOT, "plan-run.mjs", ["--dry-run", "--challenge", id, "--route", route]);
      assertCliExit(result, knownBlock ? 2 : 0);
      const guide = JSON.parse(result.stdout);
      assert.equal(guide.mode, "optional-guide");
      assert.equal(guide.liveStatus, "live-unobserved");
      assert.equal(guide.route.required, false);
      assert.equal(guide.readiness.status, knownBlock ? "blocked" : "not-checked");
      for (const key of ["environment", "entitlements", "additionalApprovals"]) {
        assert.equal(guide.readiness[key], "not-checked");
      }
      for (const key of ["condition", "filesToInject", "template", "participantChanges", "proposedRepositoryName"]) {
        assert.equal(Object.hasOwn(guide, key), false, key);
      }
      if (knownBlock) {
        assert.match(result.stderr, /^OPTIONAL_ROUTE_BLOCKED:/u);
        assert.ok(guide.runtimeRequirements.some(({ capability, status }) =>
          capability === "tracked-vscode-settings" && status === "blocked"));
      } else assert.equal(result.stderr, "");
      count++;
    }
  }
  assert.equal(count, 6);
});

test("new five Packs build deterministically into two fresh owned outputs and refuse target reuse", async (t) => {
  const [first, second] = await Promise.all([sourceSnapshot(t), sourceSnapshot(t)]);
  const hashRecords = await readJson(path.join(REPOSITORY_ROOT, "catalog", "pack-hashes.json"));
  for (const id of phase1.keys()) {
    const actual = [];
    for (const snapshot of [first, second]) {
      const output = path.join(snapshot, ".runtime", "packs", `${id.toLowerCase()}-v1`);
      await assert.rejects(stat(output), { code: "ENOENT" });
      assertCliExit(runCli(snapshot, "build-pack.mjs", ["--challenge", id, "--output", ".runtime/packs"]), 0);
      const built = await computePackHash(output);
      const source = await computePackHash(packPath(id, snapshot));
      assert.equal(built.hash, source.hash);
      assert.deepEqual(built.records, source.records);
      assert.equal(built.hash, hashRecords.packs.find(({ challengeId }) => challengeId === id).sha256);
      const sidecar = await readFile(`${output}.sha256`, "utf8");
      assert.ok(sidecar.includes(built.hash));
      const reused = runCli(snapshot, "build-pack.mjs", ["--challenge", id, "--output", ".runtime/packs"]);
      assertCliExit(reused, 1);
      assert.match(reused.stderr, /already exists/u);
      assert.equal((await computePackHash(output)).hash, built.hash);
      assert.equal(await readFile(`${output}.sha256`, "utf8"), sidecar);
      actual.push(built);
    }
    assert.deepEqual(actual[0], actual[1], `${id}: both independent builds have identical bytes`);
  }
});
