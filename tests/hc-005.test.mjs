import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadCatalog } from "../scripts/lib/catalog.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../scripts/lib/constants.mjs";
import {
  listFilesRecursively,
  readJson,
  readRepositoryFile,
  REPOSITORY_ROOT,
  sha256,
} from "../scripts/lib/fs-utils.mjs";
import { parseMarkdownProse } from "../scripts/lib/markdown.mjs";
import {
  OPTIONAL_EVIDENCE_NOTICE,
  OPTIONAL_GUIDE_HEADINGS,
  OPTIONAL_SAFETY_NOTICE,
  RUNTIME_CAPABILITY_BLOCKERS,
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
} from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

// The expected guide contract also supplies isolated negative fixtures.
const HC005_CATALOG_ENTRY = {
  "id": "HC-005",
  "title": "個人・チーム・タスクの指示を整理しよう",
  "track": "instructions",
  "status": "published",
  "sourceLab": {
    "ids": ["LAB-05"],
    "repository": "shinyay/github-copilot-customization-labs",
    "pages": ["docs/labs/lab-05-shared-task-instructions.md"]
  },
  "sourceKind": "synthetic",
  "sourcePaths": [],
  "challengeVersion": 1,
  "page": "challenges/hc-005/README.md",
  "pack": "challenges/hc-005/pack",
  "feature": "個人・チーム・用途別 Instructions の設計比較",
  "support": {
    "primary": "権限不要の合成カードによる配置・所有・再利用の設計比較",
    "fallback": "AIや機能利用権がなくても、同じ二場面を手作業で比較できる"
  },
  "isolation": {
    "tier": "repository",
    "conditionStrategy": "separate-repository"
  },
  "optionalRoutes": [
    {
      "id": "user-scope",
      "title": "User指示の保存元と隔離を確認する",
      "page": "challenges/hc-005/optional/user-scope.md",
      "required": false,
      "prerequisites": {
        "environment": [
          "別途承認された使い捨て環境で、HOMEとUser指示の保存元を分離できること。",
          "利用するVS Codeの版とAgent Hostの有無を特定できること。"
        ],
        "entitlements": [
          "対象環境でのCopilotとUser指示の利用可否を本人が確認すること。"
        ],
        "additionalApprovals": [
          "環境の所有者から、今回追加するUser指示だけの保存・確認・解除について別途承認を得ること。"
        ]
      },
      "runtimeRequirements": [
        {
          "capability": "user-source-isolation",
          "status": "not-checked",
          "reason": "Runtime v1はHOME・User指示の保存元や分離状態を検査しない。"
        },
        {
          "capability": "user-instruction-delivery",
          "status": "not-checked",
          "reason": "User指示の発見・本文投入・別の作業での再利用は実機未確認である。"
        }
      ],
      "liveStatus": "live-unobserved",
      "stopReasons": [
        "専用profileだけでHOME・User指示も隔離されたと判断してしまう場合は停止する。",
        "既存設定と今回の追加分を区別できない、または追加分だけを解除できない場合は停止する。",
        "利用資格・所有者承認・保存元のいずれかが未確認なら実機試行は未実施にする。"
      ]
    },
    {
      "id": "task-generation",
      "title": "用途別生成の入口とRuntime制約を確認する",
      "page": "challenges/hc-005/optional/task-generation.md",
      "required": false,
      "prerequisites": {
        "environment": [
          "対象のVS Code版とreview・commit message・PR descriptionの生成入口を特定できること。",
          "通常のworkspace設定を追跡する試行には、別途承認されたRuntimeの対応が必要である。"
        ],
        "entitlements": [
          "選んだ生成入口の利用資格と必要な拡張の有無を本人が確認すること。"
        ],
        "additionalApprovals": [
          "環境の所有者から、選んだ用途の設定一つと合成入力だけを扱う独立試行の承認を得ること。"
        ]
      },
      "runtimeRequirements": [
        {
          "capability": "tracked-vscode-settings",
          "status": "blocked",
          "reason": "Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings."
        },
        {
          "capability": "generation-entrypoint-delivery",
          "status": "not-checked",
          "reason": "用途別設定が選んだ生成入口へ投入されることと、その出力は実機未確認である。"
        }
      ],
      "liveStatus": "live-unobserved",
      "stopReasons": [
        "Runtime v1で通常の.vscode/settings.jsonの追跡が必要な間は停止する。",
        "通常Chatしか使えない、同じ選択範囲や差分を用意できない、または既存のstageを動かす必要がある場合は停止する。",
        "投稿・commit・push・PR作成や追加の拡張導入が必要なら、このガイドでは実施しない。"
      ]
    },
    {
      "id": "organization-scope",
      "title": "組織指示の承認と対応範囲を確認する",
      "page": "challenges/hc-005/optional/organization-scope.md",
      "required": false,
      "prerequisites": {
        "environment": [
          "利用する製品・clientの版と、対象組織での指示の保存元を特定できること。",
          "VS CodeとGitHub Docsの適用範囲の説明差を未解決として確認すること。"
        ],
        "entitlements": [
          "対象製品でのCopilotと組織指示の利用資格を本人と組織管理者が確認すること。"
        ],
        "additionalApprovals": [
          "organization ownerから、対象範囲と復元責任を限定した別途の明示承認を得ること。"
        ]
      },
      "runtimeRequirements": [
        {
          "capability": "organization-delivery",
          "status": "not-checked",
          "reason": "Runtime v1は組織指示の保存・発見・本文投入や実際の対象製品を検査しない。"
        },
        {
          "capability": "product-scope-agreement",
          "status": "not-checked",
          "reason": "VS Codeは設定による組織指示の発見を説明する一方、GitHub DocsはGitHub.comのChat・code review・cloud agentに限定しており、説明差は未解決である。"
        }
      ],
      "liveStatus": "live-unobserved",
      "stopReasons": [
        "organization ownerの承認、利用資格、対象範囲、元の状態のいずれかが不明なら停止する。",
        "公式資料の説明差や実際の投入元を確認できない場合は、組織の実機試行を未実施にする。",
        "既存の組織設定を上書きする、または本編のUser案を組織へ広げる必要がある場合は、このガイドでは実施しない。"
      ]
    }
  ]
};

