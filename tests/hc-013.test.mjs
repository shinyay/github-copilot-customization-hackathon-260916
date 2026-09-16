import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadCatalog, validateCatalog } from "../scripts/lib/catalog.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../scripts/lib/constants.mjs";
import {
  listFilesRecursively, readJson, REPOSITORY_ROOT, sha256, stableJson,
} from "../scripts/lib/fs-utils.mjs";
import { parseMarkdownProse } from "../scripts/lib/markdown.mjs";
import {
  OPTIONAL_EVIDENCE_NOTICE, OPTIONAL_GUIDE_HEADINGS, OPTIONAL_SAFETY_NOTICE, validateOptionalRoutes,
} from "../scripts/lib/optional-routes.mjs";
import {
  validateChallengePageText, validateOptionalGuideText, validatePublishedPages,
} from "../scripts/lib/pages.mjs";
import { validatePackDirectory, validatePackManifest } from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

const root = path.join(REPOSITORY_ROOT, "challenges", "hc-013");
const pack = path.join(root, "pack");
const conditions = ["baseline", "context-card", "manual-equivalent"];
const sourceCommit = "398d7d1982a1402bcdba00d6c3ded67d8d338787";
const sourceRepository = "shinyay/code-to-doc-workshop-260910";
const labsCommit = "3474d21dd62bad2e594e84657dabe2eb9bb876c1";
const sourcePins = [
  {
    id: "B1",
    sourcePath: "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
    sha256: "540035ef9797badbb049502462c9dfc23295dd7124f30d23e757f7ed5e97dde2",
    bytes: 5047,
  },
  {
    id: "B2",
    sourcePath: "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
    sha256: "6fd51123ea20d737192c90ebe9d06bc9cd893e1f352ba31d036c00350237f986",
    bytes: 5408,
  },
  {
    id: "B3",
    sourcePath: "wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java",
    sha256: "4512773a9a39ba25e61b1c1b1d0d9150d8004bfe43fb94617fb1bbe1c4a2ee63",
    bytes: 27073,
  },
];
const lineCounts = [97, 126, 467];
const redactedLines = [86, 87, 237, 242, 431, 437];
const displayPins = sourcePins.map((pin, index) => ({
  sha256: index === 2 ? "a9db7fae855db85ce87d0fc2e83c69d6d6f1862fdc95b75669a17714a6eab32a" : pin.sha256,
  bytes: index === 2 ? 27214 : pin.bytes,
  lineCount: lineCounts[index],
}));
const entry = {
  id: "HC-013",
  title: "チームの知識をCopilot Spaceへ整理しよう",
  track: "integrations",
  status: "published",
  sourceLab: {
    ids: ["LAB-13"],
    repository: "shinyay/github-copilot-customization-labs",
    pages: ["docs/labs/lab-13-copilot-spaces.md"],
  },
  sourceKind: "baseline",
  sourcePaths: sourcePins.map(({ sourcePath }) => sourcePath),
  challengeVersion: 1,
  page: "challenges/hc-013/README.md",
  pack: "challenges/hc-013/pack",
  feature: "Copilot Spaces向けローカル資料設計",
  support: {
    primary: "固定source由来のsanitized全体displayと合成資料を同じ内容で整理。実Spaceの作成・取得ではない",
    fallback: "手動の受渡し票・同一display JSON全文で比較。原本は読み取り専用、実MCP・認証・ACL・同期は未観測",
  },
  isolation: { tier: "repository", conditionStrategy: "separate-repository" },
  optionalRoutes: [{
    id: "space-read",
    title: "許可済みSpaceの読取条件を確認する",
    page: "challenges/hc-013/optional/space-read.md",
    required: false,
    prerequisites: {
      environment: [
        "本編とは別の使い捨てworkspace・新規会話で、IDEの版、Agentモード、remote GitHub MCPの既存構成を確認できること。",
        "所有者が既に承認した専用教材Spaceのexact owner/nameと、凍結したinstructions・カードJSON全文を照合できること。",
      ],
      entitlements: [
        "本人のCopilot利用資格、既存の正規認証、組織のMCP policy、対象Spaceと各sourceの既存閲覧権を個別に確認できること。",
      ],
      additionalApprovals: [
        "環境と教材の所有者から、既知のexact owner/nameに対するget_copilot_spaceの読み取りだけを行う独立試行の承認を別途得ること。",
        "承認は既存の認証・閲覧権の範囲に限り、新規共有、source追加、upload、PAT発行、OAuth・ACL・組織policy変更を含めないこと。",
      ],
    },
    runtimeRequirements: [
      {
        capability: "remote-spaces-read",
        status: "not-checked",
        reason: "Runtime v1はremote MCPの初期化・tool発見・認証・get_copilot_spaceの実callを観測しない。",
      },
      {
        capability: "source-acl-observation",
        status: "not-checked",
        reason: "Runtime v1はSpace閲覧権と個別source閲覧権、返却内容の版・範囲を実機検証しない。",
      },
    ],
    liveStatus: "live-unobserved",
    stopReasons: [
      "exact owner/nameが不明、対象が他人のSpace、または事前承認の対象と違う場合は停止する。",
      "instructions・JSON全文・source種別・版・範囲が一致しない、またはpartial/empty/error/missingで全文を確認できない場合は停止する。",
      "新しい認証、権限拡大、新規共有、資料追加、upload、PAT発行、設定変更が必要なら実機試行は未実施にする。",
      "組織policy、利用資格、Space ACL、source ACL、追加承認のどれかが未確認なら実機試行は未実施にする。",
    ],
  }],
};
const additions = [
  { pattern: "participant/hc-013/design.md", conditions },
  { pattern: "participant/hc-013/source-handoff.md", conditions: ["baseline"] },
  { pattern: "participant/hc-013/context-card.json.template", conditions: ["context-card", "manual-equivalent"] },
  { pattern: "participant/hc-013/manual-input.txt", conditions: ["manual-equivalent"] },
];
const evidenceHeadings = {
  "comparison.md": ["Fixed task", "Environment", "Design", "Observations", "Comparison", "Outcome"],
  "recovery.md": ["Case", "Expected boundary", "Observed result", "Restoration", "Non-claims"],
  "provenance.md": ["Source inventory", "Revision and scope", "Access layers", "Whole material equality", "Non-claims"],
};
const packetNames = ["source-packet.json.template", "snapshot.json.template", "provenance-packets.json.template"];
const inputPins = {
  "request.txt.template": "1c962f412543a74a3d399aeb2b037271e4576edfda6c6998f53c951201a0938c",
  "source-packet.json.template": "3f23d4a368843a1623cb34d51116ce92046c1b7ea07a8705cefd3e975fd30be4",
  "snapshot.json.template": "465e6be6eb084703f15759de02928ee365dfbbcad3d356253f9e9b19f26ac6ca",
  "provenance-packets.json.template": "941d6f2cc64cf07b2958b10cc3cc179f4308eb2243ab30805e82726dd05d9930",
};
const manifest = await readJson(path.join(pack, "manifest.json"));
const page = await readFile(path.join(root, "README.md"), "utf8");
const guide = await readFile(path.join(root, "optional", "space-read.md"), "utf8");
const payload = new Map(await Promise.all(manifest.overlay.map(async ({ source }) => [
  path.posix.basename(source), await readFile(path.join(pack, ...source.split("/"))),
])));
const sourcePacket = JSON.parse(payload.get(packetNames[0]));
const snapshot = JSON.parse(payload.get(packetNames[1]));
const provenance = JSON.parse(payload.get(packetNames[2]));
const cardTemplate = JSON.parse(payload.get("context-card.json.template"));
const helperBytes = payload.get("prepare-display.mjs.template");
const displayHelper = await import(`data:text/javascript;base64,${helperBytes.toString("base64")}`);
const liveCatalog = await loadCatalog();
const catalogFixture = structuredClone(liveCatalog);
catalogFixture.challenges = catalogFixture.challenges.map((value) => value.id === entry.id ? entry : value);

