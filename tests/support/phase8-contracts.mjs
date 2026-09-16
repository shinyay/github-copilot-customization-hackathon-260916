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
} from "./phase7-contracts.mjs";

const evidence = [
  "Fixed task",
  "Environment",
  "Baseline",
  "Designed policy",
  "Comparison",
  "Outcome",
  "Evidence boundaries",
];

const specs = {
  "HC-042": {
    conditions: ["baseline", "diagnosis-policy"],
    taskCount: 7,
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["credentials", "firewall", "content-exclusion"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "reference-notes.md.template",
      "readiness.json.template",
      "packet-set.json.template",
      "starter/diagnostic-policy.md.template",
      "starter/route-map.md.template",
      "starter/decisions.md.template",
      "evidence/comparison.md.template",
    ],
    additions: [
      "participant/hc-042/diagnostic-policy.md",
      "participant/hc-042/route-map.md",
      "participant/hc-042/decisions.md",
    ],
    evidence,
    runs: [
      ["baseline", "hc042-baseline-01"],
      ["diagnosis-policy", "hc042-policy-01"],
    ],
  },
  "HC-043": {
    conditions: ["baseline", "automation-policy"],
    taskCount: 5,
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["event-trigger"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "reference-notes.md.template",
      "readiness.json.template",
      "automation-packet.json.template",
      "event-sequence.json.template",
      "starter/automation-design.md.template",
      "starter/event-ledger.md.template",
      "starter/stop-plan.md.template",
      "evidence/comparison.md.template",
    ],
    additions: [
      "participant/hc-043/automation-design.md",
      "participant/hc-043/event-ledger.md",
      "participant/hc-043/stop-plan.md",
    ],
    evidence,
    runs: [
      ["baseline", "hc043-baseline-01"],
      ["automation-policy", "hc043-policy-01"],
    ],
  },
  "HC-044": {
    conditions: ["baseline", "approval-policy"],
    taskCount: 7,
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["approvals"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "reference-notes.md.template",
      "readiness.json.template",
      "policy-snapshot.json.template",
      "review-events.json.template",
      "starter/approval-policy.md.template",
      "starter/decision-ledger.md.template",
      "starter/escalation-plan.md.template",
      "evidence/comparison.md.template",
    ],
    additions: [
      "participant/hc-044/approval-policy.md",
      "participant/hc-044/decision-ledger.md",
      "participant/hc-044/escalation-plan.md",
    ],
    evidence,
    runs: [
      ["baseline", "hc044-baseline-01"],
      ["approval-policy", "hc044-policy-01"],
    ],
  },
  "HC-045": {
    conditions: ["baseline", "handoff-policy"],
    taskCount: 6,
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java",
      "wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java",
    ],
    routes: ["cloud-handoff"],
    payloads: [
      "brief.md.template",
      "request.txt.template",
      "reference-notes.md.template",
      "readiness.json.template",
      "candidate-diffs.json.template",
      "finding-packet.json.template",
      "handoff-events.json.template",
      "starter/handoff-policy.md.template",
      "starter/request-draft.txt.template",
      "starter/validation-plan.md.template",
      "evidence/comparison.md.template",
    ],
    additions: [
      "participant/hc-045/handoff-policy.md",
      "participant/hc-045/request-draft.txt",
      "participant/hc-045/validation-plan.md",
    ],
    evidence,
    runs: [
      ["baseline", "hc045-baseline-01"],
      ["handoff-policy", "hc045-policy-01"],
    ],
  },
};

export const PHASE8_SPECS = Object.freeze(specs);
export const PHASE8_IDS = Object.keys(PHASE8_SPECS);

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
  return `.hackathon/challenge/${id.toLowerCase()}/starter/${file}`;
}

export async function assertPhase8Pack(id) {
  const spec = PHASE8_SPECS[id];
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
      [...spec.additions].sort(),
    );
    assert.deepEqual(
      patternsFor(manifest.submissionFiles, condition),
      [...spec.additions, evidencePath].sort(),
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
      team: "phase8-fixture",
      runId: `${id.toLowerCase()}-${condition}-fixture`,
    });
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.condition, condition);
    assert.equal(plan.filesToInject.length, spec.payloads.length);
    assert.deepEqual(plan.participantChanges.allowedMutations, []);
    assert.deepEqual(
      plan.participantChanges.allowedAdditions.map(({ pattern }) => pattern).sort(),
      [...spec.additions].sort(),
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

export async function assertPhase8PageAndGuides(id) {
  const spec = PHASE8_SPECS[id];
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

export async function readPayloadText(id, file) {
  return readFile(payloadFor(id, file), "utf8");
}

export {
  fail,
  markdownRows,
  roundTripBuffer,
  roundTripJson,
};
