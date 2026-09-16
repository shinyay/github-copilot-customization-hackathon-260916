import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { getPublishedChallengeIds, loadCatalog } from "../scripts/lib/catalog.mjs";
import { readJson, REPOSITORY_ROOT, sha256, stableJson } from "../scripts/lib/fs-utils.mjs";
import { computePackHash, validatePackDirectory, validatePackManifest } from "../scripts/lib/packs.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";
import { assertCliExit, runCli } from "../test-support/publication-fixtures.mjs";

const priorIds = [
  "HC-001", "HC-002", "HC-003", "HC-004", "HC-005", "HC-006",
  "HC-007", "HC-008", "HC-009", "HC-011", "HC-030",
];
const batchSources = [
  "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
  "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
  "wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java",
];
const comparisonHeadings = ["Fixed task", "Environment", "Design", "Observations", "Comparison", "Outcome"];
const recoveryHeadings = ["Case", "Expected boundary", "Observed result", "Restoration", "Non-claims"];
const phase2 = [
  {
    id: "HC-010",
    conditions: ["baseline", "notification-design"],
    sources: ["wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java"],
    additions: {
      baseline: ["design.md", "manual-checklist.md"],
      "notification-design": ["design.md", "notification-policy.md", "stop-output.json.template", "stop-hook.json.template"],
    },
    evidence: "notifications.md",
    headings: ["Case coverage", "Manual checker", "Stop adapter", "Proposed message", "Non-claims"],
    routes: [
      ["stop-preview", [["live-stop-event", "not-checked"], ["isolated-hook-state", "not-checked"]]],
    ],
  },
  {
    id: "HC-012",
    conditions: ["baseline", "tool-set-design"],
    sources: batchSources,
    additions: {
      baseline: ["design.md", "individual-selection.md"],
      "tool-set-design": ["design.md", "reader.toolsets.jsonc.template", "selection-plan.md"],
    },
    evidence: "membership.md",
    headings: ["Declared set", "Reconstructed set", "Operations", "Non-claims"],
    routes: [
      ["profile-tool-sets", [["profile-toolsets-ui", "not-checked"], ["external-profile-state", "not-checked"]]],
    ],
  },
  {
    id: "HC-013",
    conditions: ["baseline", "context-card", "manual-equivalent"],
    sources: batchSources,
    additions: {
      baseline: ["design.md", "source-handoff.md"],
      "context-card": ["design.md", "context-card.json.template"],
      "manual-equivalent": ["design.md", "context-card.json.template", "manual-input.txt"],
    },
    evidence: "provenance.md",
    headings: ["Source inventory", "Revision and scope", "Access layers", "Whole material equality", "Non-claims"],
    routes: [
      ["space-read", [["remote-spaces-read", "not-checked"], ["source-acl-observation", "not-checked"]]],
    ],
  },
  {
    id: "HC-014",
    conditions: ["baseline", "package-design"],
    sources: batchSources,
    additions: {
      baseline: [
        "design.md", "release-ledger.md", "manual/v1/SKILL.md.template",
        "manual/v2/SKILL.md.template", "manual/current/SKILL.md.template",
      ],
      "package-design": [
        "design.md", "release-ledger.md",
        "package/v1/plugin.json.template", "package/v1/skills/order-import-evidence/SKILL.md.template",
        "package/v2/plugin.json.template", "package/v2/skills/order-import-evidence/SKILL.md.template",
        "package/current/plugin.json.template", "package/current/skills/order-import-evidence/SKILL.md.template",
      ],
    },
    evidence: "lifecycle.md",
    headings: ["Draft v1", "Draft v2", "Restored v1", "Duplicate sources", "Non-claims"],
    routes: [
      ["plugin-enable", [["tracked-vscode-settings", "blocked"], ["plugin-discovery", "not-checked"]]],
    ],
  },
  {
    id: "HC-015",
    conditions: ["baseline", "explicit-context", "manual-equivalent"],
    sources: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
      "wholesale-core/src/main/resources/application-context.xml",
      "wholesale-core/src/main/resources/spring/module-operations.xml",
    ],
    additions: {
      baseline: ["design.md", "search-plan.md"],
      "explicit-context": ["design.md", "context-plan.md"],
      "manual-equivalent": ["design.md", "context-plan.md", "manual-input.txt"],
    },
    evidence: "context.md",
    headings: ["Requested context", "Provided context", "Source references", "Search and language status", "Non-claims"],
    routes: [
      ["language-tools", [["java-language-service", "not-checked"]]],
      ["index-exclusions", [["tracked-vscode-settings", "blocked"], ["semantic-index-observation", "not-checked"]]],
    ],
  },
];
const newIds = phase2.map(({ id }) => id);
const publishedIds = [...priorIds, ...newIds].sort();
const packPath = (id, root = REPOSITORY_ROOT) => path.join(root, "challenges", id.toLowerCase(), "pack");
const evidencePath = (id, file) => `.hackathon/evidence/${id.toLowerCase()}/${file}`;
const additionsFor = (spec, condition) =>
  spec.additions[condition].map((file) => `participant/${spec.id.toLowerCase()}/${file}`).sort();
