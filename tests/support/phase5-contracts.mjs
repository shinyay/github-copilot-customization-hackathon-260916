import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
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

const all = (conditions, files, id) =>
  Object.fromEntries(conditions.map((condition) => [
    condition,
    files.map((file) => `participant/${id.toLowerCase()}/${file}`),
  ]));

export const PHASE5_SPECS = Object.freeze({
  "HC-026": {
    conditions: ["baseline", "governed-design"],
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["rollout-readiness"],
    payloads: [
      "brief.md.template",
      "request.md.template",
      "design.md.template",
      "comparison.md.template",
      "asset-register.json.template",
      "policy.md.template",
      "scenario-records.json.template",
      "versions/v1/analysis-rules.md.template",
      "versions/v2/analysis-rules.md.template",
      "versions/v1/analysis-package/plugin.json.template",
      "versions/v1/analysis-package/skills/order-import-evidence/SKILL.md.template",
      "versions/v2/analysis-package/plugin.json.template",
      "versions/v2/analysis-package/skills/order-import-evidence/SKILL.md.template",
    ],
    additions: {
      baseline: [
        "participant/hc-026/asset-audit.md",
        "participant/hc-026/restore-plan.md",
      ],
      "governed-design": [
        "participant/hc-026/asset-audit.md",
        "participant/hc-026/restore-plan.md",
        "participant/hc-026/rollout-policy.md",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Asset coverage",
      "Baseline",
      "Governed design",
      "Restore",
      "Outcome",
    ],
  },
  "HC-027": {
    conditions: ["baseline", "customized", "manual-equivalent"],
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["evaluation-readiness"],
    payloads: [
      "brief.md.template",
      "request.md.template",
      "design.md.template",
      "comparison.md.template",
      "primary-request.md.template",
      "primary-packet.txt.template",
      "transfer-request.md.template",
      "transfer-packet.txt.template",
      "schedule.md.template",
      "rules-draft.md.template",
      "synthetic-trials.md.template",
      "regression-toy.md.template",
    ],
    additions: {
      ...all(
        ["baseline", "customized", "manual-equivalent"],
        ["evaluation-plan.md", "schedule.md", "trials.md", "regression-policy.md"],
        "HC-027",
      ),
      customized: [
        "participant/hc-027/evaluation-plan.md",
        "participant/hc-027/schedule.md",
        "participant/hc-027/trials.md",
        "participant/hc-027/regression-policy.md",
        "participant/hc-027/rules-body.md.template",
      ],
      "manual-equivalent": [
        "participant/hc-027/evaluation-plan.md",
        "participant/hc-027/schedule.md",
        "participant/hc-027/trials.md",
        "participant/hc-027/regression-policy.md",
        "participant/hc-027/rules-body.md.template",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Preregistered plan",
      "Trial coverage",
      "Baseline",
      "Customized",
      "Manual-equivalent",
      "Missing and failures",
      "Outcome",
    ],
  },
  "HC-028": {
    conditions: ["baseline", "revision-audit"],
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: ["review-attribution"],
    payloads: [
      "brief.md.template",
      "request.md.template",
      "design.md.template",
      "comparison.md.template",
      "ref-register.md.template",
      "refs/base-rules.md.template",
      "refs/head-rules.md.template",
      "refs/default-rules.md.template",
      "refs/starting-rules.md.template",
      "task.diff.template",
      "config.diff.template",
      "attribution-records.md.template",
      "product-rules.md.template",
    ],
    additions: {
      baseline: [
        "participant/hc-028/revision-ledger.md",
        "participant/hc-028/diff-separation.md",
      ],
      "revision-audit": [
        "participant/hc-028/revision-ledger.md",
        "participant/hc-028/diff-separation.md",
        "participant/hc-028/audit-method.md",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Stored revisions",
      "Documented rules",
      "Observed attribution",
      "Diff separation",
      "Outcome",
    ],
  },
  "HC-029": {
    conditions: ["baseline", "customized", "manual-equivalent"],
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java",
      "wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java",
      "pom.xml",
    ],
    routes: ["cloud-test-proposal"],
    payloads: [
      "brief.md.template",
      "request.md.template",
      "design.md.template",
      "comparison.md.template",
      "source-map.md.template",
      "compatibility-checklist.md.template",
      "rules-draft.md.template",
      "proposal-guide.md.template",
    ],
    additions: {
      baseline: [
        "participant/hc-029/request.md",
        "participant/hc-029/proposed-change.diff.template",
        "participant/hc-029/compatibility-review.md",
      ],
      customized: [
        "participant/hc-029/request.md",
        "participant/hc-029/proposed-change.diff.template",
        "participant/hc-029/compatibility-review.md",
        "participant/hc-029/repository-rules.md.template",
      ],
      "manual-equivalent": [
        "participant/hc-029/request.md",
        "participant/hc-029/proposed-change.diff.template",
        "participant/hc-029/compatibility-review.md",
        "participant/hc-029/repository-rules.md.template",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Baseline",
      "Customized",
      "Manual-equivalent",
      "Compatibility",
      "Proposal boundary",
      "Outcome",
    ],
  },
  "HC-031": {
    conditions: ["baseline", "scoped-design", "manual-equivalent"],
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
      "wholesale-core/src/main/resources/application-context.xml",
      "wholesale-core/src/main/resources/spring/module-operations.xml",
      "wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java",
    ],
    routes: ["cloud-scope-observation", "review-scope-observation"],
    payloads: [
      "brief.md.template",
      "request.md.template",
      "design.md.template",
      "comparison.md.template",
      "source-map.md.template",
      "java-rules-draft.md.template",
      "xml-rules-draft.md.template",
      "scope-matrix.md.template",
      "product-matrix.md.template",
      "delivery-plan.md.template",
    ],
    additions: {
      baseline: [
        "participant/hc-031/scope-matrix.md",
        "participant/hc-031/product-matrix.md",
        "participant/hc-031/delivery-plan.md",
      ],
      "scoped-design": [
        "participant/hc-031/scope-matrix.md",
        "participant/hc-031/product-matrix.md",
        "participant/hc-031/delivery-plan.md",
        "participant/hc-031/java-rules.md.template",
        "participant/hc-031/xml-rules.md.template",
      ],
      "manual-equivalent": [
        "participant/hc-031/scope-matrix.md",
        "participant/hc-031/product-matrix.md",
        "participant/hc-031/delivery-plan.md",
        "participant/hc-031/java-rules.md.template",
        "participant/hc-031/xml-rules.md.template",
      ],
    },
    evidence: [
      "Fixed task",
      "Environment",
      "Baseline",
      "Scoped design",
      "Manual-equivalent",
      "Scope coverage",
      "Product coverage",
      "Outcome",
    ],
  },
});

export const PHASE5_IDS = Object.keys(PHASE5_SPECS);

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

export function fail(code, message = code) {
  throw Object.assign(new Error(message), { code });
}

export function markdownRows(bytes) {
  return bytes.toString("utf8").split("\n")
    .filter((line) => line.startsWith("|") && !/^\|[-:| ]+\|$/u.test(line))
    .slice(1)
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
}

export function roundTripBuffer(original, check, mutate, inspect, code) {
  let current = Buffer.from(original);
  check(current);
  current = mutate(Buffer.from(current));
  assert.equal(current.equals(original), false, "mutation changes bytes");
  inspect(current);
  assert.throws(() => check(current), { code });
  current = Buffer.from(original);
  assert.ok(current.equals(original), "restore exact original bytes");
  check(current);
}

export function roundTripJson(original, check, mutate, inspect, code) {
  const bytes = Buffer.isBuffer(original)
    ? Buffer.from(original)
    : Buffer.from(JSON.stringify(original));
  const base = JSON.parse(bytes.toString("utf8"));
  check(base);
  const changed = structuredClone(base);
  mutate(changed);
  inspect(changed);
  assert.throws(() => check(changed), { code });
  assert.deepEqual(JSON.parse(bytes.toString("utf8")), base);
  check(JSON.parse(bytes.toString("utf8")));
}

export async function assertPhase5Pack(id) {
  const spec = PHASE5_SPECS[id];
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
  const overlays = Object.fromEntries(manifest.overlay.map((item) => [item.source, item]));
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
    assert.equal(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false);
    assert.equal(bytes.at(-1), 10, `${id}/${file}: final LF`);
  }

  const evidencePath = `.hackathon/evidence/${id.toLowerCase()}/comparison.md`;
  assert.equal(manifest.evidenceRequirements.length, 1);
  const requirement = manifest.evidenceRequirements[0];
  assert.equal(requirement.path, evidencePath);
  assert.deepEqual(requirement.conditions, spec.conditions);
  assert.equal(requirement.stage, "submitted");
  assert.deepEqual(requirement.requiredHeadings, spec.evidence);
  const evidenceBytes = await readFile(payloadFor(id, "comparison.md.template"));
  assert.equal(requirement.templateSha256, sha256(evidenceBytes));
  assert.deepEqual(
    [...evidenceBytes.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    spec.evidence,
  );
  assert.equal(manifest.allowedAdditions.some(({ pattern }) => pattern === evidencePath), false);
  for (const condition of spec.conditions) {
    assert.deepEqual(patternsFor(manifest.allowedAdditions, condition), [...spec.additions[condition]].sort());
    assert.deepEqual(
      patternsFor(manifest.submissionFiles, condition),
      [...spec.additions[condition], evidencePath].sort(),
    );
  }

  const catalog = await loadCatalog();
  const entry = catalog.challenges.find(({ id: challengeId }) => challengeId === id);
  assert.equal(entry.status, "published");
  assert.equal(entry.sourceKind, spec.sourceKind);
  assert.deepEqual(entry.sourcePaths, spec.sourcePaths);
  assert.equal(entry.page, `challenges/${id.toLowerCase()}/README.md`);
  assert.equal(entry.pack, `challenges/${id.toLowerCase()}/pack`);
  assert.equal(entry.challengeVersion, 1);
  assert.deepEqual(entry.optionalRoutes.map(({ id: routeId }) => routeId), spec.routes);

  for (const condition of spec.conditions) {
    const plan = buildRunPlan(catalog, manifest, {
      challengeId: id,
      condition,
      team: "phase5-fixture",
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
    assert.ok(plan.filesToInject.every(({ allowOverwrite, ownership }) =>
      allowOverwrite === false && ownership === "pack-applied"));
  }
  return { catalog, entry, manifest, files };
}

export async function assertPhase5PageAndGuides(id) {
  const spec = PHASE5_SPECS[id];
  const catalog = await loadCatalog();
  const entry = catalog.challenges.find(({ id: challengeId }) => challengeId === id);
  const page = await readFile(path.join(rootFor(id), "README.md"));
  const text = page.toString("utf8");
  assert.deepEqual(
    [...text.matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    REQUIRED_CHALLENGE_HEADINGS,
  );
  assert.deepEqual(validateChallengePageText(id, text), []);
  assert.deepEqual(validateOptionalRoutes(entry), []);
  const optionalRoot = path.join(rootFor(id), "optional");
  const guideFiles = (await readdir(optionalRoot)).sort();
  assert.deepEqual(guideFiles, spec.routes.map((route) => `${route}.md`).sort());
  for (const route of entry.optionalRoutes) {
    assert.deepEqual(await validateOptionalRoutePage(entry, route, text), []);
    const optionalPlan = buildRunPlan(catalog, null, { challengeId: id, route: route.id });
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
    ]) assert.equal(Object.hasOwn(optionalPlan, field), false, `${id}/${route.id}: no ${field}`);
  }
  return { entry, page, text };
}

export async function readManifest(id) {
  return JSON.parse(await readFile(path.join(packFor(id), "manifest.json"), "utf8"));
}

export async function assertOptionalDirectory(id) {
  const root = path.join(rootFor(id), "optional");
  await stat(root);
  return readdir(root);
}