function assertSourcePins(value) {
  assert.deepEqual(value.sourceBaseline, { repository: sourceRepository, commit: sourceCommit });
  assert.equal(value.sourceReferences.length, 3);
  for (const [index, pin] of sourcePins.entries()) {
    const reference = value.sourceReferences[index];
    assert.equal(reference.id, pin.id, "HC013_SOURCE_ID");
    assert.equal(reference.sourcePath, pin.sourcePath, "HC013_SOURCE_PATH");
    assert.equal(reference.referenceType, "commit", "HC013_REFERENCE_TYPE");
    assert.equal(reference.revision, sourceCommit, "HC013_REVISION_PIN");
    assert.equal(reference.scope, "whole-file", "HC013_SCOPE_PIN");
    assert.equal(reference.originalSha256, pin.sha256, "HC013_SOURCE_HASH_PIN");
    assert.equal(reference.originalBytes, pin.bytes, "HC013_SOURCE_BYTES_PIN");
    assert.equal(reference.originalLineCount, lineCounts[index]);
    assert.deepEqual(reference.display, {
      policyId: "hc013-full-display-v1", scope: "whole-file-with-explicit-redactions",
      ...displayPins[index], originalByteExact: index !== 2, redactedLines: index === 2 ? redactedLines : [],
    });
    assert.equal(reference.spaceAccess, "not-observed");
    assert.equal(reference.sourceAccess, "not-observed");
    assert.equal(reference.spaceRetrieval, "not-observed");
  }
}

function assertSnapshotPins(value) {
  assert.equal(value.repository, sourceRepository);
  assert.equal(value.sourcePath, sourcePins[0].sourcePath);
  assert.equal(value.referenceType, "commit");
  assert.equal(value.revision, sourceCommit, "HC013_REVISION_PIN");
  assert.equal(value.scope, "whole-file", "HC013_SCOPE_PIN");
  assert.equal(value.sha256, sourcePins[0].sha256, "HC013_SOURCE_HASH_PIN");
  assert.equal(value.bytes, sourcePins[0].bytes);
  assert.equal(value.spaceRetrieval, "not-observed");
  assert.equal(value.observedSpaceContentSha256, null);
}

function assertNoAnswerFields(value) {
  if (value === null || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.doesNotMatch(key, /^(expected.*|diagnosis.*|classification.*|answer.*|currentCode|statement)$/iu);
    assertNoAnswerFields(child);
  }
}

function assertLocalCard(value) {
  assert.equal(value.fixtureLabel, "LOCAL_CONTEXT_CARD_NOT_A_COPILOT_SPACE", "HC013_LOCAL_LABEL");
  assert.equal(value.trainingLabel, "SYNTHETIC_TRAINING_ONLY", "HC013_SYNTHETIC_LABEL");
  assert.equal(value.actualHistoricalDecision, "NOT_PROVIDED", "HC013_UNKNOWN_HISTORY");
  assert.deepEqual(value.observations, cardTemplate.observations, "HC013_NO_LIVE_OBSERVATION");
}

// This unit fixture exercises full P1/P2/P3 transport, not a completed Runtime participant artifact.
function packetTransport() {
  const instructions = "SYNTHETIC_TRAINING_ONLY: 全文と全metadataを保ち、読めない範囲と歴史の未提供を残す。";
  const card = structuredClone(cardTemplate);
  card.instructions = instructions;
  card.organization = {
    reader: "合成の引継ぎ担当",
    readingOrder: ["P2", "P1", "P3"],
    groups: [{ title: "資料の所在", members: ["P1", "P2"] }, { title: "参照資料", members: ["P3"] }],
    omissionPolicy: "preserve-full-display-and-metadata",
  };
  card.materials = packetNames.map((name, index) => ({
    id: `P${index + 1}`,
    sourcePath: `.hackathon/challenge/hc-013/${name}`,
    metadata: {
      referenceType: "local-packet", revision: "hc013-materials-v2", scope: "whole-file",
      packetBytes: payload.get(name).length, packetSha256: inputPins[name],
    },
    displayText: payload.get(name).toString("utf8"),
  }));
  const bytes = Buffer.from(stableJson(card));
  return { instructions, bytes };
}

function assertFullPackets(transport) {
  const card = JSON.parse(transport.bytes);
  assertLocalCard(card);
  assert.equal(card.instructions, transport.instructions, "HC013_INSTRUCTIONS");
  assert.equal(card.materials.length, 3);
  for (const [index, name] of packetNames.entries()) {
    const material = card.materials[index];
    assert.equal(material.id, `P${index + 1}`);
    assert.equal(material.sourcePath, `.hackathon/challenge/hc-013/${name}`);
    assert.deepEqual(material.metadata, {
      referenceType: "local-packet", revision: "hc013-materials-v2", scope: "whole-file",
      packetBytes: payload.get(name).length, packetSha256: inputPins[name],
    }, "HC013_PACKET_METADATA");
    assert.ok(Buffer.from(material.displayText).equals(payload.get(name)), "HC013_FULL_PACKET_BYTES");
    assert.equal(sha256(material.displayText), inputPins[name], "HC013_FIXED_PACKET_PIN");
  }
  assertSourcePins(JSON.parse(card.materials[0].displayText));
  assertSnapshotPins(JSON.parse(card.materials[1].displayText));
  assert.deepEqual(JSON.parse(card.materials[2].displayText), provenance);
}

function assertSameTransport(left, right) {
  assert.equal(left.instructions, right.instructions, "HC013_INSTRUCTIONS");
  assert.ok(Buffer.from(left.bytes).equals(Buffer.from(right.bytes)), "HC013_WHOLE_JSON_BYTES");
  assertFullPackets(left);
  assertFullPackets(right);
}

function roundTripMutation(original, mutate, postImage, check, rejection) {
  const bytes = Buffer.from(stableJson(original));
  let current = Buffer.from(bytes);
  check(JSON.parse(current));
  try {
    const changed = JSON.parse(current);
    mutate(changed);
    current = Buffer.from(stableJson(changed));
    assert.notDeepEqual(current, bytes);
    postImage(JSON.parse(current));
    assert.throws(() => check(JSON.parse(current)), rejection);
  } finally {
    current = Buffer.from(bytes);
  }
  assert.deepEqual(current, bytes);
  assert.deepEqual(JSON.parse(current), original);
  check(JSON.parse(current));
}

// Override only read bytes in a fresh subprocess; the real CLI/helpers/pages remain unchanged on disk.
function runScopedCli(args, overrides = {}) {
  const catalogPath = path.join(REPOSITORY_ROOT, "catalog", "challenges.json");
  const replacements = Object.fromEntries(Object.entries({
    [catalogPath]: stableJson(catalogFixture), ...overrides,
  }).map(([file, contents]) => [file, Buffer.from(contents).toString("base64")]));
  const cliPath = path.join(REPOSITORY_ROOT, "scripts", "plan-run.mjs");
  const program = `
    import fs from "node:fs";
    import path from "node:path";
    import { fileURLToPath, pathToFileURL } from "node:url";
    import { syncBuiltinESMExports } from "node:module";
    const replacements = ${JSON.stringify(replacements)};
    const original = fs.promises.readFile;
    fs.promises.readFile = async (input, options) => {
      const name = path.resolve(input instanceof URL ? fileURLToPath(input) : input);
      if (!Object.hasOwn(replacements, name)) return original(input, options);
      const bytes = Buffer.from(replacements[name], "base64");
      const encoding = typeof options === "string" ? options : options?.encoding;
      return encoding ? bytes.toString(encoding) : bytes;
    };
    syncBuiltinESMExports();
    process.argv = [process.execPath, ${JSON.stringify(cliPath)}, ...${JSON.stringify(args)}];
    await import(pathToFileURL(${JSON.stringify(cliPath)}).href);
  `;
  return spawnSync(process.execPath, ["--input-type=module", "-"], {
    cwd: REPOSITORY_ROOT, input: program, encoding: "utf8", timeout: 30_000, maxBuffer: 2_097_152,
  });
}

