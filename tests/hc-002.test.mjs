import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { getChallenge, loadCatalog } from "../scripts/lib/catalog.mjs";
import { PACK_OUTPUT_ROOT, validatePackOutputArgument } from "../scripts/lib/build-output.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../scripts/lib/constants.mjs";
import {
  isInertPayloadPath,
  listFilesRecursively,
  readJson,
  REPOSITORY_ROOT,
  sha256,
} from "../scripts/lib/fs-utils.mjs";
import { matchesContractGlob, validateContractGlob } from "../scripts/lib/glob.mjs";
import { parseMarkdownProse } from "../scripts/lib/markdown.mjs";
import { validatePackDirectory, validatePackManifest } from "../scripts/lib/packs.mjs";
import { validateChallengePageText } from "../scripts/lib/pages.mjs";
import { validateSourceInventory } from "../scripts/lib/source-inventory.mjs";
import { assertErrorCode, deepClone } from "../test-support/helpers.mjs";

const ID = "HC-002";
const CHALLENGE_ROOT = path.join(REPOSITORY_ROOT, "challenges", "hc-002");
const PACK_ROOT = path.join(CHALLENGE_ROOT, "pack");
const CONDITIONS = ["baseline", "customized", "manual-equivalent"];
const ACTIVE_PATHS = [
  ".github/instructions/hc002-java.instructions.md",
  ".github/instructions/hc002-xml.instructions.md",
];
const PARTICIPANT_PATHS = [
  "participant/hc-002/design.md",
  "participant/hc-002/hc002-java.instructions.md.template",
  "participant/hc-002/hc002-xml.instructions.md.template",
];
const SOURCE_PATHS = [
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java",
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java",
  "wholesale-core/src/main/resources/application-context.xml",
  "wholesale-core/src/main/resources/spring/module-operations.xml",
];
const PAYLOAD_NAMES = [
  "brief.md.template",
  "request.txt.template",
  "design.md.template",
  "hc002-java.instructions.md.template",
  "hc002-xml.instructions.md.template",
  "comparison.md.template",
];
const EVIDENCE_PATH = ".hackathon/evidence/hc-002/comparison.md";
const EVIDENCE_HEADINGS = [
  "Fixed task", "Environment", "Design and frozen text", "Scope probes",
  "Baseline", "Customized", "Manual-equivalent", "Comparison", "Outcome", "Cleanup",
];
const manifest = await readJson(path.join(PACK_ROOT, "manifest.json"));
const page = await readFile(path.join(CHALLENGE_ROOT, "README.md"), "utf8");
const payload = Object.fromEntries(await Promise.all(PAYLOAD_NAMES.map(async (name) => [
  name, await readFile(path.join(PACK_ROOT, "payload", name), "utf8"),
])));

