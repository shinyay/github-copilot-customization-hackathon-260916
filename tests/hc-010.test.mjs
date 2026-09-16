import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync,
  readFileSync, readdirSync, realpathSync, rmSync, writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import test, { after } from "node:test";
import { pathToFileURL } from "node:url";
import { loadCatalog, validateCatalog } from "../scripts/lib/catalog.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../scripts/lib/constants.mjs";
import { isContainedBy, readJson, REPOSITORY_ROOT, sha256, stableJson } from "../scripts/lib/fs-utils.mjs";
import { matchesContractGlob } from "../scripts/lib/glob.mjs";
import { parseMarkdownProse } from "../scripts/lib/markdown.mjs";
import {
  OPTIONAL_GUIDE_HEADINGS, optionalRuntimeStatus, validateOptionalRoutes,
} from "../scripts/lib/optional-routes.mjs";
import {
  validateChallengePageText, validateOptionalGuideText,
  validateOptionalRoutePage, validatePublishedPages,
} from "../scripts/lib/pages.mjs";
import { validatePackDirectory, validatePackManifest, validatePublishedPacks } from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

const root = path.join(REPOSITORY_ROOT, "challenges", "hc-010");
const pack = path.join(root, "pack");
const payload = path.join(pack, "payload");
const conditions = ["baseline", "notification-design"];
const sourcePath = "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java";
const helperHashes = {
  "checker.mjs": "dd2e6ecee395c907a73202bae6b9104d5d12f98a0b4378d42ec806b4f0e33875",
  "hook-io.mjs": "dd149a110b33e555f81347c2860548f79df24731e71b132dfbdc8ecec7df3642",
  "stop-notify.mjs": "fd46c9e1ab6d06694f882109fb0483eeafef1ba1620b9ea2b3fa287c2a5d1fdd",
};
const additions = [
  { pattern: "participant/hc-010/design.md", conditions },
  { pattern: "participant/hc-010/manual-checklist.md", conditions: ["baseline"] },
  { pattern: "participant/hc-010/notification-policy.md", conditions: ["notification-design"] },
  { pattern: "participant/hc-010/stop-output.json.template", conditions: ["notification-design"] },
  { pattern: "participant/hc-010/stop-hook.json.template", conditions: ["notification-design"] },
];
const evidenceHeadings = {
  "comparison.md": ["Fixed task", "Environment", "Design", "Observations", "Comparison", "Outcome"],
  "recovery.md": ["Case", "Expected boundary", "Observed result", "Restoration", "Non-claims"],
  "notifications.md": ["Case coverage", "Manual checker", "Stop adapter", "Proposed message", "Non-claims"],
};
const manifest = await readJson(path.join(pack, "manifest.json"));
const catalog = structuredClone(await loadCatalog());
const challengeIndex = catalog.challenges.findIndex(({ id }) => id === "HC-010");
assert.ok(challengeIndex >= 0);
if (process.env.HC010_CATALOG_FIXTURE) {
  const entry = await readJson(path.resolve(process.env.HC010_CATALOG_FIXTURE));
  for (const field of ["id", "track", "sourceLab"]) {
    assert.deepEqual(entry[field], catalog.challenges[challengeIndex][field]);
  }
  catalog.challenges[challengeIndex] = entry;
}
const challenge = catalog.challenges[challengeIndex];
const bytes = (name) => readFileSync(path.join(payload, ...name.split("/")));
const originalDraft = bytes("draft-a.md.template");
const otherDraft = bytes("draft-b.md.template");
const activeBytes = bytes("active.json.template");
const stopInput = { hook_event_name: "Stop", stop_hook_active: false };
const scratchParent = realpathSync(os.tmpdir());
const repositoryRoot = realpathSync(REPOSITORY_ROOT);
assert.notEqual(scratchParent, repositoryRoot, "scratch must stay outside the repository");
assert.equal(isContainedBy(repositoryRoot, scratchParent), false, "scratch must stay outside the repository");
const scratch = mkdtempSync(path.join(scratchParent, "hc-010-"));
after(() => {
  assert.equal(path.dirname(scratch), scratchParent);
  assert.ok(path.basename(scratch).startsWith("hc-010-"));
  assert.ok(lstatSync(scratch).isDirectory() && !lstatSync(scratch).isSymbolicLink());
  rmSync(scratch, { recursive: true, force: false, maxRetries: 3, retryDelay: 100 });
});
let sequence = 0;

function workspace({ active = activeBytes, draft = originalDraft, runId = "run-01" } = {}) {
  const cwd = path.join(scratch, `case ${++sequence}`);
  const lab = path.join(cwd, ".runtime", "independent-labs", "lab-10");
  const tools = path.join(lab, "tools");
  mkdirSync(tools, { recursive: true });
  for (const [name, expectedHash] of Object.entries(helperHashes)) {
    const destination = path.join(tools, name);
    copyFileSync(path.join(payload, "tools", `${name}.template`), destination);
    assert.equal(sha256(readFileSync(destination)), expectedHash);
  }
  const selectorPath = path.join(lab, "active.json");
  if (active !== null) writeFileSync(selectorPath, active);
  const draftPath = path.join(lab, runId, "draft.md");
  if (draft !== null) {
    mkdirSync(path.dirname(draftPath));
    writeFileSync(draftPath, draft);
  }
  return { cwd, lab, tools, selectorPath, draftPath };
}

const libraryFixture = workspace();
const originalChecker = await import(pathToFileURL(path.join(libraryFixture.tools, "checker.mjs")).href);
const originalAdapter = await import(pathToFileURL(path.join(libraryFixture.tools, "stop-notify.mjs")).href);
const originalIo = await import(pathToFileURL(path.join(libraryFixture.tools, "hook-io.mjs")).href);

function snapshot(directory) {
  return readdirSync(directory).sort().flatMap((name) => {
    const target = path.join(directory, name);
    const stat = lstatSync(target);
    assert.equal(stat.isSymbolicLink(), false);
    return stat.isDirectory()
      ? [[target, "directory"], ...snapshot(target)]
      : [[target, sha256(readFileSync(target))]];
  });
}

function assertProcess(result) {
  assert.equal(result.error, undefined, "actual child must start and complete");
  assert.equal(result.signal, null);
  assert.ok(Number.isInteger(result.status), "null or non-integer status is not a result");
  assert.equal(result.stderr, "");
}

function execute(fixture, script, input, args = []) {
  const before = snapshot(fixture.cwd);
  const result = spawnSync(process.execPath, [path.join(fixture.tools, script), ...args], {
    cwd: fixture.cwd, input, shell: false, windowsHide: true,
    timeout: 15000, maxBuffer: 1024 * 1024, encoding: "utf8",
  });
  assertProcess(result);
  assert.deepEqual(snapshot(fixture.cwd), before, "helper must not change any fixture bytes");
  assert.equal(result.stdout.trim().split("\n").length, 1);
  return { status: result.status, output: JSON.parse(result.stdout), processResult: result };
}

function expectChecker(fixture, result, code, status, missingHeadings = [], args = []) {
  const observed = execute(fixture, "checker.mjs", undefined, args);
  assert.equal(observed.status, status);
  assert.deepEqual(observed.output, {
    protocolVersion: 1, lab: "LAB-10", result, code, missingHeadings,
  });
  return observed;
}

