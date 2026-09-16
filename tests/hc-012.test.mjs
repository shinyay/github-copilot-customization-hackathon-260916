import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadCatalog, validateCatalog } from "../scripts/lib/catalog.mjs";
import { parseNamedArguments } from "../scripts/lib/cli.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../scripts/lib/constants.mjs";
import {
  isSafeRepositoryPath,
  listFilesRecursively,
  readJson,
  readRepositoryFile,
  REPOSITORY_ROOT,
  sha256,
  stableJson,
} from "../scripts/lib/fs-utils.mjs";
import { parseMarkdownProse } from "../scripts/lib/markdown.mjs";
import {
  OPTIONAL_EVIDENCE_NOTICE,
  OPTIONAL_GUIDE_HEADINGS,
  OPTIONAL_SAFETY_NOTICE,
  validateOptionalRoutes,
} from "../scripts/lib/optional-routes.mjs";
import {
  validateChallengePageText,
  validateOptionalGuideText,
  validateOptionalRoutePage,
  validatePublishedPages,
} from "../scripts/lib/pages.mjs";
import {
  validatePackDirectory,
  validatePackManifest,
  validatePublishedPacks,
} from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

const conditions = ["baseline", "tool-set-design"];
// Independent oracle: never infer correctness from two equally wrong records.
const fixedMembers = Object.freeze([
  "search/changes", "search/codebase", "read/problems", "search/usages",
]);
const sourcePaths = [
  "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
  "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
  "wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java",
];
const sourceDigests = [
  [5047, "540035ef9797badbb049502462c9dfc23295dd7124f30d23e757f7ed5e97dde2"],
  [5408, "6fd51123ea20d737192c90ebe9d06bc9cd893e1f352ba31d036c00350237f986"],
  [27073, "4512773a9a39ba25e61b1c1b1d0d9150d8004bfe43fb94617fb1bbe1c4a2ee63"],
];
const evidenceHeadings = {
  "comparison.md": ["Fixed task", "Environment", "Design", "Observations", "Comparison", "Outcome"],
  "recovery.md": ["Case", "Expected boundary", "Observed result", "Restoration", "Non-claims"],
  "membership.md": ["Declared set", "Reconstructed set", "Operations", "Non-claims"],
};
const additions = [
  { pattern: "participant/hc-012/design.md", conditions },
  { pattern: "participant/hc-012/individual-selection.md", conditions: ["baseline"] },
  { pattern: "participant/hc-012/reader.toolsets.jsonc.template", conditions: ["tool-set-design"] },
  { pattern: "participant/hc-012/selection-plan.md", conditions: ["tool-set-design"] },
];
const evidencePatterns = Object.keys(evidenceHeadings).map((name) => ({
  pattern: `.hackathon/evidence/hc-012/${name}`, conditions,
}));

const HC012_CATALOG_ENTRY = {
  id: "HC-012",
  title: "よく使うtoolsを迷わず選べるセットにしよう",
  track: "integrations",
  status: "published",
  sourceLab: {
    ids: ["LAB-12"],
    repository: "shinyay/github-copilot-customization-labs",
    pages: ["docs/labs/lab-12-tool-sets.md"],
  },
  sourceKind: "baseline",
  sourcePaths,
  challengeVersion: 1,
  page: "challenges/hc-012/README.md",
  pack: "challenges/hc-012/pack",
  feature: "Tool Setsの選択・再構成を比べる不活性設計",
  support: {
    primary: "固定sourceを読み、同じ四toolの個別選択と名前付き集合を紙上で設計・比較する",
    fallback: "Profileやtoolの実機操作なしで原稿と再構成を提出し、未対応・未観測を分離する",
  },
  isolation: { tier: "repository", conditionStrategy: "separate-repository" },
  optionalRoutes: [{
    id: "profile-tool-sets",
    title: "Profile Tool Setsの保存元と実効メンバーを確認する",
    page: "challenges/hc-012/optional/profile-tool-sets.md",
    required: false,
    prerequisites: {
      environment: [
        "対応するVS Code StableのLocal Agentで、Chat: Configure Tool Setsと四つの固定参照の実在を本人が確認できること。",
        "別途承認された専用user-data/Profileを使い、既定Profileからの継承・同期・残留を識別できること。",
      ],
      entitlements: [
        "対象環境でのCopilotと既存の四toolの利用資格・policyを本人が確認すること。",
      ],
      additionalApprovals: [
        "環境の所有者から、今回新規作成するTool SetだけのProfile保存・選択・確認・解除について別途明示承認を得ること。",
      ],
    },
    runtimeRequirements: [
      {
        capability: "profile-toolsets-ui",
        status: "not-checked",
        reason: "Runtime v1はChat: Configure Tool Sets、picker、実効メンバーやtool callを検査しない。",
      },
      {
        capability: "external-profile-state",
        status: "not-checked",
        reason: "Runtime v1はrepository外のProfile保存先・継承・同期・残留を検査しない。",
      },
    ],
    liveStatus: "live-unobserved",
    stopReasons: [
      "対応UIがない、固定四参照のいずれかを確認できない、または実効メンバーが一致しない場合は停止する。",
      "既定Profileからの継承・同期・残留を分離できない場合は停止する。",
      "利用資格・所有者承認・実際の保存先が不明、または自分の追加分だけを解除できない場合は停止する。",
      "既存HOME/Profile設定の削除・上書き、追加toolの導入や権限変更が必要なら、このガイドでは実施しない。",
    ],
  }],
};

const challengeRoot = path.join(REPOSITORY_ROOT, "challenges", "hc-012");
const packRoot = path.join(challengeRoot, "pack");
const manifest = await readJson(path.join(packRoot, "manifest.json"));
const core = await readFile(path.join(challengeRoot, "README.md"), "utf8");
const guide = await readFile(path.join(challengeRoot, "optional", "profile-tool-sets.md"), "utf8");
const payload = new Map(await Promise.all(manifest.overlay.map(async ({ source }) => [
  source, await readFile(path.join(packRoot, ...source.split("/"))),
])));
const text = (name) => payload.get(`payload/${name}`).toString("utf8");
const toolContract = JSON.parse(text("tool-members.json.template"));
const sourceLedger = JSON.parse(text("source-materials.json.template"));
const catalogFixture = { challenges: [HC012_CATALOG_ENTRY] };

function assertLf(bytes, label) {
  assert.ok(bytes.length > 0, label);
  assert.equal(bytes.includes(13), false, `${label}: raw CR bytes are forbidden`);
  assert.equal(bytes.at(-1), 10, `${label}: final LF required`);
  assert.notEqual(bytes.subarray(0, 3).toString("hex"), "efbbbf", `${label}: no BOM`);
}

function assertFixedMembers(members) {
  assert.ok(Array.isArray(members), "HC012_MEMBERS_ARRAY");
  assert.equal(members.length, 4, "HC012_MEMBERS_COUNT");
  assert.equal(new Set(members).size, 4, "HC012_MEMBERS_DUPLICATE");
  assert.ok(members.every((member) => fixedMembers.includes(member)), "HC012_MEMBERS_UNKNOWN");
  assert.deepEqual([...members].sort(), [...fixedMembers].sort(), "HC012_MEMBERS_FIXED");
}

