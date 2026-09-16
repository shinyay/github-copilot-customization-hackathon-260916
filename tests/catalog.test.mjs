import assert from "node:assert/strict";
import test from "node:test";
import {
  CHALLENGE_IDS,
  REFERENCE_COMMIT,
  REFERENCE_REPOSITORY,
} from "../scripts/lib/constants.mjs";
import {
  getPublishedChallengeIds,
  getPublishedChallenges,
  loadCatalog,
  validateCatalog,
} from "../scripts/lib/catalog.mjs";
import { assertErrorCode, deepClone } from "../test-support/helpers.mjs";

const expectedCatalog = [
  ["根拠を大切にするJavaチームメイトを育てよう", "instructions"],
  ["JavaとXMLに別々の読み方を教えよう", "instructions"],
  ["ディレクトリごとのルールをAGENTS.mdで伝えよう", "instructions"],
  ["Claude形式の指示を安全に持ち込もう", "instructions"],
  ["個人・チーム・タスクの指示を整理しよう", "instructions"],
  ["繰り返すJava調査をワンコマンド化しよう", "workflows"],
  ["調査役と検証役のAIチームを設計しよう", "workflows"],
  ["大きな調査を二人のSubagentへ任せよう", "workflows"],
  ["CSV再送調査のプレイブックをSkillにしよう", "workflows"],
  ["Agentの終了時に検査結果を通知しよう", "hooks"],
  ["運用メモを安全に取得するMCP Toolを作ろう", "integrations"],
  ["よく使うtoolsを迷わず選べるセットにしよう", "integrations"],
  ["チームの知識をCopilot Spaceへ整理しよう", "integrations"],
  ["SkillをPluginとして配布・更新しよう", "integrations"],
  ["最短経路で必要なコードへ到達しよう", "context-controls"],
  ["役立つ記憶だけを残し、古い記憶を捨てよう", "context-controls"],
  ["タスクに合うモデルと推論量を選ぼう", "context-controls"],
  ["承認と隔離の境界を可視化しよう", "context-controls"],
  ["カスタマイズの健康診断を作ろう", "context-controls"],
  ["VS Code拡張から専用Toolを提供しよう", "context-controls"],
  ["競合するInstructionsの犯人を見つけよう", "design-evaluation"],
  ["外部資料からの命令注入を防ごう", "design-evaluation"],
  ["最小限で十分なカスタマイズを選ぼう", "design-evaluation"],
  ["一つずつ外して本当に効いた機能を探そう", "design-evaluation"],
  ["Local AgentとAgent Hostへ同じ設計を持ち運ぼう", "design-evaluation"],
  ["カスタマイズを安全に段階導入しよう", "design-evaluation"],
  ["改善を主張する前に評価を固定しよう", "design-evaluation"],
  ["Copilotが読んだInstructionsの版を突き止めよう", "github-cloud"],
  ["Cloud AgentにJava互換条件を守らせよう", "github-cloud"],
  ["税額の意味を守るコードレビューを設計しよう", "github-cloud"],
  ["Java・XML・製品別にInstructionsを出し分けよう", "github-cloud"],
  ["Cloud Agentの調査役とtoolsを設計しよう", "github-cloud"],
  ["Cloud Agentに再送調査Skillを渡そう", "github-cloud"],
  ["Cloud Agentから運用メモMCPを呼ぶ設計をしよう", "github-cloud"],
  ["指示と実行環境を混同せず準備しよう", "github-cloud"],
  ["Draft・Open・更新時のレビュー発火を設計しよう", "github-cloud"],
  ["LiteとBalancedのレビュー品質を比べよう", "github-cloud"],
  ["Cloud Hookの失敗を正しく分類しよう", "github-cloud"],
  ["組織で共有する規約のownerを決めよう", "github-cloud"],
  ["一つのSkillをPluginとして届けよう", "github-cloud"],
  ["repo factsと古い記憶を見分けよう", "github-cloud"],
  ["読めない外部データの原因を層ごとに探そう", "github-cloud"],
  ["イベント駆動Agentを最小権限で動かそう", "github-cloud"],
  ["CopilotのApproveとmerge可能を区別しよう", "github-cloud"],
  ["レビュー指摘を安全なCloud修正へ引き継ごう", "github-cloud"],
];

