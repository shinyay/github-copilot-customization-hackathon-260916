import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { validatePackOutputArgument } from "../scripts/lib/build-output.mjs";
import { loadCatalog } from "../scripts/lib/catalog.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../scripts/lib/constants.mjs";
import { listFilesRecursively, readJson, REPOSITORY_ROOT, sha256 } from "../scripts/lib/fs-utils.mjs";
import { parseMarkdownProse } from "../scripts/lib/markdown.mjs";
import { OPTIONAL_SAFETY_NOTICE, validateOptionalRoutes } from "../scripts/lib/optional-routes.mjs";
import {
  validateChallengePageText,
  validateOptionalGuideText,
  validateOptionalRoutePage,
  validatePublishedPages,
} from "../scripts/lib/pages.mjs";
import { validatePackDirectory, validatePackManifest } from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { validateSourceInventory } from "../scripts/lib/source-inventory.mjs";
import { assertErrorCode, deepClone } from "../test-support/helpers.mjs";
import { assertCliExit, runCli } from "../test-support/publication-fixtures.mjs";

const id = "HC-004";
const conditions = ["baseline", "customized", "manual-equivalent"];
const sourcePaths = [
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java",
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java",
];
const optionalRoutes = [{
  id: "claude-variants",
  title: "localとRulesの互換形式を別々に準備する",
  page: "challenges/hc-004/optional/claude-variants.md",
  required: false,
  prerequisites: {
    environment: [
      "localとRulesを分けた使い捨てworkspaceと新規会話を計画できること。",
      "利用予定のVS Code・harnessとClaude互換形式の対応状況を確認できること。",
    ],
    entitlements: ["利用予定環境のGitHub Copilotと教材repositoryへの通常の利用資格を確認できること。"],
    additionalApprovals: ["localまたはRulesの独立した実機計画には、環境所有者の追加承認を得ること。"],
  },
  runtimeRequirements: [
    {
      capability: "claude-local-discovery",
      status: "not-checked",
      reason: "localの発見・本文投入とGit除外の実状態は未確認です。",
    },
    {
      capability: "claude-rules-discovery",
      status: "not-checked",
      reason: "paths配列によるRulesの選択・本文投入とRuntimeによる任意実機検証は未確認です。",
    },
  ],
  liveStatus: "live-unobserved",
  stopReasons: [
    "対応状況、分離環境、追加承認が確認できない場合は実機計画を止めます。",
    "homeの変更、除外設定の書換え、本編へのactive Rules追加が必要なら未実施にします。",
  ],
}];
const challenge = {
  id,
  title: "Claude形式の指示を安全に持ち込もう",
  status: "published",
  challengeVersion: 1,
  page: "challenges/hc-004/README.md",
  pack: "challenges/hc-004/pack",
  sourceKind: "baseline",
  sourcePaths,
  optionalRoutes,
};
const directory = path.join(REPOSITORY_ROOT, "challenges", "hc-004");
const pack = path.join(directory, "pack");
const material = (name) => readFile(path.join(pack, "payload", name));
const evidencePath = ".hackathon/evidence/hc-004/comparison.md";
const frozenPath = "participant/hc-004/root-instructions.md.template";

function assertLessonBoundary(manifest) {
  assert.deepEqual(manifest.conditions, conditions);
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(manifest.allowedAdditions, [
    { pattern: "CLAUDE.md", conditions: ["customized"] },
    { pattern: frozenPath, conditions: ["customized", "manual-equivalent"] },
  ], "HC-004 permits only the root active file and the exact inert snapshot");
  for (const entry of manifest.overlay) {
    assert.deepEqual(entry.conditions, conditions, "all conditions receive identical common materials");
    assert.equal(entry.allowOverwrite, false);
    assert.ok(entry.source.startsWith("payload/") && entry.source.endsWith(".template"));
    assert.ok(entry.destination.startsWith(".hackathon/challenge/hc-004/") && entry.destination.endsWith(".template"));
  }
}

