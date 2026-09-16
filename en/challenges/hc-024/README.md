# HC-024 Compare Instructions and Skill by removing them one at a time

**Language:** [日本語](../../../challenges/hc-024/README.md) / **English**

## Scenario

Using Instructions and a Skill together made the explanation of CSV resubmission easier to read. However, a single result that uses both does not reveal whether the Instructions helped, whether the Skill helped, or whether either one alone would have been sufficient.

In this scenario, Instructions are **I** and the Skill is **S**. Compare one factor at a time across the four cells 00 / 10 / 01 / 11. Keep the source, synthetic operations note, request, I draft, and S draft fixed, and change as little as possible other than the presence or absence of I / S.

## What this feature is

A factorial comparison is a method for turning multiple factors on and off independently to examine both their individual differences and their combined differences.

| cell | I | S |
|---|---:|---:|
| 00 | 0 | 0 |
| 10 | 1 | 0 |
| 01 | 0 | 1 |
| 11 | 1 | 1 |

The main comparisons are `10 − 00`, `01 − 00`, `11 − 10`, and `11 − 01`. A small number of responses cannot prove a general causal relationship.

Also, do not combine the following into a single definition of "success."

1. The draft existed in the expected location.
2. The client discovered it as a candidate.
3. The body of the Instructions / Skill was loaded.
4. The source or note was used in the response.
5. The output changed according to the criteria defined in advance.

A Skill can exist without being used. Retain unused results as well.

## Good fit

- You use Instructions and a Skill together and want to check whether either one alone is sufficient.
- You can keep the inputs and drafts fixed and change only the on / off state.
- You can observe presence, discovery, loading, usage, and effect separately.
- You can treat equal, worse, no additional asset needed, and unused as valid results.

## Not a good fit

- Claiming the effects of both features from the 11 response alone.
- Manually pasting the I / S bodies into 00 and thereby changing the input.
- Adding extra domain knowledge only to the Skill.
- Changing the Agent, MCP, Hook, and model at the same time.
- Filling unobserved model, effort, tools, or usage values with defaults.

## Goals

1. Design a short I containing only shared principles and an S containing a reusable procedure.
2. Use the same I content in 10 / 11 and the same S content in 01 / 11.
3. Decide in advance which inputs, evaluation criteria, and stop conditions will be shared across all four cells.
4. Record presence, discovery, loading, usage, and effect separately.
5. Preserve cases that cannot be compared or in which neither asset is needed, together with the reason.

## What you need

- GitHub Copilot Chat. If you will not run a comparison in a real environment, a text editor is sufficient.
- The inactive teaching materials in `starter/`. Do not activate the `.template` files in this repository.

| File | Purpose |
|---|---|
| `starter/request.txt.template` | Fixed request for explaining CSV resubmission |
| `starter/source-packet.json.template` | Public upstream template, three workspace sources, and citation IDs |
| `starter/operations-note.json.template` | Synthetic operations note shared across all cells |
| `starter/brief.md.template` | Summary of the four cells and safety boundaries |
| `starter/instructions-skeleton.md.template` | Inactive I draft |
| `starter/skill-skeleton.md.template` | Inactive S draft |
| `starter/design.md.template` | Worksheet for evaluation criteria and stop conditions |
| `starter/matrix.md.template` | Observation record for the four cells |

The canonical source baseline is the public upstream template `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`. Read the following three items from their paths in the current runtime workspace.

- `OrderImportService.importDraft/replay`
- `OrderGroup.canonicalHash`
- `OrderImportPostgresTest.groupedMainImportUsesCorePricingAndNeverApprovesAndReplaysCanonically`

The exact paths and SHA-256 values from the upstream template are in `starter/source-packet.json.template`. Because a workspace created from a GitHub template has its own history, its local HEAD does not need to match the upstream template revision. Do not perform a checkout / reset to align HEAD; if the workspace source differs from the upstream hash, record that as a difference. Read only the test definition and do not treat the test as executed. `operations-note.json.template` is fictional material marked `SYNTHETIC_TRAINING_ONLY`; it is not a real incident history or internal policy.

