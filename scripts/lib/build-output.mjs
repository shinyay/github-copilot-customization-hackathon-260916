import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import { isContainedBy, isSafeRepositoryPath, REPOSITORY_ROOT } from "./fs-utils.mjs";

export const PACK_OUTPUT_ROOT = ".runtime/packs";

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function rejectSymlinkIfPresent(targetPath) {
  try {
    const targetStat = await lstat(targetPath);
    if (targetStat.isSymbolicLink()) {
      throw new Error(`Output path must not traverse a symlink: ${targetPath}`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export function validatePackOutputArgument(output) {
  if (!isSafeRepositoryPath(output) || output !== PACK_OUTPUT_ROOT) {
    throw new Error(
      `--output must be the dedicated repository-relative path ${PACK_OUTPUT_ROOT}`,
    );
  }
}

export async function resolvePackOutputPaths(output, directoryName) {
  validatePackOutputArgument(output);
  if (!/^hc-[0-9]{3}-v[1-9][0-9]*$/u.test(directoryName)) {
    throw new Error(`Invalid generated Pack directory name: ${directoryName}`);
  }

  const runtimeDirectory = path.join(REPOSITORY_ROOT, ".runtime");
  const outputRoot = path.join(runtimeDirectory, "packs");
  await rejectSymlinkIfPresent(runtimeDirectory);
  await rejectSymlinkIfPresent(outputRoot);
  await mkdir(outputRoot, { recursive: true });

  const repositoryRealPath = await realpath(REPOSITORY_ROOT);
  const outputRootRealPath = await realpath(outputRoot);
  if (!isContainedBy(repositoryRealPath, outputRootRealPath)) {
    throw new Error("Resolved Pack output root is outside the repository");
  }

  const outputDirectory = path.join(outputRootRealPath, directoryName);
  const sidecarPath = path.join(outputRootRealPath, `${directoryName}.sha256`);
  if (
    (await exists(outputDirectory)) ||
    (await exists(sidecarPath))
  ) {
    throw new Error(
      `Pack output already exists for ${directoryName}; remove it explicitly before rebuilding`,
    );
  }

  const stagingRoot = await mkdtemp(
    path.join(outputRootRealPath, `.${directoryName}-`),
  );
  return {
    outputDirectory,
    outputRoot: outputRootRealPath,
    sidecarPath,
    stagingDirectory: path.join(stagingRoot, directoryName),
    stagingRoot,
  };
}