function assertEvidenceContract(manifest, bytes) {
  assert.equal(manifest.evidenceRequirements.length, 1);
  const requirement = manifest.evidenceRequirements[0];
  assert.equal(requirement.path, evidencePath);
  assert.equal(requirement.stage, "submitted");
  assert.deepEqual(requirement.conditions, conditions);
  assert.equal(requirement.templateSha256, sha256(bytes), "evidence hash must match the actual template bytes");
  assert.deepEqual(
    [...bytes.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    requirement.requiredHeadings,
    "required evidence headings must match the template",
  );
  assert.deepEqual(manifest.submissionFiles, [
    ...manifest.allowedAdditions,
    { pattern: evidencePath, conditions },
  ]);
}

function assertVisibleSources(page) {
  const starter = parseMarkdownProse(page).sections.find(({ title }) => title === "Starter Kit");
  for (const source of sourcePaths) {
    assert.ok(starter.body.includes(source), `source path must be visible in Starter Kit: ${source}`);
  }
}

function assertCompatibleScope(page) {
  const prose = parseMarkdownProse(page).sections.map(({ body }) => body).join("\n");
  assert.match(prose, /Hub checkout/u);
  assert.match(prose, /Runtime checkout/u);
  assert.match(prose, /ファイル名を替えても、Claudeモデルや別harnessへ切り替わりません/u,
    "a compatible instruction format is not a model or harness switch");
  assert.match(prose, /AGENTS\.md、\.claude\/CLAUDE\.md、CLAUDE\.local\.md、Rulesを同時に置きません/u);
  assert.match(prose, /参加者が選んで凍結した本文全文/u);
  assert.match(prose, /metadata、priority、内部contextの扱いの一致ではありません/u);
  assert.match(prose, /homeや個人設定を削除・退避して帳尻を合わせません/u);
  assert.match(prose, /それだけでは隔離できません/u);
  assert.match(prose, /HC-003の実施や原稿は前提にしません/u);
  assert.match(prose, /コピー先が既に存在する場合は、コピーを中止します/u,
    "participant copies must stop if the destination exists");
  assert.match(prose, /既存のEvidenceにはStarterをコピーし直しません/u);
  for (const term of ["保存", "発見", "本文投入", "出力", "model", "tools", "User", "組織", "Memory", "not-observed"]) {
    assert.ok(prose.includes(term), term);
  }
}

function assertRulesDraft(guide) {
  const drafts = [...guide.matchAll(/```yaml\r?\n([\s\S]*?)```/gu)];
  assert.equal(drafts.length, 1, "one inert Rules syntax draft");
  const header = drafts[0][1].replace(/\r\n/gu, "\n");
  const match = header.match(/^---\npaths: (\[[^\n]+\])\n---\n$/u);
  assert.ok(match, "Rules draft requires paths as a YAML flow array, not applyTo or a scalar");
  assert.deepEqual(JSON.parse(match[1]), ["wholesale-core/src/**/*.java"]);
}

test("HC-004 Pack v1 has exact root-only boundaries, inert materials and submission hashes", async () => {
  const result = await validatePackDirectory(pack, id);
  assert.deepEqual(result.errors, []);
  for (const file of result.files) {
    assert.equal((await readFile(path.join(pack, ...file.split("/")), "utf8")).includes("\r"), false,
      "Pack bytes must retain the repository's LF format across platforms");
  }
  const manifest = result.manifest;
  assertLessonBoundary(manifest);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.challengeVersion, 1);
  assert.equal(manifest.minimumTemplateVersion, 1);
  assert.deepEqual(manifest.isolation, {
    tier: "repository", freshWorkspace: true, freshConversation: true,
    freshProfile: true, freshRepository: true, conditionStrategy: "separate-repository", branchSafe: false,
  });
  assert.deepEqual(manifest.forbiddenActiveCustomizations, []);
  assert.deepEqual(manifest.cleanup, {
    advisory: true, verifyBaseline: true, exportSubmission: true, stopProcesses: true, archiveRepository: true,
  });
  assert.equal(manifest.overlay.length, 4);
  assertEvidenceContract(manifest, await material("comparison.md.template"));
  for (const condition of conditions) {
    const plan = buildRunPlan({ challenges: [challenge] }, manifest, { challengeId: id, condition, team: "test", runId: condition });
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.filesToInject.length, 4);
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.deepEqual(plan.participantChanges.allowedAdditions,
      manifest.allowedAdditions.filter((addition) => addition.conditions.includes(condition)));
    assert.equal(plan.participantChanges.activeCustomizationsDefault, "deny");
    assert.deepEqual(plan.runStateEvidence, manifest.evidenceRequirements);
  }
  const files = await listFilesRecursively(directory);
  assert.deepEqual(files.filter((file) => file.startsWith("optional/")), ["optional/claude-variants.md"]);
  assert.equal(files.filter((file) => /(?:^|\/)(?:AGENTS|CLAUDE|CLAUDE\.local)\.md$|\.java$|^\.claude\//u.test(file)).length, 0);
});

test("HC-004 rejects active baseline/manual, extra formats, overwrite and reserved evidence additions", async () => {
  const original = await readJson(path.join(pack, "manifest.json"));
  assertLessonBoundary(original);
  for (const condition of ["baseline", "manual-equivalent"]) {
    const mutated = deepClone(original);
    mutated.allowedAdditions[0].conditions = [condition];
    assert.deepEqual(mutated.allowedAdditions[0], { pattern: "CLAUDE.md", conditions: [condition] });
    assertErrorCode(validatePackManifest(mutated, id), "PACK_BASELINE_ACTIVE_CUSTOMIZATION");
  }
  const activeOverlay = deepClone(original);
  activeOverlay.overlay[0].destination = "CLAUDE.md";
  assert.equal(activeOverlay.overlay[0].destination, "CLAUDE.md");
  assertErrorCode(validatePackManifest(activeOverlay, id), "PACK_INERT_DESTINATION");
  const overwrite = deepClone(original);
  overwrite.overlay[0].allowOverwrite = true;
  assert.equal(overwrite.overlay[0].allowOverwrite, true);
  assertErrorCode(validatePackManifest(overwrite, id), "PACK_OVERWRITE_DEFAULT_DENY");
  for (const [pattern, code] of [
    [evidencePath, "PACK_ADDITION_RESERVED_PATH"],
    ["**", "PACK_ADDITION_MANAGED_WILDCARD"],
  ]) {
    const mutated = deepClone(original);
    mutated.allowedAdditions.push({ pattern, conditions: ["customized"] });
    assert.equal(mutated.allowedAdditions.at(-1).pattern, pattern);
    assertErrorCode(validatePackManifest(mutated, id), code);
  }
  for (const pattern of ["AGENTS.md", ".claude/CLAUDE.md", "CLAUDE.local.md", ".claude/rules/java-rule.md"]) {
    const extraFormat = deepClone(original);
    extraFormat.allowedAdditions.push({ pattern, conditions: ["customized"] });
    assert.deepEqual(extraFormat.allowedAdditions.at(-1), { pattern, conditions: ["customized"] });
    assert.throws(() => assertLessonBoundary(extraFormat), /only the root active file/u);
  }
  const incomplete = deepClone(original);
  incomplete.overlay[0].conditions = ["customized", "manual-equivalent"];
  assert.equal(incomplete.overlay[0].conditions.includes("baseline"), false);
  assert.throws(() => assertLessonBoundary(incomplete), /identical common materials/u);
  const wrongHash = deepClone(original);
  wrongHash.evidenceRequirements[0].templateSha256 = "0".repeat(64);
  assert.notEqual(wrongHash.evidenceRequirements[0].templateSha256, original.evidenceRequirements[0].templateSha256);
  const evidence = await material("comparison.md.template");
  assert.throws(() => assertEvidenceContract(wrongHash, evidence), /hash must match/u);
});

test("HC-004 independently carries the same fixed source task without a previous HC run", async () => {
  const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));
  assert.deepEqual(validateSourceInventory(inventory), []);
  for (const source of sourcePaths) assert.ok(inventory.paths.includes(source), source);
  const page = await readFile(path.join(directory, "README.md"), "utf8");
  assert.deepEqual([...page.matchAll(/^## (.+)$/gmu)].map((match) => match[1]), REQUIRED_CHALLENGE_HEADINGS);
  assert.deepEqual(validateChallengePageText(id, page), []);
  assertVisibleSources(page);
  assertCompatibleScope(page);
  assert.deepEqual(await validatePublishedPages({ challenges: [challenge] }), []);
  const request = await material("request.txt.template");
  const displayed = page.match(/```text\r?\n([\s\S]*?)```/u);
  assert.ok(displayed, "the full request must be present in the standalone page");
  assert.equal(displayed[1].replace(/\r\n/gu, "\n"), request.toString("utf8"));
  assert.ok(request.toString().includes(inventory.commit));
  for (const source of sourcePaths) assert.ok(request.toString().includes(source));
  assert.match(request.toString(), /実データ・認証情報/u);
  for (const name of ["brief.md.template", "request.txt.template"]) {
    assert.deepEqual(await material(name), await readFile(path.join(REPOSITORY_ROOT, "challenges", "hc-003", "pack", "payload", name)));
  }
  const starter = await material("CLAUDE.md.template");
  assert.match(starter.toString(), /未完成/u);
  assert.deepEqual(starter, await readFile(path.join(REPOSITORY_ROOT, "challenges", "hc-003", "pack", "payload", "AGENTS.md.template")));
  const hiddenSource = page.replace(`\`${sourcePaths[0]}\``, "`source omitted`");
  assert.notEqual(hiddenSource, page);
  assert.throws(() => assertVisibleSources(hiddenSource), /source path must be visible/u);
  const misleading = page.replace("Claudeモデルや別harnessへ切り替わりません", "Claudeモデルへ切り替わります");
  assert.ok(misleading.includes("Claudeモデルへ切り替わります"));
  assert.throws(() => assertCompatibleScope(misleading), /not a model or harness switch/u);
  const overwrite = page.replace("コピー先が既に存在する場合は、コピーを中止します", "コピー先が既に存在する場合は、上書きします");
  assert.ok(overwrite.includes("コピー先が既に存在する場合は、上書きします"));
  assert.notEqual(overwrite, page);
  assert.throws(() => assertCompatibleScope(overwrite), /copies must stop if the destination exists/u);
});

test("HC-004 README Pack command supplies the validated POSIX output argument", async () => {
  const page = await readFile(path.join(directory, "README.md"), "utf8");
  const commands = [...page.matchAll(/^node scripts\\build-pack\.mjs --challenge (HC-\d{3}) --output (\S+)\r?$/gmu)];
  assert.equal(commands.length, 1, "one explicit Pack build command");
  assert.equal(commands[0][1], id);
  const argument = commands[0][2];
  assert.equal(argument, ".runtime/packs");
  assert.doesNotThrow(() => validatePackOutputArgument(argument));
  const windowsArgument = argument.replace("/", "\\");
  assert.equal(windowsArgument, ".runtime\\packs", "mutation must produce the rejected Windows spelling");
  assert.throws(() => validatePackOutputArgument(windowsArgument),
    /--output must be the dedicated repository-relative path \.runtime\/packs/u);
});

test("HC-004 optional local and Rules guide stays inert, uses a paths array and reports unchecked readiness", async () => {
  assert.deepEqual(validateOptionalRoutes(challenge), []);
  const route = optionalRoutes[0];
  const text = await readFile(path.join(REPOSITORY_ROOT, ...route.page.split("/")), "utf8");
  assert.deepEqual(await validateOptionalRoutePage(challenge, route), []);
  assert.match(text, /https:\/\/code\.visualstudio\.com\/docs\/agent-customization\/custom-instructions/u);
  assert.match(text, /2026-09-15/u);
  assertRulesDraft(text);
  const prose = parseMarkdownProse(text).sections.map(({ body }) => body).join("\n");
  assert.match(prose, /localとRulesは別の実験/u);
  assert.match(prose, /localという名前はGit除外の証明ではありません/u);
  assert.match(prose, /homeの.*変更・削除・退避しません/u);
  assert.match(text, /git check-ignore -v -- CLAUDE\.local\.md/u);
  for (const replacement of [
    'applyTo: ["wholesale-core/src/**/*.java"]',
    'paths: "wholesale-core/src/**/*.java"',
  ]) {
    const malformed = text.replace('paths: ["wholesale-core/src/**/*.java"]', replacement);
    assert.ok(malformed.includes(replacement));
    assert.notEqual(malformed, text);
    assert.throws(() => assertRulesDraft(malformed), /paths as a YAML flow array/u);
  }
  const plan = buildRunPlan({ challenges: [challenge] }, undefined, { challengeId: id, route: route.id });
  assert.equal(plan.mode, "optional-guide");
  assert.equal(plan.liveStatus, "live-unobserved");
  assert.equal(plan.route.required, false);
  assert.deepEqual(plan.runtimeRequirements, route.runtimeRequirements);
  assert.deepEqual(plan.readiness, {
    status: "not-checked", environment: "not-checked", entitlements: "not-checked",
    additionalApprovals: "not-checked", runtimeCapabilities: "not-checked",
  });
  for (const key of ["condition", "filesToInject", "participantChanges", "runStateEvidence", "postCreateSettings"]) {
    assert.equal(Object.hasOwn(plan, key), false, key);
  }
  const hiddenSafety = text.replace(OPTIONAL_SAFETY_NOTICE, `<!-- ${OPTIONAL_SAFETY_NOTICE} -->`);
  assert.notEqual(hiddenSafety, text);
  assertErrorCode(validateOptionalGuideText(challenge, route, hiddenSafety), "OPTIONAL_PAGE_SAFETY");
  const missingReason = text.replace(route.stopReasons[0], "停止理由を省略");
  assert.equal(missingReason.includes(route.stopReasons[0]), false);
  assertErrorCode(validateOptionalGuideText(challenge, route, missingReason), "OPTIONAL_PAGE_METADATA");
  const ready = deepClone(challenge);
  ready.optionalRoutes[0].runtimeRequirements[0].status = "ready";
  assert.equal(ready.optionalRoutes[0].runtimeRequirements[0].status, "ready");
  assertErrorCode(validateOptionalRoutes(ready), "CATALOG_OPTIONAL_RUNTIME");
  const executable = deepClone(challenge);
  executable.optionalRoutes[0].conditions = ["customized"];
  assert.deepEqual(Object.keys(executable.optionalRoutes[0]).filter((key) => !Object.hasOwn(route, key)), ["conditions"]);
  assertErrorCode(validateOptionalRoutes(executable), "CATALOG_OPTIONAL_ROUTE_SHAPE");
});

test("HC-004 published catalog and read-only CLI match the authored core and variants guide", async () => {
  const entry = (await loadCatalog()).challenges.find((item) => item.id === id);
  assert.ok(entry);
  assert.equal(entry.status, "published");
  for (const key of ["sourceKind", "sourcePaths", "optionalRoutes", "challengeVersion", "page", "pack"]) {
    assert.deepEqual(entry[key], challenge[key], key);
  }
  const manifest = await readJson(path.join(pack, "manifest.json"));
  for (const condition of conditions) {
    const result = runCli(REPOSITORY_ROOT, "plan-run.mjs", [
      "--dry-run", "--challenge", id, "--condition", condition, "--team", "test", "--run", `test-${condition}`,
    ]);
    assertCliExit(result, 0);
    const plan = JSON.parse(result.stdout);
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.deepEqual(plan.participantChanges.allowedAdditions,
      manifest.allowedAdditions.filter((addition) => addition.conditions.includes(condition)));
    assert.equal(plan.filesToInject.length, 4);
    assert.deepEqual(plan.runStateEvidence, manifest.evidenceRequirements);
  }
  const route = optionalRoutes[0];
  const result = runCli(REPOSITORY_ROOT, "plan-run.mjs", ["--dry-run", "--challenge", id, "--route", route.id]);
  assertCliExit(result, 0);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.mode, "optional-guide");
  assert.equal(plan.readiness.status, "not-checked");
  assert.deepEqual(plan.runtimeRequirements, route.runtimeRequirements);
  const mixed = runCli(REPOSITORY_ROOT, "plan-run.mjs", [
    "--dry-run", "--challenge", id, "--route", route.id, "--condition", "baseline",
  ]);
  assertCliExit(mixed, 1);
  assert.equal(mixed.stdout, "");
  assert.match(mixed.stderr, /cannot be combined with --condition/u);
});
