import { createHash } from "node:crypto";
import { CONTRACT_LIMITS } from "./constants.mjs";
import {
  findCaseInsensitiveNfcCollisions,
  isSafeRepositoryPath,
} from "./fs-utils.mjs";

const MAX_FILES = CONTRACT_LIMITS.submissionFiles;
const MAX_FILE_BYTES = CONTRACT_LIMITS.submissionFileBytes;
const MAX_TOTAL_BYTES = CONTRACT_LIMITS.submissionTotalBytes;
const EXPORT_NAME_PATTERN =
  /^[a-z0-9][a-z0-9-]{0,47}--[0-9a-f]{12}\.(?:md|txt|json|patch|diff)\.template$/u;
const DENIED_SOURCE_PATH =
  /(^|\/)(?:\.env(?:\.[^/]+)?|\.npmrc|\.pypirc|(?:logs?|raw)(?:\/.*)?|[^/]+\.(?:log|pem|p12|pfx|key))$/iu;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;

function addError(errors, code, message) {
  errors.push({ code, message });
}

export function sourcePathSha256(sourcePath) {
  return createHash("sha256").update(sourcePath, "utf8").digest("hex");
}

// Checks only the future Hub draft's artifact array/total, and supplied bytes
// when present. This is not whole-document or Runtime bundle validation.
export function validateSubmissionArtifacts(
  artifacts,
  totalArtifactBytes,
  artifactContents = new Map(),
) {
  const errors = [];
  if (!Array.isArray(artifacts)) {
    return [
      {
        code: "SUBMISSION_ARTIFACTS",
        message: "artifacts must be an array",
      },
    ];
  }
  if (artifacts.length > MAX_FILES) {
    addError(
      errors,
      "SUBMISSION_FILE_COUNT",
      `artifacts exceed ${MAX_FILES} files`,
    );
  }

  let calculatedTotal = 0;
  for (const [index, artifact] of artifacts.entries()) {
    const context = `artifacts[${index}]`;
    if (!isSafeRepositoryPath(artifact.sourcePath)) {
      addError(
        errors,
        "SUBMISSION_SOURCE_PATH",
        `${context}.sourcePath is unsafe`,
      );
      continue;
    }
    if (DENIED_SOURCE_PATH.test(artifact.sourcePath)) {
      addError(
        errors,
        "SUBMISSION_DENIED_SOURCE",
        `${context}.sourcePath looks like a secret or raw log source`,
      );
    }

    const expectedPathHash = sourcePathSha256(artifact.sourcePath);
    if (artifact.sourcePathSha256 !== expectedPathHash) {
      addError(
        errors,
        "SUBMISSION_PATH_HASH",
        `${context}.sourcePathSha256 does not match sourcePath`,
      );
    }
    if (
      typeof artifact.exportName !== "string" ||
      !EXPORT_NAME_PATTERN.test(artifact.exportName) ||
      !artifact.exportName.includes(`--${expectedPathHash.slice(0, 12)}.`)
    ) {
      addError(
        errors,
        "SUBMISSION_FLAT_NAME",
        `${context}.exportName must be flat, inert, and derived from sourcePath hash`,
      );
    }
    if (
      !Number.isInteger(artifact.byteLength) ||
      artifact.byteLength < 0 ||
      artifact.byteLength > MAX_FILE_BYTES
    ) {
      addError(
        errors,
        "SUBMISSION_FILE_BYTES",
        `${context}.byteLength exceeds the per-file limit`,
      );
    } else {
      calculatedTotal += artifact.byteLength;
    }
    if (!SHA256_PATTERN.test(artifact.sha256)) {
      addError(
        errors,
        "SUBMISSION_CONTENT_HASH",
        `${context}.sha256 must be lowercase SHA-256`,
      );
    }
    if (artifactContents.has(artifact.sourcePath)) {
      const contents = Buffer.from(artifactContents.get(artifact.sourcePath));
      const actualHash = createHash("sha256").update(contents).digest("hex");
      if (
        artifact.byteLength !== contents.byteLength ||
        artifact.sha256 !== actualHash
      ) {
        addError(
          errors,
          "SUBMISSION_CONTENT_MISMATCH",
          `${context} byteLength or sha256 does not match the supplied bytes`,
        );
      }
    }
    if (!["customization", "evidence", "patch", "metadata"].includes(artifact.kind)) {
      addError(
        errors,
        "SUBMISSION_KIND",
        `${context}.kind is not allowed`,
      );
    }
    if (artifact.redacted !== true || artifact.containsSecrets !== false) {
      addError(
        errors,
        "SUBMISSION_REDACTION",
        `${context} must be redacted and secret-free`,
      );
    }
  }

  for (const [first, second] of findCaseInsensitiveNfcCollisions(
    artifacts.map(({ exportName }) => exportName),
  )) {
    addError(
      errors,
      "SUBMISSION_NAME_COLLISION",
      `export names collide: ${first} <> ${second}`,
    );
  }

  if (
    !Number.isInteger(totalArtifactBytes) ||
    totalArtifactBytes !== calculatedTotal ||
    totalArtifactBytes > MAX_TOTAL_BYTES
  ) {
    addError(
      errors,
      "SUBMISSION_TOTAL_BYTES",
      `totalArtifactBytes must equal the artifact sum and be <= ${MAX_TOTAL_BYTES}`,
    );
  }

  return errors;
}