function assertExit(result, code) {
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.signal, null);
  assert.ok(Number.isInteger(result.status));
  assert.equal(result.status, code, result.stderr);
}

test("HC-013 real v1 Pack has exactly three local conditions, safe overlays and 2+2+3 exact grants", async () => {
  const validation = await validatePackDirectory(pack, "HC-013");
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(manifest.conditions, conditions);
  for (const key of ["schemaVersion", "challengeVersion", "minimumTemplateVersion"]) assert.equal(manifest[key], 1);
  assert.deepEqual(manifest.isolation, {
    tier: "repository", freshWorkspace: true, freshConversation: true, freshProfile: true,
    freshRepository: true, conditionStrategy: "separate-repository", branchSafe: false,
  });
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(manifest.forbiddenActiveCustomizations, []);
  assert.deepEqual(manifest.allowedAdditions, additions);
  assert.equal(manifest.overlay.length, 14);
  for (const overlay of manifest.overlay) {
    assert.deepEqual(overlay.conditions, conditions);
    assert.equal(overlay.allowOverwrite, false);
    assert.match(overlay.source, /^payload\/[^/]+\.template$/u);
    assert.equal(overlay.destination, `.hackathon/challenge/hc-013/${path.posix.basename(overlay.source)}`);
  }
  assert.deepEqual(
    (await listFilesRecursively(pack)).sort(),
    ["manifest.json", ...manifest.overlay.map(({ source }) => source)].sort(),
  );
  for (const file of validation.files) {
    const bytes = await readFile(path.join(pack, ...file.split("/")));
    assert.equal(bytes.includes(13), false, `${file}: raw LF required`);
    assert.equal(bytes.at(-1), 10, `${file}: final LF required`);
    assert.doesNotMatch(file, /\.java(?:\.template)?$/u);
  }
  assert.deepEqual(manifest.submissionFiles, [
    ...additions,
    ...Object.keys(evidenceHeadings).map((name) => ({ pattern: `.hackathon/evidence/hc-013/${name}`, conditions })),
  ]);
  const plans = conditions.map((condition) => buildRunPlan(catalogFixture, manifest, {
    challengeId: "HC-013", condition, team: "fixture-only", runId: `hc013-${condition}`,
  }));
  assert.deepEqual(plans.map((plan) => plan.participantChanges.allowedAdditions.length), [2, 2, 3]);
  for (const plan of plans) {
    assert.deepEqual(plan.filesToInject, plans[0].filesToInject);
    assert.deepEqual(plan.runStateEvidence, plans[0].runStateEvidence);
    assert.equal(plan.participantChanges.activeCustomizationsDefault, "deny");
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
  }
});

test("HC-013 uses actual source pins distinct from Labs and pins whole fixed inputs without Java duplication", async () => {
  assertSourcePins(sourcePacket);
  assertSnapshotPins(snapshot);
  assert.notEqual(labsCommit, sourceCommit);
  const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));
  assert.deepEqual(entry.sourcePaths, sourcePins.map(({ sourcePath }) => sourcePath));
  for (const pin of sourcePins) assert.ok(inventory.paths.includes(pin.sourcePath), pin.sourcePath);
  assert.equal(sourcePacket.sourceReferences[2].use, "read-test-definition-do-not-execute-java-or-db");
  for (const [name, digest] of Object.entries(inputPins)) assert.equal(sha256(payload.get(name)), digest, name);
  for (const name of [...packetNames, "context-card.json.template"]) assertNoAnswerFields(JSON.parse(payload.get(name)));
  assert.equal(sourcePacket.fixtureLabel, "LOCAL_CONTEXT_CARD_NOT_A_COPILOT_SPACE");
  assert.equal(sourcePacket.textContent.label, "SYNTHETIC_TRAINING_ONLY");
  assert.equal(sourcePacket.actualHistoricalDecision, "NOT_PROVIDED");
  assertLocalCard(cardTemplate);
  assert.equal(cardTemplate.instructions, "");
  assert.deepEqual(cardTemplate.organization.readingOrder, []);
  assert.deepEqual(cardTemplate.organization.groups, []);
  assert.deepEqual(cardTemplate.materials, []);
});

test("HC-013 source ledger records original hashes, explicit adaptations and every non-self payload digest", () => {
  const ledger = JSON.parse(payload.get("source-materials.json.template"));
  assert.equal(ledger.sourceBaseline.repository, sourceRepository);
  assert.equal(ledger.sourceBaseline.commit, sourceCommit);
  assert.equal(ledger.authoringReference.commit, labsCommit);
  assert.deepEqual(ledger.baselineSources.map(({ id, sourcePath, sha256: hash, bytes }) => ({
    id, sourcePath, sha256: hash, bytes,
  })), sourcePins);
  const originalPins = {
    "docs/labs/lab-13-copilot-spaces.md": "1729a8afd646a293e02215606d8d26f9f6ce91bf869a6a879fc9d6d9ac99a8ee",
    "docs/deep-dive/lab-13-provenance.md": "048b9717705193a2f6d5efb67a9d496d02e3b3e3a65dccf17e6053c94fcd00c1",
    "examples/integrations/spaces/context-card.json": "c6417c63aad7fefc549f91125e1c2d758fd2398fef0221b16309790bf280e18f",
    "examples/integrations/spaces/github-spaces.mcp.json.template": "0cbfee3583eb6ea947f60d093b9d3b91620ba6614c934206fcb18773a0aef9bd",
    "examples/units/integrations/lab13/snapshot.json.template": "609b45b0929c8178031c1d1989814c16488f3c65b4019e59a75b3017e1aaac44",
    "examples/units/integrations/lab13/cards.json.template": "c3b27ad30fe1b9bcbfb2b1735c66530e972fa612686eb6f10e44106d31f047cc",
    "examples/units/integrations/lab13/provenance.mjs": "4513985b48a370e1590e8cf1656b149b721c1464fc8a6c8e0d84e8c008dadc5c",
    "examples/units/integrations/lab13/request.txt.template": "112e761c069a2badbf820acc1e7250160f1ebb23ef66e27cecbd25c5931b1381",
  };
  assert.deepEqual(Object.fromEntries(ledger.originals.map(({ sourcePath, sha256: hash }) => [sourcePath, hash])), originalPins);
  for (const original of [...ledger.originals, ...ledger.baselineSources]) {
    assert.ok(original.bytes > 0);
    assert.ok(original.adaptedFields.length > 0);
  }
  assert.deepEqual(
    ledger.payloadDigests.map(({ path: file }) => file).sort(),
    manifest.overlay.map(({ source }) => source).filter((file) => file !== "payload/source-materials.json.template").sort(),
  );
  for (const record of ledger.payloadDigests) {
    const bytes = payload.get(path.posix.basename(record.path));
    assert.equal(record.bytes, bytes.length, record.path);
    assert.equal(record.sha256, sha256(bytes), record.path);
    assert.ok(record.derivation.length > 0);
  }
  assert.equal(Object.hasOwn(ledger, "sha256"), false);
});

