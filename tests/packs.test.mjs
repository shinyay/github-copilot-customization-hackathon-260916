import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { getPublishedChallengeIds, loadCatalog } from "../scripts/lib/catalog.mjs";
import {
  validatePackDirectory,
  validatePackManifest,
} from "../scripts/lib/packs.mjs";
import { readJson, REPOSITORY_ROOT, stableJson } from "../scripts/lib/fs-utils.mjs";
import { assertErrorCode, deepClone } from "../test-support/helpers.mjs";

function packDirectory(challengeId) {
  return path.join(
    REPOSITORY_ROOT,
    "challenges",
    challengeId.toLowerCase(),
    "pack",
  );
}

test("all published packs satisfy the Hub Contract v1 validator", async () => {
  for (const challengeId of getPublishedChallengeIds(await loadCatalog())) {
    const result = await validatePackDirectory(
      packDirectory(challengeId),
      challengeId,
    );
    assert.deepEqual(result.errors, [], challengeId);
  }
});

test("unsafe and active overlay destinations fail for their intended reasons", async () => {
  const manifest = await readJson(
    path.join(packDirectory("HC-001"), "manifest.json"),
  );

  const traversal = deepClone(manifest);
  traversal.overlay[0].destination = "../escape.template";
  assertErrorCode(
    validatePackManifest(traversal, "HC-001"),
    "PACK_INERT_DESTINATION",
  );

  const active = deepClone(manifest);
  active.overlay[0].destination = ".github/copilot-instructions.md";
  assertErrorCode(
    validatePackManifest(active, "HC-001"),
    "PACK_INERT_DESTINATION",
  );
});

test("overwrite, unknown condition, and baseline active customization mutations fail", async () => {
  const manifest = await readJson(
    path.join(packDirectory("HC-001"), "manifest.json"),
  );

  const overwrite = deepClone(manifest);
  overwrite.overlay[0].allowOverwrite = true;
  assertErrorCode(
    validatePackManifest(overwrite, "HC-001"),
    "PACK_OVERWRITE_DEFAULT_DENY",
  );

  const unknownCondition = deepClone(manifest);
  unknownCondition.overlay[0].conditions = ["not-declared"];
  assertErrorCode(
    validatePackManifest(unknownCondition, "HC-001"),
    "PACK_CONDITION_UNKNOWN",
  );

  const baselineActivation = deepClone(manifest);
  baselineActivation.allowedAdditions.push({
    pattern: ".github/copilot-instructions.md",
    conditions: ["baseline"],
  });
  assertErrorCode(
    validatePackManifest(baselineActivation, "HC-001"),
    "PACK_BASELINE_ACTIVE_CUSTOMIZATION",
  );
  for (const pattern of [
    "src/AGENTS.md",
    ".agents/skills/example/**",
    ".github/*",
    ".copilot/hooks.toml",
  ]) {
    const deniedFamily = deepClone(manifest);
    deniedFamily.allowedAdditions.push({
      pattern,
      conditions: ["baseline"],
    });
    assertErrorCode(
      validatePackManifest(deniedFamily, "HC-001"),
      "PACK_BASELINE_ACTIVE_CUSTOMIZATION",
    );
  }

  for (const pattern of [
    ".hackathon/evidence/hc-001/comparison.md",
    ".hackathon/custom-state.json",
    "submission/result.md",
  ]) {
    const reservedAddition = deepClone(manifest);
    reservedAddition.allowedAdditions.push({
      pattern,
      conditions: ["customized"],
    });
    assertErrorCode(
      validatePackManifest(reservedAddition, "HC-001"),
      "PACK_ADDITION_RESERVED_PATH",
    );
  }

  for (const pattern of ["*/participant/*", "**"]) {
    const wildcardNamespace = deepClone(manifest);
    wildcardNamespace.allowedAdditions.push({
      pattern,
      conditions: ["customized"],
    });
    assertErrorCode(
      validatePackManifest(wildcardNamespace, "HC-001"),
      "PACK_ADDITION_MANAGED_WILDCARD",
    );
  }

  const incoherentBranchSafety = deepClone(manifest);
  incoherentBranchSafety.isolation.branchSafe = true;
  assertErrorCode(
    validatePackManifest(incoherentBranchSafety, "HC-001"),
    "PACK_BRANCH_SAFETY",
  );

  const missingBaseline = deepClone(manifest);
  missingBaseline.conditions = missingBaseline.conditions.filter(
    (condition) => condition !== "baseline",
  );
  assertErrorCode(
    validatePackManifest(missingBaseline, "HC-001"),
    "PACK_BASELINE_REQUIRED",
  );
});