function headings(contents) {
  return [...contents.matchAll(/^## (.+)$/gmu)].map((match) => match[1]);
}

function instructionParts(text) {
  const match = /^---\n([\s\S]*?)\n---\n/u.exec(text);
  assert.ok(match, "starter must have explicit YAML frontmatter with LF line endings");
  const fields = Object.fromEntries(match[1].split("\n").map((line) => {
    const field = /^(description|applyTo): (".+")$/u.exec(line);
    assert.ok(field, `unexpected starter frontmatter: ${line}`);
    return [field[1], JSON.parse(field[2])];
  }));
  return { fields, frontmatter: match[0], body: text.slice(match[0].length) };
}

function assertCodes(errors, expectedCodes) {
  for (const code of expectedCodes) assertErrorCode(errors, code);
  assert.deepEqual([...new Set(errors.map(({ code }) => code))].sort(), [...expectedCodes].sort());
}

test("HC-002 is a real v1 pack with three isolated read-only conditions", async () => {
  const result = await validatePackDirectory(PACK_ROOT, ID);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(manifest.conditions, CONDITIONS);
  assert.equal(manifest.challengeId, ID);
  for (const field of ["schemaVersion", "challengeVersion", "minimumTemplateVersion"]) {
    assert.equal(manifest[field], 1);
  }
  assert.deepEqual(manifest.isolation, {
    tier: "repository",
    freshWorkspace: true,
    freshConversation: true,
    freshProfile: true,
    freshRepository: true,
    conditionStrategy: "separate-repository",
    branchSafe: false,
  });
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(manifest.forbiddenActiveCustomizations, []);
  assert.deepEqual(manifest.cleanup, {
    advisory: true, verifyBaseline: true, exportSubmission: true,
    stopProcesses: true, archiveRepository: true,
  });
});

test("HC-002 distributes identical immutable inert materials in every condition", async () => {
  assert.deepEqual(manifest.overlay, PAYLOAD_NAMES.map((name) => ({
    source: `payload/${name}`,
    destination: `.hackathon/challenge/hc-002/starter/${name}`,
    conditions: CONDITIONS,
    allowOverwrite: false,
  })));
  const files = await listFilesRecursively(CHALLENGE_ROOT);
  assert.deepEqual(files.sort(), [
    "README.md", "pack/manifest.json", ...PAYLOAD_NAMES.map((name) => `pack/payload/${name}`),
  ].sort());
  for (const entry of manifest.overlay) {
    assert.equal(isInertPayloadPath(entry.source), true);
    assert.ok(payload[path.posix.basename(entry.source)].trim().length > 0);
    assert.equal(payload[path.posix.basename(entry.source)].includes("\r"), false);
  }
  for (const condition of CONDITIONS) {
    assert.deepEqual(
      manifest.overlay.filter((entry) => entry.conditions.includes(condition)).map(({ source }) => source),
      PAYLOAD_NAMES.map((name) => `payload/${name}`),
    );
  }
});

test("HC-002 grants only two customized active files and exact inert participant files", () => {
  const expectedAdditions = [
    ...ACTIVE_PATHS.map((pattern) => ({ pattern, conditions: ["customized"] })),
    ...PARTICIPANT_PATHS.map((pattern) => ({ pattern, conditions: CONDITIONS })),
  ];
  assert.deepEqual(manifest.allowedAdditions, expectedAdditions);
  assert.deepEqual(manifest.submissionFiles, [
    ...expectedAdditions, { pattern: EVIDENCE_PATH, conditions: CONDITIONS },
  ]);
  for (const condition of CONDITIONS) {
    const allowed = (candidate) => manifest.allowedAdditions.some((entry) =>
      entry.conditions.includes(condition) && matchesContractGlob(entry.pattern, candidate));
    for (const active of ACTIVE_PATHS) assert.equal(allowed(active), condition === "customized");
    for (const inert of PARTICIPANT_PATHS) assert.equal(allowed(inert), true);
    for (const denied of [
      ...SOURCE_PATHS, "pom.xml", "README.md", EVIDENCE_PATH,
      ".github/copilot-instructions.md", ".github/instructions/other.instructions.md",
      ".github/prompts/extra.prompt.md", ".github/agents/extra.agent.md",
      ".vscode/settings.json", ".vscode/mcp.json", "AGENTS.md", "CLAUDE.md",
      "participant/hc-002/extra.md", "participant/hc-003/design.md",
    ]) {
      assert.equal(allowed(denied), false, `${condition}: ${denied}`);
    }
  }
});

test("HC-002 evidence is submitted run-state with exact headings and a real template hash", () => {
  const evidence = payload["comparison.md.template"];
  assert.deepEqual(manifest.evidenceRequirements, [{
    path: EVIDENCE_PATH,
    conditions: CONDITIONS,
    stage: "submitted",
    requiredHeadings: EVIDENCE_HEADINGS,
    templateSha256: sha256(evidence),
  }]);
  assert.deepEqual(headings(evidence), EVIDENCE_HEADINGS);
  assert.equal(manifest.allowedAdditions.some(({ pattern }) => pattern.startsWith(".hackathon/")), false);
  for (const text of ["not-observed", "fileSha256", "frontmatterSha256", "bodySha256", "全文", "未実施"]) {
    assert.ok(evidence.includes(text), text);
  }
  const rows = evidence.split("\n").filter((line) =>
    line.startsWith("| wholesale-") || line.startsWith("| pom.xml") || line.startsWith("| README.md"));
  assert.equal(rows.length, 5);
  assert.ok(rows.every((line) => line.split("|").slice(1, -1).length === 6));
});

test("HC-002 cites existing baseline paths visibly, without importing a source tree or answer key", async () => {
  const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));
  assert.deepEqual(validateSourceInventory(inventory), []);
  const starterProse = parseMarkdownProse(page).sections.find(({ title }) => title === "Starter Kit").body;
  for (const sourcePath of SOURCE_PATHS) {
    assert.ok(inventory.paths.includes(sourcePath), sourcePath);
    for (const contents of [starterProse, payload["brief.md.template"], payload["request.txt.template"]]) {
      assert.ok(contents.includes(sourcePath), sourcePath);
    }
  }
  for (const negative of ["pom.xml", "README.md"]) {
    assert.ok(inventory.paths.includes(negative), negative);
    assert.ok(starterProse.includes(negative), negative);
  }
  assert.match(starterProse, /sourceKindは baseline/u);
  assert.ok(starterProse.includes(inventory.commit));
  const allParticipantText = page + Object.values(payload).join("\n");
  assert.doesNotMatch(allParticipantText, /module-sales\.xml|answer-key|instructor-only|fixtures[\\/]tsubame-wholesale/iu);
  assert.doesNotMatch(allParticipantText, /LAB-\d+/u);
});

