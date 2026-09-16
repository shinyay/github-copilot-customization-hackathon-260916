import path from "node:path";
import {
  CATALOG_SCHEMA_VERSION,
  CHALLENGE_IDS,
  LABS_REPOSITORY,
  MINIMUM_TEMPLATE_VERSION,
  REFERENCE_COMMIT,
  REFERENCE_REPOSITORY,
  RELEASE_WAVES,
  RUNTIME_TEMPLATE_REPOSITORY,
} from "./constants.mjs";
import {
  isSafeRepositoryPath,
  readJson,
  REPOSITORY_ROOT,
} from "./fs-utils.mjs";
import { hasExactKeys, validateOptionalRoutes } from "./optional-routes.mjs";
import { validateSourceInventory } from "./source-inventory.mjs";
import sourceInventory from "../../catalog/source-baseline-paths.json" with { type: "json" };

const verifiedSourcePaths = new Set(
  Array.isArray(sourceInventory.paths) ? sourceInventory.paths : [],
);

export const CATALOG_PATH = path.join(
  REPOSITORY_ROOT,
  "catalog",
  "challenges.json",
);

export async function loadCatalog(catalogPath = CATALOG_PATH) {
  return readJson(catalogPath);
}

function addError(errors, code, message) {
  errors.push({ code, message });
}