test("HC-013 keeps neutral packet identities and missing/error/empty/partial/unresolved access shapes separate", () => {
  assert.deepEqual(provenance.packets.map(({ id }) => id), Array.from({ length: 8 }, (_, index) => `packet-0${index + 1}`));
  assert.equal(provenance.fixtureLabel, "SYNTHETIC_PROVENANCE_CARDS_NOT_SPACES");
  assert.equal(provenance.trainingLabel, "SYNTHETIC_TRAINING_ONLY");
  assert.equal(provenance.actualHistoricalDecision, "NOT_PROVIDED");
  const [one, two, three, four, five, six, seven, eight] = provenance.packets;
  assert.equal(one.sha256, sourcePins[0].sha256);
  assert.equal(two.sha256, one.sha256);
  assert.notEqual(two.revision, one.revision);
  assert.equal(two.referenceType, "synthetic-commit");
  assert.equal(three.revision, "main");
  assert.equal(three.resolvedRevision, null);
  assert.equal(three.sha256, null);
  assert.equal(three.bodyReference, null);
  assert.equal(four.spaceAccess, "allowed-fixture-only");
  assert.equal(four.sourceAccess, "denied-fixture-only");
  assert.equal(four.sha256, null);
  assert.deepEqual([five, six, seven, eight].map(({ retrieval }) => retrieval), [
    "missing-fixture-only", "error-fixture-only", "empty-fixture-only", "partial-fixture-only",
  ]);
  assert.equal(Object.hasOwn(five, "bodyText"), false);
  assert.equal(Object.hasOwn(five, "bodyReference"), false);
  assert.equal(six.bodyText, null);
  assert.equal(six.readError, "SYNTHETIC_READ_ERROR_NOT_A_SERVICE_RESPONSE");
  assert.equal(seven.bodyText, "");
  assert.equal(eight.scope, "line-range");
  assert.deepEqual(eight.lineRange, { start: 1, end: 2 });
  assert.equal(eight.bodyText, "package jp.co.tsubame.wholesale.batch.service;\n\n");
  for (const material of provenance.packets) {
    assert.equal(material.fixtureLabel, "SYNTHETIC_PROVENANCE_CARD_NOT_A_SPACE");
    assert.equal(material.sourceExistence, "not-inferred-from-retrieval");
  }
  for (const material of [three, four, five, six, seven, eight]) assert.equal(material.sha256, null);
  assert.equal(provenance.observations.aclVerified, false);
  assert.equal(provenance.observations.getCopilotSpaceCall, null);
  for (const [key, value] of Object.entries(provenance.observations)) {
    if (!["evidenceKind", "aclVerified", "getCopilotSpaceCall"].includes(key)) assert.equal(value, "not-observed", key);
  }
});

test("HC-013 revision-only and scope-only post-images fail independent source pins and fully restore", () => {
  for (const [key, replacement, rejection] of [
    ["revision", "2222222222222222222222222222222222222222", /HC013_REVISION_PIN/u],
    ["scope", "line-range", /HC013_SCOPE_PIN/u],
  ]) {
    roundTripMutation(snapshot,
      (value) => { value[key] = replacement; },
      (value) => {
        assert.equal(value[key], replacement);
        assert.deepEqual({ ...value, [key]: snapshot[key] }, snapshot);
        assert.equal(value.sha256, sourcePins[0].sha256);
      },
      assertSnapshotPins, rejection);
  }
  roundTripMutation(sourcePacket,
    (value) => { value.sourceReferences[1].sourcePath = sourcePins[0].sourcePath; },
    (value) => {
      assert.equal(value.sourceReferences[1].sourcePath, sourcePins[0].sourcePath);
      assert.deepEqual(value.sourceReferences[0], sourcePacket.sourceReferences[0]);
    },
    assertSourcePins, /HC013_SOURCE_PATH/u);
});

test("HC-013 whole packet body comparisons reject partial text even with intact revision/scope and restore", () => {
  const original = packetTransport();
  assertSameTransport(original, { instructions: original.instructions, bytes: Buffer.from(original.bytes) });
  let changed = { instructions: original.instructions, bytes: Buffer.from(original.bytes) };
  try {
    const card = JSON.parse(changed.bytes);
    const packet = JSON.parse(card.materials[0].displayText);
    packet.textContent.text = packet.textContent.text.slice(0, -1);
    assert.deepEqual({ ...packet, textContent: sourcePacket.textContent }, sourcePacket);
    assert.equal(packet.textContent.text.length, sourcePacket.textContent.text.length - 1);
    assert.deepEqual(packet.sourceReferences, sourcePacket.sourceReferences);
    card.materials[0].displayText = stableJson(packet);
    changed.bytes = Buffer.from(stableJson(card));
    assert.throws(() => assertFullPackets(changed), /HC013_FULL_PACKET_BYTES/u);
  } finally {
    changed = { instructions: original.instructions, bytes: Buffer.from(original.bytes) };
  }
  assertSameTransport(original, changed);
});

test("HC-013 manual control compares instructions and the entire JSON including limitations and array order", () => {
  const original = packetTransport();
  for (const [name, mutate, postImage, rejection] of [
    ["limitations", (card) => { delete card.limitations; }, (card) => assert.equal(Object.hasOwn(card, "limitations"), false), /HC013_WHOLE_JSON_BYTES/u],
    ["array", (card) => { card.organization.readingOrder.reverse(); }, (card) => assert.deepEqual(card.organization.readingOrder, ["P3", "P1", "P2"]), /HC013_WHOLE_JSON_BYTES/u],
    ["instructions", (card) => { card.instructions += "\n"; }, (card) => assert.equal(card.instructions, `${original.instructions}\n`), /HC013_WHOLE_JSON_BYTES/u],
  ]) {
    assertSameTransport(original, { instructions: original.instructions, bytes: Buffer.from(original.bytes) });
    let changed = { instructions: original.instructions, bytes: Buffer.from(original.bytes) };
    try {
      const before = JSON.parse(original.bytes);
      const card = JSON.parse(changed.bytes);
      mutate(card);
      postImage(card);
      if (name === "limitations") assert.deepEqual({ ...card, limitations: before.limitations }, before);
      if (name === "array") assert.deepEqual({ ...card, organization: before.organization }, before);
      if (name === "instructions") assert.deepEqual({ ...card, instructions: before.instructions }, before);
      changed.bytes = Buffer.from(stableJson(card));
      assert.throws(() => assertSameTransport(original, changed), rejection);
    } finally {
      changed = { instructions: original.instructions, bytes: Buffer.from(original.bytes) };
    }
    assertSameTransport(original, changed);
  }
  const differentInstructions = { instructions: `${original.instructions} `, bytes: Buffer.from(original.bytes) };
  assert.deepEqual(differentInstructions.bytes, original.bytes);
  assert.throws(() => assertSameTransport(original, differentInstructions), /HC013_INSTRUCTIONS/u);
  differentInstructions.instructions = original.instructions;
  assertSameTransport(original, differentInstructions);
  const manual = Buffer.concat([Buffer.from(`${original.instructions}\n\n`), original.bytes]);
  const prefix = Buffer.byteLength(`${original.instructions}\n\n`);
  assert.deepEqual(manual.subarray(prefix), original.bytes);
  assert.equal(manual.subarray(0, prefix).toString(), `${original.instructions}\n\n`);
});

test("HC-013 identical wrong hashes in B and C still fail the independent baseline oracle", () => {
  const original = stableJson(sourcePacket);
  let left = JSON.parse(original);
  let right = JSON.parse(original);
  assertSourcePins(left);
  assertSourcePins(right);
  try {
    left.sourceReferences[0].originalSha256 = "0".repeat(64);
    right.sourceReferences[0].originalSha256 = "0".repeat(64);
    assert.deepEqual(left, right);
    assert.equal(left.sourceReferences[0].originalSha256, "0".repeat(64));
    assert.equal(left.sourceReferences[0].revision, sourceCommit);
    assert.equal(left.sourceReferences[0].scope, "whole-file");
    assert.throws(() => assertSourcePins(left), /HC013_SOURCE_HASH_PIN/u);
    assert.throws(() => assertSourcePins(right), /HC013_SOURCE_HASH_PIN/u);
  } finally {
    left = JSON.parse(original);
    right = JSON.parse(original);
  }
  assert.equal(stableJson(left), original);
  assert.equal(stableJson(right), original);
  assertSourcePins(left);
  assertSourcePins(right);
});