function assertDraft(contents) {
  const value = JSON.parse(contents);
  assert.ok(value && typeof value === "object" && !Array.isArray(value), "HC012_DRAFT_OBJECT");
  const entries = Object.entries(value);
  assert.equal(entries.length, 1, "HC012_DRAFT_ONE_GROUP");
  const [name, group] = entries[0];
  assert.ok(name.trim().length > 0, "HC012_DRAFT_NAME");
  assert.deepEqual(Object.keys(group).sort(), ["description", "icon", "tools"], "HC012_DRAFT_FIELDS");
  assertFixedMembers(group.tools);
  for (const property of ["description", "icon"]) {
    assert.ok(typeof group[property] === "string" && group[property].trim(), "HC012_DRAFT_TEXT");
  }
  return group;
}

// These guards check this lesson's records, not arbitrary prose or live product behavior.
function assertToolContract(value) {
  assert.deepEqual(Object.keys(value.expectedMembersByCondition), conditions, "HC012_CONDITION_MEMBERS");
  for (const condition of conditions) assertFixedMembers(value.expectedMembersByCondition[condition]);
  assertFixedMembers(value.cards.map(({ reference }) => reference));
  for (const card of value.cards) {
    assert.ok(typeof card.purpose === "string" && card.purpose.trim(), "HC012_CARD_PURPOSE");
    assert.equal(card.zeroResultsProveCorrectness, false, "HC012_ZERO_RESULTS_ARE_NOT_CORRECTNESS");
  }
  assert.ok(
    value.cards.find(({ reference }) => reference === "search/changes").emptyResultMeaning
      .includes("変更なしは実装の正しさの証拠ではありません。"),
    "HC012_NO_CHANGES_NONCLAIM",
  );
  assert.ok(
    value.cards.find(({ reference }) => reference === "read/problems").emptyResultMeaning
      .includes("診断なしはアプリ全体に不具合がない証明ではありません。"),
    "HC012_NO_DIAGNOSTICS_NONCLAIM",
  );
  assert.deepEqual(value.boundary, {
    addsCapabilities: false,
    grantsPermissions: false,
    actsAsAcl: false,
    automaticallyInvokesAllMembers: false,
    testDefinitionReadingIsExecution: false,
  }, "HC012_SELECTION_IS_NOT_A_GRANT_ACL_OR_CALL");
  assert.deepEqual(value.discovery, {
    command: "Chat: Configure Tool Sets",
    scope: "current-profile-prompts",
    suffix: ".toolsets.jsonc",
    actualAbsolutePath: null,
    status: "not-observed",
  }, "HC012_PROFILE_DISCOVERY_BOUNDARY");
  assert.deepEqual(value.observations, {
    installedTools: "not-checked",
    selectedMembers: null,
    effectiveMembers: null,
    actualCalls: null,
    observedClicks: null,
    elapsedMs: null,
    languageService: "not-checked",
    index: "not-checked",
    runtimeBehavior: "not-observed",
    educationalEffect: "not-observed",
  }, "HC012_LIVE_UNOBSERVED");
}

function assertComparisonRecord(value) {
  for (const layer of ["declared", "reconstructed"]) {
    assert.deepEqual(Object.keys(value[layer]), conditions, "HC012_COMPARISON_CONDITIONS");
    for (const condition of conditions) assertFixedMembers(value[layer][condition]);
    assert.deepEqual([...value[layer].baseline].sort(), [...value[layer]["tool-set-design"]].sort());
  }
  for (const property of ["selectedMembers", "effectiveMembers", "actualCalls", "observedClicks", "elapsedMs"]) {
    assert.equal(value[property], null, "HC012_PLANNED_IS_NOT_OBSERVED");
  }
}

function assertScope(value) {
  assert.deepEqual(value.conditions, conditions, "HC012_CORE_CONDITIONS");
  assert.deepEqual(value.allowedMutations, [], "HC012_NO_SOURCE_MUTATIONS");
  assert.deepEqual(value.allowedAdditions, additions, "HC012_EXACT_ADDITIONS");
  assert.deepEqual(value.submissionFiles, [...additions, ...evidencePatterns], "HC012_EXACT_EXPORTS");
  assert.deepEqual(value.forbiddenActiveCustomizations, [], "HC012_DEFAULT_DENY_UNCHANGED");
  assert.deepEqual(value.isolation, {
    tier: "repository",
    freshWorkspace: true,
    freshConversation: true,
    freshProfile: true,
    freshRepository: true,
    conditionStrategy: "separate-repository",
    branchSafe: false,
  }, "HC012_FRESH_REPOSITORY_ISOLATION");
  for (const entry of value.overlay) {
    assert.deepEqual(entry.conditions, conditions, "HC012_SAME_INPUT_ALL_CONDITIONS");
    assert.equal(entry.allowOverwrite, false, "HC012_NO_OVERWRITE");
    assert.equal(entry.destination, `.hackathon/challenge/hc-012/${entry.source.slice("payload/".length)}`);
    assert.ok(entry.source.startsWith("payload/") && entry.source.endsWith(".template"));
  }
}

function assertEvidence(value, materials = payload) {
  assert.deepEqual(
    value.evidenceRequirements.map(({ path: target }) => target),
    evidencePatterns.map(({ pattern }) => pattern),
    "HC012_THREE_REQUIRED_EVIDENCE_FILES",
  );
  for (const requirement of value.evidenceRequirements) {
    const name = path.posix.basename(requirement.path);
    assert.deepEqual(requirement.conditions, conditions, "HC012_EVIDENCE_ALL_CONDITIONS");
    assert.equal(requirement.stage, "submitted", "HC012_EVIDENCE_SUBMITTED_ONLY");
    assert.deepEqual(requirement.requiredHeadings, evidenceHeadings[name], "HC012_EVIDENCE_DECLARED_HEADINGS");
    const bytes = materials.get(`payload/${name}.template`);
    assert.ok(bytes, "HC012_EVIDENCE_TEMPLATE_REQUIRED");
    assert.deepEqual(
      parseMarkdownProse(bytes.toString("utf8")).sections.map(({ title }) => title),
      evidenceHeadings[name],
      "HC012_EVIDENCE_TEMPLATE_HEADINGS",
    );
    assert.equal(sha256(bytes), requirement.templateSha256, "HC012_EVIDENCE_RAW_HASH");
  }
}

function assertCoreBoundaries(contents) {
  for (const [required, reason] of [
    ["四toolすべての自動呼出し指示でも、ほかのtoolを禁止するACLやsandboxでもありません。", "HC012_CORE_NOT_ACL"],
    ["開く先は**current Profileのpromptsフォルダー**", "HC012_CORE_PROFILE_PATH"],
    ["空結果はアプリ全体に不具合がない証明ではなく", "HC012_CORE_EMPTY_NOT_CORRECT"],
    ["実測クリック数・時間・callはnull", "HC012_CORE_NO_MEASURED_CLICKS"],
    ["テスト定義の読解であり、Java・DB実行ではありません。", "HC012_CORE_TESTS_NOT_EXECUTED"],
  ]) assert.ok(contents.includes(required), reason);
}

