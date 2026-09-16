# HC-019 Build a customization health check

**Language:** [日本語](../../../challenges/hc-019/README.md) / **English**

## Scenario

Draft Instructions for GitHub Copilot can be syntactically readable and appear in candidate lists while still contradicting one another in practice. Conversely, it is premature to decide that they are "not useful" based on syntax checks alone.

In this scenario, you will use a harmless synthetic draft and synthetic inventory to diagnose **syntax, location, target harness, meaning, discovery, actual application, and usefulness** separately. Do not activate the draft. Design a minimal repair that preserves the original intent, along with a method for verifying it again.

## What this feature is

Consider the state of a customization in at least the following layers.

| Layer | What you can verify | What this alone cannot verify |
|---|---|---|
| syntax | Whether the frontmatter and body can be parsed | Whether the instructions are compatible with one another |
| location | Whether it is at a candidate path for the intended scope | Whether the client discovered it |
| harness | Whether the target client / agent host handles the format | Whether it was supplied to this request |
| meaning | Whether the instructions avoid conflicts and preserve the intent | Whether they are actually useful |
| discovery | Whether it appeared as a candidate or reference source | Whether the body entered the conversation |
| application | Whether there is direct evidence that it was supplied to the request | Whether output quality improved |
| usefulness | Whether it helped with the task | Whether it will always be effective for other tasks |

Do not reinterpret `listed: true`, `enabled: true`, or a successful parse as `applied: true`. Treat `applied: null` as unknown.

References: [Create and manage agent customizations](https://code.visualstudio.com/docs/agent-customization/overview), [Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Good fit / Not a good fit

**Good fit**

- Distinguishing why a customization is "visible but ineffective" or "appears effective without evidence"
- Dividing responsibilities between automated checks and human judgment about meaning
- Comparing minimal repairs such as deletion, rewriting, scope restriction, and explicit precedence
- Making explicit when to stop at an unverified layer

**Not a good fit**

- Concluding application or usefulness from a successful parser run or candidate listing alone
- Modifying real profiles or another person's customization as training material
- Treating the output of an external evaluation model as the sole correct answer
- Creating active Instructions in this repository

## Goals

1. Explain the conflict between the two fixed lines.
2. Create a diagnostic checklist that does not conflate the seven layers.
3. Choose a minimal repair candidate that preserves the original intent.
4. Recheck syntax and meaning separately, and state which layers remain unobserved.

## What you need

- A working environment that has completed the [repository-wide getting started steps](../../README.md#getting-started)
- An editor that can read Markdown / JSON
- The following materials under `starter/`
  - [Fixed request](../../../challenges/hc-019/starter/request.txt.template)
  - [Conflicting body](../../../challenges/hc-019/starter/fixtures/draft-p.txt.template)
  - [Inactive frontmatter](../../../challenges/hc-019/starter/fixtures/wrapper.txt.template)
  - [Synthetic inventory](../../../challenges/hc-019/starter/fixtures/inventory.json.template)
  - [Design worksheet](../../../challenges/hc-019/starter/worksheets/design.md.template)
  - [Diagnostic checklist](../../../challenges/hc-019/starter/worksheets/checklist.md.template)
  - [Repair worksheet](../../../challenges/hc-019/starter/worksheets/repair.md.template)

You do not need a management UI, an external model, or an additional extension.

## Preparation

The fixed body is exactly these two lines.

```text
Use exactly the two headings Evidence and Unknowns.
Never include a heading named Unknowns.
```

The fixed frontmatter is as follows.

```text
---
description: "Synthetic contradiction for evaluating instruction diagnostics"
applyTo: "**"
---
```

`*.template` is an inactive training-material filename. Do not move the combined draft into `.github/`, a profile, or User data, and do not remove `.template`.

The synthetic inventory contains the following two entries.

| name | scope / source | Synthetic state |
|---|---|---|
| `lab19-safe` | workspace / `.github/instructions/lab19-safe.instructions.md` | A candidate for local-agent and agent-host; enabled / listed are true, and applied is null |
| `profile-only` | profile / `vscode-profile-user-data/instructions/profile-only.instructions.md` | A candidate for local-agent; enabled is false, listed is true, and applied is null |

These paths and states are labels in the training materials, not observations from a real profile or management UI.

## Try it

1. Read the [fixed request](../../../challenges/hc-019/starter/request.txt.template) and consider how you would respond without activating the draft.
2. In the [design worksheet](../../../challenges/hc-019/starter/worksheets/design.md.template), write the original intent, inspection order, automated checks versus human judgment, and stop conditions.
3. Check the wrapper and body separately.
   - syntax: Can you read the shape of the frontmatter and the two body lines?
   - meaning: Can the line that requires `Unknowns` and the line that prohibits it both be satisfied?
4. Inspect the inventory.
   - Write only what can be concluded from the location and target harness.
   - Do not infer application from `listed` / `enabled`.
   - Leave `applied: null`, the real UI, and usefulness as unknown.
5. For each row in the [diagnostic checklist](../../../challenges/hc-019/starter/worksheets/checklist.md.template), record the input, evidence checked directly, facts that can be automated, content requiring human judgment, and stop condition.
6. Compare multiple options in the [repair worksheet](../../../challenges/hc-019/starter/worksheets/repair.md.template). Examples:
   - Delete one of the conflicting instructions.
   - Rewrite it as a conditional statement.
   - Narrow the application scope.
   - Make the precedence explicit.
   - Add no customization.
7. Verify again that the chosen option preserves the original intent and does not expand the scope of the change. If you create a repaired draft, keep an inactive `*.instructions.md.template` filename.

This exercise does not require everyone to use a single deletion method. What matters is that you can explain why the conflict is resolved and which requirements were retained.

## Optional: Compare

First review the materials once using any approach. Then, in a new note or conversation, review the same materials with the checklist. Compare missed layers, treatment of unknowns, amount of explanation, and maintenance burden.

Because you already know the materials during the second review, do not treat the difference as proof of the checklist's effect or improved accuracy. Equivalent results, additional complexity, and no need for an addition are also valid conclusions.

## Verification points

- Did you identify the exact two conflicting lines?
- Did you separate syntax, location, harness, meaning, discovery, application, and usefulness?
- Did you avoid mistaking the synthetic inventory for observations from a real UI?
- Did you separate automated checks from human judgment?
- Does the minimal repair preserve the original intent?
- Did you state the unverified layers and the conditions for stopping there?

## Further exploration

- [Observe a self-owned copy in the Customizations editor](optional/customization-editor.md)
- [Try an approved external diagnostic](optional/diagnostic-evaluation.md)
- [Safely try Waza evaluation](optional/waza-evaluation.md)
- [Observe migration of a self-owned copy](optional/copy-migration.md)

Each is optional exploration independent of the main scenario. Before proceeding, verify the required product, permissions, data transmission, cost, and safety conditions.

## Constraints, fallback, and safety

- The materials are `SYNTHETIC_TRAINING_ONLY` synthetic fixtures. Do not treat synthetic IDs or states as logs from a real environment.
- Do not create or modify active Instructions, profile data, or User settings in this repository.
- Do not send private code, secrets, or third-party information to an external evaluator.
- Even without a parser, you can manually inspect the frontmatter delimiters, required fields, and two body lines.
- Even without Copilot or a management UI, you can complete the diagnosis and design a minimal repair using only the fixed fixtures, inventory, and worksheets.
- Verifying actual discovery, application, and usefulness requires a separate approved environment. If they cannot be verified, record `not-observed` and stop.
