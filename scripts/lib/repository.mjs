import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { ACTIVE_CUSTOMIZATION_PATH_PATTERNS } from "./constants.mjs";
import { getPublishedChallengeIds, getPublishedChallenges } from "./catalog.mjs";
import {
  listFilesRecursively,
  readJson,
  REPOSITORY_ROOT,
} from "./fs-utils.mjs";
import { validateIssueFormText } from "./issue-form.mjs";
import {
  renderGeneratedDocs,
  validateGeneratedDocContents,
} from "./render.mjs";

function addError(errors, code, message) {
  errors.push({ code, message });
}

export async function validateRepositoryStructure(catalog) {
  const errors = [];
  let files;
  try {
    files = await listFilesRecursively(REPOSITORY_ROOT, {
      ignoredRootDirectories: ["node_modules", "dist", ".git"],
    });
  } catch (error) {
    addError(errors, "REPOSITORY_FILE_ENUMERATION", `Cannot safely enumerate repository files: ${error.message}`);
    return errors;
  }
  const relevantFiles = files.filter(
    (file) =>
      !file.startsWith("node_modules/") &&
      !file.startsWith("dist/") &&
      !file.startsWith(".git/"),
  );

  const optionalPages = new Set(
    getPublishedChallenges(catalog).flatMap(({ optionalRoutes }) =>
      optionalRoutes.map(({ page }) => page),
    ),
  );
  for (const relativePath of relevantFiles) {
    if (
      /^challenges\/hc-\d{3}\/optional\/.*\.md$/iu.test(relativePath) &&
      !optionalPages.has(relativePath)
    ) {
      addError(
        errors,
        "OPTIONAL_PAGE_UNREGISTERED",
        `Optional page must be registered in its challenge catalog entry: ${relativePath}`,
      );
    }
    if (
      ACTIVE_CUSTOMIZATION_PATH_PATTERNS.some((pattern) =>
        pattern.test(relativePath),
      )
    ) {
      addError(
        errors,
        "ACTIVE_CUSTOMIZATION_IN_HUB",
        `Hub contains active customization path: ${relativePath}`,
      );
    }
    if (
      relativePath.startsWith("challenges/") &&
      /(^|\/)(?:solutions?|answer[-_]?keys?|instructor-only)(?:\/|$)/iu.test(
        relativePath,
      )
    ) {
      addError(
        errors,
        "HIDDEN_ANSWER_MATERIAL",
        `Challenge tree contains prohibited answer material: ${relativePath}`,
      );
    }
    if (
      relativePath.startsWith("challenges/") &&
      (relativePath.endsWith(".md") ||
        relativePath.endsWith(".template") ||
        relativePath.endsWith(".json"))
    ) {
      const contents = await readFile(
        path.join(REPOSITORY_ROOT, ...relativePath.split("/")),
        "utf8",
      );
      if (
        contents.includes("com/example/hackathon") ||
        contents.includes("com.example.hackathon")
      ) {
        addError(
          errors,
          "FAKE_SOURCE_PATH",
          `Challenge content references the removed synthetic source tree: ${relativePath}`,
        );
      }
    }
  }

  const challengeEntries = await readdir(
    path.join(REPOSITORY_ROOT, "challenges"),
    { withFileTypes: true },
  );
  const actualChallengeIds = challengeEntries
    .filter((entry) => entry.isDirectory() && /^hc-\d{3}$/u.test(entry.name))
    .map((entry) => entry.name.toUpperCase())
    .sort();
  const expectedChallengeIds = getPublishedChallengeIds(catalog);
  if (JSON.stringify(actualChallengeIds) !== JSON.stringify(expectedChallengeIds)) {
    addError(
      errors,
      "CHALLENGE_DIRECTORY_PARITY",
      `challenge directories must be ${expectedChallengeIds.join(", ")}`,
    );
  }

  const issueFormPath = path.join(
    REPOSITORY_ROOT,
    ".github",
    "ISSUE_TEMPLATE",
    "challenge-result.yml",
  );
  const issueForms = relevantFiles.filter(
    (file) =>
      file.startsWith(".github/ISSUE_TEMPLATE/") &&
      /\.ya?ml$/u.test(file) &&
      !/^\.github\/ISSUE_TEMPLATE\/config\.ya?ml$/u.test(file),
  );
  if (
    JSON.stringify(issueForms) !==
    JSON.stringify([".github/ISSUE_TEMPLATE/challenge-result.yml"])
  ) {
    addError(
      errors,
      "ISSUE_FORM_SINGLE",
      "Keep one manually authored Challenge Result Issue Form; optional routes use the same Form",
    );
  }
  try {
    const issueForm = await readFile(issueFormPath, "utf8");
    errors.push(...validateIssueFormText(issueForm, expectedChallengeIds));
  } catch (error) {
    addError(
      errors,
      "ISSUE_FORM_MISSING",
      `Challenge Result Issue Form is missing: ${error.message}`,
    );
  }

  const generatedContents = new Map();
  for (const [generatedPath] of renderGeneratedDocs(catalog)) {
    try {
      generatedContents.set(generatedPath, await readFile(generatedPath, "utf8"));
    } catch {
      generatedContents.set(generatedPath, undefined);
    }
  }
  errors.push(...validateGeneratedDocContents(catalog, generatedContents));

  for (const schemaName of [
    "challenge-catalog.schema.json",
    "challenge-pack.schema.json",
    "run-plan.schema.json",
    "hub-result-draft.schema.json",
  ]) {
    try {
      const schema = await readJson(
        path.join(REPOSITORY_ROOT, "schemas", schemaName),
      );
      if (
        schema.$schema !==
        "https://json-schema.org/draft/2020-12/schema"
      ) {
        addError(
          errors,
          "SCHEMA_DIALECT",
          `${schemaName} must use JSON Schema 2020-12`,
        );
      }
    } catch (error) {
      addError(
        errors,
        "SCHEMA_INVALID",
        `${schemaName} is invalid: ${error.message}`,
      );
    }
  }

  return errors;
}
