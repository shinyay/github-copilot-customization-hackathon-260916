import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadCatalog } from "../scripts/lib/catalog.mjs";
import { readJson, REPOSITORY_ROOT, sha256, stableJson, writeText } from "../scripts/lib/fs-utils.mjs";
import {
  OPTIONAL_EVIDENCE_NOTICE,
  OPTIONAL_SAFETY_NOTICE,
} from "../scripts/lib/optional-routes.mjs";

export function assertCliExit(result, status) {
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.signal, null, `CLI terminated by ${result.signal}`);
  assert.equal(Number.isInteger(result.status), true, "CLI must actually exit");
  assert.equal(result.status, status, result.stderr || result.stdout);
}

export function runCli(root, script, args = []) {
  return spawnSync(process.execPath, [path.join(root, "scripts", script), ...args], {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, NODE_PATH: path.join(REPOSITORY_ROOT, "node_modules") },
  });
}

export function issueFormWithIds(contents, ids) {
  const pattern = /(^    id: challenge_id\r?\n[\s\S]*?^      options:\r?\n)((?:        - HC-\d{3}\r?\n)+)/mu;
  const match = contents.match(pattern);
  assert.ok(match, "fixture must patch the existing dropdown, not generate the Form");
  return contents.replace(pattern, `${match[1]}${ids.map((id) => `        - ${id}\n`).join("")}`);
}

export function optionalRoute(challengeId, id = "design-readiness", runtimeRequirements = []) {
  return {
    id,
    title: "Isolated optional guide fixture",
    page: `challenges/${challengeId.toLowerCase()}/optional/${id}.md`,
    required: false,
    prerequisites: {
      environment: ["Use a disposable workspace without activating external services."],
      entitlements: ["Confirm account access independently; the Hub does not inspect it."],
      additionalApprovals: ["Obtain explicit owner approval before any separately authorized live action."],
    },
    runtimeRequirements,
    liveStatus: "live-unobserved",
    stopReasons: ["Stop if an approval is missing or a Runtime capability is blocked."],
  };
}

export function optionalGuide(route) {
  return `# ${route.title}

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved. This isolated toy guide does not launch anything.
Return to the [core challenge](../README.md); optional work is never a prerequisite.

## Prerequisites

${[...route.prerequisites.environment, ...route.prerequisites.entitlements].join("\n\n") || "Environment and entitlements remain not-checked."}

## Permissions / Safety

${OPTIONAL_SAFETY_NOTICE}
${route.prerequisites.additionalApprovals.join("\n\n") || "Approvals remain not-checked."}
Do not bypass a missing approval or change account, organization or repository permissions.

## Runtime capabilities

${route.runtimeRequirements.map(({ capability, status, reason }) => `${capability}: ${status}. ${reason}`).join("\n\n") || "No Runtime capabilities have been checked. No live execution is provided."}

## Stop / Block

${route.stopReasons.join("\n\n")}
Leave optional work unperformed rather than editing run.json, spoofing branchSafe or expanding an allowlist.

## Evidence / Non-claims

${OPTIONAL_EVIDENCE_NOTICE}
Keep guide notes and any independently approved live receipts separate from core evidence.
Runtime runtimeBehavior and educationalEffect remain not-observed.
`;
}

function corePage(challenge) {
  return `# ${challenge.id}: ${challenge.title}

## Challenge Story

This is an isolated synthetic validator fixture, not new participant content.

## この機能とは

The fixture exercises publication wiring without requiring a product feature.

## 向いていること / 向いていないこと

Use it only to check Hub contracts, never to infer product behavior.

## Starter Kit

SYNTHETIC_TRAINING_ONLY. One inert evidence template; no invented Java source.
The immutable Runtime baseline/provenance remains in place.

## Open Question

Can the same complete contract flow through every publication surface?

## Design Time

Record a design before comparing the two toy conditions.

## Build

In the Runtime checkout, keep allowedMutations and allowedAdditions empty.
The Hub checkout is not an execution workspace.

## Compare

Baseline and Customized share fixed synthetic input and separate Runtime repositories.

## Evidence

Evidence belongs to .hackathon/evidence run-state, not allowedAdditions.
Static checks cannot observe runtimeBehavior or educationalEffect.

## Submit

Use the common Issue Form and Runtime PR; leave optional work unperformed.

## Judging

Accept equal, worse, incomparable, blocked and unsupported as well as improved.

## Bonus Mission

None; this fixture creates no Bonus challenge.

## Support / Fallback

Stop on unsupported capabilities; do not bypass permissions.
${challenge.optionalRoutes.map((route) => `[${route.title}](optional/${route.id}.md)`).join("\n")}
`;
}