function assertProductEvidence(value) {
  assert.equal(value.documentation.url, "https://code.visualstudio.com/docs/agent-customization/tool-sets");
  assert.equal(value.documentation.checkedAt, "2026-09-15");
  assert.equal(value.documentation.checkedBy, "parent-direct-fetch");
  assertFixedMembers(value.documentation.confirmedToolReferences);
  assert.deepEqual(value.documentation.notStated, ["current Profile prompts path", "user Tool Set deprecated flag"]);
  assert.equal(value.designSource.checkedAt, "2026-09-15");
  assert.equal(value.designSource.basis, "approved-design-plan-section-6");
  assert.equal(value.currentSourceRetrieval.status, "unverified-here", "HC012_CURRENT_SOURCE_NOT_RETRIEVED");
  assert.equal(value.currentSourceRetrieval.httpStatus, 403);
  assert.equal(value.currentSourceRetrieval.bypassAttempted, false);
  assert.equal(value.liveUi, "not-observed", "HC012_DOCUMENTATION_IS_NOT_LIVE_UI");
  assert.equal(value.actualProfilePath, null);
}

function assertJsonMutation({ original, mutate, postImage, validate, reason }) {
  const originalBytes = stableJson(original);
  let candidate = JSON.parse(originalBytes);
  validate(candidate);
  mutate(candidate);
  postImage(candidate);
  assert.notEqual(stableJson(candidate), originalBytes, "Mutation must land");
  assert.throws(() => validate(candidate), reason);
  candidate = JSON.parse(originalBytes);
  assert.equal(stableJson(candidate), originalBytes, "Restore the complete original serialization");
  validate(candidate);
}

test("HC012 independently validates Pack v1 and exact inert grants/exports for two conditions", async () => {
  const result = await validatePackDirectory(packRoot, "HC-012");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(validatePackManifest(manifest, "HC-012"), []);
  assertScope(manifest);
  for (const key of ["schemaVersion", "challengeVersion", "minimumTemplateVersion"]) assert.equal(manifest[key], 1);
  assert.equal(manifest.challengeId, "HC-012");
  assert.deepEqual(manifest.cleanup, {
    advisory: true, verifyBaseline: true, exportSubmission: true, stopProcesses: true, archiveRepository: true,
  });
  assert.deepEqual(result.files.sort(), ["manifest.json", ...manifest.overlay.map(({ source }) => source)].sort());
  assert.equal(manifest.overlay.length, 10);
  assert.ok(result.files.every((file) => file === "manifest.json" || file.endsWith(".template")));
  assert.ok(additions.every(({ pattern }) => !pattern.includes("*") && !pattern.startsWith(".hackathon/")));
  for (const file of await listFilesRecursively(challengeRoot)) {
    assertLf(await readFile(path.join(challengeRoot, ...file.split("/"))), file);
  }
  assertLf(await readFile(new URL(import.meta.url)), "tests/hc-012.test.mjs");
});

test("HC012 scoped page/pack helpers and plans work before shared catalog publication", async () => {
  assert.deepEqual(await validatePublishedPages(catalogFixture), []);
  assert.deepEqual(await validatePublishedPacks(catalogFixture), []);
  const plans = conditions.map((condition) => buildRunPlan(catalogFixture, manifest, {
    challengeId: "HC-012", condition, team: "fixture", runId: `hc012-${condition}`,
  }));
  assert.deepEqual(plans[0].filesToInject, plans[1].filesToInject);
  assert.deepEqual(plans[0].runStateEvidence, plans[1].runStateEvidence);
  for (const plan of plans) {
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.participantChanges.activeCustomizationsDefault, "deny");
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.deepEqual(plan.participantChanges.allowedAdditions, additions.filter(({ conditions: selected }) => selected.includes(plan.condition)));
    assert.equal(plan.runStateEvidence.length, 3);
    assert.equal(plan.cleanup.checks.every(({ verification }) => verification === "not-observed"), true);
  }
  const actualCatalog = await loadCatalog();
  const actual = actualCatalog.challenges.find(({ id }) => id === "HC-012");
  for (const key of ["id", "title", "track", "sourceLab"]) assert.deepEqual(actual[key], HC012_CATALOG_ENTRY[key]);
  if (actual.status === "published") assert.deepEqual(actual, HC012_CATALOG_ENTRY);
  const intendedCatalog = structuredClone(actualCatalog);
  intendedCatalog.challenges[intendedCatalog.challenges.findIndex(({ id }) => id === "HC-012")] = HC012_CATALOG_ENTRY;
  assert.deepEqual(validateCatalog(intendedCatalog), []);
});

test("HC012 pins real source provenance separately from Labs and hashes every nonrecursive output", async () => {
  const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));
  assert.equal(HC012_CATALOG_ENTRY.sourceKind, "baseline");
  assert.equal(sourceLedger.sourceKind, "baseline");
  assert.equal(sourceLedger.authoringReference.repository, "shinyay/github-copilot-customization-labs");
  assert.equal(sourceLedger.authoringReference.commit, "3474d21dd62bad2e594e84657dabe2eb9bb876c1");
  assert.equal(sourceLedger.sourceBaseline.repository, "shinyay/code-to-doc-workshop-260910");
  assert.equal(sourceLedger.sourceBaseline.commit, "398d7d1982a1402bcdba00d6c3ded67d8d338787");
  assert.notEqual(sourceLedger.sourceBaseline.commit, sourceLedger.authoringReference.commit);
  assert.equal(sourceLedger.sourceBaseline.fileCount, 515);
  assert.equal(sourceLedger.sourceBaseline.treeSha256, "c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111");
  assert.deepEqual(sourceLedger.sourceBaseline.files.map(({ path: sourcePath }) => sourcePath), sourcePaths);
  sourceLedger.sourceBaseline.files.forEach((file, index) => {
    assert.ok(inventory.paths.includes(file.path));
    assert.equal(file.labsVendoredPath, `fixtures/tsubame-wholesale/${file.path}`);
    assert.deepEqual([file.bytes, file.sha256], sourceDigests[index]);
    assert.ok(file.readingAnchors.length > 0 && file.adaptation.length > 0);
    for (const contents of [core, text("brief.md.template"), text("request.txt.template")]) assert.ok(contents.includes(file.path));
  });
  assert.deepEqual(sourceLedger.authoringReference.materials.map(({ path: sourcePath, bytes, sha256: digest }) => [sourcePath, bytes, digest]), [
    ["docs/labs/lab-12-tool-sets.md", 13347, "6f85c966642650359dec819f6fb503209ae9bcb152a5f157009230090d0e11ed"],
    ["examples/integrations/toolsets/wholesale-reader.toolsets.jsonc.template", 306, "89f22a292ca913b1890b5baa8c4391f29e3476d39615710e0bfc8e2c61974f95"],
  ]);
  const outputPaths = [...payload.keys()].filter((name) => name !== "payload/source-materials.json.template").sort();
  assert.deepEqual(sourceLedger.outputs.map(({ path: output }) => output).sort(), outputPaths);
  for (const output of sourceLedger.outputs) {
    assert.equal(output.sha256, sha256(payload.get(output.path)), output.path);
    assert.ok(output.origins.length > 0 && output.adaptations.every((adaptation) => adaptation.trim()));
  }
  assert.equal(sha256(payload.get("payload/reader.toolsets.jsonc.template")), sourceLedger.authoringReference.materials[1].sha256);
  assert.match(sourceLedger.labelPolicy, /SYNTHETIC_TRAINING_ONLY/u);
  assert.match(sourceLedger.sourceBaseline.use, /実行していない/u);
  assertProductEvidence(sourceLedger.productEvidence);
  for (const [name, bytes] of payload) {
    assert.doesNotMatch(bytes.toString("utf8"), /answer[-_]key|expectedClassification|teacherAnswer|instructor\/|public (?:final )?class /iu, name);
  }
});