function expectStop(fixture, result, code, input = stopInput, args = []) {
  const raw = typeof input === "string" || Buffer.isBuffer(input) ? input : JSON.stringify(input);
  const observed = execute(fixture, "stop-notify.mjs", raw, args);
  assert.equal(observed.status, 0, "adapter exit is notification status, never checker pass");
  assert.deepEqual(Object.keys(observed.output).sort(), ["continue", "systemMessage"]);
  assert.equal(observed.output.continue, true);
  const reported = /^\[LAB-10\] ([a-z]+): ([A-Z][A-Z0-9_]*)\./u.exec(observed.output.systemMessage);
  assert.ok(reported, observed.output.systemMessage);
  assert.deepEqual(reported.slice(1), [result, code]);
  return observed;
}

function draftMutation(name, mutate, postImage, code, missing = [], withAdapter = false) {
  test(name, () => {
    const fixture = workspace();
    const before = snapshot(fixture.cwd);
    const original = readFileSync(fixture.draftPath);
    expectChecker(fixture, "pass", "OK", 0);
    if (withAdapter) expectStop(fixture, "pass", "OK");
    const changed = Buffer.from(mutate(original.toString("utf8")));
    assert.notDeepEqual(changed, original);
    writeFileSync(fixture.draftPath, changed);
    const actual = readFileSync(fixture.draftPath);
    assert.deepEqual(actual, changed);
    postImage(actual.toString("utf8"));
    expectChecker(fixture, "invalid", code, 1, missing);
    if (withAdapter) {
      expectStop(fixture, "invalid", code);
      expectStop(fixture, "invalid", code);
      assert.deepEqual(readFileSync(fixture.draftPath), changed, "notification must not repair a draft");
    }
    writeFileSync(fixture.draftPath, original);
    assert.deepEqual(readFileSync(fixture.draftPath), original);
    assert.deepEqual(snapshot(fixture.cwd), before);
    expectChecker(fixture, "pass", "OK", 0);
    if (withAdapter) expectStop(fixture, "pass", "OK");
  });
}

function selectorMutation(name, mutate, inspect, expectedCode = "ACTIVE_TARGET_INVALID") {
  test(name, () => {
    const fixture = workspace();
    const original = readFileSync(fixture.selectorPath);
    const before = snapshot(fixture.cwd);
    expectChecker(fixture, "pass", "OK", 0);
    const next = Buffer.from(mutate(original.toString("utf8")));
    assert.notDeepEqual(next, original);
    writeFileSync(fixture.selectorPath, next);
    assert.deepEqual(readFileSync(fixture.selectorPath), next);
    inspect(next.toString("utf8"));
    expectChecker(fixture, "uncheckable", expectedCode, 2);
    expectStop(fixture, "uncheckable", expectedCode);
    writeFileSync(fixture.selectorPath, original);
    assert.deepEqual(readFileSync(fixture.selectorPath), original);
    assert.deepEqual(snapshot(fixture.cwd), before);
    expectChecker(fixture, "pass", "OK", 0);
  });
}

test("HC-010 catalog identity and pinned source remain valid, including standalone publication fixtures", async (t) => {
  assert.equal(challenge.status, "published", "use HC010_CATALOG_FIXTURE only while parent integration is pending");
  assert.equal(challenge.title, "Agentの終了時に検査結果を通知しよう");
  assert.equal(challenge.track, "hooks");
  assert.deepEqual(challenge.sourceLab, {
    ids: ["LAB-10"], repository: "shinyay/github-copilot-customization-labs",
    pages: ["docs/labs/lab-10-hooks.md"],
  });
  assert.equal(challenge.sourceKind, "baseline");
  assert.deepEqual(challenge.sourcePaths, [sourcePath]);
  assert.equal(challenge.challengeVersion, 1);
  assert.equal(challenge.pack, "challenges/hc-010/pack");
  assert.deepEqual(validateCatalog(catalog), []);
  const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));
  assert.ok(inventory.paths.includes(sourcePath));
  if (process.env.HC010_CATALOG_FIXTURE) t.diagnostic("Session catalog fixture used; no common catalog file was changed.");
});

test("HC-010 pack grants exactly 2+4 inert participant placements and 3 separate run-state evidence files", async () => {
  const result = await validatePackDirectory(pack, "HC-010");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(await validatePublishedPacks({ challenges: [challenge] }), []);
  for (const field of ["schemaVersion", "challengeVersion", "minimumTemplateVersion"]) {
    assert.equal(manifest[field], 1);
  }
  assert.deepEqual(manifest.conditions, conditions);
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(manifest.forbiddenActiveCustomizations, []);
  assert.deepEqual(manifest.allowedAdditions, additions);
  assert.deepEqual(manifest.isolation, {
    tier: "repository", freshWorkspace: true, freshConversation: true,
    freshProfile: true, freshRepository: true, conditionStrategy: "separate-repository", branchSafe: false,
  });
  assert.equal(manifest.overlay.length, 21);
  assert.equal(result.files.length, 22);
  const expectedSources = result.files.filter((file) => file.startsWith("payload/")).sort();
  assert.deepEqual(manifest.overlay.map(({ source }) => source).sort(), expectedSources);
  for (const entry of manifest.overlay) {
    assert.deepEqual(entry.conditions, conditions);
    assert.equal(entry.allowOverwrite, false);
    assert.equal(entry.destination, `.hackathon/challenge/hc-010/${entry.source.slice("payload/".length)}`);
    assert.ok(entry.source.endsWith(".template") && entry.destination.endsWith(".template"));
  }
  assert.ok(result.files.every((file) => file === "manifest.json" || file.endsWith(".template")));
  assert.deepEqual(manifest.submissionFiles, [
    ...additions,
    ...Object.keys(evidenceHeadings).map((name) => ({ pattern: `.hackathon/evidence/hc-010/${name}`, conditions })),
  ]);
});

test("HC-010 real run-plan/glob helpers expose the same packet and deny other-condition or active paths", () => {
  const plans = conditions.map((condition) => buildRunPlan(catalog, manifest, {
    challengeId: "HC-010", condition, team: "qa-fixture", runId: `hc010-${condition}-01`,
  }));
  assert.deepEqual(plans[0].filesToInject, plans[1].filesToInject);
  assert.equal(plans[0].filesToInject.length, 21);
  for (const [index, plan] of plans.entries()) {
    const grant = (candidate) => plan.participantChanges.allowedAdditions
      .some(({ pattern }) => matchesContractGlob(pattern, candidate));
    const eligible = additions.filter(({ conditions: applicable }) => applicable.includes(conditions[index]));
    assert.deepEqual(plan.participantChanges.allowedAdditions, eligible);
    assert.equal(eligible.length, index === 0 ? 2 : 4);
    assert.equal(plan.participantChanges.activeCustomizationsDefault, "deny");
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.equal(plan.runStateEvidence.length, 3);
    for (const entry of eligible) assert.equal(grant(entry.pattern), true);
    const nonEligible = additions.filter(({ conditions: applicable }) => !applicable.includes(conditions[index]));
    for (const entry of nonEligible) assert.equal(grant(entry.pattern), false);
    for (const candidate of [
      ".github/hooks/stop.json", ".runtime/independent-labs/lab-10/active.json", ".vscode/settings.json",
      "AGENTS.md", sourcePath, ".hackathon/evidence/hc-010/comparison.md",
      "participant/hc-010/stop-hook.json", "participant/hc-010/extra.md", "participant/hc-012/design.md",
    ]) assert.equal(grant(candidate), false, candidate);
  }
});

