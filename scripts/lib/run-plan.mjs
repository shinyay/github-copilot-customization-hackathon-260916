import {
  MINIMUM_TEMPLATE_VERSION,
  PATH_OWNERSHIP,
  RUN_PLAN_SCHEMA_VERSION,
  RUNTIME_TEMPLATE_REPOSITORY,
} from "./constants.mjs";
import { getChallenge } from "./catalog.mjs";
import { sha256 } from "./fs-utils.mjs";
import { optionalRuntimeStatus, validateOptionalRoutes } from "./optional-routes.mjs";

function slug(value, label) {
  const result = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  if (result.length === 0) {
    throw new Error(`${label} must include at least one ASCII letter or number`);
  }
  return result;
}

export function buildProposedRepositoryName(challengeId, team, runId) {
  const teamSlug = slug(team, "team");
  const runSlug = slug(runId, "run");
  const candidate = `copilot-${challengeId.toLowerCase()}-${teamSlug}-${runSlug}`;
  if (candidate.length <= 100) {
    return candidate;
  }

  const suffix = sha256(candidate).slice(0, 12);
  const prefix = `copilot-${challengeId.toLowerCase()}-`;
  const available = 100 - prefix.length - 1 - suffix.length;
  const combined = `${teamSlug}-${runSlug}`;
  const truncated = combined.slice(0, available).replace(/-+$/u, "");
  if (truncated.length === 0) {
    throw new Error("team and run produce an invalid repository name");
  }
  return `${prefix}${truncated}-${suffix}`;
}

export function buildRunPlan(
  catalog,
  manifest,
  { challengeId, condition, team, runId, route = "core" },
) {
  const challenge = getChallenge(catalog, challengeId);
  if (!challenge) {
    throw new Error(`Unknown challenge: ${challengeId}`);
  }
  if (challenge.status !== "published") {
    throw new Error(`Challenge is not published: ${challengeId}`);
  }
  if (route !== "core") {
    const errors = validateOptionalRoutes(challenge);
    if (errors.length > 0) {
      throw new Error(`Optional route validation failed: ${errors.map(({ code }) => code).join(", ")}`);
    }
    const optionalRoute = challenge.optionalRoutes.find(({ id }) => id === route);
    if (!optionalRoute) {
      throw new Error(`Unknown route for ${challengeId}: ${route}`);
    }
    for (const [name, value] of [["condition", condition], ["team", team], ["run", runId]]) {
      if (value !== undefined) {
        throw new Error(`Optional guide route ${route} cannot be combined with --${name}`);
      }
    }
    const runtimeStatus = optionalRuntimeStatus(optionalRoute);
    return {
      schemaVersion: RUN_PLAN_SCHEMA_VERSION,
      mode: "optional-guide",
      challenge: {
        id: challenge.id,
        title: challenge.title,
        version: challenge.challengeVersion,
      },
      route: {
        id: optionalRoute.id,
        title: optionalRoute.title,
        page: optionalRoute.page,
        required: false,
      },
      prerequisites: optionalRoute.prerequisites,
      runtimeRequirements: optionalRoute.runtimeRequirements,
      readiness: {
        status: runtimeStatus,
        environment: "not-checked",
        entitlements: "not-checked",
        additionalApprovals: "not-checked",
        runtimeCapabilities: runtimeStatus,
      },
      liveStatus: optionalRoute.liveStatus,
      stopReasons: optionalRoute.stopReasons,
    };
  }
  if (manifest.challengeId !== challengeId) {
    throw new Error(
      `Pack manifest ${manifest.challengeId} does not match ${challengeId}`,
    );
  }
  if (!manifest.conditions.includes(condition)) {
    throw new Error(
      `Unknown condition for ${challengeId}: ${condition}. Expected one of ${manifest.conditions.join(", ")}`,
    );
  }

  const proposedRepositoryName = buildProposedRepositoryName(
    challengeId,
    team,
    runId,
  );

  return {
    schemaVersion: RUN_PLAN_SCHEMA_VERSION,
    mode: "dry-run",
    challenge: {
      id: challenge.id,
      title: challenge.title,
      version: challenge.challengeVersion,
    },
    condition,
    proposedRepositoryName,
    template: {
      repository: RUNTIME_TEMPLATE_REPOSITORY,
      minimumVersion: MINIMUM_TEMPLATE_VERSION,
      versionMarker: ".hackathon/template.json",
    },
    isolation: {
      tier: manifest.isolation.tier,
      conditionStrategy: manifest.isolation.conditionStrategy,
      freshWorkspace: manifest.isolation.freshWorkspace,
      freshConversation: manifest.isolation.freshConversation,
      freshProfile: manifest.isolation.freshProfile,
      freshRepository: manifest.isolation.freshRepository,
    },
    filesToInject: manifest.overlay
      .filter((entry) => entry.conditions.includes(condition))
      .map((entry) => ({
        source: `${challenge.pack}/${entry.source}`,
        destination: entry.destination,
        ownership: "pack-applied",
        allowOverwrite: entry.allowOverwrite,
      })),
    participantChanges: {
      allowedMutations: manifest.allowedMutations.filter((entry) =>
        entry.conditions.includes(condition),
      ),
      allowedAdditions: manifest.allowedAdditions.filter((entry) =>
        entry.conditions.includes(condition),
      ),
      activeCustomizationsDefault: "deny",
    },
    runStateEvidence: manifest.evidenceRequirements.filter((entry) =>
      entry.conditions.includes(condition),
    ),
    pathOwnership: PATH_OWNERSHIP,
    postCreateSettings: {
      visibility: "private",
      defaultBranch: "main",
      existingDestinationPolicy: "deny",
      remoteCreation: "deferred",
    },
    expectedHubIssueMetadata: {
      challengeId: challenge.id,
      condition,
      conditionsCompared: manifest.conditions,
      participantTeam: team,
      runId,
      runtimeRepositoryUrl: "<required after repository creation>",
      pullRequestUrl: "<required for submission>",
      outcome:
        "improved|equal|worse|incomparable|blocked|unsupported",
    },
    cleanup: {
      advisory: manifest.cleanup.advisory,
      checks: [
        ["verifyBaseline", manifest.cleanup.verifyBaseline],
        ["exportSubmission", manifest.cleanup.exportSubmission],
        ["stopProcesses", manifest.cleanup.stopProcesses],
        ["archiveRepository", manifest.cleanup.archiveRepository],
      ].map(([name, required]) => ({
        name,
        required,
        verification: "not-observed",
      })),
    },
  };
}
