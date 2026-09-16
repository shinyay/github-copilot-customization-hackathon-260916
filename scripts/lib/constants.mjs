export const CATALOG_SCHEMA_VERSION = 1;
export const PACK_SCHEMA_VERSION = 1;
export const RUN_PLAN_SCHEMA_VERSION = 1;
export const HUB_RESULT_DRAFT_SCHEMA_VERSION = 1;

export const CONTRACT_LIMITS = {
  packFiles: 256,
  packBytes: 10_485_760,
  overlay: 128,
  evidenceFiles: 32,
  evidenceFileBytes: 1_048_576,
  submissionFiles: 64,
  submissionFileBytes: 1_048_576,
  submissionTotalBytes: 8_388_608,
  repoPath: 320,
};

export const PATH_OWNERSHIP = [
  "baseline-owned",
  "template-owned",
  "run-state",
  "pack-applied",
  "participant-addition",
  "submission-bundle",
  "ignored",
  "violation",
];

export const VERIFICATION_RESULTS = [
  "pass",
  "fail",
  "blocked",
  "not-observed",
];

export const RUNTIME_TEMPLATE_REPOSITORY =
  "shinyay/github-copilot-customization-runtime-template";
export const MINIMUM_TEMPLATE_VERSION = 1;
export const REFERENCE_REPOSITORY =
  "shinyay/code-to-doc-workshop-260910";
export const LABS_REPOSITORY =
  "shinyay/github-copilot-customization-labs";
export const REFERENCE_COMMIT =
  "398d7d1982a1402bcdba00d6c3ded67d8d338787";

export const CHALLENGE_IDS = Array.from(
  { length: 45 },
  (_, index) => `HC-${String(index + 1).padStart(3, "0")}`,
);

// Maintainer review order, independent of current publication status.
export const RELEASE_WAVES = [
  ["HC-002", "HC-003", "HC-004", "HC-005", "HC-008"],
  ["HC-010", "HC-012", "HC-013", "HC-014", "HC-015"],
  ["HC-016", "HC-017", "HC-018", "HC-019", "HC-020"],
  ["HC-021", "HC-022", "HC-023", "HC-024", "HC-025"],
  ["HC-026", "HC-027", "HC-028", "HC-029", "HC-031"],
  ["HC-032", "HC-033", "HC-034", "HC-035", "HC-036"],
  ["HC-037", "HC-038", "HC-039", "HC-040", "HC-041"],
  ["HC-042", "HC-043", "HC-044", "HC-045"],
];

export const REQUIRED_CHALLENGE_HEADINGS = [
  "Challenge Story",
  "この機能とは",
  "向いていること / 向いていないこと",
  "Starter Kit",
  "Open Question",
  "Design Time",
  "Build",
  "Compare",
  "Evidence",
  "Submit",
  "Judging",
  "Bonus Mission",
  "Support / Fallback",
];

export const REQUIRED_ISSUE_FORM_FIELDS = [
  "challenge_id",
  "conditions",
  "participant_team",
  "run_id",
  "runtime_repo_url",
  "pull_request_url",
  "environment",
  "model_effort_tools",
  "feature_understanding",
  "problem_hypothesis",
  "baseline_evidence",
  "customized_evidence",
  "outcome",
  "failures_unknowns",
  "challenge_design",
  "reusability",
  "privacy_confirmation",
  "safety_confirmation",
];

export const ISSUE_FORM_FIELD_CONTRACT = [
  ["challenge_id", "dropdown", "Challenge ID"],
  ["conditions", "textarea", "Conditions compared"],
  ["participant_team", "input", "Participant / team"],
  ["run_id", "input", "Run ID"],
  ["runtime_repo_url", "input", "Runtime repository URL"],
  ["pull_request_url", "input", "Pull Request URL"],
  ["environment", "textarea", "Client / host / OS / channel"],
  ["model_effort_tools", "textarea", "Model / effort / tools"],
  ["feature_understanding", "textarea", "Feature understanding"],
  ["problem_hypothesis", "textarea", "Problem + hypothesis"],
  ["baseline_evidence", "textarea", "Baseline evidence"],
  ["customized_evidence", "textarea", "Customized evidence"],
  ["outcome", "dropdown", "Outcome"],
  ["failures_unknowns", "textarea", "Failures + unknowns"],
  ["challenge_design", "textarea", "Challenge-specific design"],
  ["reusability", "textarea", "Reusability"],
  ["privacy_confirmation", "checkboxes", "Privacy confirmation"],
  ["safety_confirmation", "checkboxes", "Safety confirmation"],
];

export const OPTIONAL_ISSUE_FORM_FIELD_CONTRACT = [
  ["optional_route", "input", "OPTIONAL guide route"],
  ["optional_status", "dropdown", "OPTIONAL activity status"],
  ["optional_run", "textarea", "OPTIONAL separate run"],
  ["optional_evidence", "textarea", "OPTIONAL evidence"],
  ["optional_unperformed_reason", "textarea", "OPTIONAL unperformed / blocked reason"],
];

export const OPTIONAL_ACTIVITY_OPTIONS = [
  "unperformed",
  "guide-only",
  "blocked",
  "live-attempted",
];

export const REQUIRED_OUTCOME_OPTIONS = [
  "improved",
  "equal",
  "worse",
  "incomparable",
  "blocked",
  "unsupported",
];

export const ACTIVE_CUSTOMIZATION_PATH_PATTERNS = [
  /^\.github\/copilot-instructions\.md$/u,
  /^\.github\/instructions\/.+/u,
  /^\.github\/prompts\/.+/u,
  /^\.github\/agents\/.+/u,
  /^\.github\/skills\/.+/u,
  /^\.agents\/skills\/.+/u,
  /^\.github\/hooks\/.+/u,
  /^\.copilot\/hooks(?:\.[^/]+|\/.+)?$/u,
  /^\.github\/plugins\/.+/u,
  /^\.github\/plugin\.json$/u,
  /^\.copilot\/plugins\/.+/u,
  /^\.vscode\/mcp\.json$/u,
  /(^|\/)AGENTS\.md$/u,
  /(^|\/)CLAUDE\.md$/u,
  /^\.claude\/.+/u,
  /^\.cursor\/.+/u,
];

export const DEFAULT_DENY_CUSTOMIZATION_PATTERNS = [
  ".github/copilot-instructions.md",
  ".github/instructions/**",
  ".github/agents/**",
  ".github/prompts/**",
  ".github/skills/**",
  ".agents/skills/**",
  ".vscode/mcp.json",
  ".github/hooks/**",
  ".copilot/hooks",
  ".copilot/hooks.json",
  ".copilot/hooks.yaml",
  ".copilot/hooks.yml",
  ".copilot/hooks/**",
  ".github/plugins/**",
  ".github/plugin.json",
  ".copilot/plugins/**",
  ".claude/**",
  ".cursor/**",
];

export const DEFAULT_DENY_CUSTOMIZATION_BASENAMES = [
  "AGENTS.md",
  "CLAUDE.md",
];