test("HC-010 all committed material is UTF-8 with LF and one final LF, with no active helper files", () => {
  function inspect(directory) {
    for (const name of readdirSync(directory)) {
      const file = path.join(directory, name);
      const stat = lstatSync(file);
      assert.equal(stat.isSymbolicLink(), false);
      if (stat.isDirectory()) inspect(file);
      else {
        const content = readFileSync(file);
        assert.equal(content.includes(13), false, file);
        assert.equal(content.at(-1), 10, file);
        assert.notEqual(content.at(-2), 10, file);
        assert.deepEqual(Buffer.from(new TextDecoder("utf-8", { fatal: true }).decode(content)), content);
        assert.ok(file.endsWith(".md") || file.endsWith(".template") || file === path.join(pack, "manifest.json"), file);
      }
    }
  }
  inspect(root);
});

test("HC-010 provenance records exact original helpers and every non-recursive payload digest without a semantic answer", () => {
  const ledger = JSON.parse(bytes("source-materials.json.template"));
  assert.equal(ledger.labs.commit, "3474d21dd62bad2e594e84657dabe2eb9bb876c1");
  assert.equal(ledger.sourceBaseline.commit, "398d7d1982a1402bcdba00d6c3ded67d8d338787");
  assert.equal(ledger.sourceBaseline.path, sourcePath);
  assert.equal(ledger.sourceBaseline.sha256, "647a016546879a67680973676c751668cdb39d84569df26d65cf543c67ef5f15");
  const sources = manifest.overlay.map(({ source }) => source)
    .filter((source) => source !== "payload/source-materials.json.template").sort();
  assert.deepEqual(ledger.payloads.map(({ source }) => source).sort(), sources);
  assert.equal(new Set(ledger.originals.map(({ path: file }) => file)).size, ledger.originals.length);
  for (const record of ledger.payloads) {
    const original = readFileSync(path.join(pack, ...record.source.split("/")));
    assert.equal(record.bytes, original.length);
    assert.equal(record.sha256, sha256(original));
    assert.ok(record.adaptation.trim().length > 0);
    assert.ok(record.origins.length > 0);
    for (const origin of record.origins) assert.ok(ledger.originals.some(({ path: file }) => file === origin));
  }
  for (const [name, digest] of Object.entries(helperHashes)) {
    assert.equal(sha256(bytes(`tools/${name}.template`)), digest);
    assert.equal(ledger.originals.find(({ path: file }) => file === `examples/hooks/${name}`).sha256, digest);
  }
  assert.match(bytes("tools/checker.mjs.template").toString(), /from '\.\/hook-io\.mjs'/u);
  assert.match(bytes("tools/stop-notify.mjs.template").toString(), /from '\.\/checker\.mjs'/u);
  for (const draft of [originalDraft, otherDraft]) {
    const text = draft.toString("utf8");
    assert.match(text, /SYNTHETIC_TRAINING_ONLY/u);
    assert.ok(text.includes(sourcePath) && text.includes("Money.tax"));
    assert.match(text, /処理内容を説明していません/u);
    assert.doesNotMatch(text, /expectedClassification|answerKey|normal-candidate|instructor-only/iu);
  }
});

