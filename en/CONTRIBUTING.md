# Contributing

**Language:** [日本語](../CONTRIBUTING.md) / **English**

This repository is maintained as a static public learning resource for exploring GitHub Copilot customization features through scenarios.

## Scenario principles

- Make the purpose, prerequisites, procedure, and verification points understandable from a single scenario.
- Start with a real-world difficulty and the decision the learner needs to make, not with a feature name.
- Explain what the feature changes and what it does not guarantee.
- Cover not only successful examples, but also no difference, regression, and unavailable-feature outcomes.
- Do not depend on past events, submissions, judging, run management, or private answer materials.
- When using fixed source, identify the public repository and revision. Do not require the local `HEAD` of a working repository created from a template to match the upstream revision.
- Do not include secrets, credentials, personal information, customer data, private source, or internal-only information.

## Recommended document structure

Use only the sections that are needed, and prioritize explanations specific to the scenario.

1. `Scenario`
2. `What this feature is`
3. `Good fit / Not a good fit`
4. `Goals`
5. `What you need`
6. `Preparation`
7. `Try it`
8. `Optional: Compare`
9. `Verification points`
10. `Further exploration`
11. `Constraints, fallback, and safety`

Write observations that let learners judge results for themselves, rather than submission instructions or scoring criteria.

## Starter materials

- Include only fixed inputs, fixtures, code excerpts, candidates, customization examples, helpers, and short worksheets used directly by the exercise.
- Place them under `challenges/hc-xxx/starter/` with names and a structure that make their purpose clear.
- Keep the `.template` suffix on customization examples so Copilot does not activate them accidentally.
- Do not commit `.github/copilot-instructions.md`, `*.instructions.md`, `*.prompt.md`, `*.agent.md`, `SKILL.md`, `.vscode/mcp.json`, or similar files under active names.
- Do not add metadata used only for automated placement, hashes, run IDs, or submission exports.
- Helpers must run with paths relative to the learning materials and must not transmit data externally or connect to real data.

## Optional guides

Content under `optional/` is advanced material for trying additional environments, entitlements, permissions, or product surfaces. It is not required to complete the main scenario.

- State the purpose, prerequisites, permissions and safety, procedure, observation points, and stopping conditions.
- Link to it from the main README and provide a link back to the main scenario.
- Do not confuse reading a guide with succeeding on a live product surface.

## Index

When adding, removing, or renaming a scenario, update the static index in `challenges/README.md` in the same change. Do not use a generator or Catalog.

## Bilingual documentation

- Keep every public Japanese document paired one-to-one with the same path under `en/`.
- Update both languages in the same change without summarizing away procedures, constraints, verification points, or safety boundaries.
- Keep code, commands, paths, hashes, identifiers, URLs, and starter filenames unchanged.
- Keep the visible **日本語 / English** links on both GitHub Markdown pages and verify that the GitHub Pages toggle points to both existing counterparts.

## Verification

- Relative README links resolve to existing files.
- Every public Japanese document has an English counterpart and every English document has a Japanese counterpart.
- `starter/` samples retain inactive names.
- The procedure can be started with this README and the target scenario alone.
- No legacy Hub, Pack, submission command, or Issue-submission path remains.
- `git diff --check` succeeds.
