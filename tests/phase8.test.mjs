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
  assertPhase8Pack,
  packFor,
  PHASE8_IDS,
  PHASE8_SPECS,
} from "./support/phase8-contracts.mjs";

const protectedIds = Array.from(
  { length: 41 },
  (_, index) => `HC-${String(index + 1).padStart(3, "0")}`,
);
const publishedIds = Array.from(
  { length: 45 },
  (_, index) => `HC-${String(index + 1).padStart(3, "0")}`,
);
const PROTECTED_CATALOG_DIGEST =
  "643fc913f94530107d4c0808616451615b11ff64042ad205d9fc34070bcb6197";
const PROTECTED_HASH_DIGEST =
  "155c514d05006a1d5147fc397e527eb62bd2da8b6c384171304d32bbd738fe60";
const IDENTITY_DIGEST =
  "2512563b8baf9af3aa12957f65a1d258dcac88d0c18b0e79e9fd4f2c4830bdc8";
const RELEASE_DIGEST =
  "0746431ffd9882a26b193883e73741a38aa039b770d3575e527366eb660590b9";
const README_RECEIPTS = {
  "HC-042": [
    20064,
    "79020d7f1a1943bef258069d77af74a48a7e6dfe26ea980e7d6ecb8700359e28",
  ],
  "HC-043": [
    19699,
    "7b39125b70f59878632b141f8115b0c0dc233013c3f2b4e2e842195865bd5c74",
  ],
  "HC-044": [
    19231,
    "61df5c86bc5718ab270ee8eeeefe512a48d86bf52900f50850d9cdab4f7e44db",
  ],
  "HC-045": [
    21524,
    "f345d62ea62e0f188ef50dffc236c7a5613934a32a8d41a0ebcfe172851a84d9",
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

test("Phase8 publishes exact HC-042 through HC-045 and preserves the Phase7 state", async () => {
  const catalog = await loadCatalog();
  assert.deepEqual(validateCatalog(catalog), []);
  assert.deepEqual(getPublishedChallengeIds(catalog), publishedIds);
  assert.deepEqual(
    catalog.challenges
      .filter(({ status }) => status === "planned")
      .map(({ id }) => id),
    [],
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
  assert.deepEqual(catalog.releasePlan.waves[7], PHASE8_IDS);
  assert.deepEqual(
    PHASE8_IDS.map((id) => [
      id,
      catalog.challenges.find((entry) => entry.id === id).title,
    ]),
    [
      ["HC-042", "読めない外部データの原因を層ごとに探そう"],
      ["HC-043", "イベント駆動Agentを最小権限で動かそう"],
      ["HC-044", "CopilotのApproveとmerge可能を区別しよう"],
      ["HC-045", "レビュー指摘を安全なCloud修正へ引き継ごう"],
    ],
  );
});

test("Phase8 aggregate is exactly eight conditions, twenty-five tasks, six guides, forty payloads and thirty-two submissions", async () => {
  let conditions = 0;
  let tasks = 0;
  let routes = 0;
  let payloads = 0;
  let submissionPlacements = 0;
  for (const id of PHASE8_IDS) {
    const { entry, manifest } = await assertPhase8Pack(id);
    conditions += manifest.conditions.length;
    tasks += PHASE8_SPECS[id].taskCount;
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
      tasks,
      routes,
      payloads,
      submissionPlacements,
    },
    {
      conditions: 8,
      tasks: 25,
      routes: 6,
      payloads: 40,
      submissionPlacements: 32,
    },
  );
});

test("all forty-five core Packs plan and Phase8 optional CLI exits are actual processes", async () => {
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
        team: "phase8-regression",
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
      if (PHASE8_IDS.includes(entry.id)) newConditions++;
    }
  }
  assert.equal(newConditions, 8);

  let routeCount = 0;
  for (const id of PHASE8_IDS) {
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
  assert.equal(routeCount, 6);
});

test("Phase8 README run IDs bind Hub --run to Runtime --run-id for all eight conditions", async () => {
  for (const id of PHASE8_IDS) {
    const text = await readFile(
      path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase(), "README.md"),
      "utf8",
    );
    assert.match(
      text,
      /apply-pack\.mjs \$Pack --team team-sora --condition \$Condition --run-id \$RunId/u,
    );
    assert.match(text, /run\.json` (?:を|の)手編集/u);
    for (const [condition, runId] of PHASE8_SPECS[id].runs) {
      assert.match(
        text,
        new RegExp(
          `--condition ${escapeRegex(condition)} --team team-sora --run ${escapeRegex(runId)}`,
          "u",
        ),
      );
      if (condition === "baseline") {
        assert.match(
          text,
          new RegExp(
            `\\$Condition = '${escapeRegex(condition)}'[\\s\\S]{0,80}\\$RunId = '${escapeRegex(runId)}'`,
            "u",
          ),
        );
      } else {
        assert.match(
          text,
          new RegExp(
            `${escapeRegex(condition)}[\\s\\S]{0,80}${escapeRegex(runId)}`,
            "u",
          ),
        );
      }
    }
  }
});

test("Phase8 hash ledger, README bytes, Issue Form and schema are exact while Phase7 records stay protected", async () => {
  const hashes = await readJson(
    path.join(REPOSITORY_ROOT, "catalog", "pack-hashes.json"),
  );
  assert.deepEqual(
    hashes.packs.map(({ challengeId }) => challengeId),
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
  assert.equal(hashes.packs.length, 45);
  for (const id of PHASE8_IDS) {
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
    [...dropdown.matchAll(/- (HC-\d{3})/gu)].map((match) => match[1]),
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

test("Phase8 critical manifest guards reject unknown conditions, active destinations, overwrite and Evidence duplication", async () => {
  for (const id of PHASE8_IDS) {
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

test("Phase8 source provenance guards reject synthetic and baseline tamper", async () => {
  const original = await loadCatalog();
  for (const id of ["HC-042", "HC-043", "HC-044"]) {
    const synthetic = structuredClone(original);
    synthetic.challenges.find(({ id: challengeId }) => challengeId === id)
      .sourcePaths.push("pom.xml");
    assertErrorCode(validateCatalog(synthetic), "CATALOG_SYNTHETIC_SOURCE");
  }

  const baseline = structuredClone(original);
  baseline.challenges.find(({ id }) => id === "HC-045").sourcePaths[0] =
    "missing/source.java";
  assertErrorCode(validateCatalog(baseline), "CATALOG_BASELINE_SOURCE");

  assert.deepEqual(validateCatalog(structuredClone(original)), []);
});
