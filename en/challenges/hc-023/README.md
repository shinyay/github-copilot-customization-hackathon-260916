# HC-023 Choose the minimum sufficient customization

**Language:** [日本語](../../../challenges/hc-023/README.md) / **English**

## Scenario

A team has many options, including Instructions, Prompts, Skills, Custom Agents, MCP, and Plugins. Adding a new mechanism for every problem increases configuration, permission checks, supported environments, and update ownership. On the other hand, preparing nothing for repetitive work means repeating the same explanation every time.

In this scenario, you will read ten fixed cases about Java maintenance and design **not only what to add, but also what not to add**. This is not a quiz about guessing a feature name. Manual context and adding nothing are valid choices when they fit the conditions.

## What this feature is

The candidates and their primary roles are as follows.

- **Instructions**: Reusable reading guidance or rules. Scope them to an entire repository or selected paths.
- **Prompt**: A standardized request that a person starts explicitly. Verify support in the harness being used.
- **Skill**: A collection of procedures and related materials. Existence, discovery, body use, and script execution must be verified separately.
- **Custom Agent**: A collection of role and tool declarations. Declarations and effective permissions are not the same.
- **MCP**: A route for retrieving resources. Separate connection, server trust, content authority, and call approval.
- **Plugin**: A versioned distribution unit for Skills and related components. Verify support for each component and harness.
- **manual context**: A person explicitly supplies the required materials.
- **none**: Use only the fixed request and existing materials, without creating an additional customization.

Explain each option from the following five perspectives.

1. **trigger**: One-time or repeated, explicitly started or a candidate for automatic supply.
2. **scope**: Which people, workspaces, paths, and harnesses it reaches.
3. **resources**: Which source, materials, checklists, scripts, or external resources it requires.
4. **permissions**: How reading is separated from execution, writing, and transmission that require separate approval.
5. **maintenance**: How ownership, update frequency, versions, duplication, restoration, and manual effort are handled.

## Good fit

- Multiple mechanisms are candidates, and you want to compare their value and maintenance cost.
- Usage conditions differ, such as Local Agent, Agent Host, or no external connectivity.
- You want to evaluate none, manual, and customization options using the same criteria.
- You want to retain rejected options and alternatives for changed conditions.

## Not a good fit

- Deriving a single correct feature from a case ID.
- Measuring success by the number of configurations added.
- Assuming Prompts or Plugins work in every harness.
- Treating synthetic permission material as an actual grant or server trust.
- Treating a paper design as verified Copilot behavior.

## Goals

1. Compare at least two options for all ten cases.
2. Explain the selected option, reasons for rejection, possibility of adding nothing, assumptions, and unknowns.
3. Use the five perspectives to choose the smallest maintainable option.
4. Do not compensate for a critical harness or permission mismatch with well-written prose.
5. Provide an alternative for when conditions change.

## What you need

- A text editor. Copilot Chat is optional.
- The fixed cases, requests, candidates, worksheets, and supporting materials under `starter/`.

| path | Purpose |
|---|---|
| `starter/cases/` | Fixed situations for case-01 through case-10 |
| `starter/requests/` | Fixed request for each case |
| `starter/mechanisms.json.template` | Candidate preparation methods |
| `starter/checklist.md.template` | Checklist for the five perspectives |
| `starter/answers.md.template` | Answer worksheet |
| `starter/review.md.template` | Human review worksheet |
| `starter/brief.json.template` | Public upstream template, workspace source, and safety boundaries |
| `starter/scope-paths.json.template` | Fixed paths referenced by the cases |
| `starter/resource-permission.md.template` | Boundary between resources and permissions |
| `starter/harness-boundaries.md.template` | Local / Agent Host boundaries |
| `starter/fixed-review-packet.md.template` | Fixed review items |
| `starter/review-role.md.template` | Inactive example of a read-only review role |
| `starter/operations-note.json.template` | Synthetic operations note used in case-06 / 08 |
| `starter/evidence-note.txt.template` | Short record template used in case-04 |
| `starter/package/` | Inactive Plugin / Skill v1 / v2 examples compared in case-09 |

