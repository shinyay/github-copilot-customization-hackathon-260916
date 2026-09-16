import { createHash } from "node:crypto";

// Author-side structural checks, not a language server, client probe, or answer rubric.
export const CONDITIONS = Object.freeze(["baseline", "explicit-context", "manual-equivalent"]);
export const SOURCE_BASELINE = Object.freeze({
  repository: "shinyay/code-to-doc-workshop-260910",
  commit: "398d7d1982a1402bcdba00d6c3ded67d8d338787",
});
export const SOURCE_ORACLE = Object.freeze([
  Object.freeze({
    id: "A1",
    path: "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
    bytes: 29357,
    sha256: "a9586d7b43c4577d548180f4ea883ae522f7d97c78927f6a53e1bd48a382b072",
    lineCount: 521,
    anchorRanges: Object.freeze([Object.freeze([333, 349])]),
  }),
  Object.freeze({
    id: "A2",
    path: "wholesale-core/src/main/resources/application-context.xml",
    bytes: 5169,
    sha256: "ff96dd85980eb533693bd8df6111eead091796f3192645c50944db599d7d081c",
    lineCount: 90,
    anchorRanges: Object.freeze([Object.freeze([44, 53]), Object.freeze([82, 89])]),
  }),
  Object.freeze({
    id: "A3",
    path: "wholesale-core/src/main/resources/spring/module-operations.xml",
    bytes: 1405,
    sha256: "284d8e50c62a952aecfab1b3fab6877db5eebd9c5d674e2da40d1a6ef6359eb9",
    lineCount: 27,
    anchorRanges: Object.freeze([Object.freeze([10, 14])]),
  }),
]);
export const FULL_CONTEXT = Object.freeze(SOURCE_ORACLE.slice(0, 2));
export const MANUAL_PREAMBLE = "HC-015 MANUAL FULL-SOURCE v1\n";
export const PAYLOAD_FILES = Object.freeze([
  "brief.md.template", "request.txt.template", "source-materials.json.template",
  "design.md.template", "comparison.md.template", "recovery.md.template", "context.md.template",
  "source-targets.json.template", "context-plan.md.template", "query.json.template",
  "search-plan.json.template", "manual-input-layout.txt.template",
]);

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function requireThat(value, code, message) {
  if (!value) throw Object.assign(new Error(message), { code });
}

export function checkCoreManifest(manifest) {
  requireThat(
    manifest.challengeId === "HC-015" && manifest.schemaVersion === 1
      && manifest.challengeVersion === 1 && manifest.minimumTemplateVersion === 1
      && same(manifest.conditions, CONDITIONS),
    "HC015_MANIFEST_CONDITIONS", "Keep the v1 three-condition core contract.",
  );
  requireThat(
    manifest.isolation?.tier === "repository" && manifest.isolation.conditionStrategy === "separate-repository"
      && manifest.isolation.branchSafe === false
      && ["freshRepository", "freshWorkspace", "freshConversation", "freshProfile"]
        .every((key) => manifest.isolation[key] === true)
      && same(manifest.allowedMutations, []) && same(manifest.forbiddenActiveCustomizations, []),
    "HC015_MANIFEST_ISOLATION", "Core uses fresh separate repositories with no mutations or active additions.",
  );
  requireThat(
    Array.isArray(manifest.overlay) && manifest.overlay.length === PAYLOAD_FILES.length
      && PAYLOAD_FILES.every((file) => manifest.overlay.some((entry) =>
        entry.source === `payload/${file}` && entry.destination === `.hackathon/challenge/hc-015/${file}`
        && entry.allowOverwrite === false && same(entry.conditions, CONDITIONS))),
    "HC015_MANIFEST_OVERLAY", "Every condition must receive every identical inert payload without overwrite.",
  );
  const additions = {
    baseline: ["design.md", "search-plan.md"],
    "explicit-context": ["design.md", "context-plan.md"],
    "manual-equivalent": ["design.md", "context-plan.md", "manual-input.txt"],
  };
  const evidence = ["comparison.md", "recovery.md", "context.md"]
    .map((file) => `.hackathon/evidence/hc-015/${file}`);
  requireThat(
    manifest.evidenceRequirements?.length === 3
      && evidence.every((file) => manifest.evidenceRequirements.some((entry) =>
        entry.path === file && entry.stage === "submitted" && same(entry.conditions, CONDITIONS))),
    "HC015_MANIFEST_EVIDENCE", "Each condition needs the three submitted run-state Evidence files.",
  );
  for (const condition of CONDITIONS) {
    const expected = additions[condition].map((file) => `participant/hc-015/${file}`).sort();
    requireThat(
      same(manifest.allowedAdditions.filter((entry) => entry.conditions.includes(condition))
        .map(({ pattern }) => pattern).sort(), expected),
      "HC015_MANIFEST_ADDITIONS", `Only exact participant additions are allowed: ${condition}`,
    );
    requireThat(
      same(manifest.submissionFiles.filter((entry) => entry.conditions.includes(condition))
        .map(({ pattern }) => pattern).sort(), [...expected, ...evidence].sort()),
      "HC015_MANIFEST_EXPORT", `Export every granted artifact and every Evidence file: ${condition}`,
    );
  }
}