const patternsFor = (entries, condition) =>
  entries.filter(({ conditions }) => conditions.includes(condition)).map(({ pattern }) => pattern).sort();

function assertPublication(catalog) {
  assert.deepEqual(
    getPublishedChallengeIds(catalog).filter((id) => publishedIds.includes(id)),
    publishedIds,
    "all Phase2 published IDs remain published in catalog order",
  );
  assert.ok(
    publishedIds.every((id) => catalog.challenges.find((entry) => entry.id === id)?.status === "published"),
    "later phases must not unpublish a Phase2 challenge",
  );
  assert.equal(catalog.challenges.length, 45);
  assert.deepEqual(catalog.releasePlan.waves[1], newIds);
}

function assertScope(manifest, spec) {
  assert.deepEqual(manifest.conditions, spec.conditions, `${spec.id}: exact conditions`);
  for (const key of ["schemaVersion", "challengeVersion", "minimumTemplateVersion"]) {
    assert.equal(manifest[key], 1, key);
  }
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(manifest.forbiddenActiveCustomizations, []);
  assert.deepEqual(manifest.isolation, {
    tier: "repository",
    freshWorkspace: true,
    freshConversation: true,
    freshProfile: true,
    freshRepository: true,
    conditionStrategy: "separate-repository",
    branchSafe: false,
  });
  const evidenceFiles = ["comparison.md", "recovery.md", spec.evidence];
  assert.deepEqual(
    manifest.evidenceRequirements.map(({ path: file }) => file).sort(),
    evidenceFiles.map((file) => evidencePath(spec.id, file)).sort(),
    `${spec.id}: exactly three evidence files`,
  );
  for (const condition of spec.conditions) {
    const additions = additionsFor(spec, condition);
    assert.deepEqual(patternsFor(manifest.allowedAdditions, condition), additions, `${spec.id}/${condition}: literal additions`);
    assert.deepEqual(
      patternsFor(manifest.submissionFiles, condition),
      [...additions, ...evidenceFiles.map((file) => evidencePath(spec.id, file))].sort(),
      `${spec.id}/${condition}: complete eligible export`,
    );
  }
  assert.ok(manifest.overlay.length > 0);
  for (const entry of manifest.overlay) {
    assert.equal(entry.destination, `.hackathon/challenge/${spec.id.toLowerCase()}/${entry.source.slice("payload/".length)}`);
    assert.ok(entry.source.startsWith("payload/") && entry.source.endsWith(".template"));
    assert.equal(entry.allowOverwrite, false);
    assert.deepEqual(entry.conditions, spec.conditions, "same frozen materials are available in every condition");
  }
}

test("new Phase2 pages, guides and test helpers keep LF even with Windows autocrlf enabled", () => {
  const files = [
    ...phase2.flatMap(({ id, routes }) => [
      `challenges/${id.toLowerCase()}/README.md`,
      ...routes.map(([route]) => `challenges/${id.toLowerCase()}/optional/${route}.md`),
      `tests/${id.toLowerCase()}.test.mjs`,
    ]),
    "tests/phase2.test.mjs",
    "tests/support/hc-015-context-checks.mjs",
  ];
  const result = spawnSync("git", ["-c", "core.autocrlf=true", "check-attr", "-z", "text", "eol", "--", ...files], {
    cwd: REPOSITORY_ROOT, encoding: "utf8", timeout: 30_000,
  });
  assertCliExit(result, 0);
  assert.equal(result.stderr, "");
  assert.deepEqual(
    result.stdout.split("\0"),
    [...files.flatMap((file) => [file, "text", "set", file, "eol", "lf"]), ""],
  );
});