test("HC-010 handwritten page is standalone, exactly 13 H2s and separates design, format, event and meaning", async () => {
  const page = readFileSync(path.join(root, "README.md"), "utf8");
  assert.deepEqual(validateChallengePageText("HC-010", page), []);
  assert.deepEqual([...page.matchAll(/^## (.+)$/gmu)].map((match) => match[1]), REQUIRED_CHALLENGE_HEADINGS);
  assert.deepEqual(await validatePublishedPages({ challenges: [challenge] }), []);
  for (const text of [
    sourcePath, "Money.tax", "398d7d1982a1402bcdba00d6c3ded67d8d338787",
    "SYNTHETIC_TRAINING_ONLY", "Baseline", "Customized", "continue: true", "stop_hook_active: true",
    "UNEXPECTED_ARGUMENTS", "プロセスcwd", "草稿内run markerはありません", "checker起動前にskipped",
    "fixture-only", "not-observed", "unsupported", "incomparable", "blocked",
    "equal", "worse", "追加カスタマイズ不要", "runtimeBehavior", "educationalEffect",
    "Challenge-specific design", "--output .runtime/packs", "--stage in-progress",
    "--stage submitted", "export-submission.mjs $Pack", "原本の", "許可外",
  ]) assert.ok(page.includes(text), text);
  assert.match(page, /Stopは今のAgentの応答が止まる時/u);
  assert.match(page, /セッションや会話、ウィンドウを閉じる時ではありません/u);
  assert.match(page, /自動修正、新しいAIターンの要求、合格までの反復・ループは行いません/u);
  assert.match(page, /自分の説明を支持する行/u);
  assert.match(page, /提案文面/u);
  assert.match(page, /配布adapterがその日本語を返したという観測ではありません/u);
  for (const text of [
    "2026-09-15", "hooks-reference#_stop", "概要のイベント表の略記ではなく",
    "current agent execution stops", "セッションの停止や非アクティブ化を示すものではありません",
    "既定でtrue", "falseはセッションを停止", 'decision: "block"', "追加ターンにつながる",
    "Web表示からJSONの入れ子を推測せず", "構文は同梱の原本テンプレート",
  ]) assert.ok(page.includes(text), text);
  assert.doesNotMatch(page, /Copy-Item[^\n]*\.runtime\\independent-labs/u);
  const request = bytes("request.txt.template").toString("utf8");
  for (const condition of conditions) assert.ok(request.includes(`${condition}:`));
  assert.match(request, /同じ全5case/u);
  assert.match(request, /固定版のMoney\.java全文を実際に読み/u);
});

test("HC-010 has exactly one six-section guide with literal prerequisites, non-claims and not-checked capabilities", async () => {
  assert.equal(challenge.optionalRoutes.length, 1);
  const route = challenge.optionalRoutes[0];
  assert.equal(route.id, "stop-preview");
  assert.equal(route.page, "challenges/hc-010/optional/stop-preview.md");
  assert.equal(route.required, false);
  assert.equal(route.liveStatus, "live-unobserved");
  assert.deepEqual(route.runtimeRequirements.map(({ capability, status }) => ({ capability, status })), [
    { capability: "live-stop-event", status: "not-checked" },
    { capability: "isolated-hook-state", status: "not-checked" },
  ]);
  assert.ok(route.runtimeRequirements.every(({ reason }) => reason.trim().length > 0));
  assert.deepEqual(readdirSync(path.join(root, "optional")), ["stop-preview.md"]);
  assert.deepEqual(validateOptionalRoutes(challenge), []);
  const page = readFileSync(path.join(root, "optional", "stop-preview.md"), "utf8");
  for (const text of [
    "2026-09-15", "hooks-reference#_stop", "概要のイベント表の略記ではなく",
    "current agent execution stops", "非アクティブ化", "再確認した資料でもHooksはPreview",
    "文書確認や合成stdinテスト", 'decision: "block"', "原本テンプレート",
  ]) assert.ok(page.includes(text), text);
  assert.deepEqual(parseMarkdownProse(page).sections.map(({ title }) => title), OPTIONAL_GUIDE_HEADINGS);
  assert.deepEqual(validateOptionalGuideText(challenge, route, page), []);
  assert.deepEqual(await validateOptionalRoutePage(challenge, route), []);
  const plan = buildRunPlan(catalog, null, { challengeId: "HC-010", route: "stop-preview" });
  assert.equal(plan.mode, "optional-guide");
  assert.equal(plan.readiness.status, "not-checked");
  assert.equal(plan.readiness.additionalApprovals, "not-checked");
  assert.equal(plan.liveStatus, "live-unobserved");
  for (const key of ["condition", "filesToInject", "participantChanges", "runStateEvidence"]) {
    assert.equal(Object.hasOwn(plan, key), false);
  }
});

test("HC-010 guide mutations reject missing metadata, missing reciprocal links and executable route fields then restore", async () => {
  const route = challenge.optionalRoutes[0];
  const page = readFileSync(path.join(root, "optional", "stop-preview.md"), "utf8");
  assert.deepEqual(validateOptionalGuideText(challenge, route, page), []);
  const sentence = route.prerequisites.environment[0];
  let changed = page.replace(sentence, "この項目は削除された。");
  assert.notEqual(changed, page);
  assert.equal(changed.includes(sentence), false);
  assertErrorCode(validateOptionalGuideText(challenge, route, changed), "OPTIONAL_PAGE_METADATA");
  changed = page;
  assert.deepEqual(Buffer.from(changed), Buffer.from(page));
  assert.deepEqual(validateOptionalGuideText(challenge, route, changed), []);
  const core = readFileSync(path.join(root, "README.md"), "utf8");
  let unlinked = core.replace("[Stop Previewの準備確認ガイド](optional/stop-preview.md)", "準備確認ガイド");
  assert.equal(parseMarkdownProse(unlinked).links.includes("optional/stop-preview.md"), false);
  assertErrorCode(await validateOptionalRoutePage(challenge, route, unlinked), "OPTIONAL_PAGE_UNLINKED");
  unlinked = core;
  assert.deepEqual(Buffer.from(unlinked), Buffer.from(core));
  assert.deepEqual(await validateOptionalRoutePage(challenge, route, unlinked), []);
  const original = stableJson(challenge);
  let executable = JSON.parse(original);
  executable.optionalRoutes[0].conditions = ["notification-design"];
  assert.deepEqual(executable.optionalRoutes[0].conditions, ["notification-design"]);
  assertErrorCode(validateOptionalRoutes(executable), "CATALOG_OPTIONAL_ROUTE_SHAPE");
  executable = JSON.parse(original);
  assert.equal(stableJson(executable), original);
  assert.deepEqual(validateOptionalRoutes(executable), []);
});

test("HC-010 optional readiness aggregates a single blocked requirement without granting core execution", () => {
  const original = stableJson(challenge);
  const changed = JSON.parse(original);
  changed.optionalRoutes[0].runtimeRequirements[1].status = "blocked";
  assert.deepEqual(changed.optionalRoutes[0].runtimeRequirements.map(({ status }) => status), ["not-checked", "blocked"]);
  assert.deepEqual(validateOptionalRoutes(changed), []);
  assert.equal(optionalRuntimeStatus(changed.optionalRoutes[0]), "blocked");
  const local = { challenges: [changed] };
  assert.equal(buildRunPlan(local, null, { challengeId: "HC-010", route: "stop-preview" }).readiness.status, "blocked");
  const restored = JSON.parse(original);
  assert.equal(stableJson(restored), original);
  assert.equal(optionalRuntimeStatus(restored.optionalRoutes[0]), "not-checked");
  assert.throws(
    () => buildRunPlan(catalog, null, { challengeId: "HC-010", route: "stop-preview", condition: "baseline" }),
    { message: "Optional guide route stop-preview cannot be combined with --condition" },
  );
  assert.equal(buildRunPlan(catalog, null, { challengeId: "HC-010", route: "stop-preview" }).mode, "optional-guide");
});

test("HC-010 evidence has exact submitted-only headings and raw template hashes, never participant grants", () => {
  assert.deepEqual(manifest.evidenceRequirements.map(({ path: file }) => file),
    Object.keys(evidenceHeadings).map((name) => `.hackathon/evidence/hc-010/${name}`));
  for (const requirement of manifest.evidenceRequirements) {
    const name = path.posix.basename(requirement.path);
    const content = bytes(`${name}.template`);
    assert.equal(requirement.stage, "submitted");
    assert.deepEqual(requirement.conditions, conditions);
    assert.deepEqual(requirement.requiredHeadings, evidenceHeadings[name]);
    assert.equal(requirement.templateSha256, sha256(content));
    assert.equal(content.at(-1), 10);
    assert.equal(content.includes(13), false);
    assert.deepEqual([...content.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]), evidenceHeadings[name]);
    assert.equal(manifest.allowedAdditions.some(({ pattern }) => matchesContractGlob(pattern, requirement.path)), false);
  }
  assert.equal(new Set(manifest.evidenceRequirements.map(({ templateSha256 }) => templateSha256)).size, 3);
});

test("HC-010 single-factor manifest negatives fail at the real boundary then restore full serialized bytes", async (t) => {
  const original = stableJson(manifest);
  assert.deepEqual(validatePackManifest(manifest, "HC-010"), []);
  const scenarios = [
    ["active baseline", (value) => value.allowedAdditions.push({ pattern: ".github/hooks/stop.json", conditions: ["baseline"] }),
      (value) => assert.equal(value.allowedAdditions.at(-1).pattern, ".github/hooks/stop.json"), "PACK_BASELINE_ACTIVE_CUSTOMIZATION"],
    ["evidence as addition", (value) => value.allowedAdditions.push({ pattern: value.evidenceRequirements[0].path, conditions }),
      (value) => assert.equal(value.allowedAdditions.at(-1).pattern, ".hackathon/evidence/hc-010/comparison.md"), "PACK_ADDITION_RESERVED_PATH"],
    ["overwrite", (value) => { value.overlay[0].allowOverwrite = true; },
      (value) => assert.equal(value.overlay[0].allowOverwrite, true), "PACK_OVERWRITE_DEFAULT_DENY"],
    ["active destination", (value) => { value.overlay[0].destination = ".github/hooks/stop.json"; },
      (value) => assert.equal(value.overlay[0].destination, ".github/hooks/stop.json"), "PACK_INERT_DESTINATION"],
    ["duplicate condition", (value) => value.conditions.push("baseline"),
      (value) => assert.equal(value.conditions.filter((item) => item === "baseline").length, 2), "PACK_CONDITION_DUPLICATE"],
    ["unknown overlay condition", (value) => value.overlay[0].conditions.push("live-stop"),
      (value) => assert.equal(value.overlay[0].conditions.at(-1), "live-stop"), "PACK_CONDITION_UNKNOWN"],
    ["branch handoff", (value) => { value.isolation.branchSafe = true; },
      (value) => assert.equal(value.isolation.branchSafe, true), "PACK_BRANCH_SAFETY"],
    ["premature evidence", (value) => { value.evidenceRequirements[0].stage = "in-progress"; },
      (value) => assert.equal(value.evidenceRequirements[0].stage, "in-progress"), "PACK_EVIDENCE_STAGE"],
  ];
  for (const [name, mutate, inspect, code] of scenarios) {
    await t.test(name, () => {
      let candidate = JSON.parse(original);
      assert.deepEqual(validatePackManifest(candidate, "HC-010"), []);
      mutate(candidate);
      inspect(candidate);
      assert.notEqual(stableJson(candidate), original);
      assertErrorCode(validatePackManifest(candidate, "HC-010"), code);
      candidate = JSON.parse(original);
      assert.equal(stableJson(candidate), original);
      assert.deepEqual(validatePackManifest(candidate, "HC-010"), []);
    });
  }
});

test("HC-010 real pack validation rejects a changed evidence post-image and an active payload, with complete byte restoration", async () => {
  const directory = path.join(scratch, "pack boundary");
  cpSync(pack, directory, { recursive: true });
  const before = snapshot(directory);
  assert.deepEqual((await validatePackDirectory(directory, "HC-010")).errors, []);
  const target = path.join(directory, "payload", "comparison.md.template");
  const original = readFileSync(target);
  const changed = original.toString("utf8").replace(/^## Outcome$/mu, "## Removed outcome");
  assert.match(changed, /^## Removed outcome$/mu);
  assert.doesNotMatch(changed, /^## Outcome$/mu);
  assert.notDeepEqual(Buffer.from(changed), original);
  writeFileSync(target, changed);
  assert.equal(readFileSync(target, "utf8"), changed);
  assertErrorCode((await validatePackDirectory(directory, "HC-010")).errors, "PACK_EVIDENCE_TEMPLATE_HASH");
  writeFileSync(target, original);
  assert.deepEqual(readFileSync(target), original);
  assert.deepEqual(snapshot(directory), before);
  assert.deepEqual((await validatePackDirectory(directory, "HC-010")).errors, []);
  const extra = path.join(directory, "payload", "unexpected.mjs");
  writeFileSync(extra, "export {};\n");
  assert.equal(lstatSync(extra).isFile(), true);
  assert.equal(path.extname(extra), ".mjs");
  assertErrorCode((await validatePackDirectory(directory, "HC-010")).errors, "PACK_ACTIVE_PAYLOAD");
  rmSync(extra);
  assert.equal(existsSync(extra), false);
  assert.deepEqual(snapshot(directory), before);
  assert.deepEqual((await validatePackDirectory(directory, "HC-010")).errors, []);
});

draftMutation(
  "HC-010 original checker: normal -> only Unknowns section missing -> restored, adapter stays exit 0 without fixing",
  (text) => text.replace(/\n\n## Unknowns\n[\s\S]*$/u, "\n"),
  (text) => {
    assert.deepEqual(Buffer.from(text), otherDraft);
    assert.match(text, /^## Evidence$/mu);
    assert.doesNotMatch(text, /^## Unknowns$/mu);
  },
  "MISSING_REQUIRED_HEADING", ["## Unknowns"], true,
);

draftMutation(
  "HC-010 original checker: removing only the Unknowns heading is not a section-body deletion",
  (text) => text.replace(/^## Unknowns\n/mu, ""),
  (text) => {
    assert.doesNotMatch(text, /^## Unknowns$/mu);
    assert.ok(text.includes("この合成メモはsourceの意味を検証していません。"));
    assert.match(text, /^## Evidence$/mu);
  },
  "MISSING_REQUIRED_HEADING", ["## Unknowns"],
);

draftMutation(
  "HC-010 original checker: missing Evidence is independently detected and restored",
  (text) => text.replace(/\n\n## Evidence\n[\s\S]*?(?=\n\n## Unknowns)/u, ""),
  (text) => {
    assert.doesNotMatch(text, /^## Evidence$/mu);
    assert.match(text, /^## Unknowns$/mu);
  },
  "MISSING_REQUIRED_HEADING", ["## Evidence"],
);

draftMutation(
  "HC-010 original checker: duplicated required heading is not accepted",
  (text) => `${text}\n## Unknowns\n合成の追記。\n`,
  (text) => {
    assert.equal([...text.matchAll(/^## Unknowns$/gmu)].length, 2);
    assert.equal([...text.matchAll(/^## Evidence$/gmu)].length, 1);
  },
  "DUPLICATE_REQUIRED_HEADING",
);

for (const fence of ["```", "~~~"]) {
  draftMutation(
    `HC-010 original checker: ${fence} fenced headings do not satisfy the document contract`,
    (text) => `${fence}markdown\n${text}${fence}\n`,
    (text) => {
      assert.equal(text, `${fence}markdown\n${originalDraft.toString("utf8")}${fence}\n`);
      assert.equal(text.startsWith(`${fence}markdown\n`), true);
      assert.equal(text.endsWith(`${fence}\n`), true);
    },
    "MISSING_REQUIRED_HEADING", ["## Evidence", "## Unknowns"],
  );
}

draftMutation(
  "HC-010 original checker: an empty Evidence body is invalid despite both headings",
  (text) => text.replace(/^## Evidence\n[\s\S]*?(?=^## Unknowns\n)/mu, "## Evidence\n\n"),
  (text) => {
    assert.match(text, /^## Evidence\n\n## Unknowns\n/mu);
    assert.equal([...text.matchAll(/^## (?:Evidence|Unknowns)$/gmu)].length, 2);
  },
  "EMPTY_REQUIRED_SECTION",
);

draftMutation(
  "HC-010 original checker: code-fence-only content does not fill an empty required section",
  (text) => text.replace(/^## Evidence\n[\s\S]*?(?=^## Unknowns\n)/mu, "## Evidence\n```text\n構造用の本文。\n```\n\n"),
  (text) => assert.match(text, /^## Evidence\n```text\n構造用の本文。\n```\n\n## Unknowns\n/mu),
  "EMPTY_REQUIRED_SECTION",
);

draftMutation(
  "HC-010 original checker: an unclosed trailing fence is distinct from missing headings",
  (text) => `${text}\n\`\`\`text\n閉じない構造サンプル。\n`,
  (text) => {
    assert.match(text, /^## Evidence$/mu);
    assert.match(text, /^## Unknowns$/mu);
    assert.equal([...text.matchAll(/^```/gmu)].length, 1);
  },
  "UNCLOSED_FENCE",
);

test("HC-010 original checker inspects format, not semantic claims or a hidden source answer", () => {
  const fixture = workspace();
  const original = readFileSync(fixture.draftPath);
  expectChecker(fixture, "pass", "OK", 0);
  const changed = Buffer.from(original.toString("utf8").replace(
    "書式練習として根拠を置く節を用意しました。ここにはMoney.taxの処理内容を説明していません。",
    "この一文は意味の裏付けを持たない合成の主張です。",
  ));
  assert.notDeepEqual(changed, original);
  writeFileSync(fixture.draftPath, changed);
  assert.match(readFileSync(fixture.draftPath, "utf8"), /意味の裏付けを持たない合成の主張/u);
  expectChecker(fixture, "pass", "OK", 0);
  writeFileSync(fixture.draftPath, original);
  assert.deepEqual(readFileSync(fixture.draftPath), original);
  expectChecker(fixture, "pass", "OK", 0);
});

selectorMutation(
  "HC-010 original selector rejects malformed JSON then restores exact bytes",
  (text) => text.trimEnd().slice(0, -1),
  (text) => assert.throws(() => JSON.parse(text), SyntaxError),
);

selectorMutation(
  "HC-010 original selector retains LAB-10 rather than accepting the Hub challenge ID",
  (text) => JSON.stringify({ ...JSON.parse(text), lab: "HC-010" }),
  (text) => assert.deepEqual(JSON.parse(text), { lab: "HC-010", runId: "run-01" }),
);

selectorMutation(
  "HC-010 original selector rejects unknown keys",
  (text) => JSON.stringify({ ...JSON.parse(text), cwd: "." }),
  (text) => assert.deepEqual(Object.keys(JSON.parse(text)).sort(), ["cwd", "lab", "runId"]),
);

selectorMutation(
  "HC-010 original selector rejects path traversal rather than looking outside its owned run",
  (text) => JSON.stringify({ ...JSON.parse(text), runId: "../other" }),
  (text) => assert.equal(JSON.parse(text).runId, "../other"),
);

selectorMutation(
  "HC-010 original selector must match the existing run directory",
  (text) => JSON.stringify({ ...JSON.parse(text), runId: "run-02" }),
  (text) => assert.deepEqual(JSON.parse(text), { lab: "LAB-10", runId: "run-02" }),
  "DRAFT_NOT_FOUND",
);

test("HC-010 original selector accepts a matching letter-prefixed run ID and rejects a digit-prefixed mutation", () => {
  const runId = "b-20260915-000001";
  const fixture = workspace({ active: `${JSON.stringify({ lab: "LAB-10", runId })}\n`, runId });
  const original = readFileSync(fixture.selectorPath);
  expectChecker(fixture, "pass", "OK", 0);
  writeFileSync(fixture.selectorPath, `${JSON.stringify({ lab: "LAB-10", runId: "20260915-000001" })}\n`);
  assert.equal(JSON.parse(readFileSync(fixture.selectorPath)).runId, "20260915-000001");
  assert.equal(path.basename(path.dirname(fixture.draftPath)), runId);
  expectChecker(fixture, "uncheckable", "ACTIVE_TARGET_INVALID", 2);
  writeFileSync(fixture.selectorPath, original);
  assert.deepEqual(readFileSync(fixture.selectorPath), original);
  expectChecker(fixture, "pass", "OK", 0);
});

test("HC-010 original CLI accepts no extra arguments; --run-id is UNEXPECTED_ARGUMENTS/2, not a selector", () => {
  const fixture = workspace();
  const before = snapshot(fixture.cwd);
  expectChecker(fixture, "pass", "OK", 0);
  let args = ["--run-id", "run-01"];
  assert.deepEqual(args, ["--run-id", "run-01"]);
  expectChecker(fixture, "uncheckable", "UNEXPECTED_ARGUMENTS", 2, [], args);
  expectStop(fixture, "uncheckable", "UNEXPECTED_ARGUMENTS", stopInput, args);
  args = [];
  assert.deepEqual(args, []);
  assert.deepEqual(snapshot(fixture.cwd), before);
  expectChecker(fixture, "pass", "OK", 0, [], args);
  expectStop(fixture, "pass", "OK", stopInput, args);
});

test("HC-010 no active selector is skipped/0, not passed; missing draft is uncheckable/2, both restore", () => {
  const fixture = workspace();
  const before = snapshot(fixture.cwd);
  const selector = readFileSync(fixture.selectorPath);
  const draft = readFileSync(fixture.draftPath);
  expectChecker(fixture, "pass", "OK", 0);
  rmSync(fixture.selectorPath);
  assert.equal(existsSync(fixture.selectorPath), false);
  assert.deepEqual(readFileSync(fixture.draftPath), draft);
  expectChecker(fixture, "skipped", "NO_ACTIVE_TARGET", 0);
  expectStop(fixture, "skipped", "NO_ACTIVE_TARGET");
  writeFileSync(fixture.selectorPath, selector);
  assert.deepEqual(snapshot(fixture.cwd), before);
  expectChecker(fixture, "pass", "OK", 0);
  rmSync(fixture.draftPath);
  assert.equal(existsSync(fixture.draftPath), false);
  assert.deepEqual(readFileSync(fixture.selectorPath), selector);
  expectChecker(fixture, "uncheckable", "DRAFT_NOT_FOUND", 2);
  expectStop(fixture, "uncheckable", "DRAFT_NOT_FOUND");
  writeFileSync(fixture.draftPath, draft);
  assert.deepEqual(snapshot(fixture.cwd), before);
  expectChecker(fixture, "pass", "OK", 0);
});

test("HC-010 original checker bounds selector/draft bytes and rejects unsafe file types and UTF-8, then restores", async (t) => {
  const scenarios = [
    ["selector limit", "selectorPath", Buffer.alloc(originalChecker.MAX_ACTIVE_BYTES + 1, 32), "ACTIVE_TARGET_TOO_LARGE"],
    ["draft limit", "draftPath", Buffer.alloc(originalChecker.MAX_DRAFT_BYTES + 1, 32), "DRAFT_TOO_LARGE"],
    ["selector UTF-8", "selectorPath", Buffer.from([0xc3, 0x28]), "FILE_INVALID_UTF8"],
    ["draft UTF-8", "draftPath", Buffer.from([0xc3, 0x28]), "FILE_INVALID_UTF8"],
  ];
  for (const [name, key, changed, code] of scenarios) {
    await t.test(name, () => {
      const fixture = workspace();
      const original = readFileSync(fixture[key]);
      const before = snapshot(fixture.cwd);
      expectChecker(fixture, "pass", "OK", 0);
      writeFileSync(fixture[key], changed);
      assert.deepEqual(readFileSync(fixture[key]), changed);
      assert.notDeepEqual(changed, original);
      if (name.endsWith("limit")) {
        assert.equal(changed.length, (key === "selectorPath" ? originalChecker.MAX_ACTIVE_BYTES : originalChecker.MAX_DRAFT_BYTES) + 1);
      } else {
        assert.throws(() => new TextDecoder("utf-8", { fatal: true }).decode(changed), TypeError);
      }
      expectChecker(fixture, "uncheckable", code, 2);
      writeFileSync(fixture[key], original);
      assert.deepEqual(readFileSync(fixture[key]), original);
      assert.deepEqual(snapshot(fixture.cwd), before);
      expectChecker(fixture, "pass", "OK", 0);
    });
  }
  const fixture = workspace();
  const original = readFileSync(fixture.selectorPath);
  const before = snapshot(fixture.cwd);
  expectChecker(fixture, "pass", "OK", 0);
  rmSync(fixture.selectorPath);
  mkdirSync(fixture.selectorPath);
  assert.equal(lstatSync(fixture.selectorPath).isDirectory(), true);
  expectChecker(fixture, "uncheckable", "UNSAFE_FILE_TYPE", 2);
  rmSync(fixture.selectorPath, { recursive: true });
  writeFileSync(fixture.selectorPath, original);
  assert.deepEqual(snapshot(fixture.cwd), before);
  expectChecker(fixture, "pass", "OK", 0);
});

test("HC-010 adapter uses process cwd, not the Hook input cwd; independent copies retain identical helpers", () => {
  const first = workspace();
  const second = workspace({ draft: otherDraft });
  const firstBefore = snapshot(first.cwd);
  const secondBefore = snapshot(second.cwd);
  expectChecker(first, "pass", "OK", 0);
  expectChecker(second, "invalid", "MISSING_REQUIRED_HEADING", 1, ["## Unknowns"]);
  for (const name of Object.keys(helperHashes)) {
    assert.deepEqual(readFileSync(path.join(first.tools, name)), readFileSync(path.join(second.tools, name)));
  }
  const original = JSON.stringify(stopInput);
  let input = { ...stopInput, cwd: first.cwd };
  assert.equal(input.cwd, first.cwd);
  expectStop(second, "invalid", "MISSING_REQUIRED_HEADING", input);
  input = { ...stopInput, cwd: second.cwd };
  assert.equal(input.cwd, second.cwd);
  expectStop(first, "pass", "OK", input);
  input = JSON.parse(original);
  assert.equal(JSON.stringify(input), original);
  expectStop(first, "pass", "OK", input);
  assert.deepEqual(snapshot(first.cwd), firstBefore);
  assert.deepEqual(snapshot(second.cwd), secondBefore);
});

test("HC-010 reentry skips before invoking the exact checker and cannot start an auto-fix or new turn", () => {
  const fixture = workspace();
  const before = snapshot(fixture.cwd);
  const calls = [];
  const runner = (command, args, options) => {
    calls.push({ command, args, options });
    assert.equal(command, process.execPath);
    assert.deepEqual(args, [path.join(libraryFixture.tools, "checker.mjs")]);
    assert.equal(options.cwd, fixture.cwd);
    assert.equal(options.shell, false);
    assert.equal(options.timeout, 3000);
    assert.equal(options.maxBuffer, 8192);
    const result = spawnSync(command, args, options);
    assertProcess(result);
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).code, "OK");
    return result;
  };
  const initial = JSON.stringify(stopInput);
  const normal = originalAdapter.handleStop(stopInput, { cwd: fixture.cwd, runner });
  assert.equal(calls.length, 1);
  assert.equal(normal.continue, true);
  assert.match(normal.systemMessage, /^\[LAB-10\] pass: OK\./u);
  const changed = { ...stopInput, stop_hook_active: true };
  assert.deepEqual(changed, { hook_event_name: "Stop", stop_hook_active: true });
  let forbiddenCalls = 0;
  const skipped = originalAdapter.handleStop(changed, {
    cwd: fixture.cwd,
    runner: () => { forbiddenCalls += 1; throw new Error("checker must not be invoked on reentry"); },
  });
  assert.equal(forbiddenCalls, 0);
  assert.equal(skipped.continue, true);
  assert.match(skipped.systemMessage, /^\[LAB-10\] skipped: STOP_HOOK_ALREADY_ACTIVE\./u);
  expectStop(fixture, "skipped", "STOP_HOOK_ALREADY_ACTIVE", changed);
  const restored = JSON.parse(initial);
  assert.equal(JSON.stringify(restored), initial);
  assert.deepEqual(originalAdapter.handleStop(restored, { cwd: fixture.cwd, runner }), normal);
  assert.equal(calls.length, 2);
  assert.deepEqual(snapshot(fixture.cwd), before);
});

test("HC-010 fixed checker-results are reproduced by the exact helper on all structural cases, never real Stop", () => {
  const inputs = JSON.parse(bytes("stop-inputs.json.template"));
  const fixed = JSON.parse(bytes("checker-results.json.template"));
  for (const packet of [inputs, fixed]) {
    assert.equal(packet.materialType, "SYNTHETIC_TRAINING_ONLY");
    assert.equal(packet.observation, "fixture-only");
    assert.equal(packet.liveStatus, "live-unobserved");
  }
  const ids = ["sample-01", "sample-02", "sample-03", "sample-04", "sample-05"];
  assert.deepEqual(inputs.cases.map(({ caseId }) => caseId), ids);
  assert.deepEqual(fixed.cases.map(({ caseId }) => caseId), ids);
  assert.deepEqual(fixed.helperSha256, Object.fromEntries(
    Object.entries(helperHashes).map(([name, digest]) => [`payload/tools/${name}.template`, digest]),
  ));
  for (const specimen of inputs.cases) {
    const record = fixed.cases.find(({ caseId }) => caseId === specimen.caseId);
    const draft = readFileSync(path.join(pack, ...specimen.draftSource.split("/")));
    const fixture = workspace({
      active: specimen.selector === null ? null : `${JSON.stringify(specimen.selector)}\n`,
      draft, runId: specimen.draftRunId,
    });
    assert.equal(record.observation, "fixture-only");
    assert.equal(record.draftSha256, sha256(draft));
    assert.equal(record.draftSource, specimen.draftSource);
    assert.deepEqual(record.selector, specimen.selector);
    assert.equal(record.checkerInvoked, !specimen.input.stop_hook_active);
    if (record.checkerInvoked) {
      const checked = execute(fixture, "checker.mjs");
      assert.deepEqual({ exitCode: checked.status, output: checked.output }, record.checker);
      assert.equal(checked.status, originalChecker.RESULT_EXIT[checked.output.result]);
    } else {
      assert.equal(record.checker, null);
      let calls = 0;
      originalAdapter.handleStop(specimen.input, { cwd: fixture.cwd, runner: () => { calls += 1; } });
      assert.equal(calls, 0);
    }
    const notified = execute(fixture, "stop-notify.mjs", JSON.stringify(specimen.input));
    assert.equal(notified.status, 0);
    assert.equal(notified.output.continue, true);
    assert.deepEqual({ exitCode: notified.status, output: notified.output }, record.adapter);
  }
  for (const key of ["realStop", "settingsDiscovery", "notificationDisplay", "llmExecution"]) {
    assert.equal(fixed.nonClaims[key], "not-observed");
  }
  assert.equal(fixed.nonClaims.semanticAccuracy, "not-evaluated");
});

test("HC-010 original adapter validates only its input subset and returns nonblocking input failures", async (t) => {
  const original = JSON.stringify(stopInput);
  const scenarios = [
    ["wrong event", JSON.stringify({ ...stopInput, hook_event_name: "SessionStart" }), "STOP_INPUT_INVALID_SCHEMA",
      (text) => assert.equal(JSON.parse(text).hook_event_name, "SessionStart")],
    ["boolean required", JSON.stringify({ ...stopInput, stop_hook_active: "false" }), "STOP_INPUT_INVALID_SCHEMA",
      (text) => assert.equal(typeof JSON.parse(text).stop_hook_active, "string")],
    ["invalid JSON", original.slice(0, -1), "HOOK_INPUT_INVALID_JSON",
      (text) => assert.throws(() => JSON.parse(text), SyntaxError)],
    ["non-object JSON", `[${original}]`, "HOOK_INPUT_NOT_OBJECT",
      (text) => assert.equal(Array.isArray(JSON.parse(text)), true)],
    ["invalid UTF-8", Buffer.from([0xc3, 0x28]), "HOOK_INPUT_INVALID_UTF8",
      (value) => assert.throws(() => new TextDecoder("utf-8", { fatal: true }).decode(value), TypeError)],
    ["input limit", JSON.stringify({ ...stopInput, padding: "x".repeat(originalIo.MAX_INPUT_BYTES) }), "HOOK_INPUT_TOO_LARGE",
      (text) => assert.ok(Buffer.byteLength(text) > originalIo.MAX_INPUT_BYTES)],
  ];
  for (const [name, changed, code, inspect] of scenarios) {
    await t.test(name, () => {
      const fixture = workspace();
      const before = snapshot(fixture.cwd);
      expectStop(fixture, "pass", "OK", original);
      assert.notDeepEqual(Buffer.from(changed), Buffer.from(original));
      inspect(changed);
      expectStop(fixture, "uncheckable", code, changed);
      expectStop(fixture, "pass", "OK", original);
      assert.deepEqual(snapshot(fixture.cwd), before);
    });
  }
});

test("HC-010 original hook-io timeout is a bounded input failure and a fresh stream still succeeds", async () => {
  const data = Buffer.from(`${JSON.stringify(stopInput)}\n`);
  async function complete() {
    const stream = new PassThrough();
    const result = originalIo.readHookInput(stream, 1000);
    stream.end(data);
    return result;
  }
  assert.deepEqual(await complete(), stopInput);
  const pending = new PassThrough();
  const timed = originalIo.readHookInput(pending, 10);
  assert.equal(pending.readableEnded, false);
  await assert.rejects(timed, { code: "HOOK_INPUT_TIMEOUT" });
  assert.equal(pending.destroyed, true);
  assert.deepEqual(await complete(), stopInput);
  assert.deepEqual(data, Buffer.from(`${JSON.stringify(stopInput)}\n`));
});

test("HC-010 adapter rejects one-factor corruptions of an actual checker protocol response and restores it", async (t) => {
  const fixture = workspace();
  const observed = expectChecker(fixture, "pass", "OK", 0).processResult;
  const original = JSON.stringify({
    status: observed.status, signal: observed.signal, stdout: observed.stdout, stderr: observed.stderr,
  });
  assert.deepEqual(originalAdapter.checkProcessResult(JSON.parse(original)), originalChecker.report("pass", "OK"));
  const scenarios = [
    ["status mismatch", (value) => { value.status = 1; }, (value) => assert.equal(value.status, 1), "CHECKER_STATUS_MISMATCH"],
    ["non-integer status", (value) => { value.status = null; }, (value) => assert.equal(value.status, null), "CHECKER_STATUS_NOT_INTEGER_OR_SIGNAL"],
    ["unexpected stderr", (value) => { value.stderr = "synthetic diagnostic"; }, (value) => assert.equal(value.stderr, "synthetic diagnostic"), "CHECKER_UNEXPECTED_STDERR"],
    ["invalid JSON", (value) => { value.stdout = value.stdout.trimEnd().slice(0, -1); },
      (value) => assert.throws(() => JSON.parse(value.stdout), SyntaxError), "CHECKER_PROTOCOL_INVALID_JSON"],
    ["wrong protocol origin", (value) => { value.stdout = JSON.stringify({ ...JSON.parse(value.stdout), lab: "HC-010" }); },
      (value) => assert.equal(JSON.parse(value.stdout).lab, "HC-010"), "CHECKER_PROTOCOL_INVALID_SCHEMA"],
    ["oversized output", (value) => { value.stdout = " ".repeat(originalAdapter.MAX_CHECKER_OUTPUT_BYTES + 1); },
      (value) => assert.equal(Buffer.byteLength(value.stdout), originalAdapter.MAX_CHECKER_OUTPUT_BYTES + 1), "CHECKER_OUTPUT_INVALID_OR_TOO_LARGE"],
  ];
  for (const [name, mutate, inspect, code] of scenarios) {
    await t.test(name, () => {
      let candidate = JSON.parse(original);
      mutate(candidate);
      inspect(candidate);
      assert.notEqual(JSON.stringify(candidate), original);
      assert.deepEqual(originalAdapter.checkProcessResult(candidate), originalChecker.report("uncheckable", code));
      candidate = JSON.parse(original);
      assert.equal(JSON.stringify(candidate), original);
      assert.deepEqual(originalAdapter.checkProcessResult(candidate), originalChecker.report("pass", "OK"));
    });
  }
  expectChecker(fixture, "pass", "OK", 0);
});

test("HC-010 inert drafts preserve the original command shape, no-argument protocol and nonblocking-only proposal", () => {
  const contract = JSON.parse(bytes("notification-contract.json.template"));
  assert.equal(contract.materialType, "SYNTHETIC_TRAINING_ONLY");
  assert.deepEqual(contract.checker.arguments, []);
  assert.deepEqual(contract.checker.resultExits, { pass: 0, invalid: 1, uncheckable: 2, skipped: 0 });
  assert.deepEqual(contract.checker.unexpectedArguments, { result: "uncheckable", code: "UNEXPECTED_ARGUMENTS", exitCode: 2 });
  assert.equal(contract.checker.draftRunMarker, false);
  assert.equal(contract.adapter.continue, true);
  assert.equal(contract.adapter.newAiTurnRequested, false);
  assert.equal(contract.adapter.retryLoop, false);
  assert.equal(contract.adapter.autoFix, false);
  assert.equal(contract.nonClaims.coreExecution, "not-permitted");
  const proposal = JSON.parse(bytes("stop-output.json.template"));
  assert.deepEqual(Object.keys(proposal).sort(), ["continue", "systemMessage"]);
  assert.equal(proposal.continue, true);
  assert.match(proposal.systemMessage, /観測したadapter出力ではない/u);
  assert.deepEqual(bytes("stop-hook.json.template"), bytes("stop-notification.json.template"));
  const config = JSON.parse(bytes("stop-hook.json.template"));
  assert.deepEqual(Object.keys(config), ["hooks"]);
  assert.deepEqual(Object.keys(config.hooks), ["Stop"]);
  assert.equal(config.hooks.Stop.length, 1);
  const command = config.hooks.Stop[0];
  assert.deepEqual(Object.keys(command).sort(), ["command", "cwd", "timeout", "type", "windows"]);
  assert.equal(command.type, "command");
  assert.equal(command.command, "node .runtime\\independent-labs\\lab-10\\tools\\stop-notify.mjs");
  assert.equal(command.windows, command.command);
  assert.equal(command.cwd, ".");
  assert.equal(command.timeout, 10);
  assert.doesNotMatch(command.command, /--run|-run-id/u);
  assert.deepEqual(JSON.parse(activeBytes), { lab: "LAB-10", runId: "run-01" });
});
