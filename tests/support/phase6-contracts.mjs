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
} from "./phase5-contracts.mjs";

const all = (conditions, patterns) =>
  Object.fromEntries(conditions.map((condition) => [condition, patterns]));

const specs = {
  "HC-032": {
    conditions: ["baseline", "role-profile", "manual-equivalent"],
    tasks: ["approval-trace"],
    comparisonCells: 3,
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java",
    ],
    routes: ["cloud-profile"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "packets.json.template",
      "evidence/comparison.md.template",
      "control.agent.md.template",
      "evidence.agent.md.template",
      "manual-body.md.template",
      "handoff.md.template",
      "tools-ledger.md.template",
    ],
    participant: [
      "participant/hc-032/design.md.template",
      "participant/hc-032/control.agent.md.template",
      "participant/hc-032/evidence.agent.md.template",
      "participant/hc-032/manual-body.md.template",
      "participant/hc-032/handoff.md.template",
      "participant/hc-032/tools-ledger.md.template",
    ],
    evidence: [
      "Fixed task",
      "Environment",
      "Design",
      "Comparison",
      "Observations",
      "Outcome",
      "Limits",
      "Profile and tools",
    ],
  },
  "HC-033": {
    conditions: ["baseline", "skill-package", "manual-equivalent"],
    tasks: ["replay-plan", "journal-boundary"],
    comparisonCells: 6,
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRowService.java",
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRunService.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
    ],
    routes: ["cloud-skill", "review-skill"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "packets.json.template",
      "evidence/comparison.md.template",
      "SKILL.md.template",
      "checklist.md.template",
      "manual-bundle.md.template",
      "resource-ledger.md.template",
    ],
    participant: [
      "participant/hc-033/design.md.template",
      "participant/hc-033/SKILL.md.template",
      "participant/hc-033/checklist.md.template",
      "participant/hc-033/manual-bundle.md.template",
      "participant/hc-033/resource-ledger.md.template",
    ],
    evidence: [
      "Fixed task",
      "Environment",
      "Design",
      "Comparison",
      "Observations",
      "Outcome",
      "Limits",
      "Skill and resources",
    ],
  },
  "HC-034": {
    conditions: ["baseline", "mcp-retrieval", "manual-equivalent"],
    tasks: ["retrieval-plan", "retrieval-diagnosis"],
    comparisonCells: 6,
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
    ],
    routes: ["cloud-mcp", "review-mcp"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "packets.json.template",
      "evidence/comparison.md.template",
      "mcp.json.template",
      "operations-note.json.template",
      "manual-note.json.template",
      "retrieval-contract.md.template",
    ],
    participant: [
      "participant/hc-034/design.md.template",
      "participant/hc-034/mcp.json.template",
      "participant/hc-034/manual-note.json.template",
      "participant/hc-034/retrieval-contract.md.template",
    ],
    evidence: [
      "Fixed task",
      "Environment",
      "Design",
      "Comparison",
      "Observations",
      "Outcome",
      "Limits",
      "Retrieval and support",
    ],
  },
  "HC-035": {
    conditions: ["baseline", "preinstalled-plan"],
    tasks: ["prepare-plan", "setup-diagnosis"],
    comparisonCells: 4,
    sourceKind: "baseline",
    sourcePaths: ["pom.xml"],
    routes: ["cloud-setup", "review-setup", "postgres-readiness"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "packets.json.template",
      "evidence/comparison.md.template",
      "instructions.md.template",
      "copilot-setup-steps.yml.template",
      "responsibility.md.template",
      "failure-handoff.md.template",
    ],
    participant: [
      "participant/hc-035/design.md.template",
      "participant/hc-035/instructions.md.template",
      "participant/hc-035/copilot-setup-steps.yml.template",
      "participant/hc-035/responsibility.md.template",
      "participant/hc-035/failure-handoff.md.template",
    ],
    evidence: [
      "Fixed task",
      "Environment",
      "Design",
      "Comparison",
      "Observations",
      "Outcome",
      "Limits",
      "Setup and constraints",
    ],
  },
  "HC-036": {
    conditions: ["baseline", "basic-request", "draft-request", "push-request"],
    tasks: ["new-open", "first-ready", "still-draft", "new-push", "manual-rereview"],
    comparisonCells: 20,
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["review-triggers"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "design.md.template",
      "packets.json.template",
      "evidence/comparison.md.template",
      "policy.md.template",
      "event-matrix.md.template",
      "correlation.md.template",
    ],
    participant: [
      "participant/hc-036/design.md.template",
      "participant/hc-036/policy.md.template",
      "participant/hc-036/event-matrix.md.template",
      "participant/hc-036/correlation.md.template",
    ],
    evidence: [
      "Fixed task",
      "Environment",
      "Design",
      "Comparison",
      "Observations",
      "Outcome",
      "Limits",
      "Events and heads",
    ],
  },
};

for (const spec of Object.values(specs)) {
  spec.additions = all(spec.conditions, spec.participant);
}

export const PHASE6_SPECS = Object.freeze(specs);
export const PHASE6_IDS = Object.keys(PHASE6_SPECS);

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

export async function assertPhase6Pack(id) {
  const spec = PHASE6_SPECS[id];
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
    assert.equal(
      overlay.destination,
      `.hackathon/challenge/${id.toLowerCase()}/starter/${file}`,
    );
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

  for (const condition of spec.conditions) {
    const plan = buildRunPlan(catalog, manifest, {
      challengeId: id,
      condition,
      team: "phase6-fixture",
      runId: `${id.toLowerCase()}-${condition}-fixture`,
    });
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.condition, condition);
    assert.equal(plan.filesToInject.length, spec.payloads.length);
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.deepEqual(
      plan.participantChanges.allowedAdditions.map(({ pattern }) => pattern).sort(),
      [...spec.participant].sort(),
    );
    assert.deepEqual(plan.runStateEvidence, [requirement]);
    assert.ok(
      plan.filesToInject.every(
        ({ allowOverwrite, ownership }) =>
          allowOverwrite === false && ownership === "pack-applied",
      ),
    );
  }
  return { catalog, entry, manifest, files };
}

export async function assertPhase6PageAndGuides(id) {
  const spec = PHASE6_SPECS[id];
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

export async function readPayloadJson(id, file = "packets.json.template") {
  return JSON.parse(await readFile(payloadFor(id, file), "utf8"));
}

export {
  fail,
  markdownRows,
  roundTripBuffer,
  roundTripJson,
};
