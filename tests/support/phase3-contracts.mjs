import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
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
  "Design",
  "Run log",
  "Comparison",
  "Outcome",
  "Limits and cleanup",
];

const all = (conditions, names, id) =>
  Object.fromEntries(conditions.map((condition) => [
    condition,
    names.map((name) => `participant/${id.toLowerCase()}/${name}`),
  ]));

export const PHASE3_SPECS = Object.freeze({
  "HC-016": {
    conditions: ["baseline", "curated-design"],
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java",
    ],
    readmeSha256: "0b4fa83910cf7874321bc35e63f741cd10d1c673df87fa1d711b38b835ffbba1",
    routes: ["local-memory"],
    payloads: {
      "brief.md.template": "brief.md.template",
      "request.txt.template": "request.txt.template",
      "design.md.template": "starter/design.md.template",
      "evidence/comparison.md.template": "starter/comparison.md.template",
      "source-map.md.template": "materials/source-map.md.template",
      "memory-fact.txt.template": "materials/memory-fact.txt.template",
      "cards.md.template": "materials/cards.md.template",
      "card-review.md.template": "starter/card-review.md.template",
      "handoff.txt.template": "starter/handoff.txt.template",
    },
    additions: all(
      ["baseline", "curated-design"],
      ["design.md", "card-review.md", "handoff.txt.template"],
      "HC-016",
    ),
  },
  "HC-017": {
    conditions: ["baseline", "model-alternate", "effort-reference", "effort-alternate"],
    sourceKind: "baseline",
    sourcePaths: [
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Checks.java",
      "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/CreditService.java",
    ],
    readmeSha256: "fb25c496499c8b4b8060a68fd23c59e746b28ad027a274a1de6dbbb1c5d20397",
    routes: ["byok-provider", "utility-models", "host-byok"],
    payloads: {
      "brief.md.template": "brief.md.template",
      "request.txt.template": "request.txt.template",
      "design.md.template": "starter/design.md.template",
      "evidence/comparison.md.template": "starter/comparison.md.template",
      "model-input.txt.template": "materials/model-input.txt.template",
      "source-map.md.template": "materials/source-map.md.template",
      "follow-up.txt.template": "materials/follow-up.txt.template",
      "comparison-protocol.md.template": "materials/comparison-protocol.md.template",
      "controls.md.template": "starter/controls.md.template",
      "responses.md.template": "starter/responses.md.template",
    },
    additions: all(
      ["baseline", "model-alternate", "effort-reference", "effort-alternate"],
      ["design.md", "controls.md", "responses.md"],
      "HC-017",
    ),
  },
  "HC-018": {
    conditions: ["baseline", "boundary-review"],
    sourceKind: "synthetic",
    sourcePaths: [],
    readmeSha256: "22137bc6262039a580640af1d82811105b7a954634c37e63e9dc5e4547287029",
    routes: ["terminal-sandbox", "mcp-sandbox"],
    payloads: {
      "brief.md.template": "brief.md.template",
      "request.txt.template": "request.txt.template",
      "design.md.template": "starter/design.md.template",
      "evidence/comparison.md.template": "starter/comparison.md.template",
      "command.txt.template": "materials/command.txt.template",
      "events.md.template": "materials/events.md.template",
      "settings.json.template": "materials/settings.json.template",
      "boundary-map.md.template": "starter/boundary-map.md.template",
      "run-log.md.template": "starter/run-log.md.template",
    },
    additions: {
      baseline: [
        "participant/hc-018/design.md",
        "participant/hc-018/run-log.md",
      ],
      "boundary-review": [
        "participant/hc-018/design.md",
        "participant/hc-018/run-log.md",
        "participant/hc-018/boundary-map.md",
        "participant/hc-018/approval-policy.json.template",
      ],
    },
  },
  "HC-019": {
    conditions: ["baseline", "checklist-review"],
    sourceKind: "synthetic",
    sourcePaths: [],
    readmeSha256: "26730ee51d4cc1d5a2be67a6d845ddd79c1995ece8c7a12ab67b7bcd90f625bc",
    routes: [
      "customization-editor",
      "diagnostic-evaluation",
      "waza-readiness",
      "copy-migration",
    ],
    payloads: {
      "brief.md.template": "brief.md.template",
      "request.txt.template": "request.txt.template",
      "design.md.template": "starter/design.md.template",
      "evidence/comparison.md.template": "starter/comparison.md.template",
      "draft-p.txt.template": "materials/draft-p.txt.template",
      "inventory.json.template": "materials/inventory.json.template",
      "wrapper.txt.template": "materials/wrapper.txt.template",
      "checklist.md.template": "starter/checklist.md.template",
      "repair.md.template": "starter/repair.md.template",
    },
    additions: {
      baseline: [
        "participant/hc-019/design.md",
        "participant/hc-019/review.md",
      ],
      "checklist-review": [
        "participant/hc-019/design.md",
        "participant/hc-019/review.md",
        "participant/hc-019/checklist.md",
        "participant/hc-019/repaired.instructions.md.template",
      ],
    },
  },
  "HC-020": {
    conditions: ["baseline", "tool-contract"],
    sourceKind: "synthetic",
    sourcePaths: [],
    readmeSha256: "badf0b3c00d720c5a506372ce3f4afc30bf9c299cbd87fa85503e2ca2f024e74",
    routes: ["extension-tool-host", "chat-participant-host"],
    payloads: {
      "brief.md.template": "brief.md.template",
      "request.txt.template": "request.txt.template",
      "design.md.template": "starter/design.md.template",
      "evidence/comparison.md.template": "starter/comparison.md.template",
      "analyzer.cjs.template": "materials/analyzer.cjs.template",
      "counter-draft.txt.template": "materials/counter-draft.txt.template",
      "extension.cjs.template": "reference/extension.cjs.template",
      "package.json.template": "reference/package.json.template",
      "counts.md.template": "starter/counts.md.template",
      "input-contract.md.template": "starter/input-contract.md.template",
    },
    additions: {
      baseline: [
        "participant/hc-020/design.md",
        "participant/hc-020/counts.md",
        "participant/hc-020/counter-input.txt.template",
      ],
      "tool-contract": [
        "participant/hc-020/design.md",
        "participant/hc-020/counts.md",
        "participant/hc-020/counter-input.txt.template",
        "participant/hc-020/input-contract.md",
        "participant/hc-020/extension.cjs.template",
        "participant/hc-020/package.json.template",
      ],
    },
  },
});