const conditions = ["baseline", "scope-design"];
const challengeRoot = path.join(REPOSITORY_ROOT, "challenges", "hc-005");
const packRoot = path.join(challengeRoot, "pack");
const evidencePath = ".hackathon/evidence/hc-005/comparison.md";
const additions = [
  { pattern: "participant/hc-005/classification.md", conditions },
  { pattern: "participant/hc-005/policy.md", conditions: ["scope-design"] },
  { pattern: "participant/hc-005/instruction-drafts.md.template", conditions: ["scope-design"] },
  { pattern: "participant/hc-005/generation-settings.json.template", conditions: ["scope-design"] },
];
const inputDigests = {
  "cards.md.template": "5f4df6ba1b238ab4eba96dd11da14f8ad4b3193544399ca9a9dfcb7227cd0063",
  "situations.md.template": "11cbef8409c739df3ad8ce27e60bae8ae99f2c0b4565492b870fbde06e77dab8",
  "request.txt.template": "45224a6c6ce4f7db6fec51e91a3b8c59c787bee52e0282f718382a829ad8b783",
};
const generationKeys = [
  "github.copilot.chat.reviewSelection.instructions",
  "github.copilot.chat.commitMessageGeneration.instructions",
  "github.copilot.chat.pullRequestDescriptionGeneration.instructions",
];
const catalogFixture = { challenges: [HC005_CATALOG_ENTRY] };
const manifest = await readJson(path.join(packRoot, "manifest.json"));
const core = await readFile(path.join(challengeRoot, "README.md"), "utf8");
const payload = new Map(await Promise.all(
  manifest.overlay.map(async ({ source }) => [
    path.posix.basename(source),
    await readFile(path.join(packRoot, ...source.split("/")), "utf8"),
  ]),
));
const guides = new Map(await Promise.all(
  HC005_CATALOG_ENTRY.optionalRoutes.map(async (route) => [
    route.id,
    await readRepositoryFile(route.page),
  ]),
));