export function validateCatalog(catalog) {
  const errors = [];

  errors.push(...validateSourceInventory(sourceInventory));

  if (
    !hasExactKeys(catalog?.releasePlan, [
      "waves",
      "reviewBetweenWaves",
      "participantPrerequisite",
    ]) ||
    catalog.releasePlan.reviewBetweenWaves !== true ||
    catalog.releasePlan.participantPrerequisite !== false
  ) {
    addError(
      errors,
      "CATALOG_RELEASE_PLAN",
      "releasePlan must contain only waves, reviewBetweenWaves:true and participantPrerequisite:false",
    );
  }
  if (JSON.stringify(catalog?.releasePlan?.waves) !== JSON.stringify(RELEASE_WAVES)) {
    addError(
      errors,
      "CATALOG_RELEASE_WAVES",
      "releasePlan.waves must match the eight approved maintainer waves exactly, including ID order",
    );
  }

  if (catalog?.schemaVersion !== CATALOG_SCHEMA_VERSION) {
    addError(
      errors,
      "CATALOG_SCHEMA_VERSION",
      `schemaVersion must be ${CATALOG_SCHEMA_VERSION}`,
    );
  }

  if (catalog?.runtimeTemplate?.repository !== RUNTIME_TEMPLATE_REPOSITORY) {
    addError(
      errors,
      "CATALOG_RUNTIME_REPOSITORY",
      `runtimeTemplate.repository must be ${RUNTIME_TEMPLATE_REPOSITORY}`,
    );
  }

  if (
    catalog?.runtimeTemplate?.minimumTemplateVersion !==
    MINIMUM_TEMPLATE_VERSION
  ) {
    addError(
      errors,
      "CATALOG_RUNTIME_VERSION",
      `runtimeTemplate.minimumTemplateVersion must be ${MINIMUM_TEMPLATE_VERSION}`,
    );
  }
  if (
    catalog?.runtimeTemplate?.versionMarker !== ".hackathon/template.json"
  ) {
    addError(
      errors,
      "CATALOG_RUNTIME_MARKER",
      "runtimeTemplate.versionMarker must be .hackathon/template.json",
    );
  }

  if (
    catalog?.sourceBaseline?.repository !== REFERENCE_REPOSITORY ||
    catalog?.sourceBaseline?.commit !== REFERENCE_COMMIT ||
    catalog?.sourceBaseline?.fileCount !== 515 ||
    catalog?.sourceBaseline?.treeSha256 !==
      "c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111"
  ) {
    addError(
      errors,
      "CATALOG_SOURCE_BASELINE",
      `sourceBaseline must pin ${REFERENCE_REPOSITORY}@${REFERENCE_COMMIT}`,
    );
  }

  if (
    catalog?.authoringReference?.repository !== LABS_REPOSITORY ||
    catalog?.authoringReference?.vendoredSourcePath !==
      "fixtures/tsubame-wholesale"
  ) {
    addError(
      errors,
      "CATALOG_AUTHORING_REFERENCE",
      `authoringReference must identify ${LABS_REPOSITORY} and fixtures/tsubame-wholesale`,
    );
  }

  if (!Array.isArray(catalog?.challenges)) {
    addError(errors, "CATALOG_CHALLENGES", "challenges must be an array");
    return errors;
  }

  if (catalog.challenges.length !== CHALLENGE_IDS.length) {
    addError(
      errors,
      "CATALOG_COUNT",
      `challenges must contain ${CHALLENGE_IDS.length} entries`,
    );
  }

  const seen = new Set();
  catalog.challenges.forEach((challenge, index) => {
    if (challenge === null || typeof challenge !== "object" || Array.isArray(challenge)) {
      addError(errors, "CATALOG_CHALLENGE", `challenge at index ${index} must be an object`);
      return;
    }
    const expectedId = CHALLENGE_IDS[index];
    if (challenge.id !== expectedId) {
      addError(
        errors,
        "CATALOG_ORDER",
        `challenge at index ${index} must be ${expectedId ?? "<none>"}`,
      );
    }

    if (seen.has(challenge.id)) {
      addError(
        errors,
        "CATALOG_DUPLICATE_ID",
        `duplicate challenge id: ${challenge.id}`,
      );
    }
    seen.add(challenge.id);

    if (typeof challenge.title !== "string" || challenge.title.trim() === "") {
      addError(
        errors,
        "CATALOG_TITLE",
        `${challenge.id ?? `index ${index}`} must have a title`,
      );
    }

    if (typeof challenge.track !== "string" || challenge.track.trim() === "") {
      addError(
        errors,
        "CATALOG_TRACK",
        `${challenge.id ?? `index ${index}`} must have a track`,
      );
    }

    if (!["planned", "published"].includes(challenge.status)) {
      addError(
        errors,
        "CATALOG_STATUS",
        `${challenge.id ?? `index ${index}`} has invalid status`,
      );
    }

    const expectedLabId = `LAB-${String(index + 1).padStart(2, "0")}`;
    const expectedLabIds = [expectedLabId];
    if (challenge.id === "HC-009") expectedLabIds.push("LAB-33");
    if (challenge.id === "HC-011") expectedLabIds.push("LAB-34");
    if (
      JSON.stringify(challenge.sourceLab?.ids) !== JSON.stringify(expectedLabIds) ||
      challenge.sourceLab?.repository !== LABS_REPOSITORY ||
      !Array.isArray(challenge.sourceLab?.pages) ||
      challenge.sourceLab.pages.length !== challenge.sourceLab.ids.length ||
      challenge.sourceLab.pages.some(
        (page, pageIndex) =>
          !isSafeRepositoryPath(page) ||
          !page.startsWith(`docs/labs/lab-${expectedLabIds[pageIndex]?.slice(4)}-`) ||
          !page.endsWith(".md"),
      )
    ) {
      addError(
        errors,
        "CATALOG_SOURCE_LAB",
        `${challenge.id ?? `index ${index}`} must map to ${expectedLabId} in ${LABS_REPOSITORY}`,
      );
    }

    if (challenge.status === "published") {
      for (const property of [
        "challengeVersion",
        "page",
        "pack",
        "feature",
        "support",
        "isolation",
        "sourcePaths",
        "sourceKind",
        "optionalRoutes",
      ]) {
        if (challenge[property] === undefined) {
          addError(
            errors,
            "CATALOG_PUBLISHED_METADATA",
            `${challenge.id} is missing ${property}`,
          );
        }
      }
      if (
        !Number.isInteger(challenge.challengeVersion) ||
        challenge.challengeVersion < 1 ||
        !Array.isArray(challenge.sourcePaths) ||
        challenge.sourcePaths.some((sourcePath) => !isSafeRepositoryPath(sourcePath)) ||
        new Set(challenge.sourcePaths).size !== challenge.sourcePaths.length
      ) {
        addError(
          errors,
          "CATALOG_PUBLISHED_SOURCE",
          `${challenge.id} must declare a positive version and unique safe sourcePaths`,
        );
      }
      if (!["baseline", "synthetic"].includes(challenge.sourceKind)) {
        addError(
          errors,
          "CATALOG_SOURCE_KIND",
          `${challenge.id} sourceKind must be baseline or synthetic`,
        );
      } else if (challenge.sourceKind === "baseline") {
        if (
          !Array.isArray(challenge.sourcePaths) ||
          challenge.sourcePaths.length === 0 ||
          challenge.sourcePaths.some((sourcePath) => !verifiedSourcePaths.has(sourcePath))
        ) {
          addError(
            errors,
            "CATALOG_BASELINE_SOURCE",
            `${challenge.id} needs at least one exact path in the pinned source baseline inventory`,
          );
        }
      } else if (
        !Array.isArray(challenge.sourcePaths) ||
        challenge.sourcePaths.length !== 0
      ) {
        addError(
          errors,
          "CATALOG_SYNTHETIC_SOURCE",
          `${challenge.id} synthetic materials must declare sourcePaths:[]; do not invent source provenance`,
        );
      }
      errors.push(...validateOptionalRoutes(challenge));
      if (
        typeof challenge.support?.primary !== "string" ||
        typeof challenge.support?.fallback !== "string" ||
        !["workspace", "repository", "organization"].includes(
          challenge.isolation?.tier,
        ) ||
        ![
          "single-workspace",
          "separate-workspace",
          "separate-repository",
        ].includes(challenge.isolation?.conditionStrategy)
      ) {
        addError(
          errors,
          "CATALOG_PUBLISHED_SUPPORT",
          `${challenge.id} has invalid support or isolation metadata`,
        );
      }
    } else {
      const publishedOnlyProperties = [
        "challengeVersion",
        "page",
        "pack",
        "feature",
        "support",
        "isolation",
        "sourcePaths",
        "sourceKind",
        "optionalRoutes",
      ];
      if (
        publishedOnlyProperties.some(
          (property) => challenge[property] !== undefined,
        )
      ) {
        addError(
          errors,
          "CATALOG_PLANNED_ARTIFACT",
          `${challenge.id} is planned and must not declare published artifacts`,
        );
      }
    }
  });

  return errors;
}

export function getPublishedChallenges(catalog) {
  return catalog.challenges.filter(({ status }) => status === "published");
}

export function getPublishedChallengeIds(catalog) {
  return getPublishedChallenges(catalog).map(({ id }) => id);
}

export function getChallenge(catalog, challengeId) {
  return catalog.challenges.find((challenge) => challenge.id === challengeId);
}
