import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { isContainedBy, listFilesRecursively, readJson, REPOSITORY_ROOT, sha256 } from "../scripts/lib/fs-utils.mjs";
import { validateChallengePageText, validateOptionalGuideText, validateOptionalRoutePage } from "../scripts/lib/pages.mjs";
import { optionalRuntimeStatus, validateOptionalRoutes } from "../scripts/lib/optional-routes.mjs";
import { validatePackDirectory, validatePackManifest } from "../scripts/lib/packs.mjs";

const root = path.join(REPOSITORY_ROOT, "challenges", "hc-014");
const pack = path.join(root, "pack");
const payload = path.join(pack, "payload");
const conditions = ["baseline", "package-design"];
const skillPath = "skills/order-import-evidence/SKILL.md.template";
const componentPaths = ["plugin.json.template", skillPath];
const validatorSha256 = "49b3089618fb3614276d4b20576bd2dfe27e4447f64c7375f49f1357f795f891";
const sourcePaths = [
  "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
  "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
  "wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java",
];
const additions = {
  baseline: [
    "design.md", "release-ledger.md",
    "manual/v1/SKILL.md.template", "manual/v2/SKILL.md.template", "manual/current/SKILL.md.template",
  ],
  "package-design": [
    "design.md", "release-ledger.md",
    ...["v1", "v2", "current"].flatMap((version) => componentPaths.map((file) => `package/${version}/${file}`)),
  ],
};
const evidenceHeadings = {
  "comparison.md": ["Fixed task", "Environment", "Design", "Observations", "Comparison", "Outcome"],
  "recovery.md": ["Case", "Expected boundary", "Observed result", "Restoration", "Non-claims"],
  "lifecycle.md": ["Draft v1", "Draft v2", "Restored v1", "Duplicate sources", "Non-claims"],
};
const route = {
  id: "plugin-enable",
  title: "追跡可能なworkspace設定でPluginを有効化する前の準備確認",
  page: "challenges/hc-014/optional/plugin-enable.md",
  required: false,
  prerequisites: {
    environment: [
      "レビュー済みの Agent Plugins 1.0・一つの Skill の package と、対応する VS Code Stable / local plugin 設定を確認できること。",
      "本編とは別の専用 workspace と、workspace 設定を再現可能な成果物として追跡する計画があること。",
    ],
    entitlements: ["利用予定の Copilot・教材 repository の利用資格と、組織の Plugin policy を確認できること。"],
    additionalApprovals: ["対象を限定した install / register / enable と workspace 設定変更には、環境所有者の別承認が必要です。"],
  },
  runtimeRequirements: [
    {
      capability: "tracked-vscode-settings",
      status: "blocked",
      reason: "Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings.",
    },
    {
      capability: "plugin-discovery",
      status: "not-checked",
      reason: "Plugin の実 discovery、Skill 本文 loading、無効化後の残留は未確認です。",
    },
  ],
  liveStatus: "live-unobserved",
  stopReasons: [
    "追跡済みの .vscode/settings.json が必要なこの経路は Runtime v1 では blocked のため、実機操作を開始しません。",
    "対応環境・利用資格・追加承認・package のレビューを確認できない場合は未実施にします。",
    "既存の home / User / 組織設定や他人の Plugin に触れる必要がある場合は停止します。",
  ],
};
const challenge = { id: "HC-014", page: "challenges/hc-014/README.md", optionalRoutes: [route] };
const fileAt = (directory, relative) => path.join(directory, ...relative.split("/"));
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

