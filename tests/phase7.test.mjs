import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  getPublishedChallengeIds,
  loadCatalog,
  validateCatalog,
} from "../scripts/lib/catalog.mjs";
import {
  readJson,
  REPOSITORY_ROOT,
  sha256,
  stableJson,
} from "../scripts/lib/fs-utils.mjs";
import { optionalRuntimeStatus } from "../scripts/lib/optional-routes.mjs";
import {
  computePackHash,
  validatePackManifest,
} from "../scripts/lib/packs.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";
import {
  assertCliExit,
  runCli,
} from "../test-support/publication-fixtures.mjs";
import {
  assertPhase7Pack,
  packFor,
  PHASE7_IDS,
  PHASE7_SPECS,
} from "./support/phase7-contracts.mjs";

const protectedIds = Array.from(
  { length: 36 },
  (_, index) => `HC-${String(index + 1).padStart(3, "0")}`,
);
const publishedIds = Array.from(
  { length: 41 },
  (_, index) => `HC-${String(index + 1).padStart(3, "0")}`,
);
const PROTECTED_CATALOG_DIGEST =
  "79e95c510f14eda01bce2909a21b6ad2f8b048b1b73d5503c02a41837ae93c3a";
const PROTECTED_HASH_DIGEST =
  "8dc8172d2299319f41ef457b05dfa31c8d416b7532e8dc95f98eed2f91ba32b9";
const IDENTITY_DIGEST =
  "2512563b8baf9af3aa12957f65a1d258dcac88d0c18b0e79e9fd4f2c4830bdc8";
const RELEASE_DIGEST =
  "0746431ffd9882a26b193883e73741a38aa039b770d3575e527366eb660590b9";
const README_RECEIPTS = {
  "HC-037": [
    18104,
    "a80d32b9a9b7e38a5d55fe5ce4965c8ed05e64d7cb32a1a23e3cb003ac3637d3",
  ],
  "HC-038": [
    18284,
    "aa96b7e693c3bcfedf714bff4c13f40642b5d04c8c0503ff8ec7f557398d8024",
  ],
  "HC-039": [
    18840,
    "95161b7e42d8d9ea43cd8ee6c3686a8a9d8929261bddfba65fc2ffa128783f9a",
  ],
  "HC-040": [
    19386,
    "431a69f0d0e9be25bac8dc11f03ee7c623f22968b501be03cdcf50812c8da518",
  ],
  "HC-041": [
    18102,
    "d2a95321ec2c32b82b37d1376e751acd8f12639f9c5a2b15bb791ec687ca744d",
  ],
};