test("HC-002 starters declare product applyTo without pretending Pack globs emulate VS Code", () => {
  const java = instructionParts(payload["hc002-java.instructions.md.template"]);
  const xml = instructionParts(payload["hc002-xml.instructions.md.template"]);
  assert.deepEqual(Object.keys(java.fields).sort(), ["applyTo", "description"]);
  assert.deepEqual(Object.keys(xml.fields).sort(), ["applyTo", "description"]);
  assert.equal(java.fields.applyTo, "wholesale-core/src/main/java/**/*.java");
  assert.deepEqual(xml.fields.applyTo.split(","), [
    "wholesale-core/src/main/resources/application-context.xml",
    "wholesale-core/src/main/resources/spring/*.xml",
  ]);
  for (const starter of [java, xml]) {
    assert.ok(starter.fields.description.length > 0);
    assert.ok(starter.body.trim().length > 0);
    assert.match(starter.body, /編集開始点/u);
    assert.doesNotMatch(starter.fields.applyTo, /pom\.xml|README\.md/u);
    assert.notEqual(validateContractGlob(starter.fields.applyTo), undefined);
  }
  assert.match(java.body, /共有ガード/u);
  for (const term of ["bean", "advice", "pointcut", "method rule"]) assert.ok(xml.body.includes(term));
  assert.match(xml.body, /宣言と、稼働時の観測を区別/u);
});

test("HC-002 page offers choices, controlled full-text comparison and observation boundaries", () => {
  assert.deepEqual(validateChallengePageText(ID, page), []);
  const sections = parseMarkdownProse(page).sections;
  assert.deepEqual(sections.map(({ title }) => title), REQUIRED_CHALLENGE_HEADINGS);
  assert.ok(sections.every(({ body }) => body.trim().length > 0));
  const body = (heading) => sections.find(({ title }) => title === heading).body;
  assert.match(body("Open Question"), /唯一のパターンや文章を当てるクイズではありません/u);
  assert.match(body("Design Time"), /凍結してからBaselineを含む比較を開始/u);
  assert.match(body("Compare"), /参加者が選び凍結した二本文の全文/u);
  assert.match(body("Compare"), /frontmatterだけを除き/u);
  assert.match(body("Compare"), /別の新規会話/u);
  for (const probe of [SOURCE_PATHS[0], SOURCE_PATHS[3], SOURCE_PATHS[4], "pom.xml", "README.md"]) {
    assert.ok(body("Compare").includes(probe), probe);
  }
  for (const term of ["正例", "負例", "description", "not-observed"]) {
    assert.ok(body("Compare").includes(term), term);
  }
  for (const term of ["保存", "発見", "実際のcontext投入", "出力", "人のEvidence作成"]) {
    assert.ok(body("Evidence").includes(term), term);
  }
  assert.match(body("この機能とは"), /applyTo はACL/u);
  assert.match(body("この機能とは"), /glob文法は別物/u);
  assert.match(body("この機能とは"), /組合せ順序は保証されません/u);
  assert.match(body("この機能とは"), /applyTo 未指定時/u);
  assert.match(body("この機能とは"), /2026-09-15/u);
  assert.ok(parseMarkdownProse(page).links.includes("https://code.visualstudio.com/docs/agent-customization/custom-instructions"));
  for (const term of ["Hub checkout", "Runtime checkout", "home", "User", "組織", "Memory"]) {
    assert.ok(body("Build").includes(term), term);
  }
  assert.match(body("Support / Fallback"), /optionalRoutesは空/u);
  for (const outcome of ["improved", "equal", "worse", "incomparable", "blocked", "unsupported"]) {
    assert.ok(body("Evidence").includes(outcome), outcome);
  }
  const request = payload["request.txt.template"];
  for (const term of ["OrderService.allocate", "共有ガード", "bean", "advice", "pointcut", "method rule", "事実・推論・未確認"]) {
    assert.ok(request.includes(term), term);
  }
  assert.match(request, /ファイル編集、compile、test、DB接続、サーバー起動はしない/u);
  assert.match(request, /設計票やEvidenceを作成するのは人の別作業/u);
});

