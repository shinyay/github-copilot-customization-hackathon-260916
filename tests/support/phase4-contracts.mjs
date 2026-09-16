import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { loadCatalog } from "../../scripts/lib/catalog.mjs";
import { REQUIRED_CHALLENGE_HEADINGS } from "../../scripts/lib/constants.mjs";
import { readJson, REPOSITORY_ROOT, sha256 } from "../../scripts/lib/fs-utils.mjs";
import { validateOptionalRoutes } from "../../scripts/lib/optional-routes.mjs";
import {
  validateChallengePageText,
  validateOptionalRoutePage,
} from "../../scripts/lib/pages.mjs";
import { validatePackDirectory } from "../../scripts/lib/packs.mjs";
import { buildRunPlan } from "../../scripts/lib/run-plan.mjs";

export const EVIDENCE_HEADINGS = [
  "Fixed task",
  "Environment",
  "Condition",
  "Materials",
  "Observations",
  "Design rationale",
  "Comparison set",
  "Outcome",
  "Limits",
];

const all = (conditions, files, id) =>
  Object.fromEntries(conditions.map((condition) => [
    condition,
    files.map((file) => `participant/${id.toLowerCase()}/${file}`),
  ]));

const payloadMap = (files) =>
  Object.fromEntries(files.map((file) => [file, `starter/${file}`]));

const hc023Payloads = [
  "brief.json.template",
  "mechanisms.json.template",
  "checklist.md.template",
  "evidence-note.txt.template",
  "operations-note.json.template",
  "review-role.md.template",
  "answers.md.template",
  "review.md.template",
  "evidence/comparison.md.template",
  ...Array.from({ length: 10 }, (_, index) =>
    `cases/case-${String(index + 1).padStart(2, "0")}.json.template`),
  ...Array.from({ length: 10 }, (_, index) =>
    `requests/case-${String(index + 1).padStart(2, "0")}.txt.template`),
  "package/v1/plugin.json.template",
  "package/v1/skills/order-import-evidence/SKILL.md.template",
  "package/v2/plugin.json.template",
  "package/v2/skills/order-import-evidence/SKILL.md.template",
  "scope-paths.json.template",
  "resource-permission.md.template",
  "harness-boundaries.md.template",
  "fixed-review-packet.md.template",
];