export const PHASE3_IDS = Object.keys(PHASE3_SPECS);

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
  const originalBytes = Buffer.isBuffer(original)
    ? Buffer.from(original)
    : Buffer.from(JSON.stringify(original));
  const base = JSON.parse(originalBytes.toString("utf8"));
  check(base);
  const changed = structuredClone(base);
  mutate(changed);
  inspect(changed);
  assert.throws(() => check(changed), { code });
  assert.deepEqual(JSON.parse(originalBytes.toString("utf8")), base);
  check(JSON.parse(originalBytes.toString("utf8")));
}

export async function assertPhase3Pack(id) {
  const spec = PHASE3_SPECS[id];
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
      new RegExp(`^\\.hackathon/challenge/${id.toLowerCase()}/.+\\.template$`, "u"),
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
      team: "phase3-fixture",
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

export async function assertPhase3PageAndGuides(id) {
  const spec = PHASE3_SPECS[id];
  const catalog = await loadCatalog();
  const entry = catalog.challenges.find(({ id: challengeId }) => challengeId === id);
  const page = await readFile(path.join(rootFor(id), "README.md"));
  const normalizedPage = Buffer.from(page.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
  assert.equal(sha256(normalizedPage), spec.readmeSha256, `${id}: accepted Stage A README blob bytes`);
  const text = normalizedPage.toString("utf8");
  assert.deepEqual(
    [...text.matchAll(/^## (.+)$/gmu)].map((match) => match[1]),
    REQUIRED_CHALLENGE_HEADINGS,
  );
  assert.deepEqual(validateChallengePageText(id, text), []);
  assert.deepEqual(validateOptionalRoutes(entry), []);
  const guideFiles = (await readdir(path.join(rootFor(id), "optional"))).sort();
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
  return { entry, page, text };
}

export async function assertRawMaterial(id, file, bytes, hash) {
  const value = await readFile(payloadFor(id, file));
  assert.equal(value.length, bytes, `${id}/${file}: bytes`);
  assert.equal(sha256(value), hash, `${id}/${file}: hash`);
  return value;
}

export async function readManifest(id) {
  return readJson(path.join(packFor(id), "manifest.json"));
}