export async function createPublicationFixture(t, publishedIds, routesById = new Map()) {
  const root = await mkdtemp(path.join(os.tmpdir(), "hc-publication-"));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  const fixturePath = (...parts) => path.join(root, ...parts);
  await Promise.all([
    ".github", "catalog", "docs", "fixtures", "schemas", "scripts", "README.md", "CONTRIBUTING.md",
  ].map((entry) => cp(path.join(REPOSITORY_ROOT, entry), fixturePath(entry), { recursive: true })));

  assert.equal(new Set(publishedIds).size, publishedIds.length);
  const catalog = await loadCatalog();
  const seed = await readJson(path.join(REPOSITORY_ROOT, "challenges", "hc-001", "pack", "manifest.json"));
  catalog.challenges = catalog.challenges.map(({ id, title, track, sourceLab }) => {
    const challenge = { id, title, track, status: "planned", sourceLab };
    if (!publishedIds.includes(id)) return challenge;
    return {
      ...challenge,
      status: "published",
      sourceKind: "synthetic",
      sourcePaths: [],
      optionalRoutes: routesById.get(id) ?? [],
      challengeVersion: 1,
      page: `challenges/${id.toLowerCase()}/README.md`,
      pack: `challenges/${id.toLowerCase()}/pack`,
      feature: "Isolated publication fixture",
      support: { primary: "Synthetic design comparison", fallback: "Report a block honestly" },
      isolation: { tier: seed.isolation.tier, conditionStrategy: seed.isolation.conditionStrategy },
    };
  });
  for (const challenge of catalog.challenges.filter(({ status }) => status === "published")) {
    const conditions = ["baseline", "customized"];
    const evidence = "# Isolated fixture\n\n## Outcome\n\nnot-observed\n";
    const evidencePath = `.hackathon/evidence/${challenge.id.toLowerCase()}/comparison.md`;
    const manifest = {
      ...structuredClone(seed),
      challengeId: challenge.id,
      challengeVersion: 1,
      conditions,
      allowedMutations: [],
      allowedAdditions: [],
      overlay: [{
        source: "payload/comparison.md.template",
        destination: `.hackathon/challenge/${challenge.id.toLowerCase()}/comparison.md.template`,
        conditions,
        allowOverwrite: false,
      }],
      evidenceRequirements: [{
        path: evidencePath,
        conditions,
        stage: "submitted",
        requiredHeadings: ["Outcome"],
        templateSha256: sha256(evidence),
      }],
      submissionFiles: [{ pattern: evidencePath, conditions }],
    };
    await writeText(fixturePath(...challenge.page.split("/")), corePage(challenge));
    await writeText(fixturePath(...challenge.pack.split("/"), "manifest.json"), stableJson(manifest));
    await writeText(fixturePath(...challenge.pack.split("/"), "payload", "comparison.md.template"), evidence);
    for (const route of challenge.optionalRoutes) {
      await writeText(fixturePath(...route.page.split("/")), optionalGuide(route));
    }
  }
  const catalogPath = fixturePath("catalog", "challenges.json");
  const writeCatalog = () => writeText(catalogPath, stableJson(catalog));
  await writeCatalog();
  const formPath = fixturePath(".github", "ISSUE_TEMPLATE", "challenge-result.yml");
  const form = await readFile(formPath, "utf8");
  await writeText(formPath, issueFormWithIds(form, [...publishedIds].sort()));
  assertCliExit(runCli(root, "render-docs.mjs", ["--write"]), 0);
  assertCliExit(runCli(root, "build-pack.mjs", ["--write-hashes"]), 0);
  return { root, catalog, path: fixturePath, writeCatalog, formPath };
}
