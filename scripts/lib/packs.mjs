import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { getPublishedChallenges } from "./catalog.mjs";
import {
  ACTIVE_CUSTOMIZATION_PATH_PATTERNS,
  CONTRACT_LIMITS,
  DEFAULT_DENY_CUSTOMIZATION_BASENAMES,
  DEFAULT_DENY_CUSTOMIZATION_PATTERNS,
  MINIMUM_TEMPLATE_VERSION,
  PACK_SCHEMA_VERSION,
} from "./constants.mjs";
import {
  computeDirectoryHash,
  findCaseInsensitiveNfcCollisions,
  isInertPayloadPath,
  isSafeRepositoryPath,
  listFilesRecursively,
  readJson,
  REPOSITORY_ROOT,
} from "./fs-utils.mjs";
import {
  contractGlobCanMatchBasename,
  contractGlobsIntersect,
  validateContractGlob,
} from "./glob.mjs";

const TOP_LEVEL_KEYS = [
  "allowedAdditions",
  "allowedMutations",
  "challengeId",
  "challengeVersion",
  "cleanup",
  "conditions",
  "evidenceRequirements",
  "forbiddenActiveCustomizations",
  "isolation",
  "minimumTemplateVersion",
  "overlay",
  "schemaVersion",
  "submissionFiles",
].sort();

const ISOLATION_KEYS = [
  "branchSafe",
  "conditionStrategy",
  "freshConversation",
  "freshProfile",
  "freshRepository",
  "freshWorkspace",
  "tier",
].sort();

const CLEANUP_KEYS = [
  "advisory",
  "archiveRepository",
  "exportSubmission",
  "stopProcesses",
  "verifyBaseline",
].sort();

const CONDITION_PATTERN = /^[a-z][a-z0-9-]{0,31}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const BASELINE_CONDITION_PATTERN =
  /^(?:baseline(?:-.+)?|manual|manual-equivalent|no-skill|single-role)$/u;

function addError(errors, code, message) {
  errors.push({ code, message });
}

function addCollisionErrors(errors, values, code, label) {
  for (const [first, second] of findCaseInsensitiveNfcCollisions(values)) {
    addError(
      errors,
      code,
      `${label} has an NFC/case-insensitive collision: ${first} <> ${second}`,
    );
  }
}

function sameKeys(value, expectedKeys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify(expectedKeys)
  );
}

function validateConditions(errors, values, knownConditions, context) {
  if (!Array.isArray(values) || values.length === 0) {
    addError(
      errors,
      "PACK_CONDITIONS_REQUIRED",
      `${context}.conditions must be a non-empty array`,
    );
    return;
  }

  if (new Set(values).size !== values.length) {
    addError(
      errors,
      "PACK_CONDITION_DUPLICATE",
      `${context}.conditions must be unique`,
    );
  }

  for (const condition of values) {
    if (!CONDITION_PATTERN.test(condition)) {
      addError(
        errors,
        "PACK_CONDITION_FORMAT",
        `${context} has invalid condition: ${String(condition)}`,
      );
    }
    if (knownConditions && !knownConditions.has(condition)) {
      addError(
        errors,
        "PACK_CONDITION_UNKNOWN",
        `${context} references unknown condition: ${String(condition)}`,
      );
    }
  }
}

function isActiveCustomizationPattern(pattern) {
  if (validateContractGlob(pattern)) {
    return false;
  }
  if (
    !pattern.includes("*") &&
    ACTIVE_CUSTOMIZATION_PATH_PATTERNS.some((activePattern) =>
      activePattern.test(pattern),
    )
  ) {
    return true;
  }
  return (
    DEFAULT_DENY_CUSTOMIZATION_PATTERNS.some((deniedPattern) =>
      contractGlobsIntersect(pattern, deniedPattern),
    ) ||
    DEFAULT_DENY_CUSTOMIZATION_BASENAMES.some((basename) =>
      contractGlobCanMatchBasename(pattern, basename),
    )
  );
}