export const PHASE4_SPECS = Object.freeze({
  "HC-021": {
    conditions: ["baseline", "inert", "misplaced", "valid", "manual", "duplicate", "conflict"],
    sourceKind: "synthetic",
    sourcePaths: [],
    routes: [],
    payloads: payloadMap([
      "brief.md.template",
      "request.txt.template",
      "packet.txt.template",
      "rules.md.template",
      "variant-a.instructions.md.template",
      "variant-b.instructions.md.template",
      "case-plan.json.template",
      "design.md.template",
      "evidence/comparison.md.template",
    ]),
    additions: {
      baseline: [
        "participant/hc-021/display.txt",
        "participant/hc-021/design.md",
        "participant/hc-021/repair-plan.md",
      ],
      inert: [
        "participant/hc-021/display.txt",
        "participant/hc-021/design.md",
        "participant/hc-021/repair-plan.md",
        ".github/copilot-instructions.md.template",
      ],
      misplaced: [
        "participant/hc-021/display.txt",
        "participant/hc-021/design.md",
        "participant/hc-021/repair-plan.md",
        "notes/copilot-instructions.md",
      ],
      valid: [
        "participant/hc-021/display.txt",
        "participant/hc-021/design.md",
        "participant/hc-021/repair-plan.md",
        ".github/copilot-instructions.md",
      ],
      manual: [
        "participant/hc-021/display.txt",
        "participant/hc-021/design.md",
        "participant/hc-021/repair-plan.md",
      ],
      duplicate: [
        "participant/hc-021/display.txt",
        "participant/hc-021/design.md",
        "participant/hc-021/repair-plan.md",
        ".github/copilot-instructions.md",
        ".github/instructions/hc021-display.instructions.md",
      ],
      conflict: [
        "participant/hc-021/display.txt",
        "participant/hc-021/design.md",
        "participant/hc-021/repair-plan.md",
        ".github/copilot-instructions.md",
        ".github/instructions/hc021-display.instructions.md",
      ],
    },
  },
  "HC-022": {
    conditions: ["baseline", "imperative"],
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
    ],
    routes: [],
    payloads: payloadMap([
      "brief.md.template",
      "request.txt.template",
      "note.normal.md.template",
      "note.imperative.md.template",
      "provenance.json.template",
      "response.marker-absent.txt.template",
      "response.marker-present.txt.template",
      "response.quoted-marker.txt.template",
      "policy.md.template",
      "evidence/comparison.md.template",
    ]),
    additions: all(
      ["baseline", "imperative"],
      ["handling-policy.md", "authority-map.md", "assessment.md"],
      "HC-022",
    ),
  },
  "HC-023": {
    conditions: ["baseline", "checklist"],
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
      "wholesale-core/src/main/resources/application-context.xml",
      "wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java",
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/OrderStates.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java",
    ],
    routes: [],
    payloads: payloadMap(hc023Payloads),
    additions: all(["baseline", "checklist"], ["answers.md", "review.md"], "HC-023"),
  },
  "HC-024": {
    conditions: ["baseline", "instructions", "skill", "both"],
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java",
      "wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java",
      "wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java",
    ],
    routes: ["ablation-preparation", "hook-chain-preparation"],
    payloads: payloadMap([
      "brief.md.template",
      "request.txt.template",
      "source-packet.json.template",
      "operations-note.json.template",
      "instructions-skeleton.md.template",
      "skill-skeleton.md.template",
      "design.md.template",
      "matrix.md.template",
      "evidence/comparison.md.template",
    ]),
    additions: {
      baseline: [
        "participant/hc-024/design.md",
        "participant/hc-024/frozen-instructions.md.template",
        "participant/hc-024/frozen-skill.md.template",
        "participant/hc-024/operations-note.json",
        "participant/hc-024/answer.md",
      ],
      instructions: [
        "participant/hc-024/design.md",
        "participant/hc-024/frozen-instructions.md.template",
        "participant/hc-024/frozen-skill.md.template",
        "participant/hc-024/operations-note.json",
        "participant/hc-024/answer.md",
        ".github/copilot-instructions.md",
      ],
      skill: [
        "participant/hc-024/design.md",
        "participant/hc-024/frozen-instructions.md.template",
        "participant/hc-024/frozen-skill.md.template",
        "participant/hc-024/operations-note.json",
        "participant/hc-024/answer.md",
        ".github/skills/hc024-replay/SKILL.md",
      ],
      both: [
        "participant/hc-024/design.md",
        "participant/hc-024/frozen-instructions.md.template",
        "participant/hc-024/frozen-skill.md.template",
        "participant/hc-024/operations-note.json",
        "participant/hc-024/answer.md",
        ".github/copilot-instructions.md",
        ".github/skills/hc024-replay/SKILL.md",
      ],
    },
  },
  "HC-025": {
    conditions: ["baseline", "host"],
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java",
      "wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
    ],
    routes: ["local-host-probes", "other-clients"],
    payloads: payloadMap([
      "brief.md.template",
      "request.txt.template",
      "packet.json.template",
      "kit/hc025-packet/SKILL.md.template",
      "kit/hc025-packet.prompt.md.template",
      "kit/plugin/com.github.copilot/agents/hc025-reader.agent.md.template",
      "kit/plugin/plugin.json.template",
      "kit/plugin/mcp.json.template",
      "invalid/prompt-fields-in-skill.md.template",
      "invalid/agents-at-plugin-root.json.template",
      "permissions.json.template",
      "source-boundaries.md.template",
      "diagnosis.md.template",
      "evidence/comparison.md.template",
    ]),
    additions: all(
      ["baseline", "host"],
      [
        "diagnosis.md",
        "portability-plan.md",
        "common-body.md.template",
        "skill-draft.md.template",
        "prompt-draft.md.template",
        "agent-draft.md.template",
        "plugin-draft.json.template",
      ],
      "HC-025",
    ),
  },
});