test("HC-013 preserves unresolved/missing/error/empty/partial data without invented hashes or calls", () => {
  const assertFrozen = (value) => assert.deepEqual(value, provenance, "HC013_FROZEN_PROVENANCE");
  for (const index of [2, 3, 4, 5, 6, 7]) {
    roundTripMutation(provenance,
      (value) => { value.packets[index].sha256 = sourcePins[0].sha256; },
      (value) => {
        assert.equal(value.packets[index].sha256, sourcePins[0].sha256);
        const restored = structuredClone(value);
        restored.packets[index].sha256 = null;
        assert.deepEqual(restored, provenance);
      },
      assertFrozen, /HC013_FROZEN_PROVENANCE/u);
  }
  roundTripMutation(provenance,
    (value) => { value.packets[2].resolvedRevision = sourceCommit; },
    (value) => {
      assert.equal(value.packets[2].revision, "main");
      assert.equal(value.packets[2].resolvedRevision, sourceCommit);
      assert.equal(value.packets[2].sha256, null);
    },
    assertFrozen, /HC013_FROZEN_PROVENANCE/u);
  roundTripMutation(provenance,
    (value) => { value.packets[3].sourceExistence = "absent"; },
    (value) => assert.equal(value.packets[3].sourceExistence, "absent"),
    assertFrozen, /HC013_FROZEN_PROVENANCE/u);
  roundTripMutation(provenance,
    (value) => { value.packets[4].bodyText = ""; },
    (value) => {
      assert.equal(Object.hasOwn(value.packets[4], "bodyText"), true);
      assert.equal(value.packets[4].bodyText, "");
    },
    assertFrozen, /HC013_FROZEN_PROVENANCE/u);
  for (const [key, replacement, rejection] of [
    ["fixtureLabel", "LIVE_SPACE", /HC013_LOCAL_LABEL/u],
    ["trainingLabel", "LIVE_OPERATION", /HC013_SYNTHETIC_LABEL/u],
    ["actualHistoricalDecision", "invented-fixture-history", /HC013_UNKNOWN_HISTORY/u],
  ]) {
    roundTripMutation(cardTemplate,
      (value) => { value[key] = replacement; },
      (value) => assert.equal(value[key], replacement),
      assertLocalCard, rejection);
  }
  for (const key of ["aclVerified", "getCopilotSpaceCall"]) {
    roundTripMutation(cardTemplate,
      (value) => { value.observations[key] = key === "aclVerified" ? true : "invented-fixture-call"; },
      (value) => assert.equal(value.observations[key], key === "aclVerified" ? true : "invented-fixture-call"),
      assertLocalCard, /HC013_NO_LIVE_OBSERVATION/u);
  }
});

test("HC-013 future material equality may ignore object key order but never arrays, missing fields or instructions", () => {
  const original = JSON.parse(packetTransport().bytes);
  const reordered = Object.fromEntries(Object.entries(original).reverse());
  assert.notEqual(stableJson(reordered), stableJson(original));
  assert.deepEqual(reordered, original);
  const missing = structuredClone(original);
  delete missing.limitations;
  assert.equal(Object.hasOwn(missing, "limitations"), false);
  assert.throws(() => assert.deepEqual(missing, original));
  missing.limitations = structuredClone(original.limitations);
  assert.deepEqual(missing, original);
  const reversed = structuredClone(original);
  reversed.materials.reverse();
  assert.equal(reversed.materials[0].id, "P3");
  assert.throws(() => assert.deepEqual(reversed, original));
  reversed.materials.reverse();
  assert.deepEqual(reversed, original);
});

