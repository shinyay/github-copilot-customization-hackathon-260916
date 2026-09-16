import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCatalog } from "../scripts/lib/catalog.mjs";
import { readJson, REPOSITORY_ROOT, sha256, stableJson, writeText } from "../scripts/lib/fs-utils.mjs";
import { validateChallengePageText } from "../scripts/lib/pages.mjs";
import { validatePackDirectory, validatePackManifest } from "../scripts/lib/packs.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

const root = path.join(REPOSITORY_ROOT, "challenges", "hc-008");
const pack = path.join(root, "pack");
const conditions = ["baseline", "subagents", "manual-conversations"];
const packetPaths = {
  web: [
    "wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java",
    "wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java",
    "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
  ],
  batch: [
    "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderCsv.java",
    "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
    "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
  ],
};
const additions = ["design.md", "returns.md", "synthesis.md"].map((name) => `participant/hc-008/${name}`);

test("HC-008 delivers the same inert full input in all three conditions without active customization", async () => {
  const { errors, manifest, files } = await validatePackDirectory(pack, "HC-008");
  assert.deepEqual(errors, []);
  assert.deepEqual(manifest.conditions, conditions);
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(manifest.allowedAdditions.map(({ pattern }) => pattern), additions);
  assert.equal(manifest.isolation.conditionStrategy, "separate-repository");
  assert.equal(manifest.isolation.branchSafe, false);
  for (const key of ["freshRepository", "freshWorkspace", "freshConversation", "freshProfile"]) {
    assert.equal(manifest.isolation[key], true);
  }
  for (const entry of [...manifest.overlay, ...manifest.allowedAdditions]) {
    assert.deepEqual(entry.conditions, conditions);
  }
  const shared = manifest.overlay.map(({ source, destination }) => ({ source, destination }));
  for (const condition of conditions) {
    assert.deepEqual(
      manifest.overlay.filter((entry) => entry.conditions.includes(condition))
        .map(({ source, destination }) => ({ source, destination })),
      shared,
    );
  }
  assert.equal(shared.length, 7);
  assert.ok(files.every((file) => file === "manifest.json" || file.endsWith(".template")));
  assert.ok(manifest.overlay.every(({ destination, allowOverwrite }) =>
    destination.startsWith(".hackathon/challenge/hc-008/") && allowOverwrite === false));
  assert.deepEqual(manifest.submissionFiles.map(({ pattern }) => pattern), [
    ...additions, ".hackathon/evidence/hc-008/comparison.md",
  ]);
});

test("HC-008 independent packets use exactly the six inventoried source paths without business-answer mappings", async () => {
  const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));
  const sourcePaths = Object.values(packetPaths).flat();
  assert.equal(new Set(sourcePaths).size, 6);
  const catalog = await loadCatalog();
  const challenge = catalog.challenges.find(({ id }) => id === "HC-008");
  assert.equal(challenge.sourceKind, "baseline");
  assert.deepEqual(challenge.sourcePaths, sourcePaths);
  assert.deepEqual(challenge.optionalRoutes, []);
  for (const [name, expected] of Object.entries(packetPaths)) {
    const contents = await readFile(path.join(pack, "payload", "packets", `${name}-entry.md.template`), "utf8");
    assert.deepEqual([...contents.matchAll(/^- (wholesale-\S+\.java)$/gmu)].map((match) => match[1]), expected);
    for (const sourcePath of expected) assert.ok(inventory.paths.includes(sourcePath), sourcePath);
    assert.match(contents, /398d7d1982a1402bcdba00d6c3ded67d8d338787/u);
    assert.match(contents, /最大5項目/u);
    for (const word of ["観測", "パス・シンボル・行範囲", "限界", "unknown", "チャットにのみ"]) {
      assert.ok(contents.includes(word), `${name}: ${word}`);
    }
    assert.match(contents, /再委任・入れ子・再試行ループ/u);
    assert.match(contents, /DB・サーバー・ビルド・テスト・シェル・無許可ネットワーク/u);
    assert.doesNotMatch(contents, /cases\.json|normal-candidate|expectedClassification|answerKey/u);
  }
});

