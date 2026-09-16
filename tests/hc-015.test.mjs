import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CONDITIONS, FULL_CONTEXT, MANUAL_PREAMBLE, PAYLOAD_FILES, SOURCE_BASELINE, SOURCE_ORACLE,
  checkCoreManifest, checkManualInput, checkPreparedFiles, checkQuery, checkSearchPlan,
  checkSourceTargets, createManualInput,
} from "./support/hc-015-context-checks.mjs";
import { loadCatalog } from "../scripts/lib/catalog.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../scripts/lib/constants.mjs";
import {
  computeDirectoryHash, isContainedBy, isSafeRepositoryPath, readJson, REPOSITORY_ROOT, sha256, stableJson,
} from "../scripts/lib/fs-utils.mjs";
import {
  OPTIONAL_EVIDENCE_NOTICE, OPTIONAL_GUIDE_HEADINGS, OPTIONAL_SAFETY_NOTICE,
  optionalRuntimeStatus, validateOptionalRoutes,
} from "../scripts/lib/optional-routes.mjs";
import {
  validateChallengePageText, validateOptionalGuideText, validateOptionalRoutePage,
} from "../scripts/lib/pages.mjs";
import { validatePackDirectory, validatePackManifest } from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

const root = path.join(REPOSITORY_ROOT, "challenges", "hc-015");
const pack = path.join(root, "pack");
const payload = (file) => path.join(pack, "payload", file);
const evidenceHeadings = {
  "comparison.md": ["Fixed task", "Environment", "Design", "Observations", "Comparison", "Outcome"],
  "recovery.md": ["Case", "Expected boundary", "Observed result", "Restoration", "Non-claims"],
  "context.md": ["Requested context", "Provided context", "Source references", "Search and language status", "Non-claims"],
};
const additions = {
  baseline: ["design.md", "search-plan.md"],
  "explicit-context": ["design.md", "context-plan.md"],
  "manual-equivalent": ["design.md", "context-plan.md", "manual-input.txt"],
};
const expectedGuides = [
  {
    id: "language-tools",
    title: "Javaの定義・参照と言語サービスの準備を分けて確認する",
    page: "challenges/hc-015/optional/language-tools.md",
    required: false,
    prerequisites: {
      environment: [
        "対応するJava拡張が既に導入済みで、同じworkspaceの初期化状態を確認できること。",
        "本編とは別の診断として、同じquery・source・tabs・selection・model・toolsを固定できること。",
      ],
      entitlements: [
        "利用予定のVS Code Stable・GitHub Copilotと教材sourceへの通常の利用資格を確認できること。",
      ],
      additionalApprovals: [
        "人のエディター操作とAgentのUsages利用は区別し、実機操作・LLM利用の対象を環境所有者が別途承認すること。",
      ],
    },
    runtimeRequirements: [{
      capability: "java-language-service",
      status: "not-checked",
      reason: "Java言語サービスの初期化、定義・参照の返却範囲とAgentからの利用は未確認です。",
    }],
    liveStatus: "live-unobserved",
    stopReasons: [
      "Java拡張が未導入なら自動installせず、unsupportedまたは未実施として止めます。",
      "初期化中、未対応、返却範囲不明なら未観測のまま止め、参照0件へ補完しません。",
      "別の設定変更、index構築、source編集が必要なら本編へ混ぜず、別承認まで止めます。",
    ],
  },
  {
    id: "index-exclusions",
    title: "索引・検索除外と設定追跡のblocked境界を確認する",
    page: "challenges/hc-015/optional/index-exclusions.md",
    required: false,
    prerequisites: {
      environment: [
        "同じquery・source版・除外状態・開いたfileを固定し、text検索・semantic検索・添付を別々に記録できること。",
        "索引の出所と状態、追跡対象のworkspace設定を変更せず確認できること。",
      ],
      entitlements: [
        "対象workspaceの索引サービス、Copilot利用資格、組織policy、source読取り権限を確認できること。",
      ],
      additionalApprovals: [
        "index構築・通信・当該workspace設定変更を伴う実機診断は、対象を限定した別承認が必要です。",
      ],
    },
    runtimeRequirements: [
      {
        capability: "tracked-vscode-settings",
        status: "blocked",
        reason: "Runtime v1は.vscode/settings.jsonをGit除外し、.vscode/mcp.jsonだけを例外にするため、この設定追跡経路はblockedです。",
      },
      {
        capability: "semantic-index-observation",
        status: "not-checked",
        reason: "semantic indexの出所、準備状態、実検索の返却範囲は未確認です。",
      },
    ],
    liveStatus: "live-unobserved",
    stopReasons: [
      "Runtime v1では追跡可能なworkspace除外設定を含む経路を完走できないため、準備確認で止めます。",
      "force-add、User/Profileへの黙った切替、既存ignoreの変更でblockedを回避しません。",
      "indexや権限が未確認ならreadyやsemantic結果0件にせず、組織content exclusionを回避しません。",
    ],
  },
];
const intendedEntry = {
  id: "HC-015",
  title: "最短経路で必要なコードへ到達しよう",
  track: "context-controls",
  status: "published",
  sourceLab: {
    ids: ["LAB-15"],
    repository: "shinyay/github-copilot-customization-labs",
    pages: ["docs/labs/lab-15-context-search-language-intelligence.md"],
  },
  sourceKind: "baseline",
  sourcePaths: SOURCE_ORACLE.map(({ path: sourcePath }) => sourcePath),
  optionalRoutes: expectedGuides,
  challengeVersion: 1,
  page: "challenges/hc-015/README.md",
  pack: "challenges/hc-015/pack",
  feature: "Context / Search / Language Intelligence",
  support: {
    primary: "Stableの通常検索、固定二file全文のAdd Context、同じraw全文の手動供給",
    fallback: "未対応clientや投入範囲不明は設計と準備の同一性を提出し、実検索・添付成功を主張しない",
  },
  isolation: { tier: "repository", conditionStrategy: "separate-repository" },
};