test("HC012 keeps today's documentation retrieval separate from design-source provenance and live UI", () => {
  assertProductEvidence(sourceLedger.productEvidence);
  for (const contents of [core, guide]) {
    assert.ok(contents.includes("制作担当が2026-09-15に直接取得して確認しました。"));
    assert.ok(contents.includes("Profile保存先とdeprecated flagは、この公式ページ本文の記載ではありません。"));
    assert.ok(contents.includes("設計時のsource確認日は2026-09-15です。今回のsource再取得は未確認です"));
    assert.ok(contents.includes("SSO 403"));
    assert.ok(contents.includes("別認証・raw URLでの迂回は行っていません"));
  }
  assertJsonMutation({
    original: sourceLedger.productEvidence,
    mutate: (value) => { value.currentSourceRetrieval.status = "verified"; },
    postImage: (value) => assert.equal(value.currentSourceRetrieval.status, "verified"),
    validate: assertProductEvidence,
    reason: /HC012_CURRENT_SOURCE_NOT_RETRIEVED/u,
  });
  assertJsonMutation({
    original: sourceLedger.productEvidence,
    mutate: (value) => { value.liveUi = "verified"; },
    postImage: (value) => assert.equal(value.liveUi, "verified"),
    validate: assertProductEvidence,
    reason: /HC012_DOCUMENTATION_IS_NOT_LIVE_UI/u,
  });
});