function assertDesignBoundary(value) {
  assert.deepEqual(value.conditions, conditions, "HC005 has only the two design conditions");
  assert.deepEqual(value.allowedMutations, [], "HC005 never changes the source baseline");
  assert.deepEqual(value.allowedAdditions, additions, "HC005 only allows exact inert participant drafts");
  assert.deepEqual(value.forbiddenActiveCustomizations, []);
  assert.deepEqual(value.isolation, {
    tier: "repository",
    freshWorkspace: true,
    freshConversation: true,
    freshProfile: true,
    freshRepository: true,
    conditionStrategy: "separate-repository",
    branchSafe: false,
  });
}

function cardsFrom(contents) {
  return [...contents.matchAll(/^### (R\d{2}) — (.+)\r?\n([\s\S]*?)(?=^### R\d{2} — |$(?![\s\S]))/gmu)];
}

function visibleFragment(contents) {
  return parseMarkdownProse(`## Fragment\n\n${contents}`).sections[0].body;
}

function assertCardContract(contents) {
  const cards = cardsFrom(contents);
  assert.deepEqual(cards.map((match) => match[1]), [
    "R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08",
  ]);
  for (const [, id, , body] of cards) {
    assert.ok(
      visibleFragment(body).includes("SYNTHETIC_TRAINING_ONLY"),
      `${id} must remain visibly synthetic`,
    );
  }
  assert.doesNotMatch(
    contents,
    /expectedScope|correctScope|answer[-_]key|classificationMap|normal-candidate|正解\s*[:：]/iu,
    "Cards must not ship answer or classification maps",
  );
}

function assertEvidenceContract(value, contents) {
  assert.equal(value.evidenceRequirements.length, 1);
  const requirement = value.evidenceRequirements[0];
  assert.equal(requirement.path, evidencePath);
  assert.deepEqual(requirement.conditions, conditions);
  assert.equal(requirement.stage, "submitted");
  assert.deepEqual(
    [...contents.matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    requirement.requiredHeadings,
    "HC005 Evidence headings must match the declared headings",
  );
  assert.equal(sha256(contents), requirement.templateSha256, "HC005 Evidence template hash must match");
}

test("HC005 independently satisfies Pack v1 with exact inert additions and unchanged baseline", async () => {
  const result = await validatePackDirectory(packRoot, "HC-005");
  assert.deepEqual(result.errors, []);
  assertDesignBoundary(manifest);
  for (const key of ["schemaVersion", "challengeVersion", "minimumTemplateVersion"]) {
    assert.equal(manifest[key], 1, key);
  }
  assert.equal(manifest.challengeId, "HC-005");
  assert.deepEqual(manifest.cleanup, {
    advisory: true,
    verifyBaseline: true,
    exportSubmission: true,
    stopProcesses: true,
    archiveRepository: true,
  });
  assert.deepEqual(
    (await listFilesRecursively(packRoot)).sort(),
    ["manifest.json", ...manifest.overlay.map(({ source }) => source)].sort(),
  );
  for (const file of result.files) {
    const contents = await readFile(path.join(packRoot, ...file.split("/")), "utf8");
    assert.equal(contents.includes("\r\n"), false, `${file} must honor the existing Pack LF attributes`);
  }
  assert.equal(manifest.overlay.length, 8);
  for (const entry of manifest.overlay) {
    assert.deepEqual(entry.conditions, conditions);
    assert.equal(entry.allowOverwrite, false);
    assert.match(entry.source, /^payload\/[^/]+\.template$/u);
    assert.equal(entry.destination, `.hackathon/challenge/hc-005/${path.posix.basename(entry.source)}`);
  }
});

test("both conditions receive identical full synthetic cards, situations, requests and blank scaffolds", () => {
  const plans = conditions.map((condition) => buildRunPlan(catalogFixture, manifest, {
    challengeId: "HC-005", condition, team: "fixture", runId: condition,
  }));
  assert.deepEqual(plans[0].filesToInject, plans[1].filesToInject);
  assert.deepEqual(plans[0].runStateEvidence, plans[1].runStateEvidence);
  for (const plan of plans) {
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.participantChanges.activeCustomizationsDefault, "deny");
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.deepEqual(
      plan.participantChanges.allowedAdditions,
      additions.filter((addition) => addition.conditions.includes(plan.condition)),
    );
    for (const [name, expected] of Object.entries(inputDigests)) {
      assert.ok(plan.filesToInject.some(({ source }) => source.endsWith(`/payload/${name}`)));
      assert.equal(sha256(payload.get(name)), expected, `${plan.condition}: ${name} must retain its full fixed input`);
    }
  }
  assert.match(payload.get("request.txt.template"), /R01〜R08全8枚/u);
  assert.match(payload.get("request.txt.template"), /S1・S2の全文/u);
  assert.match(payload.get("request.txt.template"), /片方だけ入力を要約/u);
});

test("all eight cards and both fictional situations are visibly synthetic without answer maps", () => {
  const cards = payload.get("cards.md.template");
  assertCardContract(cards);
  const situations = payload.get("situations.md.template");
  const matches = [...situations.matchAll(/^## (S[12]) — (.+)\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/gmu)];
  assert.deepEqual(matches.map((match) => match[1]), ["S1", "S2"]);
  for (const [, id, , body] of matches) {
    assert.ok(visibleFragment(body).includes("SYNTHETIC_TRAINING_ONLY"), id);
    assert.match(body, /### 固定資料/u);
    assert.match(body, /### 固定タスク/u);
    assert.match(body, /R01〜R08/u);
  }
  assert.doesNotMatch(cards + situations, /wholesale-(?:core|web|batch)\/|\.java\b/u);
  for (const [name, contents] of payload) {
    assert.doesNotMatch(contents, /expectedScope|correctScope|answer[-_]key|classificationMap|normal-candidate/iu, name);
  }
  const unlabeled = cards.replace("SYNTHETIC_TRAINING_ONLY — 架空の発言。", "Label removed by a negative fixture.");
  assert.equal(cardsFrom(unlabeled)[0][3].includes("SYNTHETIC_TRAINING_ONLY"), false);
  assert.throws(() => assertCardContract(unlabeled), /R01 must remain visibly synthetic/u);
  const mapped = `${cards}\nexpectedScope: structural-fixture-only\n`;
  assert.ok(mapped.endsWith("expectedScope: structural-fixture-only\n"));
  assert.throws(() => assertCardContract(mapped), /Cards must not ship answer or classification maps/u);
});

test("participant templates leave scope choices open and generation drafts contain only empty current keys", () => {
  const settings = JSON.parse(payload.get("generation-settings.json.template"));
  assert.deepEqual(Object.keys(settings), generationKeys);
  for (const key of generationKeys) assert.deepEqual(settings[key], []);
  for (const name of ["classification.md.template", "policy.md.template", "instruction-drafts.md.template"]) {
    const contents = payload.get(name);
    assert.ok(contents.includes("SYNTHETIC_TRAINING_ONLY"), name);
    assert.doesNotMatch(contents, /^\|\s*R\d{2}\s*\|/mu, "No prefilled card-to-scope rows");
    assert.doesNotMatch(contents, /^---\r?\n(?:description|applyTo):/mu, "Drafts are not active instruction definitions");
  }
  assert.ok(core.includes("一つを選ぶか、追加なし"));
  assert.ok(core.includes("使わないキーは取り除きます"));
  assert.ok(core.includes("`text` だけで完結"));
});

test("Evidence stays submitted-only run-state with real heading/hash and exact submission paths", () => {
  const evidence = payload.get("comparison.md.template");
  assertEvidenceContract(manifest, evidence);
  assert.equal(manifest.allowedAdditions.some(({ pattern }) => pattern.startsWith(".hackathon/")), false);
  assert.deepEqual(manifest.submissionFiles, [
    ...additions, { pattern: evidencePath, conditions },
  ]);
  assert.ok(manifest.submissionFiles.every(({ pattern }) => !pattern.includes("*")));
  for (const term of [
    "not-used", "not-observed", "carryover", "User共有", "組織適用",
    "runtimeBehavior", "educationalEffect", "追加不要",
  ]) {
    assert.ok(evidence.includes(term), term);
  }
  const wrongHash = structuredClone(manifest);
  wrongHash.evidenceRequirements[0].templateSha256 = "0".repeat(64);
  assert.equal(wrongHash.evidenceRequirements[0].templateSha256, "0".repeat(64));
  assert.throws(() => assertEvidenceContract(wrongHash, evidence), /HC005 Evidence template hash must match/u);
  const withoutOutcome = evidence.replace(/^## Outcome(?=\r?$)/mu, "## Removed by a negative fixture");
  assert.equal(withoutOutcome.includes("## Outcome"), false);
  const matchingChangedHash = structuredClone(manifest);
  matchingChangedHash.evidenceRequirements[0].templateSha256 = sha256(withoutOutcome);
  assert.equal(matchingChangedHash.evidenceRequirements[0].templateSha256, sha256(withoutOutcome));
  assert.throws(
    () => assertEvidenceContract(matchingChangedHash, withoutOutcome),
    /HC005 Evidence headings must match the declared headings/u,
  );
});

test("HC005 page is complete, synthetic, permission-free and explicit about design-only carryover", async () => {
  assert.equal(core.split(/\r?\n/u)[0], `# HC-005 ${HC005_CATALOG_ENTRY.title}`);
  assert.deepEqual(validateChallengePageText("HC-005", core), []);
  const prose = parseMarkdownProse(core);
  assert.deepEqual(prose.sections.map(({ title }) => title), REQUIRED_CHALLENGE_HEADINGS);
  assert.ok(prose.sections.every(({ body }) => body.trim().length > 0));
  assert.ok(prose.sections.find(({ title }) => title === "Starter Kit").body.includes("SYNTHETIC_TRAINING_ONLY"));
  for (const term of [
    "設計比較", "AIも呼び出しません", "515-file baseline", "provenance",
    "初期案", "scope-design", "所有者", "対象外", "追加しない", "carryover",
    "人の記憶や練習は消えません", "not-observed", "not-used", "教育効果の証明ではありません",
  ]) {
    assert.ok(core.includes(term), term);
  }
  for (const command of [
    "node scripts\\plan-run.mjs --dry-run --challenge HC-005",
    "git switch -c hc-005-baseline-design-01",
    "git switch -c hc-005-scope-design-design-02",
    "npm run verify",
    "node .hackathon\\scripts\\apply-pack.mjs $pack --team team-haru --condition baseline",
    "node .hackathon\\scripts\\apply-pack.mjs $pack --team team-haru --condition scope-design",
    "node .hackathon\\scripts\\verify-run.mjs $pack --stage in-progress",
    "node .hackathon\\scripts\\verify-run.mjs $pack --stage submitted",
    "node .hackathon\\scripts\\export-submission.mjs $pack",
  ]) {
    assert.ok(core.includes(command), command);
  }
  assert.doesNotMatch(core, /about:blank|git add -f|git add --force/u);
  assert.ok(core.includes("既存ファイルが一つでもあれば、コピーを止めます"));
  assert.ok(core.includes("以前の草稿やEvidenceにStarterを重ねて上書きせず"));
  assert.deepEqual(await validatePublishedPages(catalogFixture), []);
});

test("HC005 source mapping and published metadata match the design-only guide contract", async () => {
  assert.equal(HC005_CATALOG_ENTRY.sourceKind, "synthetic");
  assert.deepEqual(HC005_CATALOG_ENTRY.sourcePaths, []);
  assert.equal(HC005_CATALOG_ENTRY.pack, "challenges/hc-005/pack");
  const actual = (await loadCatalog()).challenges.find(({ id }) => id === "HC-005");
  assert.ok(actual);
  for (const key of ["id", "title", "track", "sourceLab"]) {
    assert.deepEqual(actual[key], HC005_CATALOG_ENTRY[key], key);
  }
  assert.equal(actual.status, "published");
  assert.deepEqual(actual, HC005_CATALOG_ENTRY);
});

test("exactly three optional guides meet closed metadata, reciprocal links and six ordered sections", async () => {
  assert.deepEqual(validateOptionalRoutes(HC005_CATALOG_ENTRY), []);
  assert.deepEqual(HC005_CATALOG_ENTRY.optionalRoutes.map(({ id }) => id), [
    "user-scope", "task-generation", "organization-scope",
  ]);
  assert.deepEqual(
    (await readdir(path.join(challengeRoot, "optional"))).sort(),
    HC005_CATALOG_ENTRY.optionalRoutes.map(({ id }) => `${id}.md`).sort(),
  );
  for (const route of HC005_CATALOG_ENTRY.optionalRoutes) {
    const guide = guides.get(route.id);
    assert.equal(route.required, false);
    assert.equal(route.liveStatus, "live-unobserved");
    assert.deepEqual(validateOptionalGuideText(HC005_CATALOG_ENTRY, route, guide), []);
    assert.deepEqual(await validateOptionalRoutePage(HC005_CATALOG_ENTRY, route, core), []);
    const sections = parseMarkdownProse(guide).sections;
    assert.deepEqual(sections.map(({ title }) => title), OPTIONAL_GUIDE_HEADINGS);
    assert.ok(sections.find(({ title }) => title === "Permissions / Safety").body.includes(OPTIONAL_SAFETY_NOTICE));
    assert.ok(sections.find(({ title }) => title === "Evidence / Non-claims").body.includes(OPTIONAL_EVIDENCE_NOTICE));
  }
  for (const [page, contents] of [
    [HC005_CATALOG_ENTRY.page, core],
    ...HC005_CATALOG_ENTRY.optionalRoutes.map((route) => [route.page, guides.get(route.id)]),
  ]) {
    for (const link of parseMarkdownProse(contents).links) {
      assert.notEqual(link, "about:blank");
      if (/^[a-z][a-z0-9+.-]*:|^#/iu.test(link)) continue;
      const target = path.posix.normalize(path.posix.join(
        path.posix.dirname(page), decodeURIComponent(link.split("#")[0].split("?")[0]),
      ));
      await readRepositoryFile(target);
    }
  }
});

test("optional plans preserve the settings blocker, unknown runtime capabilities and live-unobserved state", () => {
  for (const route of HC005_CATALOG_ENTRY.optionalRoutes) {
    const plan = buildRunPlan(catalogFixture, undefined, { challengeId: "HC-005", route: route.id });
    const status = route.id === "task-generation" ? "blocked" : "not-checked";
    assert.equal(plan.mode, "optional-guide");
    assert.equal(plan.liveStatus, "live-unobserved");
    assert.deepEqual(plan.readiness, {
      status,
      environment: "not-checked",
      entitlements: "not-checked",
      additionalApprovals: "not-checked",
      runtimeCapabilities: status,
    });
    assert.deepEqual(plan.runtimeRequirements, route.runtimeRequirements);
    for (const field of [
      "condition", "conditions", "filesToInject", "participantChanges", "runStateEvidence",
      "pack", "evidenceRequirements", "allowedAdditions", "grant",
    ]) {
      assert.equal(Object.hasOwn(plan, field), false, `${route.id}: ${field}`);
    }
    for (const requirement of route.runtimeRequirements) {
      if (requirement.capability === "tracked-vscode-settings") {
        assert.equal(requirement.status, "blocked");
        assert.equal(requirement.reason, RUNTIME_CAPABILITY_BLOCKERS["tracked-vscode-settings"]);
      } else {
        assert.equal(requirement.status, "not-checked");
      }
    }
  }
  const user = guides.get("user-scope");
  for (const text of [
    "HOME", "User", "専用profile", "自分の追加分", "Agent Host",
    "~\\.copilot\\instructions", "~\\.claude\\rules", "将来の独立試行",
  ]) assert.ok(user.includes(text), text);
  const generation = guides.get("task-generation");
  for (const key of generationKeys) assert.ok(generation.includes(key), key);
  assert.ok(generation.includes("同じstaged diff"));
  const organization = guides.get("organization-scope");
  assert.ok(organization.includes("GitHub.comのChat、code review、cloud agentのみ"));
  assert.ok(organization.includes("organization owners"));
  assert.ok(organization.includes("github.copilot.chat.organizationInstructions.enabled"));
  assert.ok(organization.includes("未解決"));
  for (const guide of guides.values()) {
    assert.ok(guide.includes("2026-09-15"));
    assert.ok(guide.includes("https://code.visualstudio.com/docs/agent-customization/custom-instructions"));
  }
  assert.ok(organization.includes("https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-organization-instructions"));
});

test("Pack mutation post-images fail for the intended contract reason without touching disk", () => {
  const cases = [
    [
      (value) => { value.overlay[0].source = "payload/active.instructions.md"; },
      (value) => assert.equal(value.overlay[0].source, "payload/active.instructions.md"),
      "PACK_INERT_SOURCE",
    ],
    [
      (value) => { value.overlay[0].destination = ".vscode/settings.json"; },
      (value) => assert.equal(value.overlay[0].destination, ".vscode/settings.json"),
      "PACK_INERT_DESTINATION",
    ],
    [
      (value) => { value.overlay[0].allowOverwrite = true; },
      (value) => assert.equal(value.overlay[0].allowOverwrite, true),
      "PACK_OVERWRITE_DEFAULT_DENY",
    ],
    [
      (value) => { value.overlay[0].conditions = ["user-scope"]; },
      (value) => assert.deepEqual(value.overlay[0].conditions, ["user-scope"]),
      "PACK_CONDITION_UNKNOWN",
    ],
    [
      (value) => { value.allowedAdditions.push({ pattern: evidencePath, conditions }); },
      (value) => assert.equal(value.allowedAdditions.at(-1).pattern, evidencePath),
      "PACK_ADDITION_RESERVED_PATH",
    ],
    [
      (value) => { value.allowedAdditions.push({ pattern: "*/drafts/**", conditions }); },
      (value) => assert.equal(value.allowedAdditions.at(-1).pattern, "*/drafts/**"),
      "PACK_ADDITION_MANAGED_WILDCARD",
    ],
    [
      (value) => { value.allowedAdditions.push({ pattern: ".github/copilot-instructions.md", conditions: ["baseline"] }); },
      (value) => assert.deepEqual(value.allowedAdditions.at(-1), { pattern: ".github/copilot-instructions.md", conditions: ["baseline"] }),
      "PACK_BASELINE_ACTIVE_CUSTOMIZATION",
    ],
    [
      (value) => { value.evidenceRequirements[0].stage = "in-progress"; },
      (value) => assert.equal(value.evidenceRequirements[0].stage, "in-progress"),
      "PACK_EVIDENCE_STAGE",
    ],
    [
      (value) => { value.isolation.branchSafe = true; },
      (value) => assert.equal(value.isolation.branchSafe, true),
      "PACK_BRANCH_SAFETY",
    ],
  ];
  for (const [mutate, checkPostImage, code] of cases) {
    const value = structuredClone(manifest);
    mutate(value);
    checkPostImage(value);
    assertErrorCode(validatePackManifest(value, "HC-005"), code);
  }
  const extraCondition = structuredClone(manifest);
  extraCondition.conditions.push("customized");
  assert.deepEqual(extraCondition.conditions, ["baseline", "scope-design", "customized"]);
  assert.throws(() => assertDesignBoundary(extraCondition), /HC005 has only the two design conditions/u);
  const activeDesign = structuredClone(manifest);
  activeDesign.allowedAdditions.push({ pattern: ".vscode/settings.json", conditions: ["scope-design"] });
  assert.equal(activeDesign.allowedAdditions.at(-1).pattern, ".vscode/settings.json");
  assert.throws(() => assertDesignBoundary(activeDesign), /HC005 only allows exact inert participant drafts/u);
});

test("guide metadata rejects executable fields and cannot downgrade the known settings block", () => {
  for (const field of ["conditions", "pack", "allowedAdditions", "grant"]) {
    const value = structuredClone(HC005_CATALOG_ENTRY);
    value.optionalRoutes[0][field] = [];
    assert.deepEqual(value.optionalRoutes[0][field], []);
    assert.equal(Object.hasOwn(HC005_CATALOG_ENTRY.optionalRoutes[0], field), false);
    assertErrorCode(validateOptionalRoutes(value), "CATALOG_OPTIONAL_ROUTE_SHAPE");
  }
  const downgraded = structuredClone(HC005_CATALOG_ENTRY);
  downgraded.optionalRoutes[1].runtimeRequirements[0].status = "not-checked";
  assert.equal(downgraded.optionalRoutes[1].runtimeRequirements[0].capability, "tracked-vscode-settings");
  assert.equal(downgraded.optionalRoutes[1].runtimeRequirements[0].status, "not-checked");
  assertErrorCode(validateOptionalRoutes(downgraded), "CATALOG_OPTIONAL_KNOWN_BLOCK");
  const ready = structuredClone(HC005_CATALOG_ENTRY);
  ready.optionalRoutes[0].runtimeRequirements[0].status = "ready";
  assert.equal(ready.optionalRoutes[0].runtimeRequirements[0].status, "ready");
  assertErrorCode(validateOptionalRoutes(ready), "CATALOG_OPTIONAL_RUNTIME");
});

test("guide negative fixtures check visible labels, precise metadata sections and reciprocal links", async () => {
  const route = HC005_CATALOG_ENTRY.optionalRoutes[1];
  const guide = guides.get(route.id);
  const hidden = guide.replace(
    "OPTIONAL_GUIDE_ONLY / live-unobserved",
    "```text\nOPTIONAL_GUIDE_ONLY / live-unobserved\n```",
  );
  assert.ok(hidden.includes("```text\nOPTIONAL_GUIDE_ONLY / live-unobserved\n```"));
  assert.equal(parseMarkdownProse(hidden).sections[0].body.includes("OPTIONAL_GUIDE_ONLY"), false);
  assertErrorCode(validateOptionalGuideText(HC005_CATALOG_ENTRY, route, hidden), "OPTIONAL_PAGE_SCOPE");
  const noSafety = guide.replace(OPTIONAL_SAFETY_NOTICE, "Notice removed by a negative fixture.");
  assert.equal(noSafety.includes(OPTIONAL_SAFETY_NOTICE), false);
  assertErrorCode(validateOptionalGuideText(HC005_CATALOG_ENTRY, route, noSafety), "OPTIONAL_PAGE_SAFETY");
  const reason = route.runtimeRequirements[0].reason;
  const misplacedReason = `${guide.replace(reason, "Reason moved by a negative fixture.")}\n${reason}\n`;
  assert.ok(misplacedReason.includes(reason));
  assert.equal(
    parseMarkdownProse(misplacedReason).sections.find(({ title }) => title === "Runtime capabilities").body.includes(reason),
    false,
  );
  assertErrorCode(validateOptionalGuideText(HC005_CATALOG_ENTRY, route, misplacedReason), "OPTIONAL_PAGE_METADATA");
  const stop = route.stopReasons[0];
  const misplacedStop = `${guide.replace(stop, "Stop reason moved by a negative fixture.")}\n${stop}\n`;
  assert.ok(misplacedStop.includes(stop));
  assert.equal(
    parseMarkdownProse(misplacedStop).sections.find(({ title }) => title === "Stop / Block").body.includes(stop),
    false,
  );
  assertErrorCode(validateOptionalGuideText(HC005_CATALOG_ENTRY, route, misplacedStop), "OPTIONAL_PAGE_METADATA");
  const link = `[${route.title}](optional/${route.id}.md)`;
  const unlinked = core.replace(link, "Guide link removed by a negative fixture.");
  assert.equal(unlinked.includes(link), false);
  assertErrorCode(await validateOptionalRoutePage(HC005_CATALOG_ENTRY, route, unlinked), "OPTIONAL_PAGE_UNLINKED");
});