test("Phase2 publication remains intact and preserves prior metadata, hashes, identities and waves", async () => {
  const catalog = await loadCatalog();
  assertPublication(catalog);
  // Digests of complete collections at accepted Phase1 main 243b70b3, not just selected fields.
  assert.equal(
    sha256(stableJson(catalog.challenges.filter(({ id }) => priorIds.includes(id)))),
    "39bb6382d17e0530ec703ef1524862a68f6499c7adca5a97ab316603c54d9cbe",
    "all eleven prior full catalog entries remain unchanged",
  );
  assert.equal(
    sha256(stableJson(catalog.challenges.map(({ id, track, sourceLab }) => ({ id, track, sourceLab })))),
    "2512563b8baf9af3aa12957f65a1d258dcac88d0c18b0e79e9fd4f2c4830bdc8",
  );
  assert.equal(sha256(stableJson(catalog.releasePlan)), "0746431ffd9882a26b193883e73741a38aa039b770d3575e527366eb660590b9");
  const hashes = await readJson(path.join(REPOSITORY_ROOT, "catalog", "pack-hashes.json"));
  assert.deepEqual(
    hashes.packs.filter(({ challengeId }) => publishedIds.includes(challengeId)).map(({ challengeId }) => challengeId),
    publishedIds,
  );
  assert.equal(
    sha256(stableJson(hashes.packs.filter(({ challengeId }) => priorIds.includes(challengeId)))),
    "c390402ff8c4cf1b79611d7613d3d2e04375c98fd80d0f28d99d7af212fb5366",
  );
  assert.equal(catalog.challenges.find(({ id }) => id === "HC-010").title, "Agentの終了時に検査結果を通知しよう");
  for (const spec of phase2) {
    const entry = catalog.challenges.find(({ id }) => id === spec.id);
    assert.equal(entry.sourceKind, "baseline");
    assert.deepEqual(entry.sourcePaths, spec.sources);
    assert.equal(entry.challengeVersion, 1);
    assert.equal(entry.pack, `challenges/${spec.id.toLowerCase()}/pack`);
    assert.equal(entry.page, `challenges/${spec.id.toLowerCase()}/README.md`);
    assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), spec.routes.map(([id]) => id));
    for (const [id, requirements] of spec.routes) {
      const route = entry.optionalRoutes.find((item) => item.id === id);
      assert.deepEqual(route.runtimeRequirements.map(({ capability, status }) => [capability, status]), requirements);
    }
  }
  for (const id of newIds) {
    const incomplete = structuredClone(catalog);
    incomplete.challenges.find((entry) => entry.id === id).status = "planned";
    assert.equal(
      getPublishedChallengeIds(incomplete).length,
      getPublishedChallengeIds(catalog).length - 1,
    );
    assert.throws(() => assertPublication(incomplete), /Phase2 published IDs|unpublish/u);
  }
  assertPublication(catalog);
});