function canonicalGitText(bytes) {
  const text = bytes.toString("utf8");
  assert.equal(/\r(?!\n)/u.test(text), false, "no lone CR");
  return Buffer.from(text.replace(/\r\n/gu, "\n"));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

test("Phase7 publishes exact HC-037 through HC-041 and preserves the Phase6 state", async () => {
  const catalog = await loadCatalog();
  assert.deepEqual(validateCatalog(catalog), []);
  assert.deepEqual(
    getPublishedChallengeIds(catalog).slice(0, publishedIds.length),
    publishedIds,
  );
  assert.equal(catalog.challenges.length, 45);
  assert.equal(
    sha256(
      stableJson(
        catalog.challenges.filter(({ id }) => protectedIds.includes(id)),
      ),
    ),
    PROTECTED_CATALOG_DIGEST,
  );
  assert.equal(
    sha256(
      stableJson(
        catalog.challenges.map(({ id, track, sourceLab }) => ({
          id,
          track,
          sourceLab,
        })),
      ),
    ),
    IDENTITY_DIGEST,
  );
  assert.equal(sha256(stableJson(catalog.releasePlan)), RELEASE_DIGEST);
  assert.deepEqual(catalog.releasePlan.waves[6], PHASE7_IDS);
  assert.deepEqual(
    PHASE7_IDS.map((id) => [
      id,
      catalog.challenges.find((entry) => entry.id === id).title,
    ]),
    [
      ["HC-037", "LiteとBalancedのレビュー品質を比べよう"],
      ["HC-038", "Cloud Hookの失敗を正しく分類しよう"],
      ["HC-039", "組織で共有する規約のownerを決めよう"],
      ["HC-040", "一つのSkillをPluginとして届けよう"],
      ["HC-041", "repo factsと古い記憶を見分けよう"],
    ],
  );
});

test("Phase7 aggregate is exactly ten conditions, eighty-four cells, seven guides, forty-six payloads and thirty-three submissions", async () => {
  let conditions = 0;
  let comparisonCells = 0;
  let lifecycleRows = 0;
  let routes = 0;
  let payloads = 0;
  let submissionPlacements = 0;
  for (const id of PHASE7_IDS) {
    const { entry, manifest } = await assertPhase7Pack(id);
    conditions += manifest.conditions.length;
    comparisonCells += PHASE7_SPECS[id].comparisonCells;
    lifecycleRows += PHASE7_SPECS[id].lifecycleRows ?? 0;
    routes += entry.optionalRoutes.length;
    payloads += manifest.overlay.length;
    for (const condition of manifest.conditions) {
      submissionPlacements += manifest.submissionFiles.filter(
        ({ conditions: values }) => values.includes(condition),
      ).length;
    }
  }
  assert.deepEqual(
    {
      conditions,
      comparisonCells,
      lifecycleRows,
      routes,
      payloads,
      submissionPlacements,
    },
    {
      conditions: 10,
      comparisonCells: 84,
      lifecycleRows: 6,
      routes: 7,
      payloads: 46,
      submissionPlacements: 33,
    },
  );
});

test("all forty-one core Packs plan and Phase7 optional CLI exits are actual processes", async () => {
  const catalog = await loadCatalog();
  let newConditions = 0;
  for (const entry of catalog.challenges.filter(
    ({ status }) => status === "published",
  )) {
    const manifest = await readJson(
      path.join(
        REPOSITORY_ROOT,
        ...entry.pack.split("/"),
        "manifest.json",
      ),
    );
    for (const condition of manifest.conditions) {
      const plan = buildRunPlan(catalog, manifest, {
        challengeId: entry.id,
        condition,
        team: "phase7-regression",
        runId: `${entry.id.toLowerCase()}-${condition}-regression`,
      });
      assert.equal(plan.mode, "dry-run");
      assert.equal(plan.condition, condition);
      assert.deepEqual(
        plan.participantChanges.allowedMutations,
        manifest.allowedMutations,
      );
      assert.ok(plan.filesToInject.length > 0);
      assert.ok(
        plan.filesToInject.every(
          ({ allowOverwrite }) => allowOverwrite === false,
        ),
      );
      if (PHASE7_IDS.includes(entry.id)) newConditions++;
    }
  }
  assert.equal(newConditions, 10);

  let routeCount = 0;
  for (const id of PHASE7_IDS) {
    const entry = catalog.challenges.find((challenge) => challenge.id === id);
    for (const route of entry.optionalRoutes) {
      const expectedStatus =
        optionalRuntimeStatus(route) === "blocked" ? 2 : 0;
      const result = runCli(REPOSITORY_ROOT, "plan-run.mjs", [
        "--dry-run",
        "--challenge",
        id,
        "--route",
        route.id,
      ]);
      assert.equal(Number.isInteger(result.pid) && result.pid > 0, true);
      assert.equal(result.signal, null);
      assert.equal(result.error, undefined);
      assertCliExit(result, expectedStatus);
      const plan = JSON.parse(result.stdout);
      assert.equal(plan.mode, "optional-guide");
      assert.equal(plan.liveStatus, "live-unobserved");
      assert.equal(plan.readiness.status, optionalRuntimeStatus(route));
      if (expectedStatus === 2) {
        assert.match(result.stderr, /^OPTIONAL_ROUTE_BLOCKED:/u);
      } else {
        assert.equal(result.stderr, "");
      }
      routeCount++;
    }
  }
  assert.equal(routeCount, 7);
});

test("Phase7 README run IDs bind Hub --run to Runtime --run-id for all ten conditions", async () => {
  for (const id of PHASE7_IDS) {
    const text = await readFile(
      path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase(), "README.md"),
      "utf8",
    );
    assert.match(
      text,
      /apply-pack\.mjs \$Pack --team team-sora --condition \$Condition --run-id \$RunId/u,
    );
    assert.match(text, /run\.json` (?:を手編集しません|を編集しません|を変更しません)/u);
    for (const [condition, runId] of PHASE7_SPECS[id].runs) {
      assert.match(
        text,
        new RegExp(
          `--condition ${escapeRegex(condition)} --team team-sora --run ${escapeRegex(runId)}`,
          "u",
        ),
      );
      assert.match(
        text,
        new RegExp(
          `\\$Condition = '${escapeRegex(condition)}'[\\s\\S]{0,80}\\$RunId = '${escapeRegex(runId)}'`,
          "u",
        ),
      );
    }
  }
});

test("Phase7 hash ledger, README bytes, Issue Form and schema are exact while Phase6 records stay protected", async () => {
  const hashes = await readJson(
    path.join(REPOSITORY_ROOT, "catalog", "pack-hashes.json"),
  );
  assert.deepEqual(
    hashes.packs
      .map(({ challengeId }) => challengeId)
      .slice(0, publishedIds.length),
    publishedIds,
  );
  assert.equal(
    sha256(
      stableJson(
        hashes.packs.filter(({ challengeId }) =>
          protectedIds.includes(challengeId)),
      ),
    ),
    PROTECTED_HASH_DIGEST,
  );
  for (const id of PHASE7_IDS) {
    const record = hashes.packs.find(({ challengeId }) => challengeId === id);
    const computed = await computePackHash(packFor(id));
    assert.equal(record.sha256, computed.hash);
    assert.equal(record.fileCount, computed.records.length);
    assert.equal(
      record.byteLength,
      computed.records.reduce((total, item) => total + item.byteLength, 0),
    );
    const readme = canonicalGitText(
      await readFile(
        path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase(), "README.md"),
      ),
    );
    assert.equal(readme.length, README_RECEIPTS[id][0]);
    assert.equal(sha256(readme), README_RECEIPTS[id][1]);
  }
  const form = await readFile(
    path.join(
      REPOSITORY_ROOT,
      ".github",
      "ISSUE_TEMPLATE",
      "challenge-result.yml",
    ),
    "utf8",
  );
  const dropdown = form.match(
    /id: challenge_id[\s\S]*?options:\s*\r?\n([\s\S]*?)    validations:/u,
  )[1];
  assert.deepEqual(
    [...dropdown.matchAll(/- (HC-\d{3})/gu)]
      .map((match) => match[1])
      .slice(0, publishedIds.length),
    publishedIds,
  );
  assert.match(form, /Hub --run and Runtime --run-id/u);
  const schema = await readFile(
    path.join(REPOSITORY_ROOT, "schemas", "challenge-pack.schema.json"),
  );
  assert.equal(schema.length, 9616);
  assert.equal(
    sha256(schema),
    "183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e",
  );
});

test("Phase7 critical manifest guards reject unknown conditions, active destinations and overwrite", async () => {
  for (const id of PHASE7_IDS) {
    const original = await readJson(path.join(packFor(id), "manifest.json"));
    assert.deepEqual(validatePackManifest(original, id), []);

    const unknown = structuredClone(original);
    unknown.overlay[0].conditions = ["missing-condition"];
    assert.deepEqual(unknown.overlay[0].conditions, ["missing-condition"]);
    assertErrorCode(validatePackManifest(unknown, id), "PACK_CONDITION_UNKNOWN");

    const active = structuredClone(original);
    active.overlay[0].destination = `.github/agents/${id.toLowerCase()}.agent.md`;
    assert.match(active.overlay[0].destination, /^\.github\/agents\//u);
    assertErrorCode(validatePackManifest(active, id), "PACK_INERT_DESTINATION");

    const overwrite = structuredClone(original);
    overwrite.overlay[0].allowOverwrite = true;
    assert.equal(overwrite.overlay[0].allowOverwrite, true);
    assertErrorCode(
      validatePackManifest(overwrite, id),
      "PACK_OVERWRITE_DEFAULT_DENY",
    );

    const evidence = structuredClone(original);
    evidence.allowedAdditions.push({
      pattern: evidence.evidenceRequirements[0].path,
      conditions: [...evidence.conditions],
    });
    assertErrorCode(
      validatePackManifest(evidence, id),
      "PACK_ADDITION_RESERVED_PATH",
    );

    assert.deepEqual(validatePackManifest(structuredClone(original), id), []);
  }
});

test("Phase7 source provenance guards reject baseline and synthetic source tamper", async () => {
  const original = await loadCatalog();
  const baseline = structuredClone(original);
  baseline.challenges.find(({ id }) => id === "HC-037").sourcePaths[0] =
    "missing/source.java";
  assertErrorCode(validateCatalog(baseline), "CATALOG_BASELINE_SOURCE");

  const synthetic = structuredClone(original);
  synthetic.challenges.find(({ id }) => id === "HC-038").sourcePaths.push(
    "pom.xml",
  );
  assertErrorCode(validateCatalog(synthetic), "CATALOG_SYNTHETIC_SOURCE");

  assert.deepEqual(validateCatalog(structuredClone(original)), []);
});
