import { REFERENCE_COMMIT, REFERENCE_REPOSITORY } from "./constants.mjs";
import {
  compareUtf8Paths,
  findCaseInsensitiveNfcCollisions,
  isSafeRepositoryPath,
  sha256,
} from "./fs-utils.mjs";
import { hasExactKeys } from "./optional-routes.mjs";

export const SOURCE_GIT_TREE = "5c76826366ecd02f432357b3ad0d74b9f4a6fce6";
export const SOURCE_PATH_SET_SHA256 =
  "3dd148b78dae9130214205e0f5f77996c1292dc4189f95086e3a6e8438153df3";

export function validateSourceInventory(inventory) {
  const errors = [];
  const addError = (code, message) => errors.push({ code, message });
  if (
    !hasExactKeys(inventory, [
      "repository", "commit", "gitTree", "pathCount", "pathSetSha256", "paths",
    ]) ||
    inventory.repository !== REFERENCE_REPOSITORY ||
    inventory.commit !== REFERENCE_COMMIT ||
    inventory.gitTree !== SOURCE_GIT_TREE
  ) {
    addError(
      "SOURCE_INVENTORY_PROVENANCE",
      "Source path inventory must pin the source repository, commit and actual Git tree with no extra fields",
    );
  }
  if (
    !Array.isArray(inventory?.paths) ||
    inventory.pathCount !== 515 ||
    inventory.paths.length !== 515 ||
    !inventory.paths.every(isSafeRepositoryPath) ||
    new Set(inventory.paths).size !== 515 ||
    findCaseInsensitiveNfcCollisions(inventory.paths).length > 0
  ) {
    addError(
      "SOURCE_INVENTORY_PATHS",
      "Source path inventory must contain exactly 515 unique safe canonical paths",
    );
    return errors;
  }
  const sortedPaths = [...inventory.paths].sort(compareUtf8Paths);
  if (JSON.stringify(inventory.paths) !== JSON.stringify(sortedPaths)) {
    addError("SOURCE_INVENTORY_ORDER", "Source paths must be sorted by UTF-8 bytes");
  }
  if (
    inventory.pathSetSha256 !== SOURCE_PATH_SET_SHA256 ||
    sha256(`${sortedPaths.join("\n")}\n`) !== SOURCE_PATH_SET_SHA256
  ) {
    addError(
      "SOURCE_INVENTORY_DIGEST",
      "Source path set differs from the verified source Git tree; this digest covers paths, not source bytes",
    );
  }
  return errors;
}
