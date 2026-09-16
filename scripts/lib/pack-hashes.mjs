import path from "node:path";
import { getPublishedChallenges } from "./catalog.mjs";
import { computePackHash, getPackDirectory } from "./packs.mjs";
import { REPOSITORY_ROOT } from "./fs-utils.mjs";

export const PACK_HASHES_PATH = path.join(
  REPOSITORY_ROOT,
  "catalog",
  "pack-hashes.json",
);

export async function computePublishedPackHashes(catalog) {
  const packs = [];

  for (const challenge of getPublishedChallenges(catalog)) {
    const result = await computePackHash(getPackDirectory(challenge));
    packs.push({
      challengeId: challenge.id,
      challengeVersion: challenge.challengeVersion,
      sha256: result.hash,
      fileCount: result.records.length,
      byteLength: result.records.reduce(
        (total, record) => total + record.byteLength,
        0,
      ),
    });
  }

  return {
    schemaVersion: 1,
    hashAlgorithm: "pack-hash-v1",
    packs,
  };
}