The canonical source baseline is the public upstream template `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`. For actual reads, use the paths listed in each case from the current runtime workspace. A workspace created from a GitHub template has its own history, so its local HEAD does not need to match the upstream template revision. Do not check out or reset to align HEAD. If source differs from upstream, record it as a workspace-side difference. The case situations, permissions, and distribution plans are synthetic training materials.

The ten cases are summarized below.

| case | Situation |
|---|---|
| `case-01` | Repeated organization of evidence across the repository |
| `case-02` | Reading guidance needed only for Java / XML |
| `case-03` | A fixed request that a person explicitly repeats |
| `case-04` | Batch reading with a checklist and record template |
| `case-05` | A read-only review role and tool scope |
| `case-06` | Use distributed materials without external connectivity |
| `case-07` | Reusable design for Agent Host |
| `case-08` | Manual context and a future read-only resource route |
| `case-09` | Versioned distribution design for v1 / v2 of the same Skill |
| `case-10` | One-time work for which the fixed input is already sufficient |

## Preparation

1. Review the [shared getting started steps](../../README.md#getting-started).
2. Read `starter/brief.json.template`, `starter/mechanisms.json.template`, and the supporting materials, and distinguish the upstream template revision from the runtime workspace source.
3. Copy `starter/answers.md.template` into an unsaved buffer or personal working note.
4. Do not move `.template` into active Instructions, Skill, Agent, or Plugin paths.
5. Confirm that "permitted" and "available" in the cases are synthetic assumptions, not grants of permission in your own environment.

## Try it

Repeat the following for each `case-01` through `case-10`.

1. Read `starter/cases/case-NN.json.template`, the corresponding `starter/requests/case-NN.txt.template`, and the shared `starter/brief.json.template`.
2. List at least two candidates without excluding `none` or `manual-context`.
3. Compare each candidate by trigger / scope / resources / permissions / maintenance.
4. Write the smallest selected option, reasons for not choosing other options, the possibility of adding nothing, and the assumptions required for it to work.
5. Leave unknown harness support, tools, grants, trust, and installation state as `unknown`.
6. Self-review using `starter/fixed-review-packet.md.template` and `starter/review.md.template`.

Also use the supporting materials for each case. For example, case-02 uses `scope-paths`, case-05 uses the review packet and review role, case-07 uses harness boundaries, case-08 uses the operations note and resource permission, and case-09 refers to `starter/package/`.

## Optional: Compare

Choose one case. First answer without looking at the checklist, then answer again in a new working note using `starter/checklist.md.template`. Manually compare missing assumptions, unnecessary mechanisms, and explanations of permissions or maintenance.

This is a short self-check. It is not an experiment that proves a learning effect or product effect.

## Verification points

- Did you explain fit with the situation rather than relying on the feature name?
- Is there a selected option and at least one alternative?
- Did you evaluate none / manual / no addition using the same criteria?
- Did you avoid guessing scope and harness support?
- Did you avoid treating the upstream template revision and the runtime workspace's local HEAD as the same?
- Did you separate tool declarations, effective tools, and operation permissions?
- Did you avoid conflating server trust, content authority, and call approval?
- Are all ten cases present exactly once?

## Further exploration

- Change only one assumption in a case and reconsider how the selection changes.
- For case-09 v1 / v2, compare only the owner, reviewer, version, and restoration method.
- Estimate the effort of operating the same objective with manual context and the maintenance cost of a customization.

## Constraints, fallback, and safety

- This exercise does not create or install active Instructions, Prompts, Skills, Agents, MCP, or Plugins.
- `starter/package/` and `starter/review-role.md.template` are inactive reading samples.
- Do not run scripts or servers, transmit data externally, change User / organizational settings, perform Cloud operations, or edit source.
- Do not check out or reset to align with the upstream template revision. If a listed path cannot be read from the workspace, record the source as `unobserved`.
- Do not guess and broaden Agent Host support for Prompt Files or support for Plugin components.
- Because every case is visible from the beginning, this is not a blind evaluation against unknown input.
- All procedures can be completed in a text editor without Copilot.
- You may record a comparison whose assumptions cannot be aligned as `incomparable`, insufficient permissions as `blocked`, and an unsupported target harness as `unsupported`.