function validateConditionalPatternArray(
  errors,
  values,
  knownConditions,
  propertyName,
) {
  if (!Array.isArray(values)) {
    addError(
      errors,
      "PACK_CONDITIONAL_PATTERN_ARRAY",
      `${propertyName} must be an array`,
    );
    return;
  }
  if (
    propertyName === "submissionFiles" &&
    values.length > CONTRACT_LIMITS.submissionFiles
  ) {
    addError(
      errors,
      "PACK_SUBMISSION_LIMIT",
      `submissionFiles exceeds ${CONTRACT_LIMITS.submissionFiles} entries`,
    );
  }

  values.forEach((entry, index) => {
    const context = `${propertyName}[${index}]`;
    if (!sameKeys(entry, ["conditions", "pattern"])) {
      addError(
        errors,
        "PACK_OBJECT_SHAPE",
        `${context} must contain only pattern and conditions`,
      );
      return;
    }
    const globError = validateContractGlob(entry.pattern);
    if (globError) {
      addError(
        errors,
        "PACK_INVALID_GLOB",
        `${context}.pattern ${globError}: ${String(entry.pattern)}`,
      );
    }
    if (
      propertyName === "allowedAdditions" &&
      /^(?:\.hackathon(?:\/|$)|submission(?:\/|$))/u.test(entry.pattern)
    ) {
      addError(
        errors,
        "PACK_ADDITION_RESERVED_PATH",
        `${context}.pattern must not target Runtime-owned paths`,
      );
    }
    if (
      propertyName === "allowedAdditions" &&
      entry.pattern.split("/")[0].includes("*")
    ) {
      addError(
        errors,
        "PACK_ADDITION_MANAGED_WILDCARD",
        `${context}.pattern must start with a literal namespace`,
      );
    }
    validateConditions(errors, entry.conditions, knownConditions, context);
  });
}

function validateAllowedMutations(errors, values, knownConditions) {
  if (!Array.isArray(values)) {
    addError(
      errors,
      "PACK_ALLOWED_MUTATIONS",
      "allowedMutations must be an array",
    );
    return;
  }

  values.forEach((entry, index) => {
    const context = `allowedMutations[${index}]`;
    const keys = Object.keys(entry ?? {}).sort();
    const allowedKeys = entry?.expectedSha256
      ? ["conditions", "expectedSha256", "path"]
      : ["conditions", "path"];
    if (JSON.stringify(keys) !== JSON.stringify(allowedKeys)) {
      addError(
        errors,
        "PACK_OBJECT_SHAPE",
        `${context} has unexpected properties`,
      );
      return;
    }
    if (!isSafeRepositoryPath(entry.path)) {
      addError(
        errors,
        "PACK_UNSAFE_PATH",
        `${context}.path is unsafe: ${String(entry.path)}`,
      );
    }
    validateConditions(errors, entry.conditions, knownConditions, context);
    if (
      entry.expectedSha256 !== undefined &&
      !SHA256_PATTERN.test(entry.expectedSha256)
    ) {
      addError(
        errors,
        "PACK_EXPECTED_SHA256",
        `${context}.expectedSha256 must be lowercase SHA-256`,
      );
    }
  });
}

function validateEvidenceRequirements(errors, values, knownConditions) {
  if (!Array.isArray(values)) {
    addError(
      errors,
      "PACK_EVIDENCE_REQUIREMENTS",
      "evidenceRequirements must be an array",
    );
    return;
  }
  if (values.length > CONTRACT_LIMITS.evidenceFiles) {
    addError(
      errors,
      "PACK_EVIDENCE_LIMIT",
      `evidenceRequirements exceeds ${CONTRACT_LIMITS.evidenceFiles} entries`,
    );
  }

  values.forEach((entry, index) => {
    const context = `evidenceRequirements[${index}]`;
    const keys = Object.keys(entry ?? {}).sort();
    const allowedKeys = entry?.templateSha256
      ? ["conditions", "path", "requiredHeadings", "stage", "templateSha256"]
      : ["conditions", "path", "requiredHeadings", "stage"];
    if (JSON.stringify(keys) !== JSON.stringify(allowedKeys)) {
      addError(
        errors,
        "PACK_OBJECT_SHAPE",
        `${context} has unexpected properties`,
      );
      return;
    }
    if (!isSafeRepositoryPath(entry.path)) {
      addError(
        errors,
        "PACK_UNSAFE_PATH",
        `${context}.path is unsafe: ${String(entry.path)}`,
      );
    }
    if (
      typeof entry.path === "string" &&
      !entry.path.startsWith(".hackathon/evidence/")
    ) {
      addError(
        errors,
        "PACK_EVIDENCE_PATH",
        `${context}.path must be below .hackathon/evidence/`,
      );
    }
    validateConditions(errors, entry.conditions, knownConditions, context);
    if (entry.stage !== "submitted") {
      addError(
        errors,
        "PACK_EVIDENCE_STAGE",
        `${context}.stage must be submitted`,
      );
    }
    if (
      !Array.isArray(entry.requiredHeadings) ||
      entry.requiredHeadings.length === 0 ||
      new Set(entry.requiredHeadings).size !== entry.requiredHeadings.length ||
      entry.requiredHeadings.some(
        (heading) => typeof heading !== "string" || heading.length === 0,
      )
    ) {
      addError(
        errors,
        "PACK_EVIDENCE_HEADINGS",
        `${context}.requiredHeadings must contain unique non-empty headings`,
      );
    }
    if (
      entry.templateSha256 !== undefined &&
      !SHA256_PATTERN.test(entry.templateSha256)
    ) {
      addError(
        errors,
        "PACK_TEMPLATE_SHA256",
        `${context}.templateSha256 must be lowercase SHA-256`,
      );
    }
  });
}