export const PHASE4_IDS = Object.keys(PHASE4_SPECS);

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

export async function assertPhase4Pack(id) {
  const spec = PHASE4_SPECS[id];
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
    ["manifest.json", ...Object.keys(spec.payloads).map((file) => `payload/${file}`)].sort(),
  );
  assert.equal(manifest.overlay.length, Object.keys(spec.payloads).length);
  assert.deepEqual(
    Object.fromEntries(manifest.overlay.map(({ source, destination }) => [
      source.slice("payload/".length),
      destination.slice(`.hackathon/challenge/${id.toLowerCase()}/`.length),
    ])),
    spec.payloads,
  );
  for (const overlay of manifest.overlay) {
    assert.deepEqual(overlay.conditions, spec.conditions);
    assert.equal(overlay.allowOverwrite, false);
    assert.match(overlay.source, /^payload\/.+\.template$/u);
    assert.match(
      overlay.destination,
      new RegExp(`^\\.hackathon/challenge/${id.toLowerCase()}/starter/.+\\.template$`, "u"),
    );
  }
  for (const file of files) {
    const bytes = await readFile(path.join(packFor(id), ...file.split("/")));
    assert.equal(bytes.includes(13), false, `${id}/${file}: LF only`);
    assert.equal(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false);
    assert.equal(bytes.at(-1), 10, `${id}/${file}: final LF`);
  }
  assert.equal(manifest.evidenceRequirements.length, 1);
  const requirement = manifest.evidenceRequirements[0];
  const evidencePath = `.hackathon/evidence/${id.toLowerCase()}/comparison.md`;
  assert.equal(requirement.path, evidencePath);
  assert.deepEqual(requirement.conditions, spec.conditions);
  assert.equal(requirement.stage, "submitted");
  assert.deepEqual(requirement.requiredHeadings, EVIDENCE_HEADINGS);
  const evidenceBytes = await readFile(payloadFor(id, "evidence/comparison.md.template"));
  assert.equal(requirement.templateSha256, sha256(evidenceBytes));
  assert.deepEqual(
    [...evidenceBytes.toString("utf8").matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    EVIDENCE_HEADINGS,
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
      team: "phase4-fixture",
      runId: `${id.toLowerCase()}-${condition}-fixture`,
    });
    assert.equal(plan.mode, "dry-run");
    assert.equal(plan.condition, condition);
    assert.equal(plan.filesToInject.length, Object.keys(spec.payloads).length);
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

export async function assertPhase4PageAndGuides(id) {
  const spec = PHASE4_SPECS[id];
  const catalog = await loadCatalog();
  const entry = catalog.challenges.find(({ id: challengeId }) => challengeId === id);
  const page = await readFile(path.join(rootFor(id), "README.md"));
  const text = page.toString("utf8");
  assert.deepEqual(
    [...text.matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    REQUIRED_CHALLENGE_HEADINGS,
  );
  assert.deepEqual(validateChallengePageText(id, text), []);
  assert.doesNotMatch(text, /Integration pending|integration-pending/u);
  assert.deepEqual(validateOptionalRoutes(entry), []);
  const optionalRoot = path.join(rootFor(id), "optional");
  if (spec.routes.length === 0) {
    await assert.rejects(stat(optionalRoot), { code: "ENOENT" });
  } else {
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
      ]) {
        assert.equal(Object.hasOwn(optionalPlan, field), false, `${id}/${route.id}: no ${field}`);
      }
    }
  }
  return { entry, page, text };
}

export async function readManifest(id) {
  return readJson(path.join(packFor(id), "manifest.json"));
}
