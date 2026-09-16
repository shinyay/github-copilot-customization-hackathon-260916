import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { readJson, REPOSITORY_ROOT, stableJson } from "./fs-utils.mjs";
import { matchesContractGlob } from "./glob.mjs";
import {
  computePublishedPackHashes,
  PACK_HASHES_PATH,
} from "./pack-hashes.mjs";

function addError(errors, code, message) {
  errors.push({ code, message });
}

export async function validateSharedContractArtifacts() {
  const errors = [];
  const metadata = await readJson(
    path.join(REPOSITORY_ROOT, "catalog", "contract-artifacts.json"),
  );
  const runtimePaths = new Set();

  for (const artifact of metadata.artifacts) {
    if (
      typeof artifact.runtimePath !== "string" ||
      !artifact.runtimePath.startsWith(".hackathon/") ||
      runtimePaths.has(artifact.runtimePath.toLowerCase())
    ) {
      addError(
        errors,
        "CONTRACT_RUNTIME_PATH",
        `${artifact.path} has an invalid or colliding runtimePath`,
      );
    }
    runtimePaths.add(String(artifact.runtimePath).toLowerCase());
    const contents = await readFile(
      path.join(REPOSITORY_ROOT, ...artifact.path.split("/")),
    );
    if (contents.byteLength !== artifact.byteLength) {
      addError(
        errors,
        "CONTRACT_ARTIFACT_SIZE",
        `${artifact.path} expected ${artifact.byteLength} bytes, got ${contents.byteLength}`,
      );
    }
    const actualHash = createHash("sha256").update(contents).digest("hex");
    if (actualHash !== artifact.sha256) {
      addError(
        errors,
        "CONTRACT_ARTIFACT_HASH",
        `${artifact.path} expected ${artifact.sha256}, got ${actualHash}`,
      );
    }
  }

  const globFixture = await readJson(
    path.join(
      REPOSITORY_ROOT,
      "fixtures",
      "contracts",
      "glob-conformance-v1.json",
    ),
  );
  for (const fixtureCase of globFixture.cases) {
    if (
      matchesContractGlob(fixtureCase.pattern, fixtureCase.path) !==
      fixtureCase.matches
    ) {
      addError(
        errors,
        "GLOB_CONFORMANCE",
        `${fixtureCase.pattern} against ${fixtureCase.path}`,
      );
    }
  }

  return errors;
}

export async function validateExpectedPackHashes(catalog) {
  const errors = [];
  let actual;
  try {
    actual = await readJson(PACK_HASHES_PATH);
  } catch (error) {
    addError(
      errors,
      "PACK_HASHES_MISSING",
      `catalog/pack-hashes.json is missing or invalid: ${error.message}`,
    );
    return errors;
  }

  let expected;
  try {
    expected = await computePublishedPackHashes(catalog);
  } catch (error) {
    addError(
      errors,
      "PACK_HASHES_COMPUTE",
      `Published Pack hashes could not be computed: ${error.message}`,
    );
    return errors;
  }
  if (stableJson(actual) !== stableJson(expected)) {
    addError(
      errors,
      "PACK_HASHES_STALE",
      "catalog/pack-hashes.json does not match current Pack bytes",
    );
  }
  return errors;
}
