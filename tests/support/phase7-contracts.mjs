import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadCatalog } from "../../scripts/lib/catalog.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../../scripts/lib/constants.mjs";
import { REPOSITORY_ROOT, sha256 } from "../../scripts/lib/fs-utils.mjs";
import { validateOptionalRoutes } from "../../scripts/lib/optional-routes.mjs";
import {
  validateChallengePageText,
  validateOptionalRoutePage,
} from "../../scripts/lib/pages.mjs";
import { validatePackDirectory } from "../../scripts/lib/packs.mjs";
import { buildRunPlan } from "../../scripts/lib/run-plan.mjs";
import {
  fail,
  markdownRows,
  roundTripBuffer,
  roundTripJson,
} from "./phase6-contracts.mjs";

const specs = {
  "HC-037": {
    conditions: ["baseline", "balanced-plan"],
    comparisonCells: 4,
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java",
      "wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java",
    ],
    routes: ["review-effort-live"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "evidence/comparison.md.template",
      "input/candidate-01.diff.template",
      "input/candidate-02.diff.template",
      "input/controls.json.template",
      "input/rules.md.template",
      "input/source-map.md.template",
    ],
    additions: {
      baseline: [
        "participant/hc-037/evaluation-plan.md.template",
        "participant/hc-037/review-request.md.template",
      ],
      "balanced-plan": [
        "participant/hc-037/evaluation-plan.md.template",
        "participant/hc-037/review-request.md.template",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Condition and input",
      "Design",
      "Comparison",
      "Outcome",
      "Limitations",
      "Effort controls",
      "Candidate coverage",
      "Supported findings and false positives",
      "Missing observations and burden",
    ],
    runs: [
      ["baseline", "lite-plan-01"],
      ["balanced-plan", "balanced-plan-01"],
    ],
  },
  "HC-038": {
    conditions: ["baseline", "hook-design"],
    comparisonCells: 24,
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["session-start-live", "pre-tool-live"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "evidence/comparison.md.template",
      "input/events.json.template",
      "input/checker.sh.template",
      "input/hook-contract.md.template",
      "input/hooks-session-start.json.template",
      "input/hooks-pre-tool.json.template",
    ],
    additions: {
      baseline: ["participant/hc-038/diagnosis-policy.md.template"],
      "hook-design": [
        "participant/hc-038/diagnosis-policy.md.template",
        "participant/hc-038/hooks-session-start.json.template",
        "participant/hc-038/hooks-pre-tool.json.template",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Condition and input",
      "Design",
      "Comparison",
      "Outcome",
      "Limitations",
      "Event and checker",
      "Failure matrix",
      "Stop and recovery",
    ],
    runs: [
      ["baseline", "manual-check-01"],
      ["hook-design", "hook-design-01"],
    ],
  },
  "HC-039": {
    conditions: ["baseline", "governed-design"],
    comparisonCells: 24,
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["org-instructions-live", "shared-profiles-live"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "evidence/comparison.md.template",
      "input/ownership.json.template",
      "input/current-policy.md.template",
      "input/shared-rules.md.template",
      "input/profile.agent.md.template",
      "input/mechanism-map.md.template",
    ],
    additions: {
      baseline: ["participant/hc-039/governance-plan.md.template"],
      "governed-design": [
        "participant/hc-039/governance-plan.md.template",
        "participant/hc-039/shared-rules.md.template",
        "participant/hc-039/profile.agent.md.template",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Condition and input",
      "Design",
      "Comparison",
      "Outcome",
      "Limitations",
      "Ownership and scope",
      "Precedence and revision",
      "Change responsibility",
    ],
    runs: [
      ["baseline", "governance-baseline-01"],
      ["governed-design", "governance-design-01"],
    ],
  },
  "HC-040": {
    conditions: ["baseline", "plugin-package"],
    comparisonCells: 8,
    lifecycleRows: 6,
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
      "wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderCsvTest.java",
    ],
    routes: ["plugin-lifecycle-live"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "evidence/comparison.md.template",
      "input/SKILL.md.template",
      "input/plugin.json.template",
      "input/plugin-settings.json.template",
      "input/source-map.md.template",
      "input/lifecycle.md.template",
    ],
    additions: {
      baseline: [
        "participant/hc-040/distribution-plan.md.template",
        "participant/hc-040/manual/v1/SKILL.md.template",
        "participant/hc-040/manual/v2/SKILL.md.template",
      ],
      "plugin-package": [
        "participant/hc-040/distribution-plan.md.template",
        "participant/hc-040/package/v1/plugin.json.template",
        "participant/hc-040/package/v1/skills/training-order-evidence/SKILL.md.template",
        "participant/hc-040/package/v2/plugin.json.template",
        "participant/hc-040/package/v2/skills/training-order-evidence/SKILL.md.template",
        "participant/hc-040/plugin-settings.json.template",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Condition and input",
      "Design",
      "Comparison",
      "Outcome",
      "Limitations",
      "Skill byte identity",
      "Component inventory",
      "Version and restoration",
    ],
    runs: [
      ["baseline", "manual-distribution-01"],
      ["plugin-package", "package-design-01"],
    ],
  },
  "HC-041": {
    conditions: ["baseline", "revalidation-policy"],
    comparisonCells: 24,
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["memory-reuse-live"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "evidence/comparison.md.template",
      "input/fact-cards.json.template",
      "input/repo-a-current.md.template",
      "input/repo-a-previous.md.template",
      "input/repo-b-current.md.template",
      "input/current-policy.md.template",
      "input/memory-scope.md.template",
    ],
    additions: {
      baseline: ["participant/hc-041/retention-policy.md.template"],
      "revalidation-policy": [
        "participant/hc-041/retention-policy.md.template",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Condition and input",
      "Design",
      "Comparison",
      "Outcome",
      "Limitations",
      "Citation audit",
      "Scope and eligibility",
      "Retention and revalidation",
    ],
    runs: [
      ["baseline", "fact-audit-01"],
      ["revalidation-policy", "revalidation-01"],
    ],
  },
};

export const PHASE7_SPECS = Object.freeze(specs);
export const PHASE7_IDS = Object.keys(PHASE7_SPECS);

export const rootFor = (id) =>
  path.join(REPOSITORY_ROOT, "challenges", id.toLowerCase());
export const packFor = (id) => path.join(rootFor(id), "pack");
export const payloadFor = (id, file) =>
  path.join(packFor(id), "payload", ...file.split("/"));

export const patternsFor = (entries, condition) =>
  entries
    .filter(({ conditions }) => conditions.includes(condition))
    .map(({ pattern }) => pattern)
    .sort();

function destinationFor(id, file) {
  if (file === "evidence/comparison.md.template") {
    return `.hackathon/challenge/${id.toLowerCase()}/starter/comparison.md.template`;
  }
  return `.hackathon/challenge/${id.toLowerCase()}/starter/${file}`;
}

export async function assertPhase7Pack(id) {
  const spec = PHASE7_SPECS[id];
  const { errors, manifest, files } = await validatePackDirectory(packFor(id), id);
  assert.deepEqual(errors, [], id);
  assert.deepEqual(manifest.conditions, spec.conditions);
  assert.deepEqual(manifest.allowedMutations, []);
  assert.deepEqual(manifest.forbiddenActiveCustomizations, []);
  assert.deepEqual(manifest.isolation, {
    tier: "repository",
    freshWorkspace: true,
    freshConversation: true,
    freshProfile: true,
    freshRepository: true,
    conditionStrategy: "separate-repository",
    branchSafe: false,
  });
  assert.deepEqual(
    files.sort(),
    ["manifest.json", ...spec.payloads.map((file) => `payload/${file}`)].sort(),
  );
  assert.equal(manifest.overlay.length, spec.payloads.length);
  const overlays = Object.fromEntries(
    manifest.overlay.map((item) => [item.source, item]),
  );
  for (const file of spec.payloads) {
    const source = `payload/${file}`;
    const overlay = overlays[source];
    assert.ok(overlay, `${id}: ${source}`);
    assert.equal(overlay.destination, destinationFor(id, file));
    assert.deepEqual(overlay.conditions, spec.conditions);
    assert.equal(overlay.allowOverwrite, false);
  }
  for (const file of files) {
    const bytes = await readFile(path.join(packFor(id), ...file.split("/")));
    assert.equal(bytes.includes(13), false, `${id}/${file}: LF only`);
    assert.equal(
      bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
      false,
      `${id}/${file}: no BOM`,
    );
    assert.equal(bytes.at(-1), 10, `${id}/${file}: final LF`);
  }

  const evidencePath = `.hackathon/evidence/${id.toLowerCase()}/comparison.md`;
  assert.equal(manifest.evidenceRequirements.length, 1);
  const requirement = manifest.evidenceRequirements[0];
  assert.equal(requirement.path, evidencePath);
  assert.deepEqual(requirement.conditions, spec.conditions);
  assert.equal(requirement.stage, "submitted");
  assert.deepEqual(requirement.requiredHeadings, spec.evidence);
  const evidenceBytes = await readFile(
    payloadFor(id, "evidence/comparison.md.template"),
  );
  assert.equal(requirement.templateSha256, sha256(evidenceBytes));
  assert.deepEqual(
    [...evidenceBytes.toString("utf8").matchAll(/^## (.+)$/gmu)].map(
      (match) => match[1],
    ),
    spec.evidence,
  );
  assert.equal(
    manifest.allowedAdditions.some(({ pattern }) => pattern === evidencePath),
    false,
  );
  for (const condition of spec.conditions) {
    assert.deepEqual(
      patternsFor(manifest.allowedAdditions, condition),
      [...spec.additions[condition]].sort(),
    );
    assert.deepEqual(
      patternsFor(manifest.submissionFiles, condition),
      [...spec.additions[condition], evidencePath].sort(),
    );
  }

  const catalog = await loadCatalog();
  const entry = catalog.challenges.find(
    ({ id: challengeId }) => challengeId === id,
  );
  assert.equal(entry.status, "published");
  assert.equal(entry.sourceKind, spec.sourceKind);
  assert.deepEqual(entry.sourcePaths, spec.sourcePaths);
  assert.equal(entry.page, `challenges/${id.toLowerCase()}/README.md`);
  assert.equal(entry.pack, `challenges/${id.toLowerCase()}/pack`);
  assert.equal(entry.challengeVersion, 1);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id: routeId }) => routeId),
    spec.routes,
  );

  const plans = {};
  for (const condition of spec.conditions) {
    const plan = buildRunPlan(catalog, manifest, {
      challengeId: id,
      condition,
      team: "phase7-fixture",
      runId: `${id.toLowerCase()}-${condition}-fixture`,
    });
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.condition, condition);
    assert.equal(plan.filesToInject.length, spec.payloads.length);
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.deepEqual(
      plan.participantChanges.allowedAdditions.map(({ pattern }) => pattern).sort(),
      [...spec.additions[condition]].sort(),
    );
    assert.deepEqual(plan.runStateEvidence, [requirement]);
    assert.ok(
      plan.filesToInject.every(
        ({ allowOverwrite, ownership }) =>
          allowOverwrite === false && ownership === "pack-applied",
      ),
    );
    plans[condition] = plan;
  }
  return { catalog, entry, manifest, files, plans };
}

