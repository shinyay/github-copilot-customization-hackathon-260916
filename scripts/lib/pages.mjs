import path from "node:path";
import { getPublishedChallenges } from "./catalog.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "./constants.mjs";
import { isSafeRepositoryPath, readRepositoryFile } from "./fs-utils.mjs";
import { parseMarkdownProse } from "./markdown.mjs";
import {
  LIVE_STATUS,
  OPTIONAL_EVIDENCE_NOTICE,
  OPTIONAL_GUIDE_HEADINGS,
  OPTIONAL_SAFETY_NOTICE,
  SYNTHETIC_MATERIAL_LABEL,
  validateOptionalRoutes,
} from "./optional-routes.mjs";

function addError(errors, code, message) {
  errors.push({ code, message });
}

export function validateChallengePageText(challengeId, contents) {
  const errors = [];
  const headings = [...contents.matchAll(/^## (.+)$/gmu)].map(
    (match) => match[1],
  );

  for (const requiredHeading of REQUIRED_CHALLENGE_HEADINGS) {
    const occurrences = headings.filter(
      (heading) => heading === requiredHeading,
    ).length;
    if (occurrences !== 1) {
      addError(
        errors,
        "PAGE_REQUIRED_HEADING",
        `${challengeId} must contain exactly one "## ${requiredHeading}" heading`,
      );
    }
  }

  const orderedPositions = REQUIRED_CHALLENGE_HEADINGS.map((heading) =>
    headings.indexOf(heading),
  );
  if (
    orderedPositions.some((position) => position < 0) ||
    orderedPositions.some(
      (position, index) => index > 0 && position <= orderedPositions[index - 1],
    )
  ) {
    addError(
      errors,
      "PAGE_HEADING_ORDER",
      `${challengeId} required headings must appear in contract order`,
    );
  }

  if (!contents.includes("Baseline") || !contents.includes("Customized")) {
    addError(
      errors,
      "PAGE_COMPARISON_TERMS",
      `${challengeId} must explain Baseline and Customized conditions`,
    );
  }

  for (const outcome of ["equal", "worse", "incomparable", "blocked"]) {
    if (!contents.includes(outcome)) {
      addError(
        errors,
        "PAGE_NON_POSITIVE_OUTCOME",
        `${challengeId} must accept the ${outcome} outcome`,
      );
    }
  }

  if (
    /(?:先に|事前に|前提として).{0,20}LAB-\d{3}/iu.test(contents) ||
    /LAB-\d{3}.{0,20}(?:完了|受講|実行).{0,10}(?:必須|前提)/iu.test(contents)
  ) {
    addError(
      errors,
      "PAGE_LAB_PREREQUISITE",
      `${challengeId} must not require prior LAB completion`,
    );
  }

  return errors;
}

function linksTo(links, fromPage, targetPage) {
  return links.some((link) => {
    if (/^[a-z][a-z0-9+.-]*:|^#/iu.test(link)) return false;
    let decoded;
    try {
      decoded = decodeURIComponent(link.split("#")[0].split("?")[0]);
    } catch {
      return false;
    }
    if (decoded.startsWith("/") || decoded.includes("\\")) return false;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(fromPage), decoded));
    return isSafeRepositoryPath(target) && target === targetPage;
  });
}

export function validateOptionalGuideText(challenge, route, contents) {
  const errors = [];
  const parts = parseMarkdownProse(contents).sections;
  if (
    JSON.stringify(parts.map(({ title }) => title)) !== JSON.stringify(OPTIONAL_GUIDE_HEADINGS) ||
    parts.some(({ body }) => body.trim().length === 0)
  ) {
    addError(
      errors,
      "OPTIONAL_PAGE_HEADINGS",
      `${route.page} must contain non-empty guide sections in contract order`,
    );
  }
  const body = (title) => parts.find((part) => part.title === title)?.body ?? "";
  if (
    !body("Guide scope").includes("OPTIONAL_GUIDE_ONLY") ||
    !body("Guide scope").includes(LIVE_STATUS) ||
    !linksTo(parts.find(({ title }) => title === "Guide scope")?.links ?? [], route.page, challenge.page)
  ) {
    addError(
      errors,
      "OPTIONAL_PAGE_SCOPE",
      `${route.page} must label OPTIONAL_GUIDE_ONLY / ${LIVE_STATUS} and link back to the core page`,
    );
  }
  if (
    !body("Permissions / Safety").includes(OPTIONAL_SAFETY_NOTICE) ||
    !body("Evidence / Non-claims").includes(OPTIONAL_EVIDENCE_NOTICE)
  ) {
    addError(errors, "OPTIONAL_PAGE_SAFETY", `${route.page} is missing required safety/non-claim explanations`);
  }
  const requiredText = [
    ["Prerequisites", [...route.prerequisites.environment, ...route.prerequisites.entitlements]],
    ["Permissions / Safety", route.prerequisites.additionalApprovals],
    ["Runtime capabilities", route.runtimeRequirements.flatMap(({ capability, status, reason }) => [capability, status, reason])],
    ["Stop / Block", route.stopReasons],
  ];
  for (const [heading, values] of requiredText) {
    if (values.some((value) => !body(heading).includes(value))) {
      addError(
        errors,
        "OPTIONAL_PAGE_METADATA",
        `${route.page} must explain the catalog metadata in ${heading}`,
      );
    }
  }
  return errors;
}