test("all new Packs use exact inert grants and three own-hash submitted Evidence files in each condition", async () => {
  let conditionCount = 0;
  let participantPlacements = 0;
  let evidencePlacements = 0;
  for (const spec of phase2) {
    const { manifest, files, errors } = await validatePackDirectory(packPath(spec.id), spec.id);
    assert.deepEqual(errors, [], spec.id);
    assertScope(manifest, spec);
    for (const file of files) {
      const bytes = await readFile(path.join(packPath(spec.id), ...file.split("/")));
      assert.equal(bytes.includes(Buffer.from("\r\n")), false, `${spec.id}/${file}: stable LF bytes`);
    }
    for (const requirement of manifest.evidenceRequirements) {
      assert.equal(requirement.stage, "submitted");
      assert.deepEqual(requirement.conditions, spec.conditions);
      const basename = path.posix.basename(requirement.path);
      const expectedHeadings = basename === "comparison.md" ? comparisonHeadings
        : basename === "recovery.md" ? recoveryHeadings : spec.headings;
      assert.deepEqual(requirement.requiredHeadings, expectedHeadings);
      const overlay = manifest.overlay.find(({ destination }) => destination.endsWith(`/${basename}.template`));
      assert.ok(overlay, requirement.path);
      const bytes = await readFile(path.join(packPath(spec.id), ...overlay.source.split("/")));
      assert.equal(requirement.templateSha256, sha256(bytes), `${requirement.path}: own raw template`);
      assert.deepEqual([...bytes.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]), expectedHeadings);
    }
    for (const condition of spec.conditions) {
      conditionCount++;
      participantPlacements += additionsFor(spec, condition).length;
      evidencePlacements += manifest.evidenceRequirements.filter(({ conditions }) => conditions.includes(condition)).length;
    }
    const missingEvidence = structuredClone(manifest);
    missingEvidence.evidenceRequirements.pop();
    assert.equal(missingEvidence.evidenceRequirements.length, 2);
    assert.throws(() => assertScope(missingEvidence, spec), /exactly three evidence files/u);
    const missingCondition = structuredClone(manifest);
    missingCondition.conditions.pop();
    assert.equal(missingCondition.conditions.length, spec.conditions.length - 1);
    assert.throws(() => assertScope(missingCondition, spec), /exact conditions/u);
    assertScope(manifest, spec);
  }
  assert.equal(conditionCount, 12);
  assert.equal(participantPlacements, 38);
  assert.equal(evidencePlacements, 36);
});

test("each new Pack still rejects managed additions, active injection and overwrite through the unchanged validator", async () => {
  for (const spec of phase2) {
    const original = await readJson(path.join(packPath(spec.id), "manifest.json"));
    const frozen = stableJson(original);
    assert.deepEqual(validatePackManifest(original, spec.id), []);
    const mutations = [
      {
        change(value) {
          value.allowedAdditions.push({ pattern: evidencePath(spec.id, "comparison.md"), conditions: ["baseline"] });
        },
        landed(value) {
          assert.equal(value.allowedAdditions.length, original.allowedAdditions.length + 1);
          assert.equal(value.allowedAdditions.at(-1).pattern, evidencePath(spec.id, "comparison.md"));
        },
        code: "PACK_ADDITION_RESERVED_PATH",
      },
      {
        change(value) { value.overlay[0].destination = ".github/hooks/phase2.json"; },
        landed(value) { assert.equal(value.overlay[0].destination, ".github/hooks/phase2.json"); },
        code: "PACK_INERT_DESTINATION",
      },
      {
        change(value) { value.overlay[0].allowOverwrite = true; },
        landed(value) { assert.equal(value.overlay[0].allowOverwrite, true); },
        code: "PACK_OVERWRITE_DEFAULT_DENY",
      },
    ];
    for (const { change, landed, code } of mutations) {
      const value = structuredClone(original);
      change(value);
      landed(value);
      assertErrorCode(validatePackManifest(value, spec.id), code);
      assert.deepEqual(validatePackManifest(JSON.parse(frozen), spec.id), []);
      assert.equal(stableJson(original), frozen);
    }
  }
});

test("twelve core CLI plans expose exact participants, equal materials and submitted-only evidence without live execution", () => {
  let count = 0;
  for (const spec of phase2) {
    let frozenInput;
    for (const condition of spec.conditions) {
      const result = runCli(REPOSITORY_ROOT, "plan-run.mjs", [
        "--dry-run", "--challenge", spec.id, "--condition", condition,
        "--team", "phase2-qa", "--run", "fixture-01",
      ]);
      assertCliExit(result, 0);
      assert.equal(result.stderr, "");
      const plan = JSON.parse(result.stdout);
      assert.equal(plan.mode, "dry-run");
      assert.equal(plan.condition, condition);
      assert.equal(plan.template.minimumVersion, 1);
      assert.equal(plan.postCreateSettings.remoteCreation, "deferred");
      assert.equal(plan.participantChanges.activeCustomizationsDefault, "deny");
      assert.deepEqual(plan.participantChanges.allowedMutations, []);
      assert.deepEqual(patternsFor(plan.participantChanges.allowedAdditions, condition), additionsFor(spec, condition));
      assert.deepEqual(
        plan.runStateEvidence.map(({ path: file }) => file).sort(),
        ["comparison.md", "recovery.md", spec.evidence].map((file) => evidencePath(spec.id, file)).sort(),
      );
      assert.ok(plan.runStateEvidence.every(({ stage }) => stage === "submitted"));
      assert.ok(plan.filesToInject.every(({ allowOverwrite, ownership }) => !allowOverwrite && ownership === "pack-applied"));
      if (frozenInput) assert.deepEqual(plan.filesToInject, frozenInput);
      frozenInput = plan.filesToInject;
      assert.ok(plan.cleanup.checks.every(({ verification }) => verification === "not-observed"));
      count++;
    }
  }
  assert.equal(count, 12);
});