export function validatePackManifest(manifest, expectedChallengeId) {
  const errors = [];

  if (!sameKeys(manifest, TOP_LEVEL_KEYS)) {
    addError(
      errors,
      "PACK_TOP_LEVEL_SHAPE",
      "manifest has missing or unexpected top-level properties",
    );
  }
  if (manifest?.schemaVersion !== PACK_SCHEMA_VERSION) {
    addError(
      errors,
      "PACK_SCHEMA_VERSION",
      `schemaVersion must be ${PACK_SCHEMA_VERSION}`,
    );
  }
  if (manifest?.challengeId !== expectedChallengeId) {
    addError(
      errors,
      "PACK_CHALLENGE_ID",
      `challengeId must be ${expectedChallengeId}`,
    );
  }
  if (!Number.isInteger(manifest?.challengeVersion) || manifest.challengeVersion < 1) {
    addError(
      errors,
      "PACK_CHALLENGE_VERSION",
      "challengeVersion must be a positive integer",
    );
  }
  if (manifest?.minimumTemplateVersion !== MINIMUM_TEMPLATE_VERSION) {
    addError(
      errors,
      "PACK_RUNTIME_VERSION",
      `minimumTemplateVersion must be ${MINIMUM_TEMPLATE_VERSION}`,
    );
  }

  validateConditions(errors, manifest?.conditions, undefined, "manifest");
  const knownConditions = new Set(
    Array.isArray(manifest?.conditions) ? manifest.conditions : [],
  );
  if (!knownConditions.has("baseline")) {
    addError(
      errors,
      "PACK_BASELINE_REQUIRED",
      "conditions must include baseline",
    );
  }

  if (!sameKeys(manifest?.isolation, ISOLATION_KEYS)) {
    addError(
      errors,
      "PACK_ISOLATION_SHAPE",
      "isolation has missing or unexpected properties",
    );
  }
  if (!["workspace", "repository", "organization"].includes(manifest?.isolation?.tier)) {
    addError(errors, "PACK_ISOLATION_TIER", "isolation.tier is invalid");
  }
  if (
    !["single-workspace", "separate-workspace", "separate-repository"].includes(
      manifest?.isolation?.conditionStrategy,
    )
  ) {
    addError(
      errors,
      "PACK_CONDITION_STRATEGY",
      "isolation.conditionStrategy is invalid",
    );
  }
  for (const property of [
    "freshWorkspace",
    "freshConversation",
    "freshProfile",
    "freshRepository",
    "branchSafe",
  ]) {
    if (typeof manifest?.isolation?.[property] !== "boolean") {
      addError(
        errors,
        "PACK_ISOLATION_BOOLEAN",
        `isolation.${property} must be boolean`,
      );
    }
  }
  if (
    manifest?.isolation?.branchSafe === true &&
    manifest?.isolation?.conditionStrategy !== "single-workspace"
  ) {
    addError(
      errors,
      "PACK_BRANCH_SAFETY",
      "isolation.branchSafe may be true only with single-workspace",
    );
  }

  if (!Array.isArray(manifest?.overlay) || manifest.overlay.length === 0) {
    addError(errors, "PACK_OVERLAY", "overlay must be a non-empty array");
  } else {
    if (manifest.overlay.length > CONTRACT_LIMITS.overlay) {
      addError(
        errors,
        "PACK_OVERLAY_LIMIT",
        `overlay exceeds ${CONTRACT_LIMITS.overlay} entries`,
      );
    }
    manifest.overlay.forEach((entry, index) => {
      const context = `overlay[${index}]`;
      if (
        !sameKeys(entry, [
          "allowOverwrite",
          "conditions",
          "destination",
          "source",
        ])
      ) {
        addError(
          errors,
          "PACK_OBJECT_SHAPE",
          `${context} has missing or unexpected properties`,
        );
        return;
      }
      if (!isInertPayloadPath(entry.source)) {
        addError(
          errors,
          "PACK_INERT_SOURCE",
          `${context}.source must be a safe payload/*.template path`,
        );
      }
      const expectedPrefix = `.hackathon/challenge/${expectedChallengeId.toLowerCase()}/`;
      if (
        !isSafeRepositoryPath(entry.destination) ||
        !entry.destination.startsWith(expectedPrefix) ||
        !entry.destination.endsWith(".template")
      ) {
        addError(
          errors,
          "PACK_INERT_DESTINATION",
          `${context}.destination must remain inert under ${expectedPrefix}`,
        );
      }
      validateConditions(errors, entry.conditions, knownConditions, context);
      if (entry.allowOverwrite !== false) {
        addError(
          errors,
          "PACK_OVERWRITE_DEFAULT_DENY",
          `${context}.allowOverwrite must be false`,
        );
      }
    });
  }

  validateAllowedMutations(
    errors,
    manifest?.allowedMutations,
    knownConditions,
  );
  validateConditionalPatternArray(
    errors,
    manifest?.allowedAdditions,
    knownConditions,
    "allowedAdditions",
  );
  validateConditionalPatternArray(
    errors,
    manifest?.submissionFiles,
    knownConditions,
    "submissionFiles",
  );

  if (!Array.isArray(manifest?.forbiddenActiveCustomizations)) {
    addError(
      errors,
      "PACK_FORBIDDEN_CUSTOMIZATIONS",
      "forbiddenActiveCustomizations must be an array",
    );
  } else {
    if (
      new Set(manifest.forbiddenActiveCustomizations).size !==
      manifest.forbiddenActiveCustomizations.length
    ) {
      addError(
        errors,
        "PACK_FORBIDDEN_DUPLICATE",
        "forbiddenActiveCustomizations must be unique",
      );
    }
    for (const pattern of manifest.forbiddenActiveCustomizations) {
      const globError = validateContractGlob(pattern);
      if (globError) {
        addError(
          errors,
          "PACK_INVALID_GLOB",
          `forbiddenActiveCustomizations ${globError}: ${String(pattern)}`,
        );
      }
    }
  }

  validateEvidenceRequirements(
    errors,
    manifest?.evidenceRequirements,
    knownConditions,
  );

  addCollisionErrors(
    errors,
    Array.isArray(manifest?.overlay)
      ? manifest.overlay.map(({ source }) => source)
      : [],
    "PACK_SOURCE_COLLISION",
    "overlay sources",
  );
  addCollisionErrors(
    errors,
    Array.isArray(manifest?.allowedMutations)
      ? manifest.allowedMutations.map(({ path: mutationPath }) => mutationPath)
      : [],
    "PACK_MUTATION_COLLISION",
    "allowed mutation paths",
  );
  addCollisionErrors(
    errors,
    Array.isArray(manifest?.allowedAdditions)
      ? manifest.allowedAdditions.map(({ pattern }) => pattern)
      : [],
    "PACK_ADDITION_COLLISION",
    "allowed addition patterns",
  );
  addCollisionErrors(
    errors,
    Array.isArray(manifest?.submissionFiles)
      ? manifest.submissionFiles.map(({ pattern }) => pattern)
      : [],
    "PACK_SUBMISSION_COLLISION",
    "submission patterns",
  );
  addCollisionErrors(
    errors,
    Array.isArray(manifest?.evidenceRequirements)
      ? manifest.evidenceRequirements.map(({ path: evidencePath }) => evidencePath)
      : [],
    "PACK_EVIDENCE_COLLISION",
    "evidence paths",
  );

  if (!sameKeys(manifest?.cleanup, CLEANUP_KEYS)) {
    addError(
      errors,
      "PACK_CLEANUP_SHAPE",
      "cleanup has missing or unexpected properties",
    );
  }
  if (manifest?.cleanup?.advisory !== true) {
    addError(errors, "PACK_CLEANUP_ADVISORY", "cleanup.advisory must be true");
  }
  for (const property of [
    "verifyBaseline",
    "exportSubmission",
    "stopProcesses",
    "archiveRepository",
  ]) {
    if (typeof manifest?.cleanup?.[property] !== "boolean") {
      addError(
        errors,
        "PACK_CLEANUP_BOOLEAN",
        `cleanup.${property} must be boolean`,
      );
    }
  }

  for (const addition of Array.isArray(manifest?.allowedAdditions)
    ? manifest.allowedAdditions
    : []) {
    if (!isActiveCustomizationPattern(addition.pattern)) {
      continue;
    }
    for (const condition of addition.conditions) {
      if (BASELINE_CONDITION_PATTERN.test(condition)) {
        addError(
          errors,
          "PACK_BASELINE_ACTIVE_CUSTOMIZATION",
          `${condition} must not allow active customization ${addition.pattern}`,
        );
      }
    }
  }

  return errors;
}