export async function validateOptionalRoutePage(challenge, route, coreContents) {
  const errors = validateOptionalRoutes(challenge);
  if (errors.length > 0) return errors;
  const expectedCore = `challenges/${challenge.id.toLowerCase()}/README.md`;
  if (challenge.page !== expectedCore) {
    return [{ code: "PAGE_CATALOG_PATH", message: `${challenge.id} page must be ${expectedCore}` }];
  }
  if (!challenge.optionalRoutes.includes(route)) {
    return [{ code: "OPTIONAL_ROUTE_UNREGISTERED", message: `${challenge.id} has no such registered guide` }];
  }
  try {
    const core = coreContents ?? await readRepositoryFile(challenge.page);
    if (!linksTo(parseMarkdownProse(core).links, challenge.page, route.page)) {
      addError(errors, "OPTIONAL_PAGE_UNLINKED", `${challenge.page} must link to ${route.page} in prose`);
    }
    const contents = await readRepositoryFile(route.page);
    errors.push(...validateOptionalGuideText(challenge, route, contents));
  } catch (error) {
    addError(
      errors,
      error.code === "MODULE_NOT_FOUND" ? "GUIDE_PARSER_UNAVAILABLE"
        : error.code === "ENOENT" ? "OPTIONAL_PAGE_MISSING" : "OPTIONAL_PAGE_UNSAFE",
      `${route.page} could not be validated: ${error.message}${error.code === "MODULE_NOT_FOUND" ? "; install authoring dependencies with npm ci" : ""}`,
    );
  }
  return errors;
}

export async function validatePublishedPages(catalog) {
  const errors = [];

  for (const challenge of getPublishedChallenges(catalog)) {
    const expectedPage = `challenges/${challenge.id.toLowerCase()}/README.md`;
    if (challenge.page !== expectedPage) {
      addError(
        errors,
        "PAGE_CATALOG_PATH",
        `${challenge.id} page must be ${expectedPage}`,
      );
      continue;
    }

    try {
      const contents = await readRepositoryFile(challenge.page);
      errors.push(...validateChallengePageText(challenge.id, contents));
      if (challenge.sourceKind === "synthetic") {
        const starter = parseMarkdownProse(contents).sections.find(({ title }) => title === "Starter Kit");
        if (!starter?.body.includes(SYNTHETIC_MATERIAL_LABEL)) {
          addError(
            errors,
            "PAGE_SYNTHETIC_LABEL",
            `${challenge.id} Starter Kit must explicitly label ${SYNTHETIC_MATERIAL_LABEL}`,
          );
        }
      } else {
        for (const sourcePath of challenge.sourcePaths) {
          if (!contents.includes(sourcePath)) {
            addError(errors, "PAGE_SOURCE_PATH", `${challenge.id} must describe baseline source path ${sourcePath}`);
          }
        }
      }
      for (const route of challenge.optionalRoutes) {
        errors.push(...await validateOptionalRoutePage(challenge, route, contents));
      }
    } catch (error) {
      addError(
        errors,
        error.code === "MODULE_NOT_FOUND" ? "GUIDE_PARSER_UNAVAILABLE"
          : error.code === "ENOENT" ? "PAGE_MISSING" : "PAGE_UNSAFE",
        `${challenge.id} page could not be validated: ${error.message}${error.code === "MODULE_NOT_FOUND" ? "; install authoring dependencies with npm ci" : ""}`,
      );
    }
  }

  return errors;
}