test("HC-013 evidence is exactly three submitted-only run-state documents pinned to their own LF templates", () => {
  assert.equal(manifest.evidenceRequirements.length, 3);
  for (const requirement of manifest.evidenceRequirements) {
    const name = path.posix.basename(requirement.path);
    assert.equal(requirement.path, `.hackathon/evidence/hc-013/${name}`);
    assert.equal(requirement.stage, "submitted");
    assert.deepEqual(requirement.conditions, conditions);
    assert.deepEqual(requirement.requiredHeadings, evidenceHeadings[name]);
    const bytes = payload.get(`${name}.template`);
    assert.equal(requirement.templateSha256, sha256(bytes));
    assert.deepEqual([...bytes.toString().matchAll(/^## (.+)$/gmu)].map((match) => match[1]), evidenceHeadings[name]);
    assert.equal(manifest.allowedAdditions.some(({ pattern }) => pattern === requirement.path), false);
  }
  const additionsCheck = (value) => assert.deepEqual(value.allowedAdditions, additions, "HC013_EXACT_GRANTS");
  roundTripMutation(manifest,
    (value) => { value.allowedAdditions[2].conditions = ["manual-equivalent"]; },
    (value) => assert.deepEqual(value.allowedAdditions[2].conditions, ["manual-equivalent"]),
    additionsCheck, /HC013_EXACT_GRANTS/u);
  roundTripMutation(manifest,
    (value) => { value.allowedAdditions[0].pattern = "participant/hc-013/**"; },
    (value) => assert.equal(value.allowedAdditions[0].pattern, "participant/hc-013/**"),
    additionsCheck, /HC013_EXACT_GRANTS/u);
  for (const [mutate, postImage, code] of [
    [(value) => value.allowedAdditions.push({ pattern: ".hackathon/evidence/hc-013/comparison.md", conditions }),
      (value) => assert.equal(value.allowedAdditions.at(-1).pattern, ".hackathon/evidence/hc-013/comparison.md"), "PACK_ADDITION_RESERVED_PATH"],
    [(value) => value.allowedAdditions.push({ pattern: ".vscode/mcp.json", conditions: ["baseline"] }),
      (value) => assert.equal(value.allowedAdditions.at(-1).pattern, ".vscode/mcp.json"), "PACK_BASELINE_ACTIVE_CUSTOMIZATION"],
    [(value) => { value.evidenceRequirements[1].stage = "in-progress"; },
      (value) => assert.equal(value.evidenceRequirements[1].stage, "in-progress"), "PACK_EVIDENCE_STAGE"],
    [(value) => { value.isolation.branchSafe = true; },
      (value) => assert.equal(value.isolation.branchSafe, true), "PACK_BRANCH_SAFETY"],
  ]) {
    assert.deepEqual(validatePackManifest(manifest, "HC-013"), []);
    const original = stableJson(manifest);
    let changed = JSON.parse(original);
    mutate(changed);
    postImage(changed);
    assertErrorCode(validatePackManifest(changed, "HC-013"), code);
    changed = JSON.parse(original);
    assert.equal(stableJson(changed), original);
    assert.deepEqual(validatePackManifest(changed, "HC-013"), []);
  }
});

test("HC-013 handwritten core and single guide validate with intended metadata while integration is pending", async () => {
  assert.deepEqual(validateCatalog(catalogFixture), []);
  assert.deepEqual(await validatePublishedPages({ challenges: [entry] }), []);
  const live = liveCatalog.challenges.find(({ id }) => id === "HC-013");
  if (live.status === "published") {
    for (const key of ["id", "title", "track", "sourceLab", "sourceKind", "sourcePaths", "optionalRoutes"]) {
      assert.deepEqual(live[key], entry[key]);
    }
  }
  else {
    assert.equal(live.status, "planned");
    assert.equal(live.title, entry.title);
    assert.deepEqual(live.sourceLab, entry.sourceLab);
  }
  assert.deepEqual(validateChallengePageText(entry.id, page), []);
  assert.deepEqual([...page.matchAll(/^## (.+)$/gmu)].map((match) => match[1]), REQUIRED_CHALLENGE_HEADINGS);
  assert.ok(page.startsWith(`# HC-013 ${entry.title}\n`));
  assert.ok(parseMarkdownProse(page).sections[0].body.includes("本編はSpaceに整理するためのローカル資料設計であり、実Spaceの作成・取得ではありません。"));
  for (const sourcePath of entry.sourcePaths) assert.ok(page.includes(sourcePath), sourcePath);
  for (const word of [
    "JSON全文", "raw bytes", "limitations", "instructions", "sanitized全体display", "missing", "error", "empty", "partial",
    "NOT_PROVIDED", "テスト定義を読むだけ", "get_copilot_space", "sourceアクセスの観測",
    "runtimeBehavior", "educationalEffect", "比較不能", "共有せず",
  ]) assert.ok(page.includes(word), word);
  assert.match(page, /apply-pack\.mjs \$Pack --team team-sora --condition baseline --run-id hc013-base-01/u);
  assert.match(page, /verify-run\.mjs \$Pack --stage submitted/u);
  assert.match(page, /export-submission\.mjs \$Pack/u);
  assert.deepEqual(await readdir(path.join(root, "optional")), ["space-read.md"]);
  assert.deepEqual(validateOptionalRoutes(entry), []);
  assert.deepEqual(validateOptionalGuideText(entry, entry.optionalRoutes[0], guide), []);
  assert.deepEqual(parseMarkdownProse(guide).sections.map(({ title }) => title), OPTIONAL_GUIDE_HEADINGS);
  assert.ok(guide.includes(OPTIONAL_SAFETY_NOTICE));
  assert.ok(guide.includes(OPTIONAL_EVIDENCE_NOTICE));
  for (const word of ["その場で発見したtool schemaを読む", "repository contextとuploadしたファイルはIDE非対応", "MCPのenvelope", "配列順・値・欠落"]) {
    assert.ok(guide.includes(word), word);
  }
  assert.deepEqual(JSON.parse(payload.get("github-spaces.mcp.json.template")), {
    servers: { hc013SpacesReferenceOnly: {
      type: "http", url: "https://api.githubcopilot.com/mcp/",
      headers: { "X-MCP-Toolsets": "copilot_spaces", "X-MCP-Readonly": "true" },
    } },
  });
});

test("HC-013 real CLI emits exact grants for all three scoped core conditions without changing the catalog", () => {
  for (const condition of conditions) {
    const result = runScopedCli([
      "--dry-run", "--challenge", "HC-013", "--condition", condition, "--team", "fixture-only", "--run", condition,
    ]);
    assertExit(result, 0);
    assert.equal(result.stderr, "");
    const plan = JSON.parse(result.stdout);
    assert.equal(plan.condition, condition);
    assert.equal(plan.filesToInject.length, 14);
    assert.deepEqual(plan.participantChanges.allowedAdditions, additions.filter((item) => item.conditions.includes(condition)));
    assert.equal(plan.runStateEvidence.length, 3);
  }
});

test("HC-013 real optional CLI preserves not-checked, rejects mixed/unknown input and aggregates a single blocked requirement", () => {
  const args = ["--dry-run", "--challenge", "HC-013", "--route", "space-read"];
  const positive = runScopedCli(args);
  assertExit(positive, 0);
  assert.equal(positive.stderr, "");
  const plan = JSON.parse(positive.stdout);
  assert.equal(plan.mode, "optional-guide");
  assert.equal(plan.readiness.status, "not-checked");
  assert.equal(plan.liveStatus, "live-unobserved");
  assert.equal(Object.hasOwn(plan, "filesToInject"), false);
  for (const [extra, pattern] of [
    [["--condition", "baseline"], /cannot be combined with --condition/u],
    [["--team", "fixture-only"], /cannot be combined with --team/u],
  ]) {
    const result = runScopedCli([...args, ...extra]);
    assertExit(result, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, pattern);
  }
  const unknown = runScopedCli(["--dry-run", "--challenge", "HC-013", "--route", "unknown-route"]);
  assertExit(unknown, 1);
  assert.equal(unknown.stdout, "");
  assert.match(unknown.stderr, /Unknown route for HC-013: unknown-route/u);
  const changedCatalog = structuredClone(catalogFixture);
  const changedRoute = changedCatalog.challenges.find(({ id }) => id === "HC-013").optionalRoutes[0];
  changedRoute.runtimeRequirements[1].status = "blocked";
  assert.deepEqual(changedRoute.runtimeRequirements.map(({ status }) => status), ["not-checked", "blocked"]);
  const changedGuide = guide.replace("| source-acl-observation | not-checked |", "| source-acl-observation | blocked |");
  assert.notEqual(changedGuide, guide);
  assert.ok(changedGuide.includes("| source-acl-observation | blocked |"));
  const blocked = runScopedCli(args, {
    [path.join(REPOSITORY_ROOT, "catalog", "challenges.json")]: stableJson(changedCatalog),
    [path.join(root, "optional", "space-read.md")]: changedGuide,
  });
  assertExit(blocked, 2);
  assert.match(blocked.stderr, /OPTIONAL_ROUTE_BLOCKED: HC-013\/space-read: source-acl-observation/u);
  assert.equal(JSON.parse(blocked.stdout).readiness.runtimeCapabilities, "blocked");
  const restored = runScopedCli(args);
  assertExit(restored, 0);
  assert.equal(restored.stdout, positive.stdout);
  assert.equal(restored.stderr, "");
});

test("HC-013 real CLI rejects an Evidence-byte mutation for its template hash and restores full original output", () => {
  const args = ["--dry-run", "--challenge", "HC-013", "--condition", "baseline", "--team", "fixture-only", "--run", "restore"];
  const positive = runScopedCli(args);
  assertExit(positive, 0);
  const original = payload.get("provenance.md.template");
  const changed = original.toString().replace("## Whole material equality\n", "## Missing material equality\n");
  assert.notEqual(changed, original.toString());
  assert.match(changed, /^## Missing material equality$/mu);
  assert.doesNotMatch(changed, /^## Whole material equality$/mu);
  const negative = runScopedCli(args, { [path.join(pack, "payload", "provenance.md.template")]: changed });
  assertExit(negative, 1);
  assert.equal(negative.stdout, "");
  assert.match(negative.stderr, /PACK_EVIDENCE_TEMPLATE_HASH/u);
  const restored = runScopedCli(args);
  assertExit(restored, 0);
  assert.equal(restored.stdout, positive.stdout);
  assert.equal(restored.stderr, "");
});

test("HC-013 bounded helper stays inert ASCII and rejects incomplete design or undeclared CLI arguments", async () => {
  assert.ok([...helperBytes].every((byte) => byte < 128));
  assert.ok(manifest.overlay.some(({ source, conditions: applied }) =>
    source === "payload/prepare-display.mjs.template" && JSON.stringify(applied) === JSON.stringify(conditions)));
  assert.ok(manifest.allowedAdditions.every(({ pattern }) => !pattern.endsWith(".mjs") && !pattern.includes(".vscode")));
  assert.throws(() => displayHelper.parseDesign(payload.get("design.md.template")), /HC013_DESIGN_FIELDS/u);
  assert.throws(() => displayHelper.transformSource("B3", Buffer.from("non-source fixture\n")), /HC013_SOURCE_DRIFT_B3/u);
  assert.throws(() => displayHelper.transformSource("unknown", Buffer.from("fixture\n")), /HC013_SOURCE_ID/u);
  await assert.rejects(displayHelper.runCli(["prepare", "baseline", "--output", "elsewhere"]), /HC013_ARGUMENTS/u);
  await assert.rejects(displayHelper.runCli(["prepare", "unknown"]), /HC013_CONDITION/u);
  assert.match(page, /Get-Content -Raw -Encoding UTF8 .*prepare-display\.mjs\.template \| node --input-type=module - prepare baseline/u);
  assert.ok(page.includes("原本のbyte-exact複製ではなく、実行可能なJavaとも限りません"));
  assert.ok(page.includes("旧 `rawText` カードは再利用しません"));
  assert.ok(page.includes("Runtime v1の実exportが拒否したら"));
});

const sourceRootInput = process.env.HC013_SOURCE_ROOT;
const qaRootInput = process.env.HC013_QA_ROOT;
test("HC-013 actual pinned sources and the shipped helper produce only complete sanitized participant artifacts", {
  skip: sourceRootInput && qaRootInput ? false
    : "Requires explicit read-only HC013_SOURCE_ROOT and owned repository-external HC013_QA_ROOT; no source is downloaded or copied.",
}, async (t) => {
  const sourceRoot = await realpath(sourceRootInput);
  const qaRoot = await realpath(qaRootInput);
  const relative = path.relative(REPOSITORY_ROOT, qaRoot);
  assert.ok(relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative), "QA root must be outside repository");
  const originals = await Promise.all(sourcePins.map((pin) => readFile(path.join(sourceRoot, ...pin.sourcePath.split("/")))));
  originals.forEach((bytes, index) => {
    assert.equal(bytes.length, sourcePins[index].bytes);
    assert.equal(sha256(bytes), sourcePins[index].sha256);
  });
  const originalLines = originals[2].toString("utf8").split("\n");
  const removedLiterals = redactedLines.map((number) => {
    const quoted = [...originalLines[number - 1].matchAll(/"([^"\\]*)"/gu)];
    return quoted[number === 242 ? 0 : 1][1];
  });
  const literalRows = originalLines.flatMap((line, index) =>
    removedLiterals.some((value) => line.includes(value)) ? [index + 1] : []);
  assert.deepEqual(literalRows, redactedLines);
  const assertAbsent = (bytes) => {
    assert.ok(removedLiterals.every((value) => !bytes.toString("utf8").includes(value)), "Removed literals must not persist");
  };
  const design = {
    instructions: "SYNTHETIC_TRAINING_ONLY: 同じsanitized全体displayと全metadataを渡し、原本と表示のhashを分ける。未確認の版・範囲・履歴を補充しない。",
    organization: {
      reader: "fixture-onlyの資料点検担当",
      readingOrder: ["P2", "P1", "B1", "B2", "B3", "P3"],
      groups: [{ title: "原本参照", members: ["B1", "B2", "B3"] }, { title: "資料のmetadata", members: ["P1", "P2", "P3"] }],
      omissionPolicy: "preserve-full-display-and-metadata",
    },
  };
  const designBytes = Buffer.from(payload.get("design.md.template").toString("utf8").replace(
    /^```hc013-design\n[\s\S]*?^```$/mu, `\`\`\`hc013-design\n${stableJson(design)}\`\`\``,
  ));
  assert.deepEqual(displayHelper.parseDesign(designBytes), design);
  const roots = new Map();
  const prepared = new Map();
  function helperCli(directory, operation, condition) {
    return spawnSync(process.execPath, ["--input-type=module", "-", operation, condition, "--source-root", sourceRoot], {
      cwd: directory, input: helperBytes, encoding: "utf8", timeout: 30_000, maxBuffer: 1_048_576,
    });
  }
  for (const condition of conditions) {
    const directory = path.join(qaRoot, `hc013 display ${randomUUID()}`);
    await mkdir(directory);
    t.after(() => rm(directory, { recursive: true, force: true }));
    roots.set(condition, directory);
    const overlay = path.join(directory, ".hackathon", "challenge", "hc-013");
    await mkdir(overlay, { recursive: true });
    await mkdir(path.join(directory, "participant", "hc-013"), { recursive: true });
    for (const [name, bytes] of payload) await writeFile(path.join(overlay, name), bytes, { flag: "wx" });
    await writeFile(path.join(directory, "participant", "hc-013", "design.md"), designBytes, { flag: "wx" });
    assert.equal((await readdir(directory)).includes("wholesale-batch"), false, "Never copy original source into a fixture");
  }

  await t.test("only six complete B3 lines change; full surroundings, line counts, original/display pins and values are checked", () => {
    for (const [index, pin] of sourcePins.entries()) {
      const result = displayHelper.transformSource(pin.id, originals[index]);
      const lines = originals[index].toString("utf8").split("\n");
      const displayed = result.displayText.split("\n");
      assert.equal(displayed.length, lines.length);
      const changed = lines.flatMap((line, position) => line !== displayed[position] ? [position + 1] : []);
      assert.deepEqual(changed, index === 2 ? redactedLines : []);
      for (const [position, line] of lines.entries()) {
        if (index === 2 && redactedLines.includes(position + 1)) {
          assert.equal(displayed[position], `        // HC013_DISPLAY_REDACTED: authentication statement removed at original line ${position + 1}; display only.`);
          assert.doesNotMatch(displayed[position], /[=]|password|secret|token/iu);
        } else assert.ok(displayed[position] === line, `unchanged ${pin.id} line ${position + 1}`);
      }
      assert.equal(result.transformation.original.sha256, pin.sha256);
      assert.equal(result.transformation.original.bytes, pin.bytes);
      assert.equal(result.transformation.display.sha256, displayPins[index].sha256);
      assert.equal(result.transformation.display.bytes, displayPins[index].bytes);
      assert.equal(sha256(result.displayText), displayPins[index].sha256);
      assert.equal(Buffer.byteLength(result.displayText), displayPins[index].bytes);
      assert.equal(result.transformation.unchangedLineCount, lineCounts[index] - changed.length);
      assert.equal(result.transformation.redactedLineCount, changed.length);
      assertAbsent(Buffer.from(stableJson(result)));
      assert.equal(stableJson(displayHelper.transformSource(pin.id, originals[index])), stableJson(result));
    }
  });

  await t.test("real prepare/verify CLI creates exact 2+2+3 grants with full A/B/C equivalence and refuses overwrites", async () => {
    for (const condition of conditions) {
      const directory = roots.get(condition);
      const created = helperCli(directory, "prepare", condition);
      assertExit(created, 0);
      assert.equal(created.stderr, "");
      const summary = JSON.parse(created.stdout);
      assert.equal(summary.runtimeExport, "not-observed");
      assert.equal(summary.verification, "prepared-display-integrity-only");
      const grants = additions.filter((item) => item.conditions.includes(condition)).map((item) => item.pattern);
      assert.deepEqual(summary.artifacts.map(({ destination }) => destination), grants);
      const built = await displayHelper.buildArtifacts(directory, condition, { sourceRoot });
      prepared.set(condition, built);
      const actual = await Promise.all(grants.map(async (destination) => ({
        destination, bytes: await readFile(path.join(directory, ...destination.split("/"))),
      })));
      displayHelper.verifyPreparedArtifacts(built, actual);
      for (const artifact of actual) assertAbsent(artifact.bytes);
      assertExit(helperCli(directory, "verify", condition), 0);
      const repeated = helperCli(directory, "prepare", condition);
      assertExit(repeated, 1);
      assert.equal(repeated.stdout, "");
      assert.equal(repeated.stderr, "HC013_DESTINATION_EXISTS\n");
      for (const artifact of actual) assert.ok(artifact.bytes.equals(await readFile(path.join(directory, ...artifact.destination.split("/")))));
    }
    const baseline = prepared.get("baseline");
    const card = prepared.get("context-card");
    const manual = prepared.get("manual-equivalent");
    assert.ok(baseline.cardBytes.equals(card.cardBytes));
    assert.ok(card.cardBytes.equals(manual.cardBytes));
    assert.equal(card.card.instructions, design.instructions);
    assert.equal(card.card.materials.length, 6);
    assert.deepEqual(card.card.materials.map(({ id }) => id), ["B1", "B2", "B3", "P1", "P2", "P3"]);
    for (const [index, name] of packetNames.entries()) {
      assert.ok(Buffer.from(card.card.materials[index + 3].displayText).equals(payload.get(name)));
    }
    const handoff = baseline.artifacts[1].bytes.toString("utf8");
    const blocks = [...handoff.matchAll(/```json\n([\s\S]*?)\n```/gu)].map((match) => JSON.parse(match[1]));
    assert.equal(blocks[0], card.card.instructions);
    assert.deepEqual({ ...blocks[1], materials: blocks.slice(2) }, card.card);
    assert.ok(manual.artifacts.at(-1).bytes.equals(Buffer.concat([Buffer.from(`${design.instructions}\n\n`), card.cardBytes])));
  });

  await t.test("unexpected display, receipt, fields, array order, instructions and one-sided originals are rejected then restored", async () => {
    const good = prepared.get("context-card");
    const check = (bytes) => displayHelper.verifyPreparedArtifacts(good, [
      good.artifacts[0], { destination: good.artifacts[1].destination, bytes },
    ]);
    for (const [mutate, postImage] of [
      [(card) => { card.materials[0].displayText = card.materials[0].displayText.slice(1); },
        (card) => assert.equal(Buffer.byteLength(card.materials[0].displayText), sourcePins[0].bytes - 1)],
      [(card) => { card.materials[2].transformation.spans.push({ startLine: 1, endLine: 1, operation: "replace-whole-line" }); },
        (card) => assert.equal(card.materials[2].transformation.spans.length, 7)],
      [(card) => { card.extraData = "unrequested fixture field"; }, (card) => assert.equal(card.extraData, "unrequested fixture field")],
      [(card) => { delete card.limitations; }, (card) => assert.equal(Object.hasOwn(card, "limitations"), false)],
      [(card) => { card.materials.reverse(); }, (card) => assert.equal(card.materials[0].id, "P3")],
      [(card) => { card.instructions += "\n"; }, (card) => assert.equal(card.instructions, `${design.instructions}\n`)],
      [(card) => { card.materials[2].metadata.display.sha256 = card.materials[2].metadata.originalSha256; },
        (card) => assert.equal(card.materials[2].metadata.display.sha256, sourcePins[2].sha256)],
    ]) {
      check(good.cardBytes);
      let changed = Buffer.from(good.cardBytes);
      try {
        const card = JSON.parse(changed);
        mutate(card);
        postImage(card);
        changed = Buffer.from(stableJson(card));
        assertAbsent(changed);
        assert.throws(() => check(changed), /HC013_DISPLAY_ARTIFACT_MISMATCH/u);
      } finally { changed = Buffer.from(good.cardBytes); }
      assert.ok(changed.equals(good.cardBytes));
      check(changed);
    }
    // The raw negative is in memory only: never write it, print it or snapshot assertion values.
    const oneSided = JSON.parse(good.cardBytes);
    oneSided.materials[2].displayText = originals[2].toString("utf8");
    assert.ok(Buffer.from(oneSided.materials[2].displayText).equals(originals[2]));
    assert.throws(() => check(Buffer.from(stableJson(oneSided))), /HC013_DISPLAY_ARTIFACT_MISMATCH/u);
    check(good.cardBytes);
    const wrong = JSON.parse(good.cardBytes);
    wrong.materials[2].metadata.originalSha256 = "0".repeat(64);
    const sameWrong = Buffer.from(stableJson(wrong));
    assert.ok(sameWrong.equals(Buffer.from(stableJson(wrong))));
    for (const condition of ["context-card", "manual-equivalent"]) {
      const expected = prepared.get(condition);
      const supplied = expected.artifacts.map((item) => item.destination.endsWith("context-card.json.template")
        ? { ...item, bytes: sameWrong } : item);
      assert.throws(() => displayHelper.verifyPreparedArtifacts(expected, supplied), /HC013_DISPLAY_ARTIFACT_MISMATCH/u);
      displayHelper.verifyPreparedArtifacts(expected, expected.artifacts);
    }
  });

  await t.test("physical safe display mutation and instruction-only mutation fail the actual CLI and restore exactly", async () => {
    const directory = roots.get("context-card");
    const good = prepared.get("context-card");
    const target = path.join(directory, "participant", "hc-013", "context-card.json.template");
    const edited = JSON.parse(good.cardBytes);
    edited.materials[2].transformation.redactedLineCount = 7;
    assert.equal(edited.materials[2].transformation.redactedLineCount, 7);
    try {
      await writeFile(target, stableJson(edited));
      assert.equal(JSON.parse(await readFile(target)).materials[2].transformation.redactedLineCount, 7);
      const result = helperCli(directory, "verify", "context-card");
      assertExit(result, 1);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr, "HC013_DISPLAY_ARTIFACT_MISMATCH_context-card.json.template\n");
    } finally { await writeFile(target, good.cardBytes); }
    assert.ok((await readFile(target)).equals(good.cardBytes));
    assertExit(helperCli(directory, "verify", "context-card"), 0);
    const designPath = path.join(directory, "participant", "hc-013", "design.md");
    const newDesign = structuredClone(design);
    newDesign.instructions += " ";
    const changed = Buffer.from(designBytes.toString().replace(stableJson(design), stableJson(newDesign)));
    assert.equal(displayHelper.parseDesign(changed).instructions, `${design.instructions} `);
    assert.deepEqual(displayHelper.parseDesign(changed).organization, design.organization);
    try {
      await writeFile(designPath, changed);
      const result = helperCli(directory, "verify", "context-card");
      assertExit(result, 1);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /^HC013_DISPLAY_ARTIFACT_MISMATCH/u);
    } finally { await writeFile(designPath, designBytes); }
    assert.ok((await readFile(designPath)).equals(designBytes));
    assertExit(helperCli(directory, "verify", "context-card"), 0);
  });

  await t.test("source drift is rejected before transformation, and all three on-disk originals remain unchanged", async () => {
    for (const [index, pin] of sourcePins.entries()) {
      const original = originals[index];
      let changed = Buffer.from(original);
      changed[0] ^= 1;
      assert.notEqual(changed[0], original[0]);
      assert.ok(changed.subarray(1).equals(original.subarray(1)));
      assert.throws(() => displayHelper.transformSource(pin.id, changed), new RegExp(`HC013_SOURCE_DRIFT_${pin.id}`, "u"));
      changed = Buffer.from(original);
      assert.ok(changed.equals(original));
      assert.equal(displayHelper.transformSource(pin.id, changed).transformation.original.sha256, pin.sha256);
      assert.ok((await readFile(path.join(sourceRoot, ...pin.sourcePath.split("/")))).equals(original));
    }
  });

  await t.test("PowerShell UTF8 stdin execution works in an owned spaced path without Runtime or source writes", {
    skip: process.platform === "win32" ? false : "Windows PowerShell probe is not substituted by a Node-only probe.",
  }, () => {
    const directory = roots.get("manual-equivalent");
    const escapedRoot = sourceRoot.replaceAll("'", "''");
    const command = `Get-Content -Raw -Encoding UTF8 .\\.hackathon\\challenge\\hc-013\\prepare-display.mjs.template | node --input-type=module - verify manual-equivalent --source-root '${escapedRoot}'; exit $LASTEXITCODE`;
    const result = spawnSync("pwsh", ["-NoProfile", "-NonInteractive", "-Command", command], {
      cwd: directory,
      encoding: "utf8", timeout: 30_000, maxBuffer: 1_048_576,
    });
    assertExit(result, 0);
    assert.equal(result.stderr, "");
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.cardSha256, sha256(prepared.get("context-card").cardBytes));
    assert.equal(summary.runtimeExport, "not-observed");
  });
});
