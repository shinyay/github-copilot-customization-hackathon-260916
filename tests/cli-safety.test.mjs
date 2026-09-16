import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { getPublishedChallenges, loadCatalog } from "../scripts/lib/catalog.mjs";
import {
  PACK_OUTPUT_ROOT,
  resolvePackOutputPaths,
  validatePackOutputArgument,
} from "../scripts/lib/build-output.mjs";
import { readJson, REPOSITORY_ROOT } from "../scripts/lib/fs-utils.mjs";
import { computePackHash, getPackDirectory } from "../scripts/lib/packs.mjs";

function runPlan(args) {
  const result = spawnSync(process.execPath, ["scripts/plan-run.mjs", ...args], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
    timeout: 30_000,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.signal, null);
  return result;
}

test("plan CLI requires explicit dry-run and rejects unknown flags", () => {
  const common = [
    "--challenge",
    "HC-001",
    "--condition",
    "baseline",
    "--team",
    "team-sora",
    "--run",
    "run-01",
  ];

  const missingDryRun = runPlan(common);
  assert.equal(Number.isInteger(missingDryRun.status), true);
  assert.notEqual(missingDryRun.status, 0);
  assert.match(missingDryRun.stderr, /--dry-run/u);

  const unknown = runPlan(["--dry-run", ...common, "--create-remote", "yes"]);
  assert.equal(Number.isInteger(unknown.status), true);
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /Unknown argument/u);
});

test("plan CLI returns JSON and performs no remote creation", () => {
  const result = runPlan([
    "--dry-run",
    "--challenge",
    "HC-001",
    "--condition",
    "baseline",
    "--team",
    "team-sora",
    "--run",
    "run-01",
  ]);
  assert.equal(Number.isInteger(result.status), true);
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.postCreateSettings.remoteCreation, "deferred");
});

test("plan CLI accepts inline name=value arguments", () => {
  const result = runPlan([
    "--dry-run",
    "--challenge=HC-001",
    "--condition=baseline",
    "--team=team-sora",
    "--run=run-01",
  ]);
  assert.equal(Number.isInteger(result.status), true);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).condition, "baseline");
});

test("every published core condition is byte-identical with an explicit --route core", async () => {
  const catalog = await loadCatalog();
  for (const challenge of getPublishedChallenges(catalog)) {
    const manifest = await readJson(path.join(getPackDirectory(challenge), "manifest.json"));
    for (const condition of manifest.conditions) {
      const args = [
        "--dry-run", "--challenge", challenge.id, "--condition", condition,
        "--team", "phase0-contract", "--run", "run-01",
      ];
      const implicit = runPlan(args);
      const explicit = runPlan([...args, "--route", "core"]);
      assert.equal(Number.isInteger(implicit.status), true);
      assert.equal(Number.isInteger(explicit.status), true);
      assert.equal(implicit.status, 0, implicit.stderr);
      assert.equal(explicit.status, 0, explicit.stderr);
      assert.equal(implicit.stderr, "");
      assert.equal(explicit.stderr, "");
      assert.equal(explicit.stdout, implicit.stdout, `${challenge.id}/${condition}`);
      const plan = JSON.parse(implicit.stdout);
      assert.equal(plan.mode, "dry-run");
      assert.equal(plan.condition, condition);
      assert.equal(plan.participantChanges.activeCustomizationsDefault, "deny");
      assert.ok(plan.cleanup.checks.every(({ verification }) => verification === "not-observed"));
    }
  }
});

test("core CLI still rejects undeclared conditions", () => {
  const result = runPlan([
    "--dry-run", "--challenge", "HC-001", "--route", "core", "--condition", "not-declared",
    "--team", "fixture", "--run", "one",
  ]);
  assert.equal(Number.isInteger(result.status), true);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown condition/u);
});

test("Pack build output rejects outside, absolute, and non-dedicated paths", () => {
  for (const output of [
    "..",
    "dist/packs",
    ".runtime/other",
    path.resolve(REPOSITORY_ROOT, ".runtime", "packs"),
  ]) {
    assert.throws(
      () => validatePackOutputArgument(output),
      /dedicated repository-relative path/u,
    );
  }
  assert.doesNotThrow(() => validatePackOutputArgument(PACK_OUTPUT_ROOT));
});

test("Pack build output refuses an existing generated target", async () => {
  const target = path.join(
    REPOSITORY_ROOT,
    ".runtime",
    "packs",
    "hc-999-v1",
  );
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "sentinel.txt"), "keep\n", "utf8");

  try {
    await assert.rejects(
      resolvePackOutputPaths(PACK_OUTPUT_ROOT, "hc-999-v1"),
      /already exists/u,
    );
    assert.equal(
      await import("node:fs/promises").then(({ readFile }) =>
        readFile(path.join(target, "sentinel.txt"), "utf8"),
      ),
      "keep\n",
    );
  } finally {
    await rm(target, { recursive: true, force: true });
  }
});

function runBuildInBackground(challengeId) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        "scripts/build-pack.mjs",
        "--challenge",
        challengeId,
        "--output",
        PACK_OUTPUT_ROOT,
      ],
      {
        cwd: REPOSITORY_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

test("concurrent Pack builds preserve the winning output", async () => {
  const directoryName = "hc-006-v1";
  const outputDirectory = path.join(
    REPOSITORY_ROOT,
    ".runtime",
    "packs",
    directoryName,
  );
  const sidecarPath = `${outputDirectory}.sha256`;
  await rm(outputDirectory, { recursive: true, force: true });
  await rm(sidecarPath, { force: true });

  try {
    const results = await Promise.all([
      runBuildInBackground("HC-006"),
      runBuildInBackground("HC-006"),
    ]);
    assert.deepEqual(
      results.map(({ status }) => status).sort(),
      [0, 1],
      JSON.stringify(results),
    );
    const hash = await computePackHash(outputDirectory);
    const sidecar = await import("node:fs/promises").then(({ readFile }) =>
      readFile(sidecarPath, "utf8"),
    );
    assert.equal(sidecar, `${hash.hash}  ${directoryName}\n`);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
    await rm(sidecarPath, { force: true });
  }
});