test("HC-008 explains actual invocation, manual transport, control limitations and a standalone safe workflow", async () => {
  const page = await readFile(path.join(root, "README.md"), "utf8");
  assert.deepEqual(validateChallengePageText("HC-008", page), []);
  for (const sourcePath of Object.values(packetPaths).flat()) assert.ok(page.includes(sourcePath));
  for (const word of [
    "agent/runSubagent", "stateless", "この教材の上限", "capability-off", "指示ベースの対照",
    "各1回", "第三の新規統合会話", "子が未起動", "本文投入", "runtimeBehavior", "educationalEffect",
    "not-observed", "2026-09-15", "人がsourceと照合",
  ]) {
    assert.ok(page.includes(word), word);
  }
  assert.match(page, /見出しは呼出し証拠ではありません/u);
  assert.match(page, /コンテキスト.*隔離|コンテキストが別でも/u);
  assert.match(page, /root READMEのアプリ起動手順はこの課題では使いません/u);
  assert.match(page, /--output \.runtime\/packs/u);
  assert.match(page, /verify-run\.mjs \$Pack --stage submitted/u);
  assert.match(page, /export-submission\.mjs \$Pack/u);
  assert.doesNotMatch(page, /about:blank/u);
  const request = await readFile(path.join(pack, "payload", "request.txt.template"), "utf8");
  for (const condition of conditions) assert.ok(request.includes(`${condition}:`));
  assert.match(request, /両全文/u);
  assert.match(request, /各子に該当packet全文、source baseline、run-id、安全条件、設計、返却契約/u);
  assert.match(request, /モデルを指定・上書きしません/u);
});

test("HC-008 evidence is run-state, submitted-only and pinned to the actual untouched template", async () => {
  const manifest = await readJson(path.join(pack, "manifest.json"));
  assert.equal(manifest.evidenceRequirements.length, 1);
  const requirement = manifest.evidenceRequirements[0];
  assert.equal(requirement.stage, "submitted");
  assert.deepEqual(requirement.conditions, conditions);
  assert.equal(requirement.path, ".hackathon/evidence/hc-008/comparison.md");
  const bytes = await readFile(path.join(pack, "payload", "comparison.md.template"));
  assert.equal(requirement.templateSha256, sha256(bytes));
  assert.deepEqual(
    [...bytes.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    requirement.requiredHeadings,
  );
  assert.ok(manifest.allowedAdditions.every(({ pattern }) => !pattern.startsWith(".hackathon/")));
});

test("HC-008 guard mutations fail for intended reasons and an evidence-byte mutation is restored", async (t) => {
  const manifest = await readJson(path.join(pack, "manifest.json"));
  const activeBaseline = structuredClone(manifest);
  activeBaseline.allowedAdditions.push({ pattern: "AGENTS.md", conditions: ["baseline"] });
  assert.deepEqual(activeBaseline.allowedAdditions.at(-1), { pattern: "AGENTS.md", conditions: ["baseline"] });
  assertErrorCode(validatePackManifest(activeBaseline, "HC-008"), "PACK_BASELINE_ACTIVE_CUSTOMIZATION");
  const evidenceAsAddition = structuredClone(manifest);
  evidenceAsAddition.allowedAdditions.push({ pattern: manifest.evidenceRequirements[0].path, conditions });
  assert.equal(evidenceAsAddition.allowedAdditions.at(-1).pattern, ".hackathon/evidence/hc-008/comparison.md");
  assertErrorCode(validatePackManifest(evidenceAsAddition, "HC-008"), "PACK_ADDITION_RESERVED_PATH");
  const unsafeBranch = structuredClone(manifest);
  unsafeBranch.isolation.branchSafe = true;
  assert.equal(unsafeBranch.isolation.branchSafe, true);
  assertErrorCode(validatePackManifest(unsafeBranch, "HC-008"), "PACK_BRANCH_SAFETY");

  const directory = await mkdtemp(path.join(os.tmpdir(), "hc008-evidence-"));
  t.after(() => rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  await cp(pack, directory, { recursive: true });
  const target = path.join(directory, "payload", "comparison.md.template");
  const original = await readFile(target, "utf8");
  const changed = original.replace(/^## Outcome$/mu, "## Missing outcome");
  assert.match(changed, /^## Missing outcome$/mu);
  assert.doesNotMatch(changed, /^## Outcome$/mu);
  await writeText(target, changed);
  assertErrorCode((await validatePackDirectory(directory, "HC-008")).errors, "PACK_EVIDENCE_TEMPLATE_HASH");
  await writeText(target, original);
  assert.deepEqual((await validatePackDirectory(directory, "HC-008")).errors, []);

  const mutated = structuredClone(manifest);
  mutated.evidenceRequirements[0].stage = "in-progress";
  assert.equal(mutated.evidenceRequirements[0].stage, "in-progress");
  await writeText(path.join(directory, "manifest.json"), stableJson(mutated));
  assertErrorCode((await validatePackDirectory(directory, "HC-008")).errors, "PACK_EVIDENCE_STAGE");
  await writeText(path.join(directory, "manifest.json"), stableJson(manifest));
  assert.deepEqual((await validatePackDirectory(directory, "HC-008")).errors, []);
});