test("catalog contains exactly HC-001 through HC-045 in order", async () => {
  const catalog = await loadCatalog();
  assert.deepEqual(validateCatalog(catalog), []);
  assert.deepEqual(
    catalog.challenges.map(({ id }) => id),
    CHALLENGE_IDS,
  );
  assert.deepEqual(
    getPublishedChallengeIds(catalog),
    catalog.challenges.filter(({ status }) => status === "published").map(({ id }) => id),
  );
  assert.deepEqual(
    getPublishedChallenges(catalog),
    catalog.challenges.filter(({ status }) => status === "published"),
  );
  assert.deepEqual(
    catalog.challenges.map(({ title, track }) => [title, track]),
    expectedCatalog,
  );
  catalog.challenges.forEach((challenge, index) => {
    const number = String(index + 1).padStart(2, "0");
    assert.match(
      challenge.sourceLab.pages[0],
      new RegExp(`^docs/labs/lab-${number}-.+\\.md$`, "u"),
      challenge.id,
    );
  });
  assert.deepEqual(catalog.sourceBaseline, {
    repository: REFERENCE_REPOSITORY,
    commit: REFERENCE_COMMIT,
    fileCount: 515,
    treeSha256:
      "c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111",
  });
  assert.equal(
    catalog.runtimeTemplate.versionMarker,
    ".hackathon/template.json",
  );
  assert.deepEqual(
    catalog.challenges[8].sourceLab.ids,
    ["LAB-09", "LAB-33"],
  );
  assert.deepEqual(
    catalog.challenges[10].sourceLab.ids,
    ["LAB-11", "LAB-34"],
  );
});

test("duplicate and out-of-order mutations fail for their intended reasons", async () => {
  const catalog = await loadCatalog();
  const duplicate = deepClone(catalog);
  duplicate.challenges[1].id = duplicate.challenges[0].id;
  const duplicateErrors = validateCatalog(duplicate);
  assertErrorCode(duplicateErrors, "CATALOG_DUPLICATE_ID");
  assertErrorCode(duplicateErrors, "CATALOG_ORDER");

  const reordered = deepClone(catalog);
  [reordered.challenges[0], reordered.challenges[1]] = [
    reordered.challenges[1],
    reordered.challenges[0],
  ];
  assertErrorCode(validateCatalog(reordered), "CATALOG_ORDER");
});

test("planned artifact and source provenance mutations fail explicitly", async () => {
  const catalog = await loadCatalog();
  const plannedArtifact = deepClone(catalog);
  const planned = plannedArtifact.challenges.at(-1);
  planned.status = "planned";
  assert.equal(planned.id, "HC-045");
  assert.equal(planned.page, "challenges/hc-045/README.md");
  assertErrorCode(
    validateCatalog(plannedArtifact),
    "CATALOG_PLANNED_ARTIFACT",
  );

  const wrongSource = deepClone(catalog);
  wrongSource.sourceBaseline.repository =
    "shinyay/github-copilot-customization-labs";
  assertErrorCode(
    validateCatalog(wrongSource),
    "CATALOG_SOURCE_BASELINE",
  );
});

