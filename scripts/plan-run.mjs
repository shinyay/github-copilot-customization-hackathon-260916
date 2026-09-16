#!/usr/bin/env node
import { getPublishedChallenges, loadCatalog, validateCatalog } from "./lib/catalog.mjs";
import {
  assertOnlyArguments,
  parseNamedArguments,
  requireArguments,
} from "./lib/cli.mjs";
import { stableJson } from "./lib/fs-utils.mjs";
import { buildRunPlan } from "./lib/run-plan.mjs";
import { validateOptionalRoutePage } from "./lib/pages.mjs";
import {
  getPackDirectory,
  validatePackDirectory,
} from "./lib/packs.mjs";

try {
  const args = parseNamedArguments(process.argv.slice(2), {
    booleanNames: ["dry-run"],
  });
  assertOnlyArguments(args, [
    "dry-run",
    "challenge",
    "condition",
    "team",
    "run",
    "route",
  ]);
  requireArguments(args, ["dry-run", "challenge"]);
  const route = args.route ?? "core";
  if (route === "core") {
    requireArguments(args, ["condition", "team", "run"]);
  }

  const catalog = await loadCatalog();
  const errors = validateCatalog(catalog);
  if (errors.length > 0) {
    throw new Error(
      `Catalog validation failed: ${errors.map(({ code }) => code).join(", ")}`,
    );
  }

  const challengeId = args.challenge.toUpperCase();
  const challenge = getPublishedChallenges(catalog).find(({ id }) => id === challengeId);
  if (!challenge) {
    throw new Error(`Published challenge not found: ${challengeId}`);
  }
  let manifest;
  if (route === "core") {
    const packValidation = await validatePackDirectory(
      getPackDirectory(challenge),
      challengeId,
    );
    if (packValidation.errors.length > 0) {
      throw new Error(
        `Pack validation failed: ${packValidation.errors
          .map(({ code }) => code)
          .join(", ")}`,
      );
    }
    manifest = packValidation.manifest;
  }

  const plan = buildRunPlan(catalog, manifest, {
    challengeId,
    condition: args.condition,
    team: args.team,
    runId: args.run,
    route,
  });
  if (plan.mode === "optional-guide") {
    const pageErrors = await validateOptionalRoutePage(
      challenge,
      challenge.optionalRoutes.find(({ id }) => id === route),
    );
    if (pageErrors.length > 0) {
      throw new Error(
        `Optional guide validation failed: ${pageErrors.map(({ code, message }) => `${code}: ${message}`).join("; ")}`,
      );
    }
  }
  process.stdout.write(stableJson(plan));
  if (plan.mode === "optional-guide" && plan.readiness.status === "blocked") {
    console.error(
      `OPTIONAL_ROUTE_BLOCKED: ${challengeId}/${route}: ${plan.runtimeRequirements
        .filter(({ status }) => status === "blocked")
        .map(({ capability, reason }) => `${capability}: ${reason}`)
        .join("; ")}`,
    );
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
