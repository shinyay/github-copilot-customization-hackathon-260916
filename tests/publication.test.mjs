import assert from "node:assert/strict";
import { cp, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { stableJson, writeText } from "../scripts/lib/fs-utils.mjs";
import { computePackHash } from "../scripts/lib/packs.mjs";
import { assertCliExit, createPublicationFixture, issueFormWithIds, runCli } from "../test-support/publication-fixtures.mjs";

const publicationSets = [
  {
    ids: ["HC-001", "HC-002", "HC-006", "HC-007", "HC-009", "HC-011", "HC-030"],
    buildId: "HC-002",
  },
  {
    ids: ["HC-001", "HC-002", "HC-003", "HC-004", "HC-005", "HC-006", "HC-007", "HC-008", "HC-009", "HC-011", "HC-030"],
    buildId: "HC-008",
  },
  {
    ids: ["HC-001", "HC-006", "HC-007", "HC-009", "HC-011", "HC-014", "HC-029", "HC-030", "HC-045"],
    buildId: "HC-045",
  },
];
const removalOptions = { recursive: true, maxRetries: 3, retryDelay: 100 };

for (const { ids, buildId } of publicationSets) {
  test(`${ids.length} published challenges propagate through real directory/page/Pack/Form/index/CLI boundaries`, async (t) => {
    const fixture = await createPublicationFixture(t, ids);
    const verification = runCli(fixture.root, "verify.mjs");
    assertCliExit(verification, 0);
    for (const check of ["catalog", "pages", "packs", "repository", "pack-hashes", "contracts", "links"]) {
      assert.match(verification.stdout, new RegExp(`PASS ${check}`, "u"));
    }
    assert.deepEqual((await readdir(fixture.path("challenges"))).map((id) => id.toUpperCase()).sort(), ids);
    const hashes = JSON.parse(await readFile(fixture.path("catalog", "pack-hashes.json"), "utf8"));
    assert.deepEqual(hashes.packs.map(({ challengeId }) => challengeId), ids);
    const form = await readFile(fixture.formPath, "utf8");
    const dropdown = form.match(/id: challenge_id[\s\S]*?options:\s*\n([\s\S]*?)    validations:/u)[1];
    assert.deepEqual([...dropdown.matchAll(/- (HC-\d{3})/gu)].map((match) => match[1]), ids);
    const index = await readFile(fixture.path("docs", "generated", "challenge-index.md"), "utf8");
    assert.deepEqual([...index.matchAll(/\| \[(HC-\d{3})\]/gu)].map((match) => match[1]), ids);
    assert.doesNotMatch(index, /releasePlan|participantPrerequisite|LAB-|Phase \d|wave/iu);
    assert.match(index, /SYNTHETIC_TRAINING_ONLY/u);

    for (const id of ids) {
      const common = ["--dry-run", "--challenge", id, "--condition", "baseline", "--team", "fixture", "--run", "one"];
      const implicit = runCli(fixture.root, "plan-run.mjs", common);
      const explicit = runCli(fixture.root, "plan-run.mjs", [...common, "--route", "core"]);
      assertCliExit(implicit, 0);
      assertCliExit(explicit, 0);
      assert.equal(explicit.stdout, implicit.stdout);
      const plan = JSON.parse(implicit.stdout);
      assert.equal(plan.challenge.id, id);
      assert.deepEqual(plan.participantChanges.allowedMutations, []);
      assert.deepEqual(plan.participantChanges.allowedAdditions, []);
      assert.equal(plan.filesToInject.length, 1, "evidence-only core still has inert overlay");
      assert.match(plan.runStateEvidence[0].path, /^\.hackathon\/evidence\//u);
    }
    const build = runCli(fixture.root, "build-pack.mjs", [
      "--challenge", buildId, "--output", ".runtime/packs",
    ]);
    assertCliExit(build, 0);
    const built = fixture.path(".runtime", "packs", `${buildId.toLowerCase()}-v1`);
    const builtHash = await computePackHash(built);
    assert.equal(builtHash.hash, hashes.packs.find(({ challengeId }) => challengeId === buildId).sha256);
    assert.equal(
      await readFile(fixture.path("challenges", buildId.toLowerCase(), "pack", "manifest.json"), "utf8"),
      await readFile(path.join(built, "manifest.json"), "utf8"),
    );
  });
}

test("publication rejects stale dropdown, missing Pack and directory, and stale index at the real verifier", async (t) => {
  const { ids } = publicationSets[0];
  const fixture = await createPublicationFixture(t, ids);
  const verifyFailure = (code) => {
    const result = runCli(fixture.root, "verify.mjs");
    assertCliExit(result, 1);
    assert.match(result.stderr, new RegExp(code, "u"));
  };

  const form = await readFile(fixture.formPath, "utf8");
  const stale = issueFormWithIds(form, ids.filter((id) => id !== "HC-002"));
  assert.match(stale, /- HC-001\s+- HC-006/u);
  assert.doesNotMatch(stale, /- HC-002/u);
  await writeText(fixture.formPath, stale);
  verifyFailure("ISSUE_CHALLENGE_OPTIONS");
  await writeText(fixture.formPath, form);

  const pack = fixture.path("challenges", "hc-002", "pack");
  const parkedPack = fixture.path("parked-pack");
  await cp(pack, parkedPack, { recursive: true });
  await rm(pack, removalOptions);
  assert.equal((await readdir(fixture.path("challenges", "hc-002"))).includes("pack"), false);
  verifyFailure("PACK_MANIFEST_MISSING");
  await cp(parkedPack, pack, { recursive: true });
  await rm(parkedPack, removalOptions);

  const directory = fixture.path("challenges", "hc-002");
  const parkedDirectory = fixture.path("parked-challenge");
  await cp(directory, parkedDirectory, { recursive: true });
  await rm(directory, removalOptions);
  assert.equal((await readdir(fixture.path("challenges"))).includes("hc-002"), false);
  verifyFailure("CHALLENGE_DIRECTORY_PARITY");
  await cp(parkedDirectory, directory, { recursive: true });
  await rm(parkedDirectory, removalOptions);

  const indexPath = fixture.path("docs", "generated", "challenge-index.md");
  const index = await readFile(indexPath, "utf8");
  const staleIndex = index.replace("| [HC-002]", "| [HC-999]");
  assert.match(staleIndex, /\| \[HC-999\]/u);
  assert.doesNotMatch(staleIndex, /\| \[HC-002\]/u);
  await writeText(indexPath, staleIndex);
  verifyFailure("GENERATED_DOC_STALE");
  await writeText(indexPath, index);

  const catalogPath = fixture.path("catalog", "challenges.json");
  const catalog = structuredClone(fixture.catalog);
  catalog.challenges[0].sourceKind = "baseline";
  assert.deepEqual(catalog.challenges[0].sourcePaths, []);
  await writeText(catalogPath, stableJson(catalog));
  verifyFailure("CATALOG_BASELINE_SOURCE");
  await fixture.writeCatalog();
  assertCliExit(runCli(fixture.root, "verify.mjs"), 0);
});

test("a second result Form is rejected rather than treating optional activity as another submission contract", async (t) => {
  const fixture = await createPublicationFixture(t, ["HC-001"]);
  await writeText(
    fixture.path(".github", "ISSUE_TEMPLATE", "optional-result.yml"),
    await readFile(fixture.formPath, "utf8"),
  );
  const result = runCli(fixture.root, "verify.mjs");
  assertCliExit(result, 1);
  assert.match(result.stderr, /ISSUE_FORM_SINGLE/u);
});

test("token-based document link checks still reject a missing Markdown image asset", async (t) => {
  const fixture = await createPublicationFixture(t, ["HC-001"]);
  const pagePath = fixture.path("challenges", "hc-001", "README.md");
  const contents = await readFile(pagePath, "utf8");
  await writeText(pagePath, `${contents}\n![Fixture image](missing-image.png)\n`);
  const result = runCli(fixture.root, "verify.mjs");
  assertCliExit(result, 1);
  assert.match(result.stderr, /BROKEN_MARKDOWN_LINK/u);
  assert.match(result.stderr, /missing-image\.png/u);
});