test("manifest path collections reject NFC and case-insensitive collisions", async () => {
  const manifest = await readJson(
    path.join(packDirectory("HC-001"), "manifest.json"),
  );
  const mutated = deepClone(manifest);
  mutated.overlay.push({
    ...mutated.overlay[0],
    source: mutated.overlay[0].source.toUpperCase(),
    destination:
      ".hackathon/challenge/hc-001/starter/extra-source.template",
  });

  mutated.allowedMutations.push({
    ...mutated.allowedMutations[0],
    path: mutated.allowedMutations[0].path.toUpperCase(),
  });
  mutated.allowedAdditions.push({
    ...mutated.allowedAdditions[0],
    pattern: mutated.allowedAdditions[0].pattern.toUpperCase(),
  });
  mutated.submissionFiles.push({
    ...mutated.submissionFiles[0],
    pattern: mutated.submissionFiles[0].pattern.toUpperCase(),
  });
  mutated.evidenceRequirements.push({
    ...mutated.evidenceRequirements[0],
    path: mutated.evidenceRequirements[0].path.toUpperCase(),
  });

  const errors = validatePackManifest(mutated, "HC-001");
  for (const code of [
    "PACK_SOURCE_COLLISION",
    "PACK_MUTATION_COLLISION",
    "PACK_ADDITION_COLLISION",
    "PACK_SUBMISSION_COLLISION",
    "PACK_EVIDENCE_COLLISION",
  ]) {
    assertErrorCode(errors, code);
  }
});

test("manifest collection limits reject oversized contracts", async () => {
  const manifest = await readJson(
    path.join(packDirectory("HC-001"), "manifest.json"),
  );

  const overlayHeavy = deepClone(manifest);
  overlayHeavy.overlay = Array.from({ length: 129 }, (_, index) => ({
    source: `payload/generated/file-${index}.template`,
    destination: `.hackathon/challenge/hc-001/generated/file-${index}.template`,
    conditions: ["baseline"],
    allowOverwrite: false,
  }));
  assertErrorCode(
    validatePackManifest(overlayHeavy, "HC-001"),
    "PACK_OVERLAY_LIMIT",
  );

  const evidenceHeavy = deepClone(manifest);
  evidenceHeavy.evidenceRequirements = Array.from(
    { length: 33 },
    (_, index) => ({
      path: `.hackathon/evidence/hc-001/result-${index}.md`,
      conditions: ["baseline"],
      stage: "submitted",
      requiredHeadings: ["Outcome"],
    }),
  );
  assertErrorCode(
    validatePackManifest(evidenceHeavy, "HC-001"),
    "PACK_EVIDENCE_LIMIT",
  );

  const submissionHeavy = deepClone(manifest);
  submissionHeavy.submissionFiles = Array.from(
    { length: 65 },
    (_, index) => ({
      pattern: `.hackathon/evidence/hc-001/result-${index}.md`,
      conditions: ["baseline"],
    }),
  );
  assertErrorCode(
    validatePackManifest(submissionHeavy, "HC-001"),
    "PACK_SUBMISSION_LIMIT",
  );
});

test("directory validation detects an active payload extension", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "hc-pack-"));
  const temporaryPack = path.join(temporaryRoot, "pack");

  try {
    await cp(packDirectory("HC-006"), temporaryPack, { recursive: true });
    const manifestPath = path.join(temporaryPack, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const entry = manifest.overlay[0];
    const oldSource = entry.source;
    const activeSource = oldSource.replace(/\.template$/u, "");
    await rename(
      path.join(temporaryPack, ...oldSource.split("/")),
      path.join(temporaryPack, ...activeSource.split("/")),
    );
    entry.source = activeSource;
    await writeFile(manifestPath, stableJson(manifest), "utf8");

    const result = await validatePackDirectory(temporaryPack, "HC-006");
    assertErrorCode(result.errors, "PACK_ACTIVE_PAYLOAD");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("directory validation detects case-insensitive destination collisions", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "hc-pack-"));
  const temporaryPack = path.join(temporaryRoot, "pack");

  try {
    await cp(packDirectory("HC-001"), temporaryPack, { recursive: true });
    const manifestPath = path.join(temporaryPack, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.overlay.push({
      ...manifest.overlay[0],
      destination:
        ".hackathon/challenge/hc-001/starter/COPILOT-INSTRUCTIONS.md.template",
    });
    await writeFile(manifestPath, stableJson(manifest), "utf8");

    const result = await validatePackDirectory(temporaryPack, "HC-001");
    assertErrorCode(result.errors, "PACK_DESTINATION_COLLISION");
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