function roundTripJson(original, check, change, inspect, code) {
  let current = Buffer.from(original);
  check(JSON.parse(current));
  const changed = JSON.parse(current);
  change(changed);
  current = Buffer.from(stableJson(changed), "utf8");
  assert.ok(!current.equals(original), "mutation changed the bytes");
  inspect(JSON.parse(current));
  assert.throws(() => check(JSON.parse(current)), { code });
  current = Buffer.from(original);
  assert.ok(current.equals(original), "restore the complete original bytes");
  check(JSON.parse(current));
}

function roundTripBuffer(original, check, change, inspect, code) {
  let current = Buffer.from(original);
  check(current);
  current = change(Buffer.from(current));
  assert.ok(!current.equals(original));
  inspect(current);
  assert.throws(() => check(current), { code });
  current = Buffer.from(original);
  assert.ok(current.equals(original));
  check(current);
}

function assertExternalFixtureRoot(repository, candidate) {
  if (candidate === repository || isContainedBy(repository, candidate)) {
    throw Object.assign(new Error("HC-015 fixture storage must be outside the repository."), {
      code: "HC015_FIXTURE_IN_REPOSITORY",
    });
  }
}

async function createPackFixture(t) {
  const artifactRoot = process.env.HC015_TEST_ARTIFACT_ROOT;
  const repository = await realpath(REPOSITORY_ROOT);
  const parent = await realpath(artifactRoot ?? os.tmpdir());
  assertExternalFixtureRoot(repository, parent);
  if (artifactRoot !== undefined) {
    // Explicit artifact storage retains restored inputs; ordinary temporary fixtures are cleaned below.
    const fixture = path.join(parent, `hc015-pack-${randomUUID()}`);
    await mkdir(fixture);
    t.diagnostic(`Restored fixture retained in owned artifact storage: ${fixture}`);
    return fixture;
  }
  const fixture = await mkdtemp(path.join(parent, "hc015-pack-"));
  t.after(() => rm(fixture, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  return fixture;
}

test("HC-015 v1 manifest delivers exactly twelve identical inert payloads and 2+2+3 exported additions", async () => {
  const { errors, manifest, files } = await validatePackDirectory(pack, "HC-015");
  assert.deepEqual(errors, []);
  checkCoreManifest(manifest);
  assert.deepEqual(manifest.conditions, ["baseline", "explicit-context", "manual-equivalent"]);
  assert.deepEqual(manifest.forbiddenActiveCustomizations, []);
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(files.sort(), ["manifest.json", ...PAYLOAD_FILES.map((file) => `payload/${file}`)].sort());
  for (const file of files) {
    const bytes = await readFile(path.join(pack, ...file.split("/")));
    assert.ok(!bytes.includes(13), `${file}: LF`);
    assert.ok(!bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), `${file}: no BOM`);
    assert.equal(bytes.at(-1), 10, `${file}: final LF`);
    assert.ok(file === "manifest.json" || file.endsWith(".template"));
  }
  for (const condition of CONDITIONS) {
    const plan = buildRunPlan({ challenges: [intendedEntry] }, manifest, {
      challengeId: "HC-015", condition, team: "qa-fixture", runId: `hc015-${condition}-qa`,
    });
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.filesToInject.length, 12);
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.deepEqual(plan.participantChanges.allowedAdditions.map(({ pattern }) => pattern),
      additions[condition].map((name) => `participant/hc-015/${name}`));
    assert.equal(plan.runStateEvidence.length, 3);
    assert.equal(plan.postCreateSettings.remoteCreation, "deferred");
    for (const entry of plan.filesToInject) {
      assert.equal(entry.allowOverwrite, false);
      assert.match(entry.destination, /^\.hackathon\/challenge\/hc-015\/[^/]+\.template$/u);
    }
    assert.ok(manifest.allowedAdditions.every(({ pattern }) => !pattern.includes("*") && !pattern.startsWith(".hackathon/")));
  }
});

test("HC-015 uses the independent pinned application source oracle, not a shared mistaken hash", async () => {
  const targets = await readJson(payload("source-targets.json.template"));
  checkSourceTargets(targets);
  assert.deepEqual(SOURCE_BASELINE, {
    repository: "shinyay/code-to-doc-workshop-260910",
    commit: "398d7d1982a1402bcdba00d6c3ded67d8d338787",
  });
  assert.deepEqual(SOURCE_ORACLE.map(({ bytes, sha256: hash }) => [bytes, hash]), [
    [29357, "a9586d7b43c4577d548180f4ea883ae522f7d97c78927f6a53e1bd48a382b072"],
    [5169, "ff96dd85980eb533693bd8df6111eead091796f3192645c50944db599d7d081c"],
    [1405, "284d8e50c62a952aecfab1b3fab6877db5eebd9c5d674e2da40d1a6ef6359eb9"],
  ]);
  assert.deepEqual(SOURCE_ORACLE.map(({ anchorRanges }) => anchorRanges), [
    [[333, 349]], [[44, 53], [82, 89]], [[10, 14]],
  ]);
  const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));
  for (const source of SOURCE_ORACLE) assert.ok(inventory.paths.includes(source.path), source.path);
  assert.equal(FULL_CONTEXT.reduce((total, source) => total + source.bytes, 0), 34526);
  assert.equal(SOURCE_ORACLE.reduce((total, source) => total + source.bytes, 0), 35931);
  const entry = (await loadCatalog()).challenges.find(({ id }) => id === "HC-015");
  for (const key of ["id", "title", "track", "sourceLab"]) assert.deepEqual(entry[key], intendedEntry[key]);
  if (entry.status === "published") {
    for (const key of ["sourceKind", "sourcePaths", "optionalRoutes", "page", "pack", "challengeVersion"]) {
      assert.deepEqual(entry[key], intendedEntry[key], `integrated ${key}`);
    }
  }
});