export function checkSourceTargets(targets) {
  requireThat(
    targets.sourceKind === "baseline"
      && targets.sourceRepository === SOURCE_BASELINE.repository
      && targets.sourceCommit === SOURCE_BASELINE.commit,
    "HC015_SOURCE_BASELINE", "Use the pinned application baseline, not the Labs commit.",
  );
  requireThat(
    same(targets.sources?.map(({ path }) => path), SOURCE_ORACLE.map(({ path }) => path)),
    "HC015_SOURCE_PATHS", "All three exact baseline paths must remain available.",
  );
  for (const [index, source] of targets.sources.entries()) {
    const expected = SOURCE_ORACLE[index];
    requireThat(
      source.id === expected.id && source.bytes === expected.bytes && source.sha256 === expected.sha256
        && source.lineCount === expected.lineCount && same(source.anchorRanges, expected.anchorRanges),
      "HC015_SOURCE_ORACLE", `Pinned source identity or reading anchor changed: ${expected.id}`,
    );
  }
  requireThat(
    same(targets.conditions, CONDITIONS)
      && same(targets.explicitContext, ["A1", "A2"])
      && same(targets.manualEquivalent, ["A1", "A2"])
      && targets.additionalRead === "A3",
    "HC015_CONTEXT_SET", "The primary comparison supplies exactly A1/A2; A3 is an equal extra read.",
  );
  requireThat(
    targets.fullSourceBytes?.firstTwo === 34526 && targets.fullSourceBytes?.allThree === 35931,
    "HC015_SOURCE_TOTALS", "Raw byte totals are source-only and exclude packet delimiters.",
  );
  requireThat(
    targets.pathSemantics === "reading-candidates-not-acls",
    "HC015_SCOPE_NOT_ACL", "Reading candidates must not be described as access control.",
  );
  requireThat(
    targets.actualTokenCount === null && targets.clientAttachmentExtent === "not-observed"
      && targets.runtimeBehavior === "not-observed" && targets.educationalEffect === "not-observed",
    "HC015_OBSERVATION_CLAIM", "Source preparation does not observe client input or educational effect.",
  );
}

function checkAnchor(value, pathKey) {
  requireThat(value.query === "allocate", "HC015_QUERY", "The fixed literal query is allocate.");
  requireThat(
    value[pathKey] === SOURCE_ORACLE[0].path && same(value.range, [333, 349]),
    "HC015_SCOPE", "The reading anchor must include the fixed file and lines 333-349.",
  );
  requireThat(
    value.fileSha256 === SOURCE_ORACLE[0].sha256,
    "HC015_PINNED_HASH", "Agreement between conditions does not replace the pinned source hash.",
  );
}

export function checkQuery(query) {
  checkAnchor(query, "source");
  requireThat(query.symbol === "OrderService.allocate", "HC015_QUERY", "Keep the fixed symbol.");
  requireThat(
    query.materialLabel === "SYNTHETIC_TRAINING_ONLY"
      && query.provenance === "node-literal-scan" && query.runtimeVerified === false,
    "HC015_LITERAL_PROVENANCE", "A static literal diagnostic cannot become a live language-tool observation.",
  );
  requireThat(
    query.languageService?.name === "Java" && query.languageService.status === "pending"
      && query.languageService.resolvedLocations === null,
    "HC015_LANGUAGE_UNOBSERVED", "Pending language service has unknown locations, not zero references.",
  );
}