test("maintainer waves reject missing, extra, duplicate and reordered entries without encoding publication state", async () => {
  const catalog = await loadCatalog();
  const cases = [
    ["missing plan", (value) => { delete value.releasePlan; }, (value) => !Object.hasOwn(value, "releasePlan"), "CATALOG_RELEASE_PLAN"],
    ["missing wave", (value) => value.releasePlan.waves.splice(2, 1), (value) => value.releasePlan.waves.length === 7, "CATALOG_RELEASE_WAVES"],
    ["extra wave", (value) => value.releasePlan.waves.push(["HC-046"]), (value) => value.releasePlan.waves.length === 9, "CATALOG_RELEASE_WAVES"],
    ["missing ID", (value) => value.releasePlan.waves[0].pop(), (value) => value.releasePlan.waves.flat().length === 38, "CATALOG_RELEASE_WAVES"],
    ["duplicate ID", (value) => { value.releasePlan.waves[1][0] = "HC-002"; }, (value) => value.releasePlan.waves.flat().length === 39 && new Set(value.releasePlan.waves.flat()).size === 38, "CATALOG_RELEASE_WAVES"],
    ["ID order", (value) => { value.releasePlan.waves[0].reverse(); }, (value) => value.releasePlan.waves[0][0] === "HC-008", "CATALOG_RELEASE_WAVES"],
    ["wave order", (value) => { [value.releasePlan.waves[0], value.releasePlan.waves[1]] = [value.releasePlan.waves[1], value.releasePlan.waves[0]]; }, (value) => value.releasePlan.waves[0][0] === "HC-010", "CATALOG_RELEASE_WAVES"],
    ["participant prerequisite", (value) => { value.releasePlan.participantPrerequisite = true; }, (value) => value.releasePlan.participantPrerequisite === true, "CATALOG_RELEASE_PLAN"],
    ["no review", (value) => { value.releasePlan.reviewBetweenWaves = false; }, (value) => value.releasePlan.reviewBetweenWaves === false, "CATALOG_RELEASE_PLAN"],
    ["redundant state", (value) => { value.releasePlan.currentWave = 0; }, (value) => Object.hasOwn(value.releasePlan, "currentWave"), "CATALOG_RELEASE_PLAN"],
  ];
  for (const [name, mutate, landed, code] of cases) {
    const value = deepClone(catalog);
    mutate(value);
    assert.equal(landed(value), true, name);
    assertErrorCode(validateCatalog(value), code);
  }
});

test("sourceKind requires honest baseline references or explicitly empty synthetic sourcePaths", async () => {
  const catalog = await loadCatalog();
  const synthetic = deepClone(catalog);
  synthetic.challenges[0].sourceKind = "synthetic";
  synthetic.challenges[0].sourcePaths = [];
  assert.deepEqual(validateCatalog(synthetic), []);

  const missing = deepClone(catalog);
  missing.challenges[0].sourcePaths = [];
  assertErrorCode(validateCatalog(missing), "CATALOG_BASELINE_SOURCE");

  for (const sourcePath of [
    catalog.challenges[0].sourcePaths[0],
    "wholesale-core/src/main/java/Invented.java",
  ]) {
    const inventedSynthetic = deepClone(synthetic);
    inventedSynthetic.challenges[0].sourcePaths = [sourcePath];
    assert.equal(inventedSynthetic.challenges[0].sourcePaths.length, 1);
    assertErrorCode(validateCatalog(inventedSynthetic), "CATALOG_SYNTHETIC_SOURCE");
  }

  const inventedBaseline = deepClone(catalog);
  inventedBaseline.challenges[0].sourcePaths = ["wholesale-core/src/main/java/Invented.java"];
  assertErrorCode(validateCatalog(inventedBaseline), "CATALOG_BASELINE_SOURCE");
  const unknownKind = deepClone(catalog);
  unknownKind.challenges[0].sourceKind = "guessed";
  assertErrorCode(validateCatalog(unknownKind), "CATALOG_SOURCE_KIND");

  const wrongSecondaryLab = deepClone(catalog);
  wrongSecondaryLab.challenges[8].sourceLab.ids[1] = "LAB-34";
  assertErrorCode(validateCatalog(wrongSecondaryLab), "CATALOG_SOURCE_LAB");
});