test("HC-002 documented read-only hash command separates metadata, body and installed bytes", () => {
  const script = /@'\r?\n([\s\S]*?)\r?\n'@ \| node --input-type=module -/u.exec(page)?.[1];
  assert.ok(script, "README must contain the runnable stdin hash command");
  const names = ["hc002-java.instructions.md.template", "hc002-xml.instructions.md.template"];
  const files = names.map((name) => path.join(PACK_ROOT, "payload", name));
  const result = spawnSync(process.execPath, ["--input-type=module", "-", ...files], {
    cwd: REPOSITORY_ROOT, encoding: "utf8", input: script, timeout: 15_000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(Number.isInteger(result.status), true);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const records = result.stdout.trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(records.length, 2);
  for (const [index, name] of names.entries()) {
    const { frontmatter, body } = instructionParts(payload[name]);
    assert.deepEqual(records[index], {
      file: files[index],
      fileSha256: sha256(payload[name]),
      frontmatterSha256: sha256(frontmatter),
      bodySha256: sha256(body),
    });
  }
});

test("HC-002 documented build command uses the literal dedicated output accepted by the CLI", () => {
  const output = /build-pack\.mjs --challenge HC-002 --output (\S+)/u.exec(page)?.[1];
  assert.ok(output, "README must include a complete build command");
  assert.doesNotThrow(() => validatePackOutputArgument(output));
  assert.equal(output, PACK_OUTPUT_ROOT);
});

test("HC-002 preparation and activation copies refuse existing participant artifacts", () => {
  const copies = [...page.matchAll(/^\[System\.IO\.File\]::Copy\("([^"]+)", "([^"]+)", (\$false)\)\r?$/gmu)];
  assert.equal(copies.length, 6);
  const destinations = copies.map((match) => match[2].replace(/^\$root\\/u, "").replaceAll("\\", "/"));
  assert.deepEqual(destinations, [...PARTICIPANT_PATHS, EVIDENCE_PATH, ...ACTIVE_PATHS]);
  for (const match of copies) {
    assert.match(match[1], /^\$(?:root|starter)\\/u);
    assert.match(match[2], /^\$root\\/u);
    assert.equal(match[3], "$false");
  }
  assert.doesNotMatch(page, /^Copy-Item\b/gmu);
  assert.match(page, /既存の設計票・原稿・Evidenceがあれば停止/u);
  assert.match(page, /同名ファイルが作られた場合も、そのファイルを置き換えません/u);
});

test("HC-002 boundary mutations fail for exact intended contract codes", () => {
  const overwrite = deepClone(manifest);
  overwrite.overlay[0].allowOverwrite = true;
  assert.deepEqual(overwrite.overlay[0], { ...manifest.overlay[0], allowOverwrite: true });
  assertCodes(validatePackManifest(overwrite, ID), ["PACK_OVERWRITE_DEFAULT_DENY"]);

  const activeOverlay = deepClone(manifest);
  activeOverlay.overlay[0].destination = ACTIVE_PATHS[0];
  assert.deepEqual(activeOverlay.overlay[0], { ...manifest.overlay[0], destination: ACTIVE_PATHS[0] });
  assertCodes(validatePackManifest(activeOverlay, ID), ["PACK_INERT_DESTINATION"]);

  const activeSource = deepClone(manifest);
  activeSource.overlay[3].source = "payload/hc002-java.instructions.md";
  assert.deepEqual(activeSource.overlay[3], { ...manifest.overlay[3], source: "payload/hc002-java.instructions.md" });
  assertCodes(validatePackManifest(activeSource, ID), ["PACK_INERT_SOURCE"]);

  for (const condition of ["baseline", "manual-equivalent"]) {
    const activation = deepClone(manifest);
    activation.allowedAdditions[0].conditions.push(condition);
    assert.deepEqual(activation.allowedAdditions[0], {
      pattern: ACTIVE_PATHS[0], conditions: ["customized", condition],
    });
    assertCodes(validatePackManifest(activation, ID), ["PACK_BASELINE_ACTIVE_CUSTOMIZATION"]);
  }

  const evidenceAddition = deepClone(manifest);
  evidenceAddition.allowedAdditions.push({ pattern: EVIDENCE_PATH, conditions: CONDITIONS });
  assert.equal(evidenceAddition.allowedAdditions.length, manifest.allowedAdditions.length + 1);
  assert.deepEqual(evidenceAddition.allowedAdditions.at(-1), { pattern: EVIDENCE_PATH, conditions: CONDITIONS });
  assertCodes(validatePackManifest(evidenceAddition, ID), ["PACK_ADDITION_RESERVED_PATH"]);

  const earlyEvidence = deepClone(manifest);
  earlyEvidence.evidenceRequirements[0].stage = "in-progress";
  assert.deepEqual(earlyEvidence.evidenceRequirements[0], { ...manifest.evidenceRequirements[0], stage: "in-progress" });
  assertCodes(validatePackManifest(earlyEvidence, ID), ["PACK_EVIDENCE_STAGE"]);

  const invalidHash = deepClone(manifest);
  invalidHash.evidenceRequirements[0].templateSha256 = "not-a-sha256";
  assert.deepEqual(invalidHash.evidenceRequirements[0], { ...manifest.evidenceRequirements[0], templateSha256: "not-a-sha256" });
  assertCodes(validatePackManifest(invalidHash, ID), ["PACK_TEMPLATE_SHA256"]);

  const unsafeBranch = deepClone(manifest);
  unsafeBranch.isolation.branchSafe = true;
  assert.deepEqual(unsafeBranch.isolation, { ...manifest.isolation, branchSafe: true });
  assertCodes(validatePackManifest(unsafeBranch, ID), ["PACK_BRANCH_SAFETY"]);

  const productGlob = deepClone(manifest);
  const applyTo = instructionParts(payload["hc002-java.instructions.md.template"]).fields.applyTo;
  productGlob.allowedAdditions[0].pattern = applyTo;
  assert.deepEqual(productGlob.allowedAdditions[0], { pattern: applyTo, conditions: ["customized"] });
  assertCodes(validatePackManifest(productGlob, ID), ["PACK_INVALID_GLOB"]);
});

test("HC-002 page mutations preserve their intended post-image and failure reason", () => {
  const missingHeading = page.replace(/^## Compare$/mu, "### Compare");
  assert.deepEqual(headings(missingHeading), REQUIRED_CHALLENGE_HEADINGS.filter((heading) => heading !== "Compare"));
  assert.match(missingHeading, /^### Compare$/mu);
  assertCodes(validateChallengePageText(ID, missingHeading), ["PAGE_REQUIRED_HEADING", "PAGE_HEADING_ORDER"]);

  const missingBaseline = page.replaceAll("Baseline", "Control");
  assert.equal(missingBaseline.includes("Baseline"), false);
  assert.equal(missingBaseline.includes("Customized"), true);
  assert.deepEqual(headings(missingBaseline), REQUIRED_CHALLENGE_HEADINGS);
  assertCodes(validateChallengePageText(ID, missingBaseline), ["PAGE_COMPARISON_TERMS"]);
});

test("HC-002 published catalog wiring matches its authored scope", async () => {
  const entry = getChallenge(await loadCatalog(), ID);
  assert.ok(entry);
  assert.equal(entry.status, "published");
  assert.equal(entry.page, "challenges/hc-002/README.md");
  assert.equal(entry.pack, "challenges/hc-002/pack");
  assert.equal(entry.challengeVersion, 1);
  assert.equal(entry.sourceKind, "baseline");
  assert.deepEqual(entry.sourcePaths, SOURCE_PATHS);
  assert.equal(entry.feature, "File/task Instructions");
  assert.deepEqual(entry.optionalRoutes, []);
  assert.deepEqual(entry.isolation, { tier: "repository", conditionStrategy: "separate-repository" });
  assert.ok(entry.support.primary.includes("applyTo"));
  assert.ok(entry.support.fallback.includes("manual-equivalent"));
});