## Preparation

1. Review the [common getting started instructions](../../README.md#getting-started).
2. Read `starter/request.txt.template`, `starter/source-packet.json.template`, and `starter/operations-note.json.template`, and inspect the three listed paths in the runtime workspace. A matching local HEAD is not a verification requirement.
3. Copy the I / S skeletons and the design / matrix files into unsaved buffers or personal working notes.
4. Do not move any `.template` to `.github/copilot-instructions.md`, a Skill directory, or any other active path.
5. If you cannot access the source, use the code-derived snapshot in the synthetic operations note as a fallback and state explicitly that the source body was not inspected.

## Try it

1. In I, write only short principles reusable across other work, such as separating facts, inferences, and unknowns; grounding claims in paths / symbols; and distinguishing a test definition from a test execution.
2. In S, write the order for reading the three runtime workspace sources, the role of the upstream template revision, how to handle the same operations note, citations, unknowns, stop conditions, and output format. Do not embed a domain-specific answer that exists only in S.
3. In `starter/design.md.template`, record the frozen I / S versions, shared inputs, predefined evaluation criteria, order of the four cells, and stop conditions.
4. In `starter/matrix.md.template`, record what will remain the same across all four cells.
5. If you do not use a real environment, mark everything except presence as `unobserved` for each cell. Do not write predictions as observed results.

## Optional: Compare

Only in an approved, disposable validation repository / workspace, perform a manual check using four new conversations. Do not create active customization files in this teaching repository.

1. 00: no I and no S.
2. 10: only the frozen I.
3. 01: only the frozen S.
4. 11: the same I and the same S.

Keep the source, full operations note, request, model, effort, available tools, and approval the same across all cells. Do not manually paste I / S into 00, and retain a result in which the Skill was not discovered as-is. Read the responses using the predefined criteria; do not use response length or the number of citation markers alone as improvement metrics.

## Verification points

- Is the I content the same in 10 / 11, and is the S content the same in 01 / 11?
- Are all four cells present without omissions or duplicates?
- Did you keep the source, note, request, model, and tools the same?
- Did you avoid treating the upstream template revision and the runtime workspace local HEAD as identical?
- Did you separate presence, discovery, loading, usage, and effect?
- Did you distinguish a test definition from a test execution, and synthetic operations from real history?
- Did you retain equal, worse, unused, and no additional asset needed results?
- If you changed a draft or evaluation criterion midway, did you avoid mixing the new results with the earlier four cells?

## Further exploration

- [Remove each of four mechanisms one at a time](optional/ablation-preparation.md) — An auxiliary design that removes I / Skill / Custom Agent / MCP one at a time from the full configuration.
- [Compare Stop notification paths](optional/hook-chain-preparation.md) — An auxiliary design that observes the same checker through three paths: disconnected, manual, and Stop notification.
- If you increase the number of repetitions, separately design for order effects, carryover from the same person, and evaluator blinding.

## Constraints, fallback, and safety

- Every sample in this repository is an inactive `.template`. Do not add active Instructions, Skill, Agent, MCP, or Hook files.
- Do not modify or run Java, the database, tests, configuration, or external services.
- Do not perform a checkout / reset to align with the upstream template revision. If you cannot access the workspace source, use only the code-derived snapshot and mark the source body as `unobserved`.
- Even if Instructions / Skill are unavailable, you can still design the I / S drafts, four-cell matrix, shared inputs, and evaluation criteria. In that case, discovery, loading, usage, and effect are `unobserved`.
- Do not claim general causality or educational effects from a small four-cell comparison.
- Record a comparison whose conditions cannot be aligned as `incomparable`, insufficient permissions as `blocked`, and an unsupported target feature as `unsupported`.