async function validateNonExecutableFiles(packDirectory, files, challengeId) {
  const errors = [];
  if (process.platform === "win32") {
    return errors;
  }

  for (const relativePath of files) {
    const fileStat = await stat(
      path.join(packDirectory, ...relativePath.split("/")),
    );
    if ((fileStat.mode & 0o111) !== 0) {
      addError(
        errors,
        "PACK_EXECUTABLE_FILE",
        `${challengeId} pack file must be mode 100644: ${relativePath}`,
      );
    }
  }
  return errors;
}

export async function validatePackDirectory(packDirectory, expectedChallengeId) {
  const errors = [];
  let manifest;

  try {
    manifest = await readJson(path.join(packDirectory, "manifest.json"));
  } catch (error) {
    addError(
      errors,
      "PACK_MANIFEST_MISSING",
      `${expectedChallengeId} manifest is missing or invalid: ${error.message}`,
    );
    return { errors, manifest: undefined };
  }

  errors.push(...validatePackManifest(manifest, expectedChallengeId));

  let files;
  try {
    files = await listFilesRecursively(packDirectory);
  } catch (error) {
    addError(
      errors,
      "PACK_FILE_ENUMERATION",
      `${expectedChallengeId} files could not be read: ${error.message}`,
    );
    return { errors, manifest };
  }

  if (
    files.some(
      (file) => file !== "manifest.json" && !file.startsWith("payload/"),
    )
  ) {
    addError(
      errors,
      "PACK_UNEXPECTED_FILE",
      `${expectedChallengeId} pack may contain only manifest.json and payload files`,
    );
  }

  const collisions = findCaseInsensitiveNfcCollisions(files);
  for (const [first, second] of collisions) {
    addError(
      errors,
      "PACK_FILE_COLLISION",
      `${expectedChallengeId} has NFC/case-insensitive collision: ${first} <> ${second}`,
    );
  }

  const payloadFiles = files.filter((file) => file.startsWith("payload/"));
  if (files.length > CONTRACT_LIMITS.packFiles) {
    addError(
      errors,
      "PACK_FILE_LIMIT",
      `${expectedChallengeId} exceeds ${CONTRACT_LIMITS.packFiles} files`,
    );
  }
  let totalBytes = 0;
  for (const relativePath of files) {
    const contents = await readFile(
      path.join(packDirectory, ...relativePath.split("/")),
    );
    totalBytes += contents.byteLength;
  }
  if (totalBytes > CONTRACT_LIMITS.packBytes) {
    addError(
      errors,
      "PACK_BYTE_LIMIT",
      `${expectedChallengeId} exceeds ${CONTRACT_LIMITS.packBytes} bytes`,
    );
  }
  for (const payloadFile of payloadFiles) {
    if (!isInertPayloadPath(payloadFile)) {
      addError(
        errors,
        "PACK_ACTIVE_PAYLOAD",
        `${expectedChallengeId} payload must remain inert: ${payloadFile}`,
      );
    }
  }

  const overlaySources = new Set(
    Array.isArray(manifest.overlay)
      ? manifest.overlay.map((entry) => entry.source)
      : [],
  );
  for (const source of overlaySources) {
    if (!payloadFiles.includes(source)) {
      addError(
        errors,
        "PACK_OVERLAY_SOURCE_MISSING",
        `${expectedChallengeId} overlay source is missing: ${source}`,
      );
    }
  }
  for (const payloadFile of payloadFiles) {
    if (!overlaySources.has(payloadFile)) {
      addError(
        errors,
        "PACK_UNREFERENCED_PAYLOAD",
        `${expectedChallengeId} payload is not listed in overlay: ${payloadFile}`,
      );
    }
  }

  const destinations = Array.isArray(manifest.overlay)
    ? manifest.overlay.map((entry) => entry.destination)
    : [];
  for (const [first, second] of findCaseInsensitiveNfcCollisions(destinations)) {
    addError(
      errors,
      "PACK_DESTINATION_COLLISION",
      `${expectedChallengeId} has NFC/case-insensitive destination collision: ${first} <> ${second}`,
    );
  }

  errors.push(
    ...(await validateNonExecutableFiles(
      packDirectory,
      files,
      expectedChallengeId,
    )),
  );

  for (const requirement of Array.isArray(manifest.evidenceRequirements)
    ? manifest.evidenceRequirements
    : []) {
    if (!requirement.templateSha256) {
      continue;
    }
    const templateFile = manifest.overlay.find((entry) =>
      entry.destination.endsWith(
        `${path.posix.basename(requirement.path)}.template`,
      ),
    );
    if (!templateFile) {
      addError(
        errors,
        "PACK_EVIDENCE_TEMPLATE_MISSING",
        `${expectedChallengeId} cannot locate template for ${requirement.path}`,
      );
      continue;
    }
    const contents = await readFile(
      path.join(packDirectory, ...templateFile.source.split("/")),
    );
    const actualSha256 = createHash("sha256")
      .update(contents)
      .digest("hex");
    if (actualSha256 !== requirement.templateSha256) {
      addError(
        errors,
        "PACK_EVIDENCE_TEMPLATE_HASH",
        `${expectedChallengeId} templateSha256 mismatch for ${requirement.path}`,
      );
    }
  }

  return { errors, manifest, files };
}

