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
  assertPhase6Pack,
  packFor,
  PHASE6_IDS,
  PHASE6_SPECS,
} from "./support/phase6-contracts.mjs";

const protectedIds = Array.from(
  { length: 31 },
  (_, index) => `HC-${String(index + 1).padStart(3, "0")}`,
);
const publishedIds = Array.from(
  { length: 36 },
  (_, index) => `HC-${String(index + 1).padStart(3, "0")}`,
);
const PROTECTED_CATALOG_DIGEST =
  "ee418e4c2dd034caf616e8f482bd9b7cbe35f529d5d1a47752c955aae070d1af";
const PROTECTED_HASH_DIGEST =
  "75baf57671f97c00635f52f1c4804e3f78de4b2ba0b3995cd2fe250775025af4";
const IDENTITY_DIGEST =
  "2512563b8baf9af3aa12957f65a1d258dcac88d0c18b0e79e9fd4f2c4830bdc8";
const RELEASE_DIGEST =
  "0746431ffd9882a26b193883e73741a38aa039b770d3575e527366eb660590b9";
const README_RECEIPTS = {
  "HC-032": [
    24346,
    "5d46df5c444c5d23f40d7a52ab4f3e8673330440576b78b381189527d17c123e",
  ],
  "HC-033": [
    24085,
    "1287cc1275bf2cf0ae3c9a758ab29808978c6f9078726da7cef26d44515a772e",
  ],
  "HC-034": [
    23594,
    "d069ac280bf67993bcaba00f2c0c0f7f4dd5071187357ba45f238a3e4368f3f8",
  ],
  "HC-035": [
    25911,
    "e4995ff734af383afff7455f2333cb586c5f9049d51ecdf58a9205fdc9d8c6c6",
  ],
  "HC-036": [
    22849,
    "ede074882dd559bfdb46d8d654bda4a9ca2acf8149f90ce36dc2392585a4fc17",
  ],
};

function canonicalGitText(bytes) {
  const text = bytes.toString("utf8");
  assert.equal(/\r(?!\n)/u.test(text), false, "no lone CR");
  return Buffer.from(text.replace(/\r\n/gu, "\n"));
}

test("Phase6 publishes exact HC-032 through HC-036 and preserves the Phase5 state", async () => {
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
  assert.deepEqual(catalog.releasePlan.waves[5], PHASE6_IDS);
  assert.deepEqual(
    PHASE6_IDS.map((id) => [
      id,
      catalog.challenges.find((entry) => entry.id === id).title,
    ]),
    [
      ["HC-032", "Cloud Agentの調査役とtoolsを設計しよう"],
      ["HC-033", "Cloud Agentに再送調査Skillを渡そう"],
      ["HC-034", "Cloud Agentから運用メモMCPを呼ぶ設計をしよう"],
      ["HC-035", "指示と実行環境を混同せず準備しよう"],
      ["HC-036", "Draft・Open・更新時のレビュー発火を設計しよう"],
    ],
  );
});

test("Phase6 aggregate is exactly fifteen conditions, thirty-nine cells, nine guides, forty-five payloads and eighty-six submissions", async () => {
  let conditions = 0;
  let comparisonCells = 0;
  let routes = 0;
  let payloads = 0;
  let submissionPlacements = 0;
  for (const id of PHASE6_IDS) {
    const { entry, manifest } = await assertPhase6Pack(id);
    conditions += manifest.conditions.length;
    comparisonCells += PHASE6_SPECS[id].comparisonCells;
    routes += entry.optionalRoutes.length;
    payloads += manifest.overlay.length;
    for (const condition of manifest.conditions) {
      submissionPlacements += manifest.submissionFiles.filter(
        ({ conditions: values }) => values.includes(condition),
      ).length;
    }
  }
  assert.deepEqual(
    { conditions, comparisonCells, routes, payloads, submissionPlacements },
    {
      conditions: 15,
      comparisonCells: 39,
      routes: 9,
      payloads: 45,
      submissionPlacements: 86,
    },
  );
});

test("all thirty-six core Packs build plans and Phase6 optional CLI exits are actual processes", async () => {
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
        team: "phase6-regression",
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
      if (PHASE6_IDS.includes(entry.id)) newConditions++;
    }
  }
  assert.equal(newConditions, 15);

  let routeCount = 0;
  for (const id of PHASE6_IDS) {
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
  assert.equal(routeCount, 9);
});

test("Phase6 hash ledger, README bytes, Issue Form and schema are exact while Phase5 records stay protected", async () => {
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
  for (const id of PHASE6_IDS) {
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
  const schema = await readFile(
    path.join(REPOSITORY_ROOT, "schemas", "challenge-pack.schema.json"),
  );
  assert.equal(schema.length, 9616);
  assert.equal(
    sha256(schema),
    "183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e",
  );
});

test("Phase6 critical manifest guards reject unknown conditions, active destinations and overwrite", async () => {
  for (const id of PHASE6_IDS) {
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

    assert.deepEqual(validatePackManifest(structuredClone(original), id), []);
  }
});

test("Phase6 source provenance guards reject baseline and synthetic source tamper", async () => {
  const original = await loadCatalog();
  const baseline = structuredClone(original);
  baseline.challenges.find(({ id }) => id === "HC-032").sourcePaths[0] =
    "missing/source.java";
  assertErrorCode(validateCatalog(baseline), "CATALOG_BASELINE_SOURCE");

  const synthetic = structuredClone(original);
  synthetic.challenges.find(({ id }) => id === "HC-036").sourcePaths.push(
    "pom.xml",
  );
  assertErrorCode(validateCatalog(synthetic), "CATALOG_SYNTHETIC_SOURCE");

  assert.deepEqual(validateCatalog(structuredClone(original)), []);
});