test("HC012 page is standalone with exactly thirteen substantive headings and safe exact commands", () => {
  assert.equal(core.split("\n")[0], `# HC-012 ${HC012_CATALOG_ENTRY.title}`);
  assert.deepEqual(validateChallengePageText("HC-012", core), []);
  const sections = parseMarkdownProse(core).sections;
  assert.deepEqual(sections.map(({ title }) => title), REQUIRED_CHALLENGE_HEADINGS);
  assert.ok(sections.every(({ body }) => body.trim().length > 0));
  assertCoreBoundaries(core);
  for (const term of [
    "Baseline", "Customized", "SYNTHETIC_TRAINING_ONLY", "Open Question", "追加不要", "carryover",
    "strict-JSON subset", "installed Stable", "deprecated: true", "Chat: Configure Tool Sets",
    "実際に開いた絶対パス", "原稿の保存", "実効メンバー", "初回", "再設定", "第三conditionではありません",
    "515-file baseline", "二つの運用override", "自己点検", "Challenge-specific design", "not-observed",
  ]) assert.ok(core.includes(term), term);
  for (const command of [
    "node scripts\\plan-run.mjs --dry-run --challenge HC-012 --condition baseline",
    "node scripts\\plan-run.mjs --dry-run --challenge HC-012 --condition tool-set-design",
    "node scripts\\build-pack.mjs --challenge HC-012 --output .runtime/packs",
    "git switch -c hc-012-baseline-individual-01",
    "git switch -c hc-012-tool-set-design-set-01",
    "node .hackathon\\scripts\\verify-template.mjs",
    "node .hackathon\\scripts\\apply-pack.mjs $pack --team team-sora --condition baseline",
    "node .hackathon\\scripts\\apply-pack.mjs $pack --team team-sora --condition tool-set-design",
    "node .hackathon\\scripts\\verify-run.mjs $pack --stage in-progress",
    "node .hackathon\\scripts\\verify-run.mjs $pack --stage submitted",
    "node .hackathon\\scripts\\export-submission.mjs $pack",
    "node scripts\\plan-run.mjs --dry-run --challenge HC-012 --route profile-tool-sets",
  ]) assert.ok(core.includes(command), command);
  const compare = core.split("## Compare\n")[1].split("\n## Evidence")[0];
  for (const condition of conditions) {
    const row = compare.split("\n").find((line) => line.startsWith(`| \`${condition}\` |`));
    assert.ok(row, condition);
    assertFixedMembers([...row.matchAll(/`((?:search|read)\/[^`]+)`/gu)].map((match) => match[1]));
  }
  assert.doesNotMatch(core, /git add (?:-f|--force)|about:blank|mvn (?:test|verify)|npm install|rm -rf/u);
});

test("HC012 common request, explanation cards and draft preserve the fixed four references", () => {
  assertToolContract(toolContract);
  const group = assertDraft(text("reader.toolsets.jsonc.template"));
  assertFixedMembers(group.tools);
  assert.equal(group.icon, "book");
  const request = text("request.txt.template");
  for (const condition of conditions) assert.ok(request.includes(`${condition}:`));
  for (const term of ["三ファイルだけ", "replay", "canonicalHash", "関連するテスト定義", "同じbytes", "紙上"]) {
    const combined = request + text("brief.md.template");
    assert.ok(combined.includes(term), term);
  }
  assert.match(request, /片方だけ入力を要約・省略/u);
  assert.match(text("design.md.template"), /SYNTHETIC_TRAINING_ONLY/u);
  assert.match(text("selection-worksheet.md.template"), /SYNTHETIC_TRAINING_ONLY/u);
  assert.doesNotMatch(text("reader.toolsets.jsonc.template"), /\/\*|\/\/|,\s*[}\]]/u);
});

test("HC012 membership negatives land and restore: one missing, both same three, wrong four, extra, duplicate, unknown", () => {
  const record = {
    declared: structuredClone(toolContract.expectedMembersByCondition),
    reconstructed: structuredClone(toolContract.expectedMembersByCondition),
    selectedMembers: null, effectiveMembers: null, actualCalls: null, observedClicks: null, elapsedMs: null,
  };
  const cases = [
    {
      mutate: (value) => value.declared["tool-set-design"].pop(),
      postImage: (value) => assert.deepEqual(value.declared["tool-set-design"], fixedMembers.slice(0, 3)),
      reason: /HC012_MEMBERS_COUNT/u,
    },
    {
      mutate: (value) => { for (const condition of conditions) value.declared[condition].pop(); },
      postImage: (value) => {
        assert.deepEqual(value.declared.baseline, value.declared["tool-set-design"]);
        assert.deepEqual(value.declared.baseline, fixedMembers.slice(0, 3));
      },
      reason: /HC012_MEMBERS_COUNT/u,
    },
    {
      mutate: (value) => { for (const condition of conditions) value.reconstructed[condition][3] = "fixture/unknown"; },
      postImage: (value) => {
        assert.deepEqual(value.reconstructed.baseline, value.reconstructed["tool-set-design"]);
        assert.equal(value.reconstructed.baseline.length, 4);
        assert.equal(value.reconstructed.baseline[3], "fixture/unknown");
      },
      reason: /HC012_MEMBERS_UNKNOWN/u,
    },
    {
      mutate: (value) => value.reconstructed.baseline.push("fixture/extra"),
      postImage: (value) => assert.deepEqual(value.reconstructed.baseline, [...fixedMembers, "fixture/extra"]),
      reason: /HC012_MEMBERS_COUNT/u,
    },
    {
      mutate: (value) => { value.reconstructed["tool-set-design"][3] = value.reconstructed["tool-set-design"][0]; },
      postImage: (value) => assert.deepEqual(value.reconstructed["tool-set-design"], [...fixedMembers.slice(0, 3), fixedMembers[0]]),
      reason: /HC012_MEMBERS_DUPLICATE/u,
    },
    {
      mutate: (value) => { value.declared.baseline[0] = "fixture/unknown"; },
      postImage: (value) => assert.deepEqual(value.declared.baseline, ["fixture/unknown", ...fixedMembers.slice(1)]),
      reason: /HC012_MEMBERS_UNKNOWN/u,
    },
    {
      mutate: (value) => { value.reconstructed.baseline = []; },
      postImage: (value) => assert.deepEqual(value.reconstructed.baseline, []),
      reason: /HC012_MEMBERS_COUNT/u,
    },
    {
      mutate: (value) => { value.observedClicks = 6; },
      postImage: (value) => assert.equal(value.observedClicks, 6),
      reason: /HC012_PLANNED_IS_NOT_OBSERVED/u,
    },
  ];
  for (const entry of cases) assertJsonMutation({ original: record, validate: assertComparisonRecord, ...entry });
});

test("HC012 draft negatives use JSON.parse, preserve open naming, and never repair malformed JSONC", () => {
  const original = text("reader.toolsets.jsonc.template");
  const group = assertDraft(original);
  assertDraft(stableJson({ anotherReader: { ...group, description: "別の読者向けに書いた選択の説明。" } }));
  for (const [mutate, postImage, reason] of [
    [(value) => value.wholesaleReader.tools.pop(), (value) => assert.equal(value.wholesaleReader.tools.length, 3), /HC012_MEMBERS_COUNT/u],
    [(value) => { value.wholesaleReader.tools[3] = value.wholesaleReader.tools[0]; }, (value) => assert.equal(new Set(value.wholesaleReader.tools).size, 3), /HC012_MEMBERS_DUPLICATE/u],
    [(value) => { value.extraReader = structuredClone(value.wholesaleReader); }, (value) => assert.equal(Object.keys(value).length, 2), /HC012_DRAFT_ONE_GROUP/u],
    [(value) => { value.wholesaleReader.permission = "allow"; }, (value) => assert.equal(value.wholesaleReader.permission, "allow"), /HC012_DRAFT_FIELDS/u],
  ]) assertJsonMutation({ original: JSON.parse(original), mutate, postImage, validate: (value) => assertDraft(stableJson(value)), reason });
  for (const malformed of [
    original.replace('  "wholesaleReader": {', '  // fixture-only invalid subset\n  "wholesaleReader": {'),
    original.replace('"icon": "book"', '"icon": "book",'),
  ]) {
    assert.notEqual(malformed, original);
    assert.ok(malformed.includes("// fixture-only") || malformed.includes('"icon": "book",'));
    assert.throws(() => assertDraft(malformed), SyntaxError);
    const restored = Buffer.from(original, "utf8").toString("utf8");
    assert.equal(restored, original);
    assertDraft(restored);
  }
});

test("HC012 source/tool non-claim mutations reject zero-result correctness, ACLs, false discovery and fabricated observations", () => {
  const cases = [
    {
      mutate: (value) => { value.cards[2].zeroResultsProveCorrectness = true; },
      postImage: (value) => assert.equal(value.cards[2].zeroResultsProveCorrectness, true),
      reason: /HC012_ZERO_RESULTS_ARE_NOT_CORRECTNESS/u,
    },
    {
      mutate: (value) => { value.cards[2].emptyResultMeaning = "診断なしはアプリ全体に不具合がない証明です。"; },
      postImage: (value) => assert.equal(value.cards[2].emptyResultMeaning, "診断なしはアプリ全体に不具合がない証明です。"),
      reason: /HC012_NO_DIAGNOSTICS_NONCLAIM/u,
    },
    {
      mutate: (value) => { value.cards[0].emptyResultMeaning = "変更なしは実装が正しい証拠です。"; },
      postImage: (value) => assert.equal(value.cards[0].emptyResultMeaning, "変更なしは実装が正しい証拠です。"),
      reason: /HC012_NO_CHANGES_NONCLAIM/u,
    },
    ...["addsCapabilities", "grantsPermissions", "actsAsAcl", "automaticallyInvokesAllMembers", "testDefinitionReadingIsExecution"].map((property) => ({
      mutate: (value) => { value.boundary[property] = true; },
      postImage: (value) => assert.equal(value.boundary[property], true),
      reason: /HC012_SELECTION_IS_NOT_A_GRANT_ACL_OR_CALL/u,
    })),
    {
      mutate: (value) => { value.discovery.scope = ".vscode/toolsets.jsonc"; },
      postImage: (value) => assert.equal(value.discovery.scope, ".vscode/toolsets.jsonc"),
      reason: /HC012_PROFILE_DISCOVERY_BOUNDARY/u,
    },
    {
      mutate: (value) => { value.discovery.suffix = ".jsonc"; },
      postImage: (value) => assert.equal(value.discovery.suffix, ".jsonc"),
      reason: /HC012_PROFILE_DISCOVERY_BOUNDARY/u,
    },
    {
      mutate: (value) => { value.observations.actualCalls = []; },
      postImage: (value) => assert.deepEqual(value.observations.actualCalls, []),
      reason: /HC012_LIVE_UNOBSERVED/u,
    },
  ];
  for (const entry of cases) assertJsonMutation({ original: toolContract, validate: assertToolContract, ...entry });
});

test("HC012 prose-boundary regressions are targeted mutations with complete restoration", () => {
  for (const [before, after, reason] of [
    ["四toolすべての自動呼出し指示でも、ほかのtoolを禁止するACLやsandboxでもありません。", "四toolすべてを自動呼出しし、ほかのtoolを禁止するACLです。", /HC012_CORE_NOT_ACL/u],
    ["開く先は**current Profileのpromptsフォルダー**", "開く先は**.vscode/toolsets.jsonc**", /HC012_CORE_PROFILE_PATH/u],
    ["空結果はアプリ全体に不具合がない証明ではなく", "空結果はアプリ全体に不具合がない証明であり", /HC012_CORE_EMPTY_NOT_CORRECT/u],
    ["テスト定義の読解であり、Java・DB実行ではありません。", "テスト定義の読解をJava・DB実行の成功として報告します。", /HC012_CORE_TESTS_NOT_EXECUTED/u],
  ]) {
    assertCoreBoundaries(core);
    const changed = core.replace(before, after);
    assert.ok(changed.includes(after));
    assert.equal(changed.includes(before), false);
    assert.throws(() => assertCoreBoundaries(changed), reason);
    const restored = changed.replace(after, before);
    assert.equal(restored, core);
    assertCoreBoundaries(restored);
    assert.deepEqual(validateChallengePageText("HC-012", restored), []);
  }
});

test("HC012 Evidence is exactly three submitted-only run-state files with independent heading and raw-hash oracles", () => {
  assertEvidence(manifest);
  assert.equal(manifest.allowedAdditions.some(({ pattern }) => pattern.startsWith(".hackathon/")), false);
  assert.deepEqual(manifest.submissionFiles, [...additions, ...evidencePatterns]);
  for (const name of Object.keys(evidenceHeadings)) {
    assert.match(text(`${name}.template`), /runtimeBehavior: not-observed/u);
    assert.match(text(`${name}.template`), /educationalEffect: not-observed/u);
  }
  for (const [mutate, postImage, reason] of [
    [(value) => value.evidenceRequirements.pop(), (value) => assert.equal(value.evidenceRequirements.length, 2), /HC012_THREE_REQUIRED_EVIDENCE_FILES/u],
    [(value) => { value.evidenceRequirements[0].templateSha256 = "0".repeat(64); }, (value) => assert.equal(value.evidenceRequirements[0].templateSha256, "0".repeat(64)), /HC012_EVIDENCE_RAW_HASH/u],
    [(value) => { value.evidenceRequirements[2].conditions = ["baseline"]; }, (value) => assert.deepEqual(value.evidenceRequirements[2].conditions, ["baseline"]), /HC012_EVIDENCE_ALL_CONDITIONS/u],
  ]) assertJsonMutation({ original: manifest, mutate, postImage, validate: assertEvidence, reason });
  const snapshots = [...payload].map(([name, bytes]) => [name, Buffer.from(bytes)]);
  for (const [kind, expected] of [
    ["missing", /HC012_EVIDENCE_TEMPLATE_REQUIRED/u],
    ["heading", /HC012_EVIDENCE_TEMPLATE_HEADINGS/u],
    ["bytes", /HC012_EVIDENCE_RAW_HASH/u],
  ]) {
    let materials = new Map(snapshots.map(([name, bytes]) => [name, Buffer.from(bytes)]));
    assertEvidence(manifest, materials);
    const key = "payload/membership.md.template";
    if (kind === "missing") {
      materials.delete(key);
      assert.equal(materials.has(key), false);
    } else {
      const original = materials.get(key).toString("utf8");
      const changed = kind === "heading"
        ? original.replace("## Operations\n", "## Missing operations\n")
        : original.replace("今回のcondition", "負例のcondition");
      assert.notEqual(changed, original);
      assert.ok(changed.includes(kind === "heading" ? "## Missing operations\n" : "負例のcondition"));
      materials.set(key, Buffer.from(changed, "utf8"));
    }
    assert.throws(() => assertEvidence(manifest, materials), expected);
    materials = new Map(snapshots.map(([name, bytes]) => [name, Buffer.from(bytes)]));
    assert.deepEqual([...materials], snapshots);
    assertEvidence(manifest, materials);
  }
});

test("HC012 actual manifest helper rejects targeted boundary mutations then accepts fully restored data", () => {
  const originalBytes = stableJson(manifest);
  const cases = [
    [(value) => { value.overlay[0].destination = ".vscode/toolsets.jsonc"; }, (value) => assert.equal(value.overlay[0].destination, ".vscode/toolsets.jsonc"), "PACK_INERT_DESTINATION"],
    [(value) => { value.overlay[0].source = "payload/reader.toolsets.jsonc"; }, (value) => assert.equal(value.overlay[0].source, "payload/reader.toolsets.jsonc"), "PACK_INERT_SOURCE"],
    [(value) => { value.overlay[0].allowOverwrite = true; }, (value) => assert.equal(value.overlay[0].allowOverwrite, true), "PACK_OVERWRITE_DEFAULT_DENY"],
    [(value) => { value.overlay[0].conditions = ["profile-tool-sets"]; }, (value) => assert.deepEqual(value.overlay[0].conditions, ["profile-tool-sets"]), "PACK_CONDITION_UNKNOWN"],
    [(value) => { value.isolation.branchSafe = true; }, (value) => assert.equal(value.isolation.branchSafe, true), "PACK_BRANCH_SAFETY"],
    [(value) => value.allowedAdditions.push({ pattern: "AGENTS.md", conditions: ["baseline"] }), (value) => assert.deepEqual(value.allowedAdditions.at(-1), { pattern: "AGENTS.md", conditions: ["baseline"] }), "PACK_BASELINE_ACTIVE_CUSTOMIZATION"],
    [(value) => value.allowedAdditions.push({ pattern: evidencePatterns[0].pattern, conditions }), (value) => assert.equal(value.allowedAdditions.at(-1).pattern, evidencePatterns[0].pattern), "PACK_ADDITION_RESERVED_PATH"],
    [(value) => { value.evidenceRequirements[0].stage = "in-progress"; }, (value) => assert.equal(value.evidenceRequirements[0].stage, "in-progress"), "PACK_EVIDENCE_STAGE"],
    [(value) => { value.grant = "profile"; }, (value) => assert.equal(value.grant, "profile"), "PACK_TOP_LEVEL_SHAPE"],
  ];
  for (const [mutate, postImage, expected] of cases) {
    let value = JSON.parse(originalBytes);
    assert.deepEqual(validatePackManifest(value, "HC-012"), []);
    mutate(value);
    postImage(value);
    assert.notEqual(stableJson(value), originalBytes);
    assertErrorCode(validatePackManifest(value, "HC-012"), expected);
    value = JSON.parse(originalBytes);
    assert.equal(stableJson(value), originalBytes);
    assert.deepEqual(validatePackManifest(value, "HC-012"), []);
    assertScope(value);
  }
});

test("HC012 local scope also rejects active customized grants, source writes, broad additions and missing exports", () => {
  const cases = [
    {
      mutate: (value) => value.allowedAdditions.push({ pattern: ".github/copilot-instructions.md", conditions: ["tool-set-design"] }),
      postImage: (value) => assert.deepEqual(value.allowedAdditions.at(-1), { pattern: ".github/copilot-instructions.md", conditions: ["tool-set-design"] }),
      reason: /HC012_EXACT_ADDITIONS/u,
    },
    {
      mutate: (value) => value.allowedMutations.push({ path: sourcePaths[0], conditions }),
      postImage: (value) => assert.deepEqual(value.allowedMutations, [{ path: sourcePaths[0], conditions }]),
      reason: /HC012_NO_SOURCE_MUTATIONS/u,
    },
    {
      mutate: (value) => { value.allowedAdditions[0].pattern = "participant/hc-012/**"; },
      postImage: (value) => assert.equal(value.allowedAdditions[0].pattern, "participant/hc-012/**"),
      reason: /HC012_EXACT_ADDITIONS/u,
    },
    {
      mutate: (value) => value.submissionFiles.splice(2, 1),
      postImage: (value) => assert.equal(value.submissionFiles.some(({ pattern }) => pattern === additions[2].pattern), false),
      reason: /HC012_EXACT_EXPORTS/u,
    },
    {
      mutate: (value) => { value.overlay[0].conditions = ["baseline"]; },
      postImage: (value) => assert.deepEqual(value.overlay[0].conditions, ["baseline"]),
      reason: /HC012_SAME_INPUT_ALL_CONDITIONS/u,
    },
    {
      mutate: (value) => { value.isolation.freshProfile = false; },
      postImage: (value) => assert.equal(value.isolation.freshProfile, false),
      reason: /HC012_FRESH_REPOSITORY_ISOLATION/u,
    },
  ];
  for (const entry of cases) assertJsonMutation({ original: manifest, validate: assertScope, ...entry });
});

test("HC012 has exactly one closed optional guide, reciprocal links and six literal safety sections", async () => {
  const route = HC012_CATALOG_ENTRY.optionalRoutes[0];
  assert.deepEqual(await readdir(path.join(challengeRoot, "optional")), ["profile-tool-sets.md"]);
  assert.deepEqual(validateOptionalRoutes(HC012_CATALOG_ENTRY), []);
  assert.deepEqual(validateOptionalGuideText(HC012_CATALOG_ENTRY, route, guide), []);
  assert.deepEqual(await validateOptionalRoutePage(HC012_CATALOG_ENTRY, route, core), []);
  const sections = parseMarkdownProse(guide).sections;
  assert.deepEqual(sections.map(({ title }) => title), OPTIONAL_GUIDE_HEADINGS);
  assert.ok(sections.every(({ body }) => body.trim()));
  assert.ok(sections.find(({ title }) => title === "Permissions / Safety").body.includes(OPTIONAL_SAFETY_NOTICE));
  assert.ok(sections.find(({ title }) => title === "Evidence / Non-claims").body.includes(OPTIONAL_EVIDENCE_NOTICE));
  for (const term of [
    "OPTIONAL_GUIDE_ONLY", "live-unobserved", "currentProfile.promptsHome", "RawToolSetsShape.suffix",
    "実際の絶対パス", "Chat: Configure Tool Sets", "deprecated: true", "installed Stable",
    "既定Profileからの継承・同期・残留", "別途明示承認", "自分が今回新規作成した集合だけ",
  ]) assert.ok(guide.includes(term), term);
  for (const [page, contents] of [[HC012_CATALOG_ENTRY.page, core], [route.page, guide]]) {
    for (const link of parseMarkdownProse(contents).links) {
      if (/^[a-z][a-z0-9+.-]*:|^#/iu.test(link)) continue;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(page), decodeURIComponent(link.split("#")[0].split("?")[0])));
      await readRepositoryFile(target);
    }
  }
  const plan = buildRunPlan(catalogFixture, undefined, { challengeId: "HC-012", route: route.id });
  assert.equal(plan.mode, "optional-guide");
  assert.equal(plan.liveStatus, "live-unobserved");
  assert.deepEqual(plan.runtimeRequirements.map(({ capability, status }) => [capability, status]), [
    ["profile-toolsets-ui", "not-checked"], ["external-profile-state", "not-checked"],
  ]);
  assert.deepEqual(plan.readiness, {
    status: "not-checked", environment: "not-checked", entitlements: "not-checked",
    additionalApprovals: "not-checked", runtimeCapabilities: "not-checked",
  });
  for (const key of ["condition", "conditions", "pack", "filesToInject", "participantChanges", "runStateEvidence", "grant"]) {
    assert.equal(Object.hasOwn(plan, key), false, key);
  }
});

test("HC012 optional guide regressions fail for the intended metadata, safety or mixed-mode reason", () => {
  const originalBytes = stableJson(HC012_CATALOG_ENTRY);
  for (const [mutate, postImage, expected] of [
    [(value) => { value.optionalRoutes[0].conditions = ["baseline"]; }, (value) => assert.deepEqual(value.optionalRoutes[0].conditions, ["baseline"]), "CATALOG_OPTIONAL_ROUTE_SHAPE"],
    [(value) => { value.optionalRoutes[0].runtimeRequirements[0].status = "verified"; }, (value) => assert.equal(value.optionalRoutes[0].runtimeRequirements[0].status, "verified"), "CATALOG_OPTIONAL_RUNTIME"],
    [(value) => { value.optionalRoutes[0].liveStatus = "live-verified"; }, (value) => assert.equal(value.optionalRoutes[0].liveStatus, "live-verified"), "CATALOG_OPTIONAL_ROUTE_GUIDE"],
  ]) {
    let value = JSON.parse(originalBytes);
    assert.deepEqual(validateOptionalRoutes(value), []);
    mutate(value);
    postImage(value);
    assertErrorCode(validateOptionalRoutes(value), expected);
    value = JSON.parse(originalBytes);
    assert.equal(stableJson(value), originalBytes);
    assert.deepEqual(validateOptionalRoutes(value), []);
  }
  const route = HC012_CATALOG_ENTRY.optionalRoutes[0];
  const changed = guide.replace(OPTIONAL_SAFETY_NOTICE, "権限を付与するという誤った合成負例。");
  assert.equal(changed.includes(OPTIONAL_SAFETY_NOTICE), false);
  assertErrorCode(validateOptionalGuideText(HC012_CATALOG_ENTRY, route, changed), "OPTIONAL_PAGE_SAFETY");
  const restored = changed.replace("権限を付与するという誤った合成負例。", OPTIONAL_SAFETY_NOTICE);
  assert.equal(restored, guide);
  assert.deepEqual(validateOptionalGuideText(HC012_CATALOG_ENTRY, route, restored), []);
  for (const [key, value, argument] of [["condition", "baseline", "condition"], ["team", "fixture", "team"], ["runId", "fixture", "run"]]) {
    assert.throws(() => buildRunPlan(catalogFixture, undefined, {
      challengeId: "HC-012", route: route.id, [key]: value,
    }), { message: `Optional guide route profile-tool-sets cannot be combined with --${argument}` });
  }
  assert.equal(buildRunPlan(catalogFixture, undefined, { challengeId: "HC-012", route: route.id }).mode, "optional-guide");
});

test("HC012 real CLI rejection probes have no process error, null signal, integer status and exact reason", () => {
  const args = parseNamedArguments(["--dry-run", "--challenge", "HC-012", "--route", "profile-tool-sets"], { booleanNames: ["dry-run"] });
  assert.deepEqual(args, { "dry-run": true, challenge: "HC-012", route: "profile-tool-sets" });
  assert.equal(buildRunPlan(catalogFixture, undefined, { challengeId: args.challenge, route: args.route }).mode, "optional-guide");
  for (const [argv, expected] of [
    [["--dry-run", "--challenge", "HC-012", "--route", "profile-tool-sets", "--activate", "yes"], "Unknown argument: --activate"],
    [["--dry-run", "--dry-run", "--challenge", "HC-012"], "Duplicate argument: --dry-run"],
    [["--dry-run", "--challenge", "HC-012", "--condition", "baseline", "--team", "fixture"], "Missing required argument: --run"],
  ]) {
    const result = spawnSync(process.execPath, [path.join(REPOSITORY_ROOT, "scripts", "plan-run.mjs"), ...argv], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
      timeout: 20_000,
      shell: false,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    assert.equal(Number.isInteger(result.status), true);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr.trim(), expected);
  }
});

// Session-only acceptance artifacts stay outside the distributable Pack and CI tree.
if (process.env.HC012_MATERIALIZATIONS) {
  test("HC012 session descriptors cover all five granted placements with actual applied-template origins", async () => {
    const root = path.resolve(process.env.HC012_MATERIALIZATIONS);
    const index = JSON.parse(await readRepositoryFile("index.json", root));
    const intended = JSON.parse(await readRepositoryFile("catalog-entry.json", root));
    assert.deepEqual(intended, HC012_CATALOG_ENTRY);
    assert.equal(index.schemaVersion, 1);
    assert.equal(index.challengeId, "HC-012");
    assert.match(index.kind, /SYNTHETIC_TRAINING_ONLY.*fixture-only/u);
    assertFixedMembers(index.fixedReferenceOracle);
    assert.deepEqual(index.conditions.map(({ condition }) => condition), conditions);
    let placements = 0;
    const records = {};
    const commonDesigns = [];
    for (const entry of index.conditions) {
      assert.ok(isSafeRepositoryPath(entry.descriptor));
      const descriptor = JSON.parse(await readRepositoryFile(entry.descriptor, root));
      assert.deepEqual(Object.keys(descriptor).sort(), ["artifacts", "schemaVersion"]);
      assert.equal(descriptor.schemaVersion, 1);
      const granted = additions.filter(({ conditions: selected }) => selected.includes(entry.condition)).map(({ pattern }) => pattern);
      assert.deepEqual(descriptor.artifacts.map(({ destination }) => destination), granted);
      assert.deepEqual(entry.artifacts.map(({ destination }) => destination), granted);
      assert.equal(new Set(descriptor.artifacts.map(({ destination }) => destination)).size, granted.length);
      for (const artifact of descriptor.artifacts) {
        placements++;
        assert.deepEqual(Object.keys(artifact).sort(), ["contentFile", "destination"]);
        assert.ok(isSafeRepositoryPath(artifact.destination));
        assert.ok(granted.includes(artifact.destination) && !artifact.destination.startsWith(".hackathon/"));
        assert.equal(artifact.contentFile.includes("\\"), false);
        assert.equal(path.posix.isAbsolute(artifact.contentFile), false);
        const relative = path.posix.normalize(path.posix.join(path.posix.dirname(entry.descriptor), artifact.contentFile));
        assert.ok(isSafeRepositoryPath(relative));
        const contents = await readRepositoryFile(relative, root);
        const bytes = Buffer.from(contents, "utf8");
        assertLf(bytes, relative);
        const indexed = entry.artifacts.find(({ destination }) => destination === artifact.destination);
        assert.equal(indexed.contentFile, artifact.contentFile);
        assert.equal(indexed.bytes, bytes.length);
        assert.equal(indexed.sha256, sha256(bytes));
        assert.ok(indexed.templateOrigins.length > 0);
        for (const origin of indexed.templateOrigins) {
          assert.deepEqual(Object.keys(origin).sort(), ["derivation", "overlayDestination", "source", "templateSha256"]);
          const overlay = manifest.overlay.find(({ source }) => source === origin.source);
          assert.ok(overlay && overlay.conditions.includes(entry.condition), `${entry.condition}: ${origin.source}`);
          assert.equal(origin.overlayDestination, overlay.destination);
          assert.equal(origin.templateSha256, sha256(payload.get(origin.source)));
          assert.ok(origin.derivation.trim().length > 0);
        }
        assert.doesNotMatch(contents, /記入:|TODO|TBD|<required|<placeholder|answer[-_]key|teacherAnswer/iu);
        if (artifact.destination.endsWith(".jsonc.template")) {
          assertDraft(contents);
        } else {
          assert.match(contents, /SYNTHETIC_TRAINING_ONLY.*fixture-only/u);
          const template = payload.get(indexed.templateOrigins[0].source).toString("utf8");
          assert.notEqual(contents, template);
          assert.deepEqual(
            parseMarkdownProse(contents).sections.map(({ title }) => title),
            parseMarkdownProse(template).sections.map(({ title }) => title),
          );
          assert.equal(contents.startsWith(template.trimEnd()), false, "No append-only filled-template shortcut");
        }
        if (artifact.destination.endsWith("/design.md")) commonDesigns.push(bytes);
        if (artifact.destination.endsWith("selection.md") || artifact.destination.endsWith("selection-plan.md")) {
          const sections = parseMarkdownProse(contents).sections;
          const members = (title) => sections.find((section) => section.title === title).body.trim().split("\n").filter(Boolean);
          const declared = members("Declared members");
          const reconstructed = members("Reconstructed members");
          assertFixedMembers(declared);
          assertFixedMembers(reconstructed);
          records[entry.condition] = { declared, reconstructed };
          for (const property of ["selectedMembers", "effectiveMembers", "actualCalls", "observedClicks", "elapsedMs"]) {
            assert.ok(contents.includes(`${property}: null`));
          }
        }
      }
    }
    assert.equal(placements, 5);
    assert.equal(commonDesigns.length, 2);
    assert.deepEqual(commonDesigns[0], commonDesigns[1]);
    for (const layer of ["declared", "reconstructed"]) {
      for (const condition of conditions) assertFixedMembers(records[condition][layer]);
      assert.deepEqual(records.baseline[layer], records["tool-set-design"][layer]);
    }
    for (const file of await listFilesRecursively(root)) {
      assertLf(Buffer.from(await readRepositoryFile(file, root), "utf8"), file);
      assert.doesNotMatch(file, /(?:^|\/)(?:comparison|recovery|membership)\.md$/u, "No acceptance Evidence supplied");
    }
  });
}
