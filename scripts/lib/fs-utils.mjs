import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONTRACT_LIMITS } from "./constants.mjs";

export const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export function isContainedBy(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export async function readRepositoryFile(relativePath, root = REPOSITORY_ROOT) {
  if (!isSafeRepositoryPath(relativePath)) {
    throw new Error(`Unsafe repository file path: ${String(relativePath)}`);
  }
  const rootRealPath = await realpath(root);
  let currentPath = rootRealPath;
  const segments = relativePath.split("/");
  for (const [index, segment] of segments.entries()) {
    currentPath = path.join(currentPath, segment);
    const entry = await lstat(currentPath);
    if (
      entry.isSymbolicLink() ||
      (index < segments.length - 1 ? !entry.isDirectory() : !entry.isFile())
    ) {
      throw new Error(`Repository file must be regular and must not traverse symlinks: ${relativePath}`);
    }
  }
  const fileRealPath = await realpath(currentPath);
  if (!isContainedBy(rootRealPath, fileRealPath)) {
    throw new Error(`Repository file resolves outside the repository: ${relativePath}`);
  }
  return readFile(fileRealPath, "utf8");
}

export async function writeText(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

export function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

export function compareStrings(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

export function compareUtf8Paths(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

const WINDOWS_RESERVED_NAME =
  /^(?:CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(?:\..*)?$/iu;
const WINDOWS_INVALID_PATH_CHARACTERS = /[<>:"|?*]/u;

export function isSafeRepositoryPath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > CONTRACT_LIMITS.repoPath
  ) {
    return false;
  }

  if (
    value.includes("\0") ||
    value.includes("\\") ||
    value.startsWith("/") ||
    /^[A-Za-z]:/u.test(value)
  ) {
    return false;
  }

  if (value.normalize("NFC") !== value) {
    return false;
  }

  const segments = value.split("/");
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.endsWith(".") ||
        segment.endsWith(" ") ||
        WINDOWS_RESERVED_NAME.test(segment) ||
        WINDOWS_INVALID_PATH_CHARACTERS.test(segment),
    )
  ) {
    return false;
  }

  return path.posix.normalize(value) === value;
}

export function isInertPayloadPath(relativePath) {
  return (
    relativePath.startsWith("payload/") &&
    relativePath.endsWith(".template") &&
    isSafeRepositoryPath(relativePath)
  );
}

export async function listFilesRecursively(
  rootDirectory,
  { ignoredRootDirectories = [] } = {},
) {
  const results = [];
  const ignored = new Set(ignoredRootDirectories);

  async function visit(currentDirectory) {
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    entries.sort((left, right) => compareUtf8Paths(left.name, right.name));

    for (const entry of entries) {
      if (
        currentDirectory === rootDirectory &&
        entry.isDirectory() &&
        ignored.has(entry.name)
      ) {
        continue;
      }
      const absolutePath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (entry.isFile()) {
        results.push(toPosixPath(path.relative(rootDirectory, absolutePath)));
      } else {
        throw new Error(`Unsupported filesystem entry: ${absolutePath}`);
      }
    }
  }

  await visit(rootDirectory);
  return results;
}

export function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

export async function buildHashRecords(directory) {
  const relativePaths = await listFilesRecursively(directory);
  const records = [];

  for (const relativePath of relativePaths) {
    const absolutePath = path.join(directory, ...relativePath.split("/"));
    const contents = await readFile(absolutePath);
    records.push({
      relativePath,
      mode: "100644",
      byteLength: contents.byteLength,
      fileSha256: sha256(contents),
    });
  }

  return records.sort((left, right) =>
    compareUtf8Paths(left.relativePath, right.relativePath),
  );
}

export function hashRecords(records) {
  const hash = createHash("sha256");
  const sorted = [...records].sort((left, right) =>
    compareUtf8Paths(left.relativePath, right.relativePath),
  );

  for (const record of sorted) {
    hash.update(record.relativePath, "utf8");
    hash.update(Buffer.from([0]));
    hash.update(record.mode, "utf8");
    hash.update(Buffer.from([0]));
    hash.update(String(record.byteLength), "utf8");
    hash.update(Buffer.from([0]));
    hash.update(record.fileSha256, "utf8");
    hash.update("\n", "utf8");
  }

  return hash.digest("hex");
}

export function findCaseInsensitiveNfcCollisions(paths) {
  const firstByKey = new Map();
  const collisions = [];

  for (const value of paths) {
    const key = value.normalize("NFC").toLowerCase();
    const first = firstByKey.get(key);
    if (first !== undefined) {
      collisions.push([first, value]);
    } else {
      firstByKey.set(key, value);
    }
  }

  return collisions;
}

export async function computeDirectoryHash(directory) {
  const records = await buildHashRecords(directory);
  return {
    hash: hashRecords(records),
    records,
  };
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