async function scratch(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hc014-fixture-"));
  t.after(() => rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  return directory;
}

async function pluginFixture(t, version = "v1") {
  const directory = await scratch(t);
  const validatorPath = path.join(directory, "validate-plugin.mjs");
  const original = await readFile(path.join(payload, "tools", "validate-plugin.mjs.template"));
  assert.equal(sha256(original), validatorSha256);
  await writeFile(validatorPath, original, { flag: "wx" });
  const plugin = path.join(directory, "package with spaces");
  await cp(path.join(payload, "drafts", version), plugin, { recursive: true, errorOnExist: true, force: false });
  const { validateWorkshopPlugin } = await import(pathToFileURL(validatorPath).href);
  return { directory, validatorPath, plugin, validate: validateWorkshopPlugin };
}

function rejected(action, reason) {
  assert.throws(action, (error) => {
    assert.equal(error.code, "ERR_ASSERTION");
    assert.equal(error.message.split("\n")[0], reason);
    return true;
  });
}

function structuralRejection(action, operator) {
  assert.throws(action, (error) => {
    assert.equal(error.code, "ERR_ASSERTION");
    assert.equal(error.operator, operator);
    return true;
  });
}

function cli(validatorPath, args, expectedStatus, reason) {
  const result = spawnSync(process.execPath, [validatorPath, ...args], {
    cwd: path.dirname(validatorPath), encoding: "utf8", shell: false, windowsHide: true, timeout: 15000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.ok(Number.isInteger(result.status));
  assert.equal(result.status, expectedStatus);
  if (expectedStatus === 0) {
    assert.equal(result.stderr, "");
    assert.equal(JSON.parse(result.stdout).componentCount, 1);
  } else {
    assert.ok(result.stderr.includes(`AssertionError [ERR_ASSERTION]: ${reason}`), result.stderr);
    assert.equal(result.stdout, "");
  }
  return result;
}

async function snapshot(validate, directory) {
  const info = validate(directory);
  const files = await Promise.all(componentPaths.map(async (name) => [name, await readFile(fileAt(directory, name))]));
  return { info, files };
}

function equivalent(snapshotValue, manualBytes, logicalVersion) {
  assert.equal(snapshotValue.info.version, logicalVersion, "HC014_RELEASE_VERSION_MISMATCH");
  assert.ok(snapshotValue.files[1][1].equals(manualBytes), "HC014_SKILL_BYTES_MISMATCH");
  return true;
}

function completeSequence(states, releases) {
  assert.deepEqual(states.map(({ state }) => state), ["draft-v1", "draft-v2", "restored-v1"], "HC014_STATE_ORDER");
  for (const [index, version] of ["v1", "v2", "v1"].entries()) {
    assert.deepEqual(states[index].snapshot.files, releases[version].files, "HC014_FULL_BYTES_MISMATCH");
    assert.deepEqual(states[index].snapshot.info, releases[version].info, "HC014_SNAPSHOT_METADATA_MISMATCH");
  }
  assert.deepEqual(states[2].snapshot.files, states[0].snapshot.files, "HC014_RESTORE_BYTES_MISMATCH");
  return true;
}

function manualSequence(states, releases) {
  assert.deepEqual(states.map(({ state }) => state), ["draft-v1", "draft-v2", "restored-v1"], "HC014_STATE_ORDER");
  for (const [index, version] of ["v1", "v2", "v1"].entries()) {
    assert.equal(states[index].logicalVersion, releases[version].logicalVersion, "HC014_MANUAL_LEDGER_VERSION");
    assert.ok(states[index].bytes.equals(releases[version].bytes), "HC014_MANUAL_RESTORE_BYTES");
  }
  return true;
}

async function originReport(validate, directory, candidates, release) {
  const origins = new Set();
  const enabledCounts = new Map();
  const staleOrigins = [];
  for (const candidate of candidates) {
    assert.equal(typeof candidate.enabled, "boolean", "HC014_ENABLED_BOOLEAN");
    assert.ok(!origins.has(candidate.origin), "HC014_DUPLICATE_ORIGIN");
    origins.add(candidate.origin);
    const actual = await snapshot(validate, fileAt(directory, candidate.origin));
    if (candidate.enabled) enabledCounts.set(actual.info.skill, (enabledCounts.get(actual.info.skill) ?? 0) + 1);
    if (
      actual.info.version !== release.info.version ||
      !actual.files[1][1].equals(release.files[1][1])
    ) staleOrigins.push(candidate.origin);
  }
  return {
    duplicateSkills: [...enabledCounts].filter(([, count]) => count > 1).map(([name]) => name),
    staleOrigins,
    enabledCount: candidates.filter(({ enabled }) => enabled).length,
    fixtureOnly: true,
    liveDiscovery: "not-observed",
  };
}

function assertCleanOrigins(report) {
  assert.equal(report.duplicateSkills.length, 0, "HC014_DUPLICATE_SKILL");
  assert.equal(report.staleOrigins.length, 0, "HC014_STALE_ORIGIN");
}

function assertSyntheticBoundary(report) {
  assert.equal(report.fixtureOnly, true, "HC014_FIXTURE_ONLY");
  assert.equal(report.liveDiscovery, "not-observed", "HC014_SYNTHETIC_NOT_DISCOVERY");
}

function contract(manifest) {
  assert.deepEqual(manifest.conditions, conditions, "HC014_CONDITIONS");
  for (const entry of manifest.overlay) assert.deepEqual(entry.conditions, conditions, "HC014_COMMON_OVERLAY_CONDITIONS");
  for (const condition of conditions) {
    const actual = manifest.allowedAdditions.filter((entry) => entry.conditions.includes(condition)).map(({ pattern }) => pattern).sort();
    assert.deepEqual(actual, additions[condition].map((name) => `participant/hc-014/${name}`).sort(), "HC014_EXACT_ADDITIONS");
    const submission = manifest.submissionFiles.filter((entry) => entry.conditions.includes(condition)).map(({ pattern }) => pattern).sort();
    assert.deepEqual(submission, [...actual, ...Object.keys(evidenceHeadings).map((name) => `.hackathon/evidence/hc-014/${name}`)].sort(), "HC014_SUBMISSION_SET");
  }
}

test("HC-014 has the exact inert 5+8 grants, all-condition overlay, v1 isolation and full submission set", async () => {
  const result = await validatePackDirectory(pack, "HC-014");
  assert.deepEqual(result.errors, []);
  const { manifest, files } = result;
  contract(manifest);
  for (const field of ["schemaVersion", "challengeVersion", "minimumTemplateVersion"]) assert.equal(manifest[field], 1);
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(manifest.forbiddenActiveCustomizations, []);
  assert.deepEqual(manifest.isolation, {
    tier: "repository", freshWorkspace: true, freshConversation: true, freshProfile: true, freshRepository: true,
    conditionStrategy: "separate-repository", branchSafe: false,
  });
  assert.equal(manifest.overlay.length, 14);
  assert.equal(manifest.allowedAdditions.length, 11);
  assert.ok(files.every((file) => file === "manifest.json" || (file.startsWith("payload/") && file.endsWith(".template"))));
  assert.deepEqual(files.filter((file) => file !== "manifest.json").sort(), manifest.overlay.map(({ source }) => source).sort());
  for (const entry of manifest.overlay) {
    assert.equal(entry.destination, entry.source.replace("payload/", ".hackathon/challenge/hc-014/"));
    assert.equal(entry.allowOverwrite, false);
  }
  for (const entry of [...manifest.allowedAdditions, ...manifest.submissionFiles]) assert.ok(!entry.pattern.includes("*"));
  assert.ok(manifest.allowedAdditions.every(({ pattern }) => !pattern.startsWith(".hackathon/")));
  for (const file of files) {
    const bytes = await readFile(fileAt(pack, file));
    assert.ok(!bytes.includes(13), `LF: ${file}`);
    assert.ok(!bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), `no BOM: ${file}`);
  }
});

test("HC-014 provenance pins actual baseline paths and every final payload digest except itself", async () => {
  const provenance = await readJson(path.join(payload, "source-materials.json.template"));
  const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));
  assert.equal(provenance.sourceKind, "baseline");
  assert.equal(provenance.sourceBaseline.repository, "shinyay/code-to-doc-workshop-260910");
  assert.equal(provenance.sourceBaseline.commit, "398d7d1982a1402bcdba00d6c3ded67d8d338787");
  assert.equal(provenance.labsReference.commit, "3474d21dd62bad2e594e84657dabe2eb9bb876c1");
  assert.deepEqual(provenance.sourceBaseline.files.map(({ path: value }) => value), sourcePaths);
  assert.deepEqual(provenance.sourceBaseline.files.map(({ sha256: hash }) => hash), [
    "540035ef9797badbb049502462c9dfc23295dd7124f30d23e757f7ed5e97dde2",
    "6fd51123ea20d737192c90ebe9d06bc9cd893e1f352ba31d036c00350237f986",
    "4512773a9a39ba25e61b1c1b1d0d9150d8004bfe43fb94617fb1bbe1c4a2ee63",
  ]);
  for (const sourcePath of sourcePaths) assert.ok(inventory.paths.includes(sourcePath));
  const expected = (await listFilesRecursively(payload)).filter((file) => file !== "source-materials.json.template")
    .map((file) => `payload/${file}`).sort();
  assert.deepEqual(provenance.payloadDigests.map(({ source }) => source).sort(), expected);
  assert.equal(new Set(provenance.payloadDigests.map(({ source }) => source)).size, expected.length);
  for (const digest of provenance.payloadDigests) {
    const bytes = await readFile(fileAt(pack, digest.source));
    assert.equal(digest.bytes, bytes.length);
    assert.equal(digest.sha256, sha256(bytes), digest.source);
  }
  for (const original of provenance.labsReference.originals) {
    assert.match(original.sha256, /^[0-9a-f]{64}$/u);
    assert.ok(original.adaptations.length > 0);
    for (const source of original.payloads) assert.ok(expected.includes(source));
  }
  assert.equal(sha256(await readFile(path.join(payload, "tools", "validate-plugin.mjs.template"))), validatorSha256);
});

