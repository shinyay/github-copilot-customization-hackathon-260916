import { isSafeRepositoryPath } from "./fs-utils.mjs";
import { CONTRACT_LIMITS } from "./constants.mjs";

const WINDOWS_RESERVED_NAME =
  /^(?:CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(?:\..*)?$/iu;
const WINDOWS_INVALID_LITERAL_CHARACTERS = /[<>:"|]/u;

export function validateContractGlob(pattern) {
  if (
    typeof pattern !== "string" ||
    pattern.length === 0 ||
    pattern.length > CONTRACT_LIMITS.repoPath
  ) {
    return "pattern must be a non-empty string";
  }
  if (
    pattern.includes("\0") ||
    pattern.includes("\\") ||
    pattern.startsWith("/") ||
    /^[A-Za-z]:/u.test(pattern)
  ) {
    return "pattern must be a repository-relative POSIX path";
  }
  if (pattern.normalize("NFC") !== pattern) {
    return "pattern must be NFC-normalized";
  }
  if (/[?[\]{}!]/u.test(pattern)) {
    return "pattern uses an unsupported glob token";
  }

  const segments = pattern.split("/");
  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.endsWith(".") ||
        segment.endsWith(" "),
    )
  ) {
    return "pattern contains an unsafe path segment";
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (segment === "**") {
      if (index !== segments.length - 1 || index === 0) {
        return "** is supported only as the final segment after a literal prefix";
      }
      continue;
    }
    if (segment.includes("**")) {
      return "** must occupy the complete trailing segment";
    }
    if (segment.includes("*") && segment !== "*") {
      return "* must occupy a complete segment";
    }

    const literalPart = segment.replaceAll("*", "");
    if (
      WINDOWS_INVALID_LITERAL_CHARACTERS.test(literalPart) ||
      WINDOWS_RESERVED_NAME.test(literalPart)
    ) {
      return "pattern contains a Windows-reserved or invalid literal segment";
    }
  }

  return undefined;
}

function escapeRegex(value) {
  return value.replace(/[\\^$.*+()[\]]/gu, "\\$&");
}

export function contractGlobToRegExp(pattern) {
  const error = validateContractGlob(pattern);
  if (error) {
    throw new Error(`${pattern}: ${error}`);
  }

  const segments = pattern.split("/");
  const hasTrailingRecursive = segments.at(-1) === "**";
  const matchableSegments = hasTrailingRecursive
    ? segments.slice(0, -1)
    : segments;
  const body = matchableSegments
    .map((segment) =>
      segment
        .split("*")
        .map((part) => escapeRegex(part))
        .join("[^/]*"),
    )
    .join("/");

  return new RegExp(
    hasTrailingRecursive ? `^${body}/[^/]+(?:/[^/]+)*$` : `^${body}$`,
    "u",
  );
}

export function matchesContractGlob(pattern, candidatePath) {
  if (!isSafeRepositoryPath(candidatePath)) {
    return false;
  }
  return contractGlobToRegExp(pattern).test(candidatePath);
}

function parseContractGlob(pattern) {
  const segments = pattern.split("/");
  const recursive = segments.at(-1) === "**";
  return {
    prefix: recursive ? segments.slice(0, -1) : segments,
    recursive,
  };
}

function segmentsCompatible(left, right) {
  return left === "*" || right === "*" || left === right;
}

export function contractGlobsIntersect(leftPattern, rightPattern) {
  for (const pattern of [leftPattern, rightPattern]) {
    const error = validateContractGlob(pattern);
    if (error) {
      throw new Error(`${pattern}: ${error}`);
    }
  }

  const left = parseContractGlob(leftPattern);
  const right = parseContractGlob(rightPattern);
  const fixedOverlap = Math.min(left.prefix.length, right.prefix.length);
  for (let index = 0; index < fixedOverlap; index += 1) {
    if (!segmentsCompatible(left.prefix[index], right.prefix[index])) {
      return false;
    }
  }

  if (!left.recursive && !right.recursive) {
    return left.prefix.length === right.prefix.length;
  }
  if (left.recursive && !right.recursive) {
    return right.prefix.length >= left.prefix.length + 1;
  }
  if (!left.recursive && right.recursive) {
    return left.prefix.length >= right.prefix.length + 1;
  }
  return true;
}

export function contractGlobCanMatchBasename(pattern, basename) {
  const error = validateContractGlob(pattern);
  if (error) {
    throw new Error(`${pattern}: ${error}`);
  }
  const parsed = parseContractGlob(pattern);
  if (parsed.recursive) {
    return true;
  }
  const lastSegment = parsed.prefix.at(-1);
  return lastSegment === "*" || lastSegment === basename;
}
