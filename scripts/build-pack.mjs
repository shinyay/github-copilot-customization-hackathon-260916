#!/usr/bin/env node
import { cp, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadCatalog, getChallenge, validateCatalog } from "./lib/catalog.mjs";
import {
  assertOnlyArguments,
  parseNamedArguments,
  requireArguments,
} from "./lib/cli.mjs";
import { resolvePackOutputPaths } from "./lib/build-output.mjs";
import {
  REPOSITORY_ROOT,
  readJson,
  stableJson,
  writeText,
} from "./lib/fs-utils.mjs";
import {
  computePackHash,
  getPackDirectory,
  validatePackDirectory,
} from "./lib/packs.mjs";
import {
  computePublishedPackHashes,
  PACK_HASHES_PATH,
} from "./lib/pack-hashes.mjs";

try {
  const command = process.argv[2];
  if (command === "--check" || command === "--write-hashes") {
    if (process.argv.length !== 3) {
      throw new Error(`Usage: node scripts/build-pack.mjs ${command}`);
    }

    const catalog = await loadCatalog();
    const catalogErrors = validateCatalog(catalog);
    if (catalogErrors.length > 0) {
      throw new Error(
        `Catalog validation failed: ${catalogErrors
          .map(({ code }) => code)
          .join(", ")}`,
      );
    }
    const expected = await computePublishedPackHashes(catalog);

    if (command === "--write-hashes") {
      await writeText(PACK_HASHES_PATH, stableJson(expected));
      console.log(`Wrote ${expected.packs.length} expected pack hashes.`);
    } else {
      const actual = await readJson(PACK_HASHES_PATH);
      if (stableJson(actual) !== stableJson(expected)) {
        throw new Error(
          "PACK_HASHES_STALE: run node scripts/build-pack.mjs --write-hashes",
        );
      }
      console.log(`Pack hashes are current (${expected.packs.length}).`);
    }
    process.exit(0);
  }

  const args = parseNamedArguments(process.argv.slice(2));
  assertOnlyArguments(args, ["challenge", "output"]);
  requireArguments(args, ["challenge", "output"]);

  const catalog = await loadCatalog();
  const catalogErrors = validateCatalog(catalog);
  if (catalogErrors.length > 0) {
    throw new Error(
      `Catalog validation failed: ${catalogErrors
        .map(({ code }) => code)
        .join(", ")}`,
    );
  }

  const challengeId = args.challenge.toUpperCase();
  const challenge = getChallenge(catalog, challengeId);
  if (!challenge || challenge.status !== "published") {
    throw new Error(`Published challenge not found: ${challengeId}`);
  }

  const sourceDirectory = getPackDirectory(challenge);
  const validation = await validatePackDirectory(
    sourceDirectory,
    challengeId,
  );
  if (validation.errors.length > 0) {
    throw new Error(
      `Pack validation failed: ${validation.errors
        .map(({ code }) => code)
        .join(", ")}`,
    );
  }

  const directoryName = `${challengeId.toLowerCase()}-v${challenge.challengeVersion}`;
  const {
    outputDirectory,
    sidecarPath,
    stagingDirectory,
    stagingRoot,
  } = await resolvePackOutputPaths(args.output, directoryName);
  let finalOutputOwned = false;
  let sidecarCreated = false;
  try {
    await cp(sourceDirectory, stagingDirectory, {
      recursive: true,
      preserveTimestamps: false,
      force: false,
      errorOnExist: true,
    });

    const sourceHash = await computePackHash(sourceDirectory);
    const outputHash = await computePackHash(stagingDirectory);
    if (sourceHash.hash !== outputHash.hash) {
      throw new Error("Copied pack hash does not match source pack hash");
    }

    await rename(stagingDirectory, outputDirectory);
    finalOutputOwned = true;
    await writeFile(sidecarPath, `${outputHash.hash}  ${directoryName}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    sidecarCreated = true;
    process.stdout.write(
      stableJson({
        challengeId,
        challengeVersion: challenge.challengeVersion,
        outputDirectory: path.relative(REPOSITORY_ROOT, outputDirectory),
        hashFile: path.relative(REPOSITORY_ROOT, sidecarPath),
        sha256: outputHash.hash,
        records: outputHash.records,
      }),
    );
  } catch (error) {
    if (sidecarCreated) {
      await rm(sidecarPath, { force: true });
    }
    if (finalOutputOwned) {
      await rm(outputDirectory, { recursive: true, force: true });
    }
    throw error;
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