test("HC-015 source ledger hashes every derived LF payload and preserves original provenance without recursion", async () => {
  const ledger = await readJson(payload("source-materials.json.template"));
  assert.equal(ledger.authoringReference.repository, "shinyay/github-copilot-customization-labs");
  assert.equal(ledger.authoringReference.commit, "3474d21dd62bad2e594e84657dabe2eb9bb876c1");
  assert.equal(ledger.sourceBaseline.repository, SOURCE_BASELINE.repository);
  assert.equal(ledger.sourceBaseline.commit, SOURCE_BASELINE.commit);
  assert.deepEqual(ledger.sourceBaseline.files.map(({ path: file, bytes, sha256: hash }) => [file, bytes, hash]),
    SOURCE_ORACLE.map(({ path: file, bytes, sha256: hash }) => [file, bytes, hash]));
  assert.deepEqual(ledger.originalMaterials.map(({ sha256: hash }) => hash), [
    "3098fb2a721bc893639653ce68a5f70a6d587a9b733f5d3d33e7889dee380f74",
    "45b362cbe9023dd39f967275ffd4882cbb5fbb45d42da307609b2b854ed2e276",
    "621322321190f083cd6ea4b7c63a15be62e84bac4641e03a27b14236b66f1d8f",
    "3d7cca8653c42f53111d7da094693f53beb88c9ca4ea44083d33e81016579f6c",
    "8480c61a71af241ca7ae5f3dbb6e64871d8bb3c11c5199c9af2b06c3cb0718f1",
    "5d75ed6c847abe15c65afe3736fc2964bf436e9cf7377c27a1c41fe206f057b6",
  ]);
  const origins = new Set([
    ...ledger.originalMaterials.map(({ path: file }) => file),
    ...ledger.sourceBaseline.files.map(({ originalLabsPath }) => originalLabsPath),
  ]);
  assert.deepEqual(ledger.derivedPayloads.map(({ source }) => source).sort(),
    PAYLOAD_FILES.filter((name) => name !== "source-materials.json.template").map((name) => `payload/${name}`).sort());
  for (const item of ledger.derivedPayloads) {
    const bytes = await readFile(path.join(pack, ...item.source.split("/")));
    assert.equal(item.bytes, bytes.length);
    assert.equal(item.sha256, sha256(bytes), item.source);
    assert.ok(item.adaptedFields.length > 0);
    assert.ok(item.originalPaths.length > 0);
    assert.ok(item.originalPaths.every((file) => origins.has(file)));
    if (item.materialKind === "synthetic-diagnostic-fixture") {
      assert.equal(item.materialLabel, "SYNTHETIC_TRAINING_ONLY");
      assert.equal(JSON.parse(bytes).materialLabel, item.materialLabel);
    }
  }
});