test("six optional guides retain four not-checked exits and two tracked-settings blocks, never execution grants", () => {
  const counts = { "not-checked": 0, blocked: 0 };
  for (const spec of phase2) {
    for (const [id, requirements] of spec.routes) {
      const blocked = requirements.some(([, status]) => status === "blocked");
      const result = runCli(REPOSITORY_ROOT, "plan-run.mjs", ["--dry-run", "--challenge", spec.id, "--route", id]);
      assertCliExit(result, blocked ? 2 : 0);
      const guide = JSON.parse(result.stdout);
      assert.equal(guide.mode, "optional-guide");
      assert.equal(guide.route.required, false);
      assert.equal(guide.liveStatus, "live-unobserved");
      assert.equal(guide.readiness.status, blocked ? "blocked" : "not-checked");
      assert.deepEqual(guide.runtimeRequirements.map(({ capability, status }) => [capability, status]), requirements);
      for (const key of ["environment", "entitlements", "additionalApprovals"]) {
        assert.equal(guide.readiness[key], "not-checked");
      }
      for (const key of ["condition", "template", "filesToInject", "participantChanges", "runStateEvidence", "proposedRepositoryName"]) {
        assert.equal(Object.hasOwn(guide, key), false, `${id}: no ${key}`);
      }
      if (blocked) assert.match(result.stderr, /^OPTIONAL_ROUTE_BLOCKED:/u);
      else assert.equal(result.stderr, "");
      counts[guide.readiness.status]++;
    }
  }
  assert.deepEqual(counts, { "not-checked": 4, blocked: 2 });
});

async function sourceSnapshot(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "hc-phase2-build "));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  await Promise.all([
    "catalog", "scripts", "schemas", "fixtures",
    ...newIds.map((id) => path.join("challenges", id.toLowerCase())),
  ].map((entry) => cp(path.join(REPOSITORY_ROOT, entry), path.join(root, entry), { recursive: true })));
  return root;
}

test("five new Packs build byte-identically in two fresh owned outputs including spaces, without deleting existing outputs", async (t) => {
  const snapshots = await Promise.all([sourceSnapshot(t), sourceSnapshot(t)]);
  const hashes = await readJson(path.join(REPOSITORY_ROOT, "catalog", "pack-hashes.json"));
  for (const id of newIds) {
    const observed = [];
    for (const root of snapshots) {
      const output = path.join(root, ".runtime", "packs", `${id.toLowerCase()}-v1`);
      await assert.rejects(stat(output), { code: "ENOENT" });
      const result = runCli(root, "build-pack.mjs", ["--challenge", id, "--output", ".runtime/packs"]);
      assertCliExit(result, 0);
      assert.equal(result.stderr, "");
      const built = await computePackHash(output);
      assert.deepEqual(built, await computePackHash(packPath(id, root)));
      const record = hashes.packs.find(({ challengeId }) => challengeId === id);
      assert.equal(built.hash, record.sha256);
      assert.equal(built.records.length, record.fileCount);
      assert.equal(built.records.reduce((total, file) => total + file.byteLength, 0), record.byteLength);
      const sidecar = await readFile(`${output}.sha256`, "utf8");
      assert.equal(sidecar, `${built.hash}  ${id.toLowerCase()}-v1\n`);
      const reused = runCli(root, "build-pack.mjs", ["--challenge", id, "--output", ".runtime/packs"]);
      assertCliExit(reused, 1);
      assert.match(reused.stderr, /already exists/u);
      assert.deepEqual(await computePackHash(output), built);
      assert.equal(await readFile(`${output}.sha256`, "utf8"), sidecar);
      observed.push(built);
    }
    assert.deepEqual(observed[0], observed[1], `${id}: both outputs and each per-file hash agree`);
  }
});
