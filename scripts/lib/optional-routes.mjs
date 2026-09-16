import { isSafeRepositoryPath } from "./fs-utils.mjs";

export const ROUTE_ID_PATTERN = /^[a-z][a-z0-9-]{0,31}$/u;
export const LIVE_STATUS = "live-unobserved";
export const SYNTHETIC_MATERIAL_LABEL = "SYNTHETIC_TRAINING_ONLY";

export const OPTIONAL_GUIDE_HEADINGS = [
  "Guide scope",
  "Prerequisites",
  "Permissions / Safety",
  "Runtime capabilities",
  "Stop / Block",
  "Evidence / Non-claims",
];

export const OPTIONAL_SAFETY_NOTICE =
  "このガイドは権限を付与せず、実機実行を開始しません。";
export const OPTIONAL_EVIDENCE_NOTICE =
  "任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。";

export const RUNTIME_CAPABILITY_BLOCKERS = Object.freeze({
  "cross-branch-handoff":
    "Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported.",
  "tracked-vscode-settings":
    "Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings.",
});

const ROUTE_KEYS = [
  "id",
  "title",
  "page",
  "required",
  "prerequisites",
  "runtimeRequirements",
  "liveStatus",
  "stopReasons",
];
const PREREQUISITE_KEYS = ["environment", "entitlements", "additionalApprovals"];

export function hasExactKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function isText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isTextList(value, minimum = 0) {
  return (
    Array.isArray(value) &&
    value.length >= minimum &&
    value.every(isText) &&
    new Set(value).size === value.length
  );
}

export function validateOptionalRoutes(challenge) {
  const errors = [];
  const addError = (code, message) =>
    errors.push({ code, message: `${challenge.id}: ${message}` });

  if (!Array.isArray(challenge.optionalRoutes)) {
    addError("CATALOG_OPTIONAL_ROUTES", "optionalRoutes must be an array");
    return errors;
  }

  const ids = new Set();
  for (const route of challenge.optionalRoutes) {
    if (!hasExactKeys(route, ROUTE_KEYS)) {
      addError(
        "CATALOG_OPTIONAL_ROUTE_SHAPE",
        "optional routes must contain only guide/readiness metadata with all required fields",
      );
      continue;
    }
    if (
      typeof route.id !== "string" ||
      !ROUTE_ID_PATTERN.test(route.id) ||
      route.id === "core"
    ) {
      addError("CATALOG_OPTIONAL_ROUTE_ID", `invalid or reserved route id: ${route.id}`);
    }
    if (ids.has(route.id)) {
      addError("CATALOG_OPTIONAL_ROUTE_DUPLICATE", `duplicate route id: ${route.id}`);
    }
    ids.add(route.id);
    if (!isText(route.title) || route.required !== false || route.liveStatus !== LIVE_STATUS) {
      addError(
        "CATALOG_OPTIONAL_ROUTE_GUIDE",
        `${route.id} needs a title, required:false and liveStatus:${LIVE_STATUS}`,
      );
    }

    const expectedPage = `challenges/${challenge.id.toLowerCase()}/optional/${route.id}.md`;
    if (!isSafeRepositoryPath(route.page) || route.page !== expectedPage) {
      addError("CATALOG_OPTIONAL_ROUTE_PAGE", `${route.id} page must be ${expectedPage}`);
    }

    if (
      !hasExactKeys(route.prerequisites, PREREQUISITE_KEYS) ||
      PREREQUISITE_KEYS.some((key) => !isTextList(route.prerequisites[key]))
    ) {
      addError(
        "CATALOG_OPTIONAL_PREREQUISITES",
        `${route.id} must declare environment, entitlements and additionalApprovals text arrays`,
      );
    }
    if (!isTextList(route.stopReasons, 1)) {
      addError("CATALOG_OPTIONAL_STOP_REASONS", `${route.id} needs explicit stop reasons`);
    }
    if (!Array.isArray(route.runtimeRequirements)) {
      addError("CATALOG_OPTIONAL_RUNTIME", `${route.id} runtimeRequirements must be an array`);
      continue;
    }

    const capabilities = new Set();
    for (const requirement of route.runtimeRequirements) {
      if (
        !hasExactKeys(requirement, ["capability", "status", "reason"]) ||
        typeof requirement.capability !== "string" ||
        !ROUTE_ID_PATTERN.test(requirement.capability) ||
        !["blocked", "not-checked"].includes(requirement.status) ||
        !isText(requirement.reason)
      ) {
        addError(
          "CATALOG_OPTIONAL_RUNTIME",
          `${route.id} runtime requirements need a capability, blocked/not-checked status and reason`,
        );
        continue;
      }
      if (capabilities.has(requirement.capability)) {
        addError(
          "CATALOG_OPTIONAL_RUNTIME_DUPLICATE",
          `${route.id} duplicates capability ${requirement.capability}`,
        );
      }
      capabilities.add(requirement.capability);
      if (
        Object.hasOwn(RUNTIME_CAPABILITY_BLOCKERS, requirement.capability) &&
        requirement.status !== "blocked"
      ) {
        addError(
          "CATALOG_OPTIONAL_KNOWN_BLOCK",
          `${route.id}: ${RUNTIME_CAPABILITY_BLOCKERS[requirement.capability]}`,
        );
      }
    }
  }
  return errors;
}

export function optionalRuntimeStatus(route) {
  return route.runtimeRequirements.some(({ status }) => status === "blocked")
    ? "blocked"
    : "not-checked";
}