export async function validatePublishedPacks(catalog) {
  const errors = [];

  for (const challenge of getPublishedChallenges(catalog)) {
    const expectedPack = `challenges/${challenge.id.toLowerCase()}/pack`;
    if (challenge.pack !== expectedPack) {
      addError(
        errors,
        "PACK_CATALOG_PATH",
        `${challenge.id} pack must be ${expectedPack}`,
      );
      continue;
    }

    const packDirectory = path.join(
      REPOSITORY_ROOT,
      ...challenge.pack.split("/"),
    );
    const result = await validatePackDirectory(packDirectory, challenge.id);
    errors.push(...result.errors);

    if (result.manifest?.challengeVersion !== challenge.challengeVersion) {
      addError(
        errors,
        "PACK_CATALOG_VERSION",
        `${challenge.id} challengeVersion must match catalog`,
      );
    }
    if (
      result.manifest?.isolation?.tier !== challenge.isolation?.tier ||
      result.manifest?.isolation?.conditionStrategy !==
        challenge.isolation?.conditionStrategy
    ) {
      addError(
        errors,
        "PACK_CATALOG_ISOLATION",
        `${challenge.id} isolation metadata must match catalog`,
      );
    }
  }

  return errors;
}

export async function computePackHash(packDirectory) {
  return computeDirectoryHash(packDirectory);
}

export async function readPackFile(packDirectory, relativePath) {
  return readFile(path.join(packDirectory, ...relativePath.split("/")));
}

export function getPackDirectory(challenge) {
  return path.join(REPOSITORY_ROOT, ...challenge.pack.split("/"));
}

export async function packDirectoryExists(packDirectory) {
  try {
    await access(packDirectory);
    return true;
  } catch {
    return false;
  }
}