test("HC-014 page stands alone with exactly 13 headings and separates packaging from content and live use", async () => {
  const page = await readFile(path.join(root, "README.md"), "utf8");
  assert.match(page, /^# HC-014 SkillをPluginとして配布・更新しよう\n/u);
  assert.deepEqual(validateChallengePageText("HC-014", page), []);
  assert.equal([...page.matchAll(/^## /gmu)].length, 13);
  for (const sourcePath of sourcePaths) assert.ok(page.includes(sourcePath));
  for (const literal of [
    "Agent Plugins 1.0", "frontmatter", "DRAFT", "baseline", "package-design",
    "同じ一つの Skill", "同じ版", "凍結", "完全復元", "全origin", "手動方式で十分",
    "1.0.0 → 2.0.0 → 1.0.0", "training-v1 → training-v2 → training-v1",
    "runtimeBehavior", "educationalEffect", "not-observed", "SYNTHETIC_LIFECYCLE_NOT_PLUGIN_DISCOVERY",
    "verify-template.mjs", "--run-id", "--output .runtime/packs",
    "verify-run.mjs $Pack --stage submitted", "export-submission.mjs $Pack", "Challenge-specific design",
    "tracked-vscode-settings: blocked", "plugin-discovery: not-checked", "2026-09-15",
  ]) assert.ok(page.includes(literal), literal);
  assert.match(page, /\[Plugin有効化前の準備ガイド\]\(optional\/plugin-enable\.md\)/u);
  const request = await readFile(path.join(payload, "request.txt.template"), "utf8");
  for (const sourcePath of sourcePaths) assert.ok(request.includes(sourcePath));
  for (const condition of conditions) assert.ok(request.includes(`${condition}:`));
  for (const file of (await listFilesRecursively(payload)).filter((file) => file !== "tools/validate-plugin.mjs.template")) {
    const text = await readFile(fileAt(payload, file), "utf8");
    assert.doesNotMatch(text, /currentCode|answerKey|expectedClassification|\.runtime[\\/]+independent-labs/u, file);
  }
  const origins = await readJson(path.join(payload, "lifecycle-origins.json.template"));
  assert.equal(origins.fixtureLabel, "SYNTHETIC_LIFECYCLE_NOT_PLUGIN_DISCOVERY");
  assert.equal(origins.liveDiscovery, "not-observed");
  assert.ok(origins.candidates.length >= 3);
  assert.ok(!Object.hasOwn(origins, "expected") && !Object.hasOwn(origins, "classification"));
});

test("HC-014 guide preserves D3, six literal sections, reciprocal links and one-blocked aggregate", async () => {
  const page = await readFile(path.join(root, "README.md"), "utf8");
  const guide = await readFile(path.join(root, "optional", "plugin-enable.md"), "utf8");
  assert.deepEqual(await listFilesRecursively(path.join(root, "optional")), ["plugin-enable.md"]);
  assert.deepEqual(validateOptionalRoutes(challenge), []);
  assert.deepEqual(validateOptionalGuideText(challenge, route, guide), []);
  assert.deepEqual(await validateOptionalRoutePage(challenge, route, page), []);
  assert.equal([...guide.matchAll(/^## /gmu)].length, 6);
  assert.equal(optionalRuntimeStatus(route), "blocked");
  assert.equal(route.runtimeRequirements.filter(({ status }) => status === "blocked").length, 1);
  const missingReason = guide.replace(route.runtimeRequirements[1].reason, "未記録");
  assert.ok(!missingReason.includes(route.runtimeRequirements[1].reason));
  assert.ok(validateOptionalGuideText(challenge, route, missingReason).some(({ code }) => code === "OPTIONAL_PAGE_METADATA"));
  assert.deepEqual(validateOptionalGuideText(challenge, route, guide), []);
  const changed = structuredClone(challenge);
  changed.optionalRoutes[0].runtimeRequirements[0].status = "not-checked";
  assert.equal(changed.optionalRoutes[0].runtimeRequirements[0].status, "not-checked");
  assert.ok(validateOptionalRoutes(changed).some(({ code }) => code === "CATALOG_OPTIONAL_KNOWN_BLOCK"));
  changed.optionalRoutes[0].runtimeRequirements[0].status = "blocked";
  assert.deepEqual(validateOptionalRoutes(changed), []);
  assert.equal(optionalRuntimeStatus({ runtimeRequirements: [] }), "not-checked");
  assert.ok(guide.includes("force-add") && guide.includes("Profile限定"));
  assert.ok(guide.includes("OPTIONAL_ROUTE_BLOCKED") && guide.includes("exit 2"));
  for (const literal of [
    "2026-09-15", "chat.plugins.enabled", "chat.pluginLocations",
    "有効状態は設定ファイルとは別に保存", "Copilot CLIがホームへ導入",
    "公式文書の確認であり、installやUI操作の観測ではありません",
  ]) assert.ok(guide.includes(literal), literal);
});

test("HC-014 Evidence uses its own raw LF hashes, exact submitted headings and all conditions", async () => {
  const manifest = await readJson(path.join(pack, "manifest.json"));
  assert.deepEqual(manifest.evidenceRequirements.map(({ path: value }) => path.posix.basename(value)), Object.keys(evidenceHeadings));
  for (const requirement of manifest.evidenceRequirements) {
    const name = path.posix.basename(requirement.path);
    const bytes = await readFile(path.join(payload, `${name}.template`));
    assert.equal(requirement.stage, "submitted");
    assert.deepEqual(requirement.conditions, conditions);
    assert.deepEqual(requirement.requiredHeadings, evidenceHeadings[name]);
    assert.equal(requirement.templateSha256, sha256(bytes));
    assert.deepEqual([...bytes.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]), evidenceHeadings[name]);
  }
});

test("HC-014 real pack rejects one Evidence mutation, reserved grant and unsafe branch then fully restores", async (t) => {
  const directory = await scratch(t);
  const copy = path.join(directory, "pack");
  await cp(pack, copy, { recursive: true });
  assert.deepEqual((await validatePackDirectory(copy, "HC-014")).errors, []);
  const target = path.join(copy, "payload", "lifecycle.md.template");
  const original = await readFile(target);
  const changed = Buffer.from(original.toString("utf8").replace("## Restored v1", "## Partial restoration"));
  assert.match(changed.toString("utf8"), /^## Partial restoration$/mu);
  assert.doesNotMatch(changed.toString("utf8"), /^## Restored v1$/mu);
  await writeFile(target, changed);
  assert.ok((await validatePackDirectory(copy, "HC-014")).errors.some(({ code }) => code === "PACK_EVIDENCE_TEMPLATE_HASH"));
  await writeFile(target, original);
  assert.deepEqual((await validatePackDirectory(copy, "HC-014")).errors, []);
  const manifest = await readJson(path.join(copy, "manifest.json"));
  const mutations = [
    ["PACK_EVIDENCE_STAGE", (value) => { value.evidenceRequirements[0].stage = "in-progress"; }, (value) => assert.equal(value.evidenceRequirements[0].stage, "in-progress")],
    ["PACK_ADDITION_RESERVED_PATH", (value) => { value.allowedAdditions.push({ pattern: value.evidenceRequirements[0].path, conditions }); }, (value) => assert.equal(value.allowedAdditions.at(-1).pattern, ".hackathon/evidence/hc-014/comparison.md")],
    ["PACK_BRANCH_SAFETY", (value) => { value.isolation.branchSafe = true; }, (value) => assert.equal(value.isolation.branchSafe, true)],
  ];
  for (const [reason, mutate, shape] of mutations) {
    assert.deepEqual(validatePackManifest(manifest, "HC-014"), []);
    const candidate = structuredClone(manifest);
    mutate(candidate);
    shape(candidate);
    assert.ok(validatePackManifest(candidate, "HC-014").some(({ code }) => code === reason), reason);
    assert.deepEqual(validatePackManifest(manifest, "HC-014"), []);
  }
  contract(manifest);
  const missingCondition = structuredClone(manifest);
  missingCondition.overlay.at(-1).conditions = ["baseline"];
  assert.deepEqual(missingCondition.overlay.at(-1).conditions, ["baseline"]);
  rejected(() => contract(missingCondition), "HC014_COMMON_OVERLAY_CONDITIONS");
  contract(manifest);
  const missingPlacement = structuredClone(manifest);
  missingPlacement.allowedAdditions = missingPlacement.allowedAdditions.filter(({ pattern }) => pattern !== "participant/hc-014/package/current/plugin.json.template");
  assert.equal(missingPlacement.allowedAdditions.length, manifest.allowedAdditions.length - 1);
  rejected(() => contract(missingPlacement), "HC014_EXACT_ADDITIONS");
  contract(manifest);
});

test("HC-014 existing validator runs on real inert payload; v2 changes only manifest version and one body marker", async (t) => {
  const { validatorPath, plugin, validate } = await pluginFixture(t);
  const first = await snapshot(validate, plugin);
  assert.equal(first.info.version, "1.0.0");
  assert.equal(first.info.skill, "order-import-evidence");
  assert.equal(first.info.componentCount, 1);
  cli(validatorPath, [plugin], 0);
  const second = await snapshot(validate, path.join(payload, "drafts", "v2"));
  assert.equal(second.info.version, "2.0.0");
  assert.notEqual(second.info.skillSha256, first.info.skillSha256);
  assert.deepEqual(
    second.files[0][1],
    Buffer.from(first.files[0][1].toString("utf8").replace('"version": "1.0.0"', '"version": "2.0.0"')),
  );
  assert.equal([...first.files[1][1].toString("utf8").matchAll(/^教材版: training-v1$/gmu)].length, 1);
  assert.deepEqual(second.files[1][1], Buffer.from(first.files[1][1].toString("utf8").replace("教材版: training-v1", "教材版: training-v2")));
  assert.deepEqual(first.files[1][1].toString("utf8").split("---\n")[1], second.files[1][1].toString("utf8").split("---\n")[1]);
  cli(validatorPath, [path.join(payload, "drafts", "v2")], 0);
});

test("HC-014 CLI missing schema, CRLF, frontmatter shape and unexpected arguments fail for exact reasons and restore", async (t) => {
  const { validatorPath, plugin } = await pluginFixture(t);
  const manifestPath = path.join(plugin, "plugin.json.template");
  const skillFile = fileAt(plugin, skillPath);
  const originalManifest = await readFile(manifestPath);
  const originalSkill = await readFile(skillFile);
  const mutations = [
    {
      target: manifestPath, original: originalManifest,
      change: (bytes) => { const value = JSON.parse(bytes); delete value.$schema; return jsonBytes(value); },
      shape: (bytes) => assert.equal(Object.hasOwn(JSON.parse(bytes), "$schema"), false),
      reason: "Only Agent Plugins 1.0 is supported by this workshop validator",
    },
    {
      target: skillFile, original: originalSkill,
      change: (bytes) => Buffer.from(bytes.toString("utf8").replace(/\n/gu, "\r\n")),
      shape: (bytes) => { assert.ok(bytes.includes(13)); assert.deepEqual(Buffer.from(bytes.toString("utf8").replace(/\r\n/gu, "\n")), originalSkill); },
      reason: "Workshop skill files must use LF, as required by .gitattributes",
    },
    {
      target: skillFile, original: originalSkill,
      change: (bytes) => Buffer.from(bytes.toString("utf8").replace(/^description: .+$/mu, "description: |\n  用途を二行にした原稿")),
      shape: (bytes) => assert.match(bytes.toString("utf8"), /^description: \|\n  用途を二行にした原稿$/mu),
      reason: "Expected the workshop name/description frontmatter, not arbitrary YAML",
    },
  ];
  for (const mutation of mutations) {
    cli(validatorPath, [plugin], 0);
    const changed = mutation.change(mutation.original);
    assert.ok(!changed.equals(mutation.original));
    mutation.shape(changed);
    await writeFile(mutation.target, changed);
    cli(validatorPath, [plugin], 1, mutation.reason);
    await writeFile(mutation.target, mutation.original);
    assert.deepEqual(await readFile(mutation.target), mutation.original);
    cli(validatorPath, [plugin], 0);
  }
  cli(validatorPath, [plugin, "--unexpected"], 1, "Usage: node validate-plugin.mjs [directory [--materialized]]");
  cli(validatorPath, [plugin], 0);
});

test("HC-014 source validator rejects format mixing, extra components and manifest fields one at a time", async (t) => {
  const { plugin, validate } = await pluginFixture(t);
  const originalFiles = await listFilesRecursively(plugin);
  const extras = [
    [".claude-plugin", ".claude-plugin/plugin.json.template"],
    [".mcp.json.template", ".mcp.json.template"],
    ["mcp.json.template", "mcp.json.template"],
    ["hooks.json.template", "hooks.json.template"],
    ["com.github.copilot", "com.github.copilot/hooks/hooks.json.template"],
    ["agents", "agents/helper.agent.md.template"],
    ["rules", "rules/reader.instructions.md.template"],
    ["prompts", "prompts/request.prompt.md.template"],
  ];
  for (const [top, extra] of extras) {
    assert.equal(validate(plugin).componentCount, 1);
    const target = fileAt(plugin, extra);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, "{}\n", { flag: "wx" });
    assert.deepEqual((await listFilesRecursively(plugin)).sort(), [...originalFiles, extra].sort());
    structuralRejection(() => validate(plugin), "deepStrictEqual");
    await rm(fileAt(plugin, top), { recursive: true });
    assert.deepEqual(await listFilesRecursively(plugin), originalFiles);
    assert.equal(validate(plugin).componentCount, 1);
  }
  const extraSkill = fileAt(plugin, "skills/another-skill/SKILL.md.template");
  await mkdir(path.dirname(extraSkill));
  await writeFile(extraSkill, (await readFile(fileAt(plugin, skillPath), "utf8")).replace("name: order-import-evidence", "name: another-skill"));
  assert.equal((await listFilesRecursively(path.join(plugin, "skills"))).length, 2);
  rejected(() => validate(plugin), "Exactly one skill; no cumulative bundle");
  await rm(path.dirname(extraSkill), { recursive: true });
  assert.equal(validate(plugin).componentCount, 1);
  const manifestPath = path.join(plugin, "plugin.json.template");
  const original = await readFile(manifestPath);
  const changed = JSON.parse(original);
  changed.skills = ["skills/order-import-evidence"];
  assert.deepEqual(changed.skills, ["skills/order-import-evidence"]);
  await writeFile(manifestPath, jsonBytes(changed));
  structuralRejection(() => validate(plugin), "deepStrictEqual");
  await writeFile(manifestPath, original);
  assert.equal(validate(plugin).componentCount, 1);
  const wrongSchema = JSON.parse(original);
  wrongSchema.$schema = "https://example.invalid/copilot-format.schema.json";
  assert.notEqual(wrongSchema.$schema, JSON.parse(original).$schema);
  await writeFile(manifestPath, jsonBytes(wrongSchema));
  rejected(() => validate(plugin), "Only Agent Plugins 1.0 is supported by this workshop validator");
  await writeFile(manifestPath, original);
  assert.equal(validate(plugin).componentCount, 1);
});

test("HC-014 rejects prefixed or mismatched Skill names without fixing a participant package name or body", async (t) => {
  const { plugin, validate } = await pluginFixture(t);
  const file = fileAt(plugin, skillPath);
  const original = await readFile(file);
  for (const name of ["wholesale-evidence:order-import-evidence", "another-name"]) {
    assert.equal(validate(plugin).skill, "order-import-evidence");
    const changed = Buffer.from(original.toString("utf8").replace("name: order-import-evidence", `name: ${name}`));
    assert.match(changed.toString("utf8"), new RegExp(`^name: ${name}$`, "m"));
    await writeFile(file, changed);
    assert.throws(() => validate(plugin), (error) => {
      assert.equal(error.code, "ERR_ASSERTION");
      assert.equal(error.actual, name);
      assert.equal(error.expected, "order-import-evidence");
      return true;
    });
    await writeFile(file, original);
    assert.equal(validate(plugin).skill, "order-import-evidence");
  }
  const manifestPath = path.join(plugin, "plugin.json.template");
  const originalManifest = await readFile(manifestPath);
  for (const name of ["reading-team", "sora.evidence"]) {
    const manifest = JSON.parse(originalManifest);
    manifest.name = name;
    manifest.description = "配布先を説明する独自の記述。";
    const alternateBody = Buffer.from("---\nname: order-import-evidence\ndescription: 静的な読解を支援する別の用途文。\n---\n\n教材版: training-v1\n\n読み手と調べる入口を先に選び、未確認の問いを分ける。実行や設定変更はしない。\n");
    await writeFile(manifestPath, jsonBytes(manifest));
    await writeFile(file, alternateBody);
    assert.equal(validate(plugin).name, name);
    assert.ok(equivalent(await snapshot(validate, plugin), alternateBody, "1.0.0"));
  }
  await writeFile(manifestPath, originalManifest);
  await writeFile(file, original);
  assert.equal(validate(plugin).name, JSON.parse(originalManifest).name);
  const invalidName = JSON.parse(originalManifest);
  invalidName.name = "Bad_Name";
  await writeFile(manifestPath, jsonBytes(invalidName));
  assert.equal(JSON.parse(await readFile(manifestPath)).name, "Bad_Name");
  structuralRejection(() => validate(plugin), "==");
  await writeFile(manifestPath, originalManifest);
  assert.equal(validate(plugin).componentCount, 1);
});

test("HC-014 raw-byte control catches frontmatter-only and same-version body differences and v1-versus-v2", async (t) => {
  const { plugin, validate } = await pluginFixture(t);
  const first = await snapshot(validate, plugin);
  const manual = Buffer.from(first.files[1][1]);
  assert.ok(equivalent(first, manual, "1.0.0"));
  const frontmatterOnly = Buffer.from(manual.toString("utf8").replace(/^description: .+$/mu, "description: 同じ用途を別の言葉で表した手順。"));
  assert.deepEqual(frontmatterOnly.toString("utf8").split("\n---\n")[1], manual.toString("utf8").split("\n---\n")[1]);
  assert.ok(!frontmatterOnly.equals(manual));
  rejected(() => equivalent(first, frontmatterOnly, "1.0.0"), "HC014_SKILL_BYTES_MISMATCH");
  assert.ok(equivalent(first, manual, "1.0.0"));
  const bodyOnly = Buffer.from(manual.toString("utf8").replace("読み手、読む順番", "読む順番、読み手"));
  assert.deepEqual(bodyOnly.toString("utf8").split("\n---\n")[0], manual.toString("utf8").split("\n---\n")[0]);
  assert.ok(!bodyOnly.equals(manual));
  await writeFile(fileAt(plugin, skillPath), bodyOnly);
  const changed = await snapshot(validate, plugin);
  assert.equal(changed.info.version, first.info.version);
  rejected(() => equivalent(changed, manual, "1.0.0"), "HC014_SKILL_BYTES_MISMATCH");
  await writeFile(fileAt(plugin, skillPath), manual);
  assert.ok(equivalent(await snapshot(validate, plugin), manual, "1.0.0"));
  const second = await snapshot(validate, path.join(payload, "drafts", "v2"));
  assert.equal(second.info.version, "2.0.0");
  rejected(() => equivalent(second, manual, "1.0.0"), "HC014_RELEASE_VERSION_MISMATCH");
  rejected(() => equivalent(second, manual, "2.0.0"), "HC014_SKILL_BYTES_MISMATCH");
  assert.ok(equivalent(second, second.files[1][1], "2.0.0"));
  assert.ok(equivalent(first, manual, "1.0.0"));
});

test("HC-014 both conditions execute v1 to v2 to full v1 restoration, not a version-string proxy", async (t) => {
  const { directory, plugin, validate } = await pluginFixture(t);
  const releases = {
    v1: await snapshot(validate, path.join(payload, "drafts", "v1")),
    v2: await snapshot(validate, path.join(payload, "drafts", "v2")),
  };
  const states = [];
  for (const [state, version] of [["draft-v1", "v1"], ["draft-v2", "v2"], ["restored-v1", "v1"]]) {
    for (const [name, bytes] of releases[version].files) await writeFile(fileAt(plugin, name), bytes);
    states.push({ state, snapshot: await snapshot(validate, plugin) });
  }
  assert.ok(completeSequence(states, releases));
  const partials = [
    { name: skillPath, bytes: releases.v2.files[1][1], version: "1.0.0", marker: "training-v2" },
    { name: "plugin.json.template", bytes: releases.v2.files[0][1], version: "2.0.0", marker: "training-v1" },
    {
      name: "plugin.json.template",
      bytes: jsonBytes({ ...JSON.parse(releases.v1.files[0][1]), description: "同じ版でも復元していない配布説明。" }),
      version: "1.0.0", marker: "training-v1",
    },
  ];
  for (const mutation of partials) {
    assert.ok(completeSequence(states, releases));
    await writeFile(fileAt(plugin, mutation.name), mutation.bytes);
    const postImage = await snapshot(validate, plugin);
    assert.equal(postImage.info.version, mutation.version);
    assert.match(postImage.files[1][1].toString("utf8"), new RegExp(`^教材版: ${mutation.marker}$`, "m"));
    assert.equal(postImage.files.filter(([name, bytes], index) => name === releases.v1.files[index][0] && !bytes.equals(releases.v1.files[index][1])).length, 1);
    const changed = [...states.slice(0, 2), { state: "restored-v1", snapshot: postImage }];
    rejected(() => completeSequence(changed, releases), "HC014_FULL_BYTES_MISMATCH");
    for (const [name, bytes] of releases.v1.files) await writeFile(fileAt(plugin, name), bytes);
    const restored = await snapshot(validate, plugin);
    assert.deepEqual(restored, releases.v1);
    assert.ok(completeSequence([...states.slice(0, 2), { state: "restored-v1", snapshot: restored }], releases));
  }
  const metadataLie = [...states.slice(0, 2), { state: "restored-v1", snapshot: { ...releases.v1, info: { ...releases.v1.info, version: "2.0.0" } } }];
  assert.deepEqual(metadataLie[2].snapshot.files, releases.v1.files);
  assert.equal(metadataLie[2].snapshot.info.version, "2.0.0");
  rejected(() => completeSequence(metadataLie, releases), "HC014_SNAPSHOT_METADATA_MISMATCH");
  assert.ok(completeSequence(states, releases));

  const manualFile = path.join(directory, "manual-current", "SKILL.md.template");
  await mkdir(path.dirname(manualFile));
  const manualReleases = Object.fromEntries(Object.entries(releases).map(([version, value]) => [version, { bytes: value.files[1][1], logicalVersion: value.info.version }]));
  const manualStates = [];
  for (const [state, version] of [["draft-v1", "v1"], ["draft-v2", "v2"], ["restored-v1", "v1"]]) {
    await writeFile(manualFile, manualReleases[version].bytes);
    manualStates.push({ state, bytes: await readFile(manualFile), logicalVersion: manualReleases[version].logicalVersion });
  }
  assert.ok(manualSequence(manualStates, manualReleases));
  await writeFile(manualFile, manualReleases.v2.bytes);
  const staleManual = [...manualStates.slice(0, 2), { ...manualStates[2], bytes: await readFile(manualFile) }];
  assert.equal(staleManual[2].logicalVersion, "1.0.0");
  assert.ok(staleManual[2].bytes.equals(manualReleases.v2.bytes));
  rejected(() => manualSequence(staleManual, manualReleases), "HC014_MANUAL_RESTORE_BYTES");
  await writeFile(manualFile, manualReleases.v1.bytes);
  assert.ok(manualSequence([...manualStates.slice(0, 2), { ...manualStates[2], bytes: await readFile(manualFile) }], manualReleases));
  const wrongLedger = manualStates.map((state) => ({ ...state }));
  wrongLedger[2].logicalVersion = "2.0.0";
  assert.ok(wrongLedger[2].bytes.equals(manualReleases.v1.bytes));
  rejected(() => manualSequence(wrongLedger, manualReleases), "HC014_MANUAL_LEDGER_VERSION");
  assert.ok(manualSequence(manualStates, manualReleases));
});

test("HC-014 aggregates a single duplicate or stale candidate among all origins, including disabled leftovers", async (t) => {
  const { directory, validate } = await pluginFixture(t, "v2");
  const release = await snapshot(validate, path.join(payload, "drafts", "v2"));
  const source = await readJson(path.join(payload, "lifecycle-origins.json.template"));
  const candidates = source.candidates.map(({ origin }, index) => ({ origin, enabled: index === 0 }));
  for (const candidate of candidates) await cp(path.join(payload, "drafts", "v2"), fileAt(directory, candidate.origin), { recursive: true });
  const report = () => originReport(validate, directory, candidates, release);
  assertCleanOrigins(await report());
  candidates.at(-1).enabled = true;
  assert.deepEqual(candidates.map(({ enabled }) => enabled), [true, false, true]);
  const duplicate = await report();
  assert.deepEqual(duplicate.duplicateSkills, ["order-import-evidence"]);
  assert.deepEqual(duplicate.staleOrigins, []);
  rejected(() => assertCleanOrigins(duplicate), "HC014_DUPLICATE_SKILL");
  candidates.at(-1).enabled = false;
  assertCleanOrigins(await report());
  const target = fileAt(directory, `${candidates[1].origin}/${skillPath}`);
  const original = await readFile(target);
  await writeFile(target, await readFile(fileAt(path.join(payload, "drafts", "v1"), skillPath)));
  assert.equal(candidates[1].enabled, false);
  assert.notEqual(sha256(await readFile(target)), sha256(original));
  const stale = await report();
  assert.deepEqual(stale.staleOrigins, [candidates[1].origin]);
  assert.deepEqual(stale.duplicateSkills, []);
  rejected(() => assertCleanOrigins(stale), "HC014_STALE_ORIGIN");
  await writeFile(target, original);
  assertCleanOrigins(await report());
  const repeatedOrigin = [...candidates, { ...candidates[0], enabled: false }];
  assert.equal(repeatedOrigin.filter(({ origin }) => origin === candidates[0].origin).length, 2);
  await assert.rejects(() => originReport(validate, directory, repeatedOrigin, release), { code: "ERR_ASSERTION", message: "HC014_DUPLICATE_ORIGIN" });
  assertCleanOrigins(await report());
});

test("HC-014 synthetic disabled flags never become actual discovery or disable receipts", async (t) => {
  const { directory, validate } = await pluginFixture(t, "v2");
  const release = await snapshot(validate, path.join(payload, "drafts", "v2"));
  const candidates = [{ origin: "paper/disabled-copy", enabled: false }];
  await cp(path.join(payload, "drafts", "v2"), fileAt(directory, candidates[0].origin), { recursive: true });
  const report = await originReport(validate, directory, candidates, release);
  assert.equal(report.enabledCount, 0);
  assertSyntheticBoundary(report);
  const changed = { ...report, liveDiscovery: "verified" };
  assert.equal(changed.enabledCount, 0);
  assert.equal(changed.fixtureOnly, true);
  assert.equal(changed.liveDiscovery, "verified");
  rejected(() => assertSyntheticBoundary(changed), "HC014_SYNTHETIC_NOT_DISCOVERY");
  assertSyntheticBoundary(report);
});

test("HC-014 README PowerShell resolves every destination from its Runtime location, not process cwd", async (t) => {
  const commands = process.platform === "win32" ? ["pwsh.exe", "powershell.exe"] : ["pwsh"];
  const hosts = [];
  const unavailableHosts = [];
  const encoded = (code) => Buffer.from(code, "utf16le").toString("base64");
  const psString = (value) => `'${value.replaceAll("'", "''")}'`;
  const options = { encoding: "utf8", shell: false, windowsHide: true, timeout: 30_000, maxBuffer: 1024 * 1024 };
  for (const command of commands) {
    const probe = spawnSync(command, ["-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand",
      encoded("$ProgressPreference='SilentlyContinue'; [pscustomobject]@{version=$PSVersionTable.PSVersion.ToString(); hashAvailable=($null -ne (Get-Command Get-FileHash -ErrorAction SilentlyContinue))} | ConvertTo-Json -Compress")], options);
    if (probe.error?.code === "ENOENT") {
      t.diagnostic(`${command}: unavailable; this host was not executed`);
      continue;
    }
    assert.equal(probe.error, undefined);
    assert.equal(probe.signal, null);
    assert.ok(Number.isInteger(probe.status));
    assert.equal(probe.status, 0, probe.stderr);
    const capability = JSON.parse(probe.stdout.trim());
    if (!capability.hashAvailable) {
      unavailableHosts.push({ command, ...capability });
      await t.test(`${command} ${capability.version}: required Get-FileHash capability`, (t) => {
        t.skip("Get-FileHash is unavailable in this installed host; the full README workflow is not executed");
      });
      continue;
    }
    hosts.push({ command, version: capability.version });
  }
  if (hosts.length === 0) {
    t.skip("PowerShell is unavailable; README destination execution is not observed");
    return;
  }

  const readme = await readFile(path.join(root, "README.md"), "utf8");
  const MarkdownIt = createRequire(import.meta.url)("markdown-it");
  const fences = new MarkdownIt().parse(readme, {}).filter((token) =>
    token.type === "fence" && token.info.trim() === "powershell").map(({ content }) => content);
  const select = (marker) => {
    const found = fences.filter((code) => code.includes(marker));
    assert.equal(found.length, 1, `exactly one actual README block: ${marker}`);
    return found[0];
  };
  const blocks = {
    setup: select("function Copy-NewDraft"),
    manualV1: select('Copy-NewDraft "$Starter\\drafts\\v1\\skills\\order-import-evidence\\SKILL.md.template" "$Mine\\manual\\v1\\SKILL.md.template"'),
    manualV2: select("$V2Path ="),
    packageV1: select("$FrozenManual ="),
    packageV2: select("$ManifestV2 ="),
    lifecycle: select("function Move-OwnedDraft"),
    evidence: select("foreach ($name in @('comparison', 'recovery', 'lifecycle'))"),
  };
  const sites = [
    ["copy", "setup", "$Destination", "HC014_DESIGN_DESTINATION"],
    ["manual-v2", "manualV2", '"$Mine\\manual\\v2\\SKILL.md.template"', "HC014_MANUAL_V2_DESTINATION"],
    ["package-v2", "packageV2", '"$Mine\\package\\v2\\plugin.json.template"', "HC014_PACKAGE_V2_DESTINATION"],
    ["current", "lifecycle", '"$Mine\\$Kind\\current\\$file"', "HC014_CURRENT_V2"],
  ].map(([name, block, argument, error]) => ({
    name, block, error,
    fixed: `$ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath(${argument})`,
    legacy: `[IO.Path]::GetFullPath(${argument})`,
  }));
  const completeFix = sites.every(({ block, fixed }) => blocks[block].includes(fixed));
  const variants = [{ name: "candidate", blocks, error: null }];
  if (completeFix) {
    for (const site of sites) {
      assert.equal(blocks[site.block].split(site.fixed).length, 2, site.name);
      const changed = { ...blocks, [site.block]: blocks[site.block].replace(site.fixed, site.legacy) };
      assert.ok(changed[site.block].includes(site.legacy));
      assert.equal(changed[site.block].includes(site.fixed), false);
      assert.equal(Object.keys(blocks).filter((key) => changed[key] !== blocks[key]).length, 1);
      variants.push({ name: `legacy-${site.name}`, blocks: changed, error: site.error });
    }
    const legacy = { ...blocks };
    for (const site of sites) legacy[site.block] = legacy[site.block].replace(site.fixed, site.legacy);
    variants.push({ name: "legacy-all", blocks: legacy, error: "HC014_DESIGN_DESTINATION" });
  }

  const artifactParent = process.env.HC014_RESOLVER_ARTIFACT_ROOT;
  const directory = await realpath(await scratch(t));
  let retainedDirectory;
  if (artifactParent) {
    const parent = await realpath(artifactParent);
    const repository = await realpath(REPOSITORY_ROOT);
    assert.ok(parent !== repository && !isContainedBy(repository, parent));
    retainedDirectory = await mkdtemp(path.join(parent, "hc014-resolver-"));
    t.diagnostic(`Resolver execution evidence retained: ${retainedDirectory}; execution uses shorter owned temporary paths`);
  }
  const report = { readmeSha256: sha256(readme), snippetSha256: Object.fromEntries(
    Object.entries(blocks).map(([name, code]) => [name, sha256(code)])), hosts, unavailableHosts, cases: [] };
  const validatorPath = path.join(directory, "validate-plugin.mjs");
  const originalValidator = await readFile(path.join(payload, "tools", "validate-plugin.mjs.template"));
  assert.equal(sha256(originalValidator), validatorSha256);
  await writeFile(validatorPath, originalValidator, { flag: "wx" });
  const { validateWorkshopPlugin } = await import(pathToFileURL(validatorPath).href);

  for (const [hostIndex, host] of hosts.entries()) {
    for (const variant of variants) {
      await t.test(`${host.command} ${host.version}: ${variant.name}`, async () => {
        const caseRoot = path.join(directory, `host-${hostIndex}-${variant.name}`);
        const processRoot = path.join(caseRoot, "process directory");
        const manualRoot = path.join(caseRoot, "manual Runtime");
        const packageRoot = path.join(caseRoot, "package Runtime");
        await mkdir(processRoot, { recursive: true });
        for (const runtime of [manualRoot, packageRoot]) {
          await cp(payload, path.join(runtime, ".hackathon", "challenge", "hc-014"), { recursive: true });
        }
        const snippetPath = path.join(caseRoot, "readme-snippets.json");
        await writeFile(snippetPath, jsonBytes(variant.blocks), { flag: "wx" });
        const driver = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$blocks = Get-Content -LiteralPath ${psString(snippetPath)} -Raw -Encoding UTF8 | ConvertFrom-Json
$manualRoot = ${psString(manualRoot)}
$packageRoot = ${psString(packageRoot)}
$initialProcessDirectory = [Environment]::CurrentDirectory
$states = @()
function Require([bool]$Condition, [string]$Code) { if (-not $Condition) { throw $Code } }
function Expect-File([string]$Relative, [string]$Code) {
    $absolute = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Relative)
    Require ([IO.File]::Exists($absolute)) $Code
}
function Save-State([string]$Version) {
    foreach ($file in $Files) {
        Require (Same-RawFile "$Mine\$Kind\$Version\$file" "$Mine\$Kind\current\$file") ("HC014_CURRENT_" + $Version.ToUpper())
    }
    [pscustomobject]@{ runtime=(Get-Location).Path; kind=$Kind; version=$Version }
}
try {
    # Prepare only directories on the owned wrong side, so a legacy write is observable.
    foreach ($relative in @('.\participant\hc-014\manual\current\SKILL.md.template',
            '.\participant\hc-014\package\v2\plugin.json.template')) {
        $wrong = [IO.Path]::GetFullPath($relative)
        [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($wrong)) | Out-Null
    }
    Set-Location -LiteralPath $manualRoot
    Require ([Environment]::CurrentDirectory -ne (Get-Location).Path) 'HC014_DIRECTORY_MISMATCH_REQUIRED'
    . ([scriptblock]::Create($blocks.setup)) | Out-Null
    Expect-File "$Mine\design.md" 'HC014_DESIGN_DESTINATION'
    . ([scriptblock]::Create($blocks.manualV1)) | Out-Null
    $manualCut = $blocks.manualV2.IndexOf('Get-FileHash')
    Require ($manualCut -gt 0) 'HC014_MANUAL_BLOCK'
    . ([scriptblock]::Create($blocks.manualV2.Substring(0, $manualCut))) | Out-Null
    Expect-File "$Mine\manual\v2\SKILL.md.template" 'HC014_MANUAL_V2_DESTINATION'
    . ([scriptblock]::Create($blocks.manualV2.Substring($manualCut))) | Out-Null
    $cut = $blocks.lifecycle.IndexOf("Move-OwnedDraft 'v2'")
    Require ($cut -gt 0) 'HC014_LIFECYCLE_BLOCK'
    $definitions = $blocks.lifecycle.Substring(0, $cut)
    . ([scriptblock]::Create($definitions)) | Out-Null
    $states += Save-State 'v1'
    Move-OwnedDraft 'v2' | Out-Null
    $states += Save-State 'v2'
    Move-OwnedDraft 'v1' | Out-Null
    $states += Save-State 'v1'
    . ([scriptblock]::Create($blocks.evidence)) | Out-Null
    $guard = $false
    try { . ([scriptblock]::Create($blocks.manualV2)) | Out-Null }
    catch { $guard = $_.Exception.Message.Contains('既存のv2は変更しません') }
    Require $guard 'HC014_MANUAL_OVERWRITE_GUARD'
    Set-Location -LiteralPath $packageRoot
    . ([scriptblock]::Create($blocks.setup)) | Out-Null
    $frozen = Join-Path $manualRoot 'participant\hc-014\manual'
    $packageCode = [regex]::Replace($blocks.packageV1, '(?m)^\$FrozenManual = .+$',
        ('$FrozenManual = ' + "'" + $frozen.Replace("'", "''") + "'"))
    . ([scriptblock]::Create($packageCode)) | Out-Null
    . ([scriptblock]::Create($blocks.packageV2)) | Out-Null
    Expect-File "$Mine\package\v2\plugin.json.template" 'HC014_PACKAGE_V2_DESTINATION'
    $packageDefinitions = $definitions.Replace("$" + "Kind = 'manual'", "$" + "Kind = 'package'")
    . ([scriptblock]::Create($packageDefinitions)) | Out-Null
    $states += Save-State 'v1'
    Move-OwnedDraft 'v2' | Out-Null
    $states += Save-State 'v2'
    Move-OwnedDraft 'v1' | Out-Null
    $states += Save-State 'v1'
    . ([scriptblock]::Create($blocks.evidence)) | Out-Null
    $guard = $false
    try { Copy-NewDraft "$Starter\design.md.template" "$Mine\design.md" }
    catch { $guard = $_.Exception.Message.Contains('既存ファイルへはコピーしません') }
    Require $guard 'HC014_COPY_OVERWRITE_GUARD'
    $guard = $false
    try { . ([scriptblock]::Create($blocks.packageV2)) | Out-Null }
    catch { $guard = $_.Exception.Message.Contains('既存manifest v2は変更しません') }
    Require $guard 'HC014_MANIFEST_OVERWRITE_GUARD'
    $guard = $false
    try { Move-OwnedDraft 'v3' | Out-Null }
    catch { $guard = $_.Exception.Message.Contains('v1かv2だけです') }
    Require $guard 'HC014_KNOWN_VERSION_GUARD'
    $current = (Resolve-Path -LiteralPath "$Mine\package\current\skills\order-import-evidence\SKILL.md.template").Path
    $saved = [IO.File]::ReadAllBytes($current)
    [IO.File]::WriteAllBytes($current, [Text.Encoding]::UTF8.GetBytes('owned corruption'))
    $guard = $false
    try { Move-OwnedDraft 'v2' | Out-Null }
    catch { $guard = $_.Exception.Message.Contains('currentが既知の完全な版ではありません') }
    [IO.File]::WriteAllBytes($current, $saved)
    Require $guard 'HC014_UNKNOWN_CURRENT_GUARD'
    Require ([Environment]::CurrentDirectory -eq $initialProcessDirectory) 'HC014_PROCESS_CWD_UNCHANGED'
    [Console]::WriteLine(([pscustomobject]@{ success=$true; processDirectory=$initialProcessDirectory;
        location=(Get-Location).Path; version=$PSVersionTable.PSVersion.ToString(); edition=$PSVersionTable.PSEdition;
        states=$states } | ConvertTo-Json -Depth 8 -Compress))
} catch {
    [Console]::WriteLine(([pscustomobject]@{ success=$false; error=$_.Exception.Message;
        processDirectory=[Environment]::CurrentDirectory; location=(Get-Location).Path;
        version=$PSVersionTable.PSVersion.ToString(); states=$states } | ConvertTo-Json -Depth 8 -Compress))
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
`;
        await writeFile(path.join(caseRoot, "driver.ps1"), driver, { flag: "wx" });
        const result = spawnSync(host.command, ["-NoLogo", "-NoProfile", "-NonInteractive",
          "-EncodedCommand", encoded(driver)], { ...options, cwd: processRoot });
        assert.equal(result.error, undefined);
        assert.equal(result.signal, null);
        assert.ok(Number.isInteger(result.status));
        const observed = JSON.parse(result.stdout.trim());
        const wrongFiles = await listFilesRecursively(processRoot);
        const retainedCaseRoot = retainedDirectory ? path.join(retainedDirectory, path.basename(caseRoot)) : null;
        if (retainedCaseRoot) await cp(caseRoot, retainedCaseRoot, { recursive: true, errorOnExist: true, force: false });
        report.cases.push({ host, variant: variant.name, caseRoot, retainedCaseRoot, driverSha256: sha256(driver), status: result.status,
          stderr: result.stderr, observed, wrongFiles });
        await writeFile(path.join(retainedDirectory ?? directory, "report.json"), jsonBytes(report));
        assert.equal(observed.processDirectory, processRoot);
        assert.notEqual(observed.location, processRoot);
        assert.equal(result.status, variant.error ? 1 : 0, result.stderr);
        if (variant.error) {
          assert.equal(observed.success, false);
          assert.equal(observed.error, variant.error);
          assert.equal(result.stderr.trim(), variant.error);
          assert.ok(wrongFiles.length > 0, "legacy resolver must actually write on the owned wrong side");
          return;
        }
        assert.equal(observed.success, true);
        assert.equal(result.stderr, "");
        assert.deepEqual(wrongFiles, [], "no files may be written relative to process cwd");
        assert.deepEqual(observed.states.map(({ kind, version }) => [kind, version]), [
          ["manual", "v1"], ["manual", "v2"], ["manual", "v1"],
          ["package", "v1"], ["package", "v2"], ["package", "v1"],
        ]);
        for (const [runtime, condition] of [[manualRoot, "baseline"], [packageRoot, "package-design"]]) {
          const actual = await listFilesRecursively(runtime);
          const created = actual.filter((file) => !file.startsWith(".hackathon/challenge/hc-014/"));
          assert.deepEqual(created.sort(), [
            ...additions[condition].map((file) => `participant/hc-014/${file}`),
            ...Object.keys(evidenceHeadings).map((file) => `.hackathon/evidence/hc-014/${file}`),
          ].sort());
          for (const name of ["design", "release-ledger"]) {
            assert.deepEqual(await readFile(fileAt(runtime, `participant/hc-014/${name}.md`)),
              await readFile(path.join(payload, `${name}.md.template`)));
          }
          for (const name of Object.keys(evidenceHeadings)) {
            assert.deepEqual(await readFile(fileAt(runtime, `.hackathon/evidence/hc-014/${name}`)),
              await readFile(path.join(payload, `${name}.template`)));
          }
        }
        for (const version of ["v1", "v2", "current"]) {
          const expectedVersion = version === "v2" ? "v2" : "v1";
          const directory = fileAt(packageRoot, `participant/hc-014/package/${version}`);
          assert.equal(validateWorkshopPlugin(directory).version, expectedVersion === "v2" ? "2.0.0" : "1.0.0");
          for (const file of componentPaths) {
            assert.deepEqual(await readFile(fileAt(directory, file)),
              await readFile(fileAt(path.join(payload, "drafts", expectedVersion), file)));
          }
          assert.deepEqual(await readFile(fileAt(manualRoot, `participant/hc-014/manual/${version}/SKILL.md.template`)),
            await readFile(fileAt(directory, skillPath)));
        }
      });
    }
  }
  assert.equal(completeFix, true, "all four destinations must use the PowerShell provider-aware resolver");
});