export async function assertPhase7PageAndGuides(id) {
  const spec = PHASE7_SPECS[id];
  const catalog = await loadCatalog();
  const entry = catalog.challenges.find(
    ({ id: challengeId }) => challengeId === id,
  );
  const page = await readFile(path.join(rootFor(id), "README.md"));
  const text = page.toString("utf8");
  assert.deepEqual(
    [...text.matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    REQUIRED_CHALLENGE_HEADINGS,
  );
  assert.deepEqual(validateChallengePageText(id, text), []);
  assert.deepEqual(validateOptionalRoutes(entry), []);
  const guideFiles = (await readdir(path.join(rootFor(id), "optional"))).sort();
  assert.deepEqual(
    guideFiles,
    spec.routes.map((route) => `${route}.md`).sort(),
  );
  for (const route of entry.optionalRoutes) {
    assert.deepEqual(await validateOptionalRoutePage(entry, route, text), []);
    const optionalPlan = buildRunPlan(catalog, null, {
      challengeId: id,
      route: route.id,
    });
    assert.equal(optionalPlan.mode, "optional-guide");
    assert.equal(optionalPlan.liveStatus, "live-unobserved");
    assert.equal(optionalPlan.route.required, false);
    for (const field of [
      "condition",
      "template",
      "filesToInject",
      "participantChanges",
      "runStateEvidence",
      "proposedRepositoryName",
    ]) {
      assert.equal(
        Object.hasOwn(optionalPlan, field),
        false,
        `${id}/${route.id}: no ${field}`,
      );
    }
  }
  return { entry, page, text };
}

export async function readPayloadJson(id, file) {
  return JSON.parse(await readFile(payloadFor(id, file), "utf8"));
}

export {
  fail,
  markdownRows,
  roundTripBuffer,
  roundTripJson,
};