export function checkSearchPlan(plan) {
  checkAnchor(plan, "target");
  requireThat(
    plan.materialLabel === "SYNTHETIC_TRAINING_ONLY" && plan.scope === "core-read-only-plan"
      && plan.runtimeVerified === false,
    "HC015_OBSERVATION_CLAIM", "The search plan is not a completed search.",
  );
  requireThat(
    plan.indexStatus === "not-checked" && plan.semanticResults === null,
    "HC015_INDEX_UNOBSERVED", "Unknown index state cannot supply zero semantic results or readiness.",
  );
  requireThat(
    same(plan.settingsChanges, []) && plan.indexBuildRequested === false
      && plan.securityBoundary === false
      && same(plan.observedSettings, { "search.exclude": null, "files.exclude": null, ".gitignore": null }),
    "HC015_CORE_SETTINGS", "The core plan changes no exclusions or index and grants no access.",
  );
  requireThat(
    same(plan.readingCandidates, SOURCE_ORACLE.map(({ path }) => path)),
    "HC015_SOURCE_PATHS", "Keep the same three reading candidates.",
  );
}

export function checkPreparedFiles(files, expected = FULL_CONTEXT) {
  requireThat(
    Array.isArray(files) && files.length === expected.length
      && files.every((file, index) => file.path === expected[index].path
        && file.bytes === expected[index].bytes && file.sha256 === expected[index].sha256),
    "HC015_PREPARED_CONTEXT", "Prepared full files must match the independent path/byte/hash oracle in order.",
  );
}

function header(file) {
  return Buffer.from(`<<<BEGIN FILE ${file.path}>>>\n`, "utf8");
}

function footer(file) {
  return Buffer.from(`<<<END FILE ${file.path}>>>\n`, "utf8");
}

export function createManualInput(files, expected = FULL_CONTEXT) {
  checkPreparedFiles(files.map((file) => ({
    path: file.path, bytes: file.content.length, sha256: hash(file.content),
  })), expected);
  return Buffer.concat([
    Buffer.from(MANUAL_PREAMBLE, "utf8"),
    ...files.flatMap((file) => [header(file), file.content, footer(file)]),
  ]);
}

export function checkManualInput(input, expected = FULL_CONTEXT) {
  requireThat(Buffer.isBuffer(input), "HC015_MANUAL_HEADER", "Read the manual packet as raw bytes.");
  const preamble = Buffer.from(MANUAL_PREAMBLE, "utf8");
  requireThat(input.subarray(0, preamble.length).equals(preamble),
    "HC015_MANUAL_HEADER", "Manual packet preamble must be exact.");
  let offset = preamble.length;
  const files = [];
  for (const source of expected) {
    const begin = header(source);
    requireThat(input.subarray(offset, offset + begin.length).equals(begin),
      "HC015_MANUAL_HEADER", `Use the exact filename header: ${source.path}`);
    offset += begin.length;
    const endMarker = footer(source);
    const end = input.indexOf(endMarker, offset);
    requireThat(end !== -1, "HC015_MANUAL_HEADER", `Missing exact filename footer: ${source.path}`);
    const content = input.subarray(offset, end);
    requireThat(content.length === source.bytes,
      "HC015_MANUAL_SOURCE_BYTES", `Full source byte length differs: ${source.path}`);
    requireThat(hash(content) === source.sha256,
      "HC015_MANUAL_SOURCE_HASH", `Full source bytes differ: ${source.path}`);
    files.push({ path: source.path, bytes: content.length, sha256: hash(content) });
    offset = end + endMarker.length;
  }
  requireThat(offset === input.length,
    "HC015_MANUAL_TRAILING", "Extra files, answers, tabs, or summaries cannot be appended to the packet.");
  checkPreparedFiles(files, expected);
  return files;
}