test("HC-015 participant page has exactly thirteen sections and actual Stable practice with truthful fallbacks", async () => {
  const page = await readFile(path.join(root, "README.md"), "utf8");
  assert.match(page, /^# HC-015 最短経路で必要なコードへ到達しよう\n/u);
  assert.deepEqual([...page.matchAll(/^## (.+)$/gmu)].map((match) => match[1]), REQUIRED_CHALLENGE_HEADINGS);
  assert.deepEqual(validateChallengePageText("HC-015", page), []);
  for (const source of SOURCE_ORACLE) assert.ok(page.includes(source.path));
  for (const text of [
    "Add Context", "fileそのものとして", "34526 bytes", "35931 bytes", "同名別ファイル",
    "実token数", "内部投入", "A3", "別design revision", "読む候補でありACLではありません",
    "unsupported", "incomparable", "blocked", "equal", "worse", "not-observed",
    "root READMEのアプリ起動手順はこの課題では使いません", "実proxy", "実transaction",
    "Go to Definition", "Find All References", "Usages", "新しいrepository",
    "--output .runtime/packs", "--run-id $runId", "--stage in-progress",
    "verify-run.mjs $Pack --stage submitted", "export-submission.mjs $Pack",
    'flag: "wx"', "$false", "片側だけ要約して比較を通しません",
    "SYNTHETIC_TRAINING_ONLY", "Challenge-specific design",
    "2026-09-15", "Add Context → Files & Folders", "Symbols", "ドラッグ＆ドロップ",
    "references・implementations・definitions", "Copilot status dashboard",
    "grep/text/file検索はsemantic indexなしでも使える", "個人・enterprise",
    "raw bytesすべてがモデルへ届く保証はありません",
  ]) assert.ok(page.includes(text), text);
  assert.doesNotMatch(page, /module-sales\.xml|instructor\/answer|以前の回答をコピー/u);
  const request = await readFile(payload("request.txt.template"), "utf8");
  assert.ok(request.includes("受注の在庫引当の入口と、適用されるtransaction設定を説明してください。"));
  for (const source of SOURCE_ORACLE) assert.ok(request.includes(source.path));
  assert.match(request, /アプリ、DB、テストを実行せず/u);
  assert.doesNotMatch(request, /"SALES"|"WAREHOUSE"|propagation="|rollback-for="/u);
  const layout = await readFile(payload("manual-input-layout.txt.template"), "utf8");
  for (const source of FULL_CONTEXT) {
    assert.ok(layout.includes(`<<<BEGIN FILE ${source.path}>>>`));
    assert.ok(layout.includes(`<<<END FILE ${source.path}>>>`));
  }
});

test("HC-015 declares three submitted Evidence files with exact headings and each template's own raw hash", async () => {
  const manifest = await readJson(path.join(pack, "manifest.json"));
  assert.equal(manifest.evidenceRequirements.length, 3);
  for (const requirement of manifest.evidenceRequirements) {
    const name = path.posix.basename(requirement.path);
    const raw = await readFile(payload(`${name}.template`));
    assert.equal(requirement.path, `.hackathon/evidence/hc-015/${name}`);
    assert.equal(requirement.stage, "submitted");
    assert.deepEqual(requirement.conditions, CONDITIONS);
    assert.deepEqual(requirement.requiredHeadings, evidenceHeadings[name]);
    assert.equal(requirement.templateSha256, sha256(raw));
    assert.deepEqual([...raw.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]), evidenceHeadings[name]);
    assert.equal(manifest.allowedAdditions.some(({ pattern }) => pattern === requirement.path), false);
    assert.deepEqual(manifest.submissionFiles.find(({ pattern }) => pattern === requirement.path).conditions, CONDITIONS);
  }
});

test("HC-015 exactly two guide-only routes keep reciprocal links, literal metadata and blocked/not-checked status", async () => {
  assert.deepEqual(validateOptionalRoutes(intendedEntry), []);
  assert.deepEqual((await readdir(path.join(root, "optional"))).sort(), ["index-exclusions.md", "language-tools.md"]);
  const page = await readFile(path.join(root, "README.md"), "utf8");
  for (const route of expectedGuides) {
    const text = await readFile(path.join(REPOSITORY_ROOT, ...route.page.split("/")), "utf8");
    assert.deepEqual([...text.matchAll(/^## (.+)$/gmu)].map((match) => match[1]), OPTIONAL_GUIDE_HEADINGS);
    assert.equal(text.split(OPTIONAL_SAFETY_NOTICE).length - 1, 1);
    assert.equal(text.split(OPTIONAL_EVIDENCE_NOTICE).length - 1, 1);
    assert.deepEqual(await validateOptionalRoutePage(intendedEntry, route, page), []);
    const plan = buildRunPlan({ challenges: [intendedEntry] }, null, { challengeId: "HC-015", route: route.id });
    assert.equal(plan.mode, "optional-guide");
    assert.equal(plan.liveStatus, "live-unobserved");
    assert.equal(plan.readiness.status, route.id === "index-exclusions" ? "blocked" : "not-checked");
    for (const key of ["condition", "filesToInject", "participantChanges", "runStateEvidence"]) {
      assert.equal(Object.hasOwn(plan, key), false);
    }
  }
  const language = await readFile(path.join(root, "optional", "language-tools.md"), "utf8");
  for (const phrase of [
    "自動install", "Go to Definition", "Find All References", "Usages", "同等manual C", "pending",
    "references・implementations・definitions", "2026-09-15", "文書確認", "実UX・LSP",
  ]) {
    assert.ok(language.includes(phrase));
  }
  const index = await readFile(path.join(root, "optional", "index-exclusions.md"), "utf8");
  for (const phrase of [
    "search.exclude", "files.exclude", ".gitignore", "開いたignored file", "force-add",
    "User/Profile", "content exclusion", "literal filter", "準備", "blocked",
    "2026-09-15", "Copilot status dashboard", "個人・enterprise",
    "Build Codebase semantic index", "本編では実行しません",
    "grep/text/file検索はindexなしでも使える",
    "text/grep検索から除外するが、Explorerには表示する",
    "Explorerで非表示にし、text/grep/semantic検索からも除外する",
    "開いたファイルや選択内容がcontextへ入り得る",
  ]) assert.ok(index.includes(phrase));
});

test("HC-015 template mutations check a positive, intended one-factor post-image, rejection and full restoration", async (t) => {
  const query = await readFile(payload("query.json.template"));
  const search = await readFile(payload("search-plan.json.template"));
  const targets = await readFile(payload("source-targets.json.template"));
  const cases = [
    ["query allocate to approve", query, checkQuery, (v) => { v.query = "approve"; },
      (v) => { assert.equal(v.query, "approve"); assert.equal(v.symbol, "OrderService.allocate"); }, "HC015_QUERY"],
    ["query wrong file scope", query, checkQuery, (v) => { v.source = v.source.replace("wholesale-core/", "wholesale-web/"); },
      (v) => { assert.match(v.source, /^wholesale-web\//u); assert.match(v.source, /\/OrderService\.java$/u); }, "HC015_SCOPE"],
    ["query omits definition line 333", query, checkQuery, (v) => { v.range = [334, 349]; },
      (v) => assert.deepEqual(v.range, [334, 349]), "HC015_SCOPE"],
    ["query fixed hash, not mutual agreement", query, checkQuery, (v) => { v.fileSha256 = "0".repeat(64); },
      (v) => assert.equal(v.fileSha256, "0".repeat(64)), "HC015_PINNED_HASH"],
    ["pending language service is not zero locations", query, checkQuery, (v) => { v.languageService.resolvedLocations = []; },
      (v) => { assert.equal(v.languageService.status, "pending"); assert.deepEqual(v.languageService.resolvedLocations, []); },
      "HC015_LANGUAGE_UNOBSERVED"],
    ["literal provenance cannot become LSP", query, checkQuery, (v) => { v.provenance = "java-language-service"; },
      (v) => assert.equal(v.provenance, "java-language-service"), "HC015_LITERAL_PROVENANCE"],
    ["static diagnostic cannot become live verified", query, checkQuery, (v) => { v.runtimeVerified = true; },
      (v) => assert.equal(v.runtimeVerified, true), "HC015_LITERAL_PROVENANCE"],
    ["search keeps same query", search, checkSearchPlan, (v) => { v.query = "approve"; },
      (v) => assert.equal(v.query, "approve"), "HC015_QUERY"],
    ["unobserved index is not zero results", search, checkSearchPlan, (v) => { v.semanticResults = []; },
      (v) => { assert.equal(v.indexStatus, "not-checked"); assert.deepEqual(v.semanticResults, []); }, "HC015_INDEX_UNOBSERVED"],
    ["unobserved index cannot become ready", search, checkSearchPlan, (v) => { v.indexStatus = "ready"; },
      (v) => { assert.equal(v.indexStatus, "ready"); assert.equal(v.semanticResults, null); }, "HC015_INDEX_UNOBSERVED"],
    ["core never requests index build", search, checkSearchPlan, (v) => { v.indexBuildRequested = true; },
      (v) => assert.equal(v.indexBuildRequested, true), "HC015_CORE_SETTINGS"],
    ["core does not activate original exclusion", search, checkSearchPlan, (v) => {
      v.observedSettings["search.exclude"] = { [SOURCE_ORACLE[0].path]: true };
    }, (v) => {
      assert.deepEqual(v.observedSettings["search.exclude"], { [SOURCE_ORACLE[0].path]: true });
      assert.equal(v.observedSettings["files.exclude"], null);
    }, "HC015_CORE_SETTINGS"],
    ["search exclusion is not ACL", search, checkSearchPlan, (v) => { v.securityBoundary = true; },
      (v) => assert.equal(v.securityBoundary, true), "HC015_CORE_SETTINGS"],
    ["missing just A3", targets, checkSourceTargets, (v) => { v.sources.pop(); },
      (v) => assert.deepEqual(v.sources.map(({ id }) => id), ["A1", "A2"]), "HC015_SOURCE_PATHS"],
    ["one source has wrong hash", targets, checkSourceTargets, (v) => { v.sources[1].sha256 = "1".repeat(64); },
      (v) => { assert.equal(v.sources[1].sha256, "1".repeat(64)); assert.equal(v.sources[0].sha256, SOURCE_ORACLE[0].sha256); },
      "HC015_SOURCE_ORACLE"],
    ["one attachment set has extra A3", targets, checkSourceTargets, (v) => { v.explicitContext.push("A3"); },
      (v) => { assert.deepEqual(v.explicitContext, ["A1", "A2", "A3"]); assert.deepEqual(v.manualEquivalent, ["A1", "A2"]); },
      "HC015_CONTEXT_SET"],
    ["one condition missing from access list", targets, checkSourceTargets, (v) => { v.conditions.pop(); },
      (v) => assert.deepEqual(v.conditions, ["baseline", "explicit-context"]), "HC015_CONTEXT_SET"],
    ["unknown tokens cannot become zero", targets, checkSourceTargets, (v) => { v.actualTokenCount = 0; },
      (v) => assert.equal(v.actualTokenCount, 0), "HC015_OBSERVATION_CLAIM"],
    ["source paths cannot become access control", targets, checkSourceTargets, (v) => { v.pathSemantics = "acl"; },
      (v) => assert.equal(v.pathSemantics, "acl"), "HC015_SCOPE_NOT_ACL"],
  ];
  for (const [name, original, check, change, inspect, code] of cases) {
    await t.test(name, () => roundTripJson(original, check, change, inspect, code));
  }
});

test("HC-015 full manual parity rejects missing lines, wrong headers, same-name other files and one-sided summaries", async (t) => {
  const toyFiles = [
    { path: FULL_CONTEXT[0].path, content: Buffer.from("SYNTHETIC_TRAINING_ONLY\nfirst line\nallocate marker\nlast line\n") },
    { path: FULL_CONTEXT[1].path, content: Buffer.from("SYNTHETIC_TRAINING_ONLY\nXML fixture text\nlast line\n") },
  ];
  const toyOracle = toyFiles.map(({ path: file, content }) => ({ path: file, bytes: content.length, sha256: sha256(content) }));
  const original = createManualInput(toyFiles, toyOracle);
  const check = (value) => assert.deepEqual(checkManualInput(value, toyOracle), toyOracle);
  check(original);
  assert.ok(original.subarray(0, Buffer.byteLength(MANUAL_PREAMBLE)).equals(Buffer.from(MANUAL_PREAMBLE)));
  assert.throws(() => checkManualInput(original), { code: "HC015_MANUAL_SOURCE_BYTES" },
    "a toy packet is never accepted as the real full pinned source");
  const cases = [
    ["one missing line", (b) => Buffer.from(b.toString("utf8").replace("allocate marker\n", "")),
      (b) => { assert.ok(!b.includes(Buffer.from("allocate marker\n"))); assert.ok(b.includes(Buffer.from("first line\nlast line\n"))); },
      "HC015_MANUAL_SOURCE_BYTES"],
    ["filename header only", (b) => Buffer.from(b.toString("utf8").replace(
      `<<<BEGIN FILE ${FULL_CONTEXT[0].path}>>>`, "<<<BEGIN FILE other/OrderService.java>>>")),
      (b) => {
        assert.ok(b.includes(Buffer.from("<<<BEGIN FILE other/OrderService.java>>>")));
        assert.ok(b.includes(Buffer.from(`<<<END FILE ${FULL_CONTEXT[0].path}>>>`)));
      }, "HC015_MANUAL_HEADER"],
    ["same-length stale bytes", (b) => Buffer.from(b.toString("utf8").replace("allocate marker", "approve! marker")),
      (b) => { assert.equal(b.length, original.length); assert.ok(b.includes(Buffer.from("approve! marker"))); },
      "HC015_MANUAL_SOURCE_HASH"],
    ["one-sided summary", (b) => Buffer.from(b.toString("utf8").replace(toyFiles[0].content.toString("utf8"), "summary only\n")),
      (b) => { assert.ok(b.includes(Buffer.from("summary only\n"))); assert.ok(b.includes(toyFiles[1].content)); },
      "HC015_MANUAL_SOURCE_BYTES"],
    ["foreign tab appended", (b) => Buffer.concat([b, Buffer.from("<<<BEGIN FILE other/tab.txt>>>\nforeign\n")]),
      (b) => assert.ok(b.subarray(original.length).equals(Buffer.from("<<<BEGIN FILE other/tab.txt>>>\nforeign\n"))),
      "HC015_MANUAL_TRAILING"],
  ];
  for (const [name, change, inspect, code] of cases) {
    await t.test(name, () => roundTripBuffer(original, check, change, inspect, code));
  }
  await t.test("same basename at another path in prepared B", () => {
    const raw = Buffer.from(stableJson(toyOracle));
    roundTripJson(raw, (files) => checkPreparedFiles(files, toyOracle), (files) => {
      files[0].path = "other/OrderService.java";
    }, (files) => {
      assert.equal(path.posix.basename(files[0].path), "OrderService.java");
      assert.equal(files[0].sha256, toyOracle[0].sha256);
    }, "HC015_PREPARED_CONTEXT");
  });
  await t.test("B/C mutual equality cannot approve a common wrong hash", () => {
    const pair = { B: structuredClone(FULL_CONTEXT), C: structuredClone(FULL_CONTEXT) };
    const raw = Buffer.from(stableJson(pair));
    const checkPair = (value) => { checkPreparedFiles(value.B); checkPreparedFiles(value.C); };
    roundTripJson(raw, checkPair, (value) => {
      value.B[0].sha256 = "f".repeat(64);
      value.C[0].sha256 = "f".repeat(64);
    }, (value) => {
      assert.deepEqual(value.B, value.C);
      assert.equal(value.B[1].sha256, FULL_CONTEXT[1].sha256);
      assert.notEqual(value.B[0].sha256, SOURCE_ORACLE[0].sha256);
      assert.throws(() => checkPreparedFiles(value.C), { code: "HC015_PREPARED_CONTEXT" });
    }, "HC015_PREPARED_CONTEXT");
  });
});

test("HC-015 one-condition contract defects are detected rather than hidden by aggregate counts", async (t) => {
  const original = await readFile(path.join(pack, "manifest.json"));
  const cases = [
    ["missing C overlay membership", (v) => { v.overlay[0].conditions.pop(); },
      (v) => { assert.equal(v.overlay.length, 12); assert.deepEqual(v.overlay[0].conditions, ["baseline", "explicit-context"]); },
      "HC015_MANIFEST_OVERLAY"],
    ["manual path leaked to baseline", (v) => { v.allowedAdditions[3].conditions.push("baseline"); },
      (v) => assert.deepEqual(v.allowedAdditions[3].conditions, ["manual-equivalent", "baseline"]), "HC015_MANIFEST_ADDITIONS"],
    ["manual artifact omitted from export", (v) => { v.submissionFiles.splice(3, 1); },
      (v) => {
        assert.equal(v.allowedAdditions[3].pattern, "participant/hc-015/manual-input.txt");
        assert.equal(v.submissionFiles.some(({ pattern }) => pattern.endsWith("manual-input.txt")), false);
      }, "HC015_MANIFEST_EXPORT"],
    ["one evidence condition missing", (v) => { v.evidenceRequirements[2].conditions.pop(); },
      (v) => { assert.equal(v.evidenceRequirements.length, 3); assert.deepEqual(v.evidenceRequirements[2].conditions, ["baseline", "explicit-context"]); },
      "HC015_MANIFEST_EVIDENCE"],
  ];
  for (const [name, change, inspect, code] of cases) {
    await t.test(name, () => roundTripJson(original, checkCoreManifest, change, inspect, code));
  }
});

test("HC-015 real Pack validators reject boundary and evidence-byte mutations, then validate full restored bytes", async (t) => {
  const repository = await realpath(REPOSITORY_ROOT);
  assertExternalFixtureRoot(repository, path.dirname(repository));
  for (const candidate of [repository, root, pack]) {
    assert.throws(() => assertExternalFixtureRoot(repository, candidate), { code: "HC015_FIXTURE_IN_REPOSITORY" });
  }
  const fixture = await createPackFixture(t);
  assertExternalFixtureRoot(repository, await realpath(fixture));
  await cp(pack, fixture, { recursive: true });
  const target = path.join(fixture, "payload", "comparison.md.template");
  const original = await readFile(target);
  assert.deepEqual((await validatePackDirectory(fixture, "HC-015")).errors, []);
  const changed = Buffer.from(original.toString("utf8").replace("## Outcome\n", "## Missing outcome\n"), "utf8");
  await writeFile(target, changed);
  const postImage = await readFile(target, "utf8");
  assert.match(postImage, /^## Missing outcome$/mu);
  assert.doesNotMatch(postImage, /^## Outcome$/mu);
  assert.deepEqual((await validatePackDirectory(fixture, "HC-015")).errors.map(({ code }) => code),
    ["PACK_EVIDENCE_TEMPLATE_HASH"]);
  await writeFile(target, original);
  assert.ok((await readFile(target)).equals(original));
  assert.deepEqual((await validatePackDirectory(fixture, "HC-015")).errors, []);

  const manifestFile = path.join(fixture, "manifest.json");
  const manifestBytes = await readFile(manifestFile);
  const cases = [
    ["branch", (v) => { v.isolation.branchSafe = true; }, (v) => assert.equal(v.isolation.branchSafe, true), "PACK_BRANCH_SAFETY"],
    ["Evidence as addition", (v) => { v.allowedAdditions.push({ pattern: v.evidenceRequirements[0].path, conditions: [...CONDITIONS] }); },
      (v) => assert.equal(v.allowedAdditions.at(-1).pattern, ".hackathon/evidence/hc-015/comparison.md"), "PACK_ADDITION_RESERVED_PATH"],
    ["baseline active customization", (v) => { v.allowedAdditions.push({ pattern: "AGENTS.md", conditions: ["baseline"] }); },
      (v) => assert.deepEqual(v.allowedAdditions.at(-1), { pattern: "AGENTS.md", conditions: ["baseline"] }), "PACK_BASELINE_ACTIVE_CUSTOMIZATION"],
    ["early Evidence stage", (v) => { v.evidenceRequirements[0].stage = "in-progress"; },
      (v) => assert.equal(v.evidenceRequirements[0].stage, "in-progress"), "PACK_EVIDENCE_STAGE"],
  ];
  for (const [name, change, inspect, code] of cases) {
    await t.test(name, async () => {
      assert.deepEqual((await validatePackDirectory(fixture, "HC-015")).errors, []);
      const altered = JSON.parse(manifestBytes);
      change(altered);
      await writeFile(manifestFile, stableJson(altered), "utf8");
      const post = await readJson(manifestFile);
      inspect(post);
      assertErrorCode(validatePackManifest(post, "HC-015"), code);
      assertErrorCode((await validatePackDirectory(fixture, "HC-015")).errors, code);
      await writeFile(manifestFile, manifestBytes);
      assert.ok((await readFile(manifestFile)).equals(manifestBytes));
      assert.deepEqual((await validatePackDirectory(fixture, "HC-015")).errors, []);
    });
  }
});

test("HC-015 guide negative controls restore complete prose and keep a single blocked capability decisive", async () => {
  const route = expectedGuides[0];
  const original = await readFile(path.join(REPOSITORY_ROOT, ...route.page.split("/")));
  assert.deepEqual(validateOptionalGuideText(intendedEntry, route, original.toString("utf8")), []);
  const altered = Buffer.from(original.toString("utf8").replace(OPTIONAL_SAFETY_NOTICE, "安全説明が欠落した負例。"));
  assert.ok(!altered.toString("utf8").includes(OPTIONAL_SAFETY_NOTICE));
  assertErrorCode(validateOptionalGuideText(intendedEntry, route, altered.toString("utf8")), "OPTIONAL_PAGE_SAFETY");
  const restored = Buffer.from(original);
  assert.ok(restored.equals(original));
  assert.deepEqual(validateOptionalGuideText(intendedEntry, route, restored.toString("utf8")), []);
  const originalMetadata = Buffer.from(stableJson(intendedEntry));
  const checkMetadata = (value) => {
    const errors = validateOptionalRoutes(value);
    if (errors.length) throw Object.assign(new Error(errors[0].message), { code: errors[0].code });
  };
  roundTripJson(originalMetadata, checkMetadata, (v) => {
    v.optionalRoutes[1].runtimeRequirements[0].status = "not-checked";
  }, (v) => {
    assert.equal(v.optionalRoutes[1].runtimeRequirements[0].status, "not-checked");
    assert.equal(v.optionalRoutes[1].runtimeRequirements[1].status, "not-checked");
  }, "CATALOG_OPTIONAL_KNOWN_BLOCK");
  assert.equal(optionalRuntimeStatus(expectedGuides[1]), "blocked");
  assert.equal(optionalRuntimeStatus({ runtimeRequirements: [] }), "not-checked");
});

test("HC-015 child-process rejection requires no spawn error, no signal, integer status and exact reason", async () => {
  const original = await readFile(payload("query.json.template"));
  const program = `
    import { checkQuery } from "./tests/support/hc-015-context-checks.mjs";
    try {
      checkQuery(JSON.parse(process.argv[1]));
      process.stdout.write("HC015_QUERY_OK\\n");
    } catch (error) {
      process.stderr.write(error.code + "\\n");
      process.exitCode = 1;
    }
  `;
  const run = (raw, status, reason) => {
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", program, raw.toString("utf8")], {
      cwd: REPOSITORY_ROOT, encoding: "utf8", timeout: 15_000,
    });
    assert.equal(child.error, undefined);
    assert.equal(child.signal, null);
    assert.equal(Number.isInteger(child.status), true);
    assert.equal(child.status, status);
    assert.equal(child.stderr, reason ? `${reason}\n` : "");
    assert.equal(child.stdout, status === 0 ? "HC015_QUERY_OK\n" : "");
  };
  run(original, 0);
  const changed = JSON.parse(original);
  changed.languageService.resolvedLocations = [];
  const negative = Buffer.from(stableJson(changed));
  assert.equal(JSON.parse(negative).languageService.status, "pending");
  assert.deepEqual(JSON.parse(negative).languageService.resolvedLocations, []);
  run(negative, 1, "HC015_LANGUAGE_UNOBSERVED");
  const restored = Buffer.from(original);
  assert.ok(restored.equals(original));
  run(restored, 0);
});

test("HC-015 optional author-only materializations have exact descriptors, granted origins and real full source bytes", {
  skip: process.env.HC015_AUTHOR_MATERIALIZATIONS ? false : "session-only acceptance fixtures are not public dependencies",
}, async () => {
  const directory = path.resolve(process.env.HC015_AUTHOR_MATERIALIZATIONS);
  const manifest = await readJson(path.join(pack, "manifest.json"));
  const index = await readJson(path.join(directory, "index.json"));
  const catalogEntry = await readJson(path.join(directory, "catalog-entry.json"));
  assert.deepEqual(catalogEntry, intendedEntry);
  assert.equal(index.observationType, "fixture-only");
  assert.equal(index.runtimeBehavior, "not-observed");
  assert.equal(index.educationalEffect, "not-observed");
  assert.equal(index.packHash, (await computeDirectoryHash(pack)).hash);
  assert.deepEqual(index.conditions.map(({ condition }) => condition), CONDITIONS);
  let placements = 0;
  for (const condition of index.conditions) {
    assert.ok(isSafeRepositoryPath(condition.descriptor));
    const descriptorBytes = await readFile(path.join(directory, ...condition.descriptor.split("/")));
    assert.equal(condition.descriptorBytes, descriptorBytes.length);
    assert.equal(condition.descriptorSha256, sha256(descriptorBytes));
    const descriptor = JSON.parse(descriptorBytes);
    assert.deepEqual(Object.keys(descriptor).sort(), ["artifacts", "schemaVersion"]);
    assert.equal(descriptor.schemaVersion, 1);
    assert.deepEqual(descriptor.artifacts.map(({ destination }) => destination),
      additions[condition.condition].map((name) => `participant/hc-015/${name}`));
    assert.equal(condition.artifacts.length, descriptor.artifacts.length);
    for (const artifact of descriptor.artifacts) {
      placements += 1;
      assert.deepEqual(Object.keys(artifact).sort(), ["contentFile", "destination"]);
      assert.ok(isSafeRepositoryPath(artifact.contentFile));
      assert.ok(isSafeRepositoryPath(artifact.destination));
      assert.ok(!artifact.destination.startsWith(".hackathon/evidence/"));
      const bytes = await readFile(path.join(directory, ...artifact.contentFile.split("/")));
      const record = condition.artifacts.find(({ destination }) => destination === artifact.destination);
      assert.equal(record.contentFile, artifact.contentFile);
      assert.equal(record.bytes, bytes.length);
      assert.equal(record.sha256, sha256(bytes));
      assert.ok(manifest.allowedAdditions.some((entry) =>
        entry.pattern === artifact.destination && entry.conditions.includes(condition.condition)));
      assert.ok(record.templateOrigins.length > 0);
      for (const origin of record.templateOrigins) {
        const overlay = manifest.overlay.find(({ source }) => source === origin.source);
        assert.ok(overlay.conditions.includes(condition.condition));
        assert.equal(origin.overlayDestination, overlay.destination);
        assert.equal(origin.templateSha256, sha256(await readFile(path.join(pack, ...origin.source.split("/")))));
        assert.ok(origin.derivation.length > 30);
      }
      if (artifact.destination.endsWith("manual-input.txt")) {
        assert.deepEqual(checkManualInput(bytes), FULL_CONTEXT.map(({ path: file, bytes: count, sha256: hash }) =>
          ({ path: file, bytes: count, sha256: hash })));
        assert.deepEqual(record.sourceOrigins.map(({ path: file, bytes: count, sha256: hash }) => [file, count, hash]),
          FULL_CONTEXT.map(({ path: file, bytes: count, sha256: hash }) => [file, count, hash]));
        for (const origin of record.sourceOrigins) {
          assert.equal(origin.sourceKind, "baseline");
          assert.equal(origin.repository, SOURCE_BASELINE.repository);
          assert.equal(origin.commit, SOURCE_BASELINE.commit);
        }
        const javaStart = Buffer.byteLength(MANUAL_PREAMBLE)
          + Buffer.byteLength(`<<<BEGIN FILE ${FULL_CONTEXT[0].path}>>>\n`);
        const java = bytes.subarray(javaStart, javaStart + FULL_CONTEXT[0].bytes).toString("utf8");
        assert.equal(java.split("\n").length - 1, 521);
        assert.match(java.split("\n")[332], /^\s+public SalesOrder allocate\(/u);
        assert.match(java.split("\n")[348], /^\s+\}$/u);
        const xmlStart = bytes.indexOf(Buffer.from(`<<<BEGIN FILE ${FULL_CONTEXT[1].path}>>>\n`))
          + Buffer.byteLength(`<<<BEGIN FILE ${FULL_CONTEXT[1].path}>>>\n`);
        const xml = bytes.subarray(xmlStart, xmlStart + FULL_CONTEXT[1].bytes).toString("utf8");
        assert.match(xml.split("\n")[88], /<import resource="classpath\*:spring\/module-\*\.xml"\/>/u);
      } else {
        const text = bytes.toString("utf8");
        assert.doesNotMatch(text, /TODO|TBD|placeholder|記入してください|ここに記入/iu);
        assert.ok(text.includes("fixture-only"));
        assert.ok(bytes.length > 1000);
      }
    }
  }
  assert.equal(placements, 7);
});
