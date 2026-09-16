# HC-021 Find the culprit behind conflicting Instructions

**Language:** [日本語](../../../challenges/hc-021/README.md) / **English**

## Scenario

You ask GitHub Copilot to format a display card containing only two lines. Sometimes the display does not change even after a rules file is added. Other times, after placing the same rules in multiple locations, it becomes impossible to explain which body was used.

In this scenario, instead of adding more instructions until the expected answer appears, you will isolate **placement, discovery, content use, and output compliance** in that order. All materials are harmless synthetic fixtures, and you will not create active Instructions.

## What this feature is

Instructions are Markdown files that tell Copilot how to interpret work and format output. However, the following four stages are separate facts.

1. **placement** — The path, name, and extension under which the file is saved.
2. **discovery** — Whether the client recognized it as a candidate or reference source.
3. **content use** — Whether the rules body was confirmed to have been supplied to the actual conversation.
4. **output compliance** — Whether the response followed the rules, identified a conflict, or took another form.

`*.instructions.md.template` is a safe, inactive sample filename and is not a valid active filename for ordinary Instructions. Even if a file exists at a documented path, that alone does not prove discovery, content use, or output compliance.

When multiple Instructions are used, their bodies may be combined, but do not infer a general precedence based on filenames or save order. Instructions also do not add tool permissions, OS permissions, approvals, or access controls.

Reference: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Good fit / Not a good fit

**Good fit**

- Diagnosing which stage failed after an instruction file was placed
- Comparing inactive names, nonstandard paths, and documented paths on paper
- Distinguishing duplicate text from a one-line conflict
- Handing off candidate causes, disconfirming evidence, unobserved items, and minimal repair options

**Not a good fit**

- Continuing to add instructions until a particular heading appears
- Concluding that a body was used merely because the output looks similar
- Deriving a precedence rule for all Instructions from a small fixture
- Deleting personal, home, or organizational Instructions to align conditions
- Creating an active customization in this repository

## Goals

1. Create a diagnostic order that does not conflate the four stages.
2. Explain seven static cases that preserve the same packet, request, and rules body.
3. Diagnose duplicate text separately from a one-line conflict.
4. Leave unobservable items as `not-observed` and propose the next minimal verification.

## What you need

- A working environment that has completed the [repository-wide getting started steps](../../README.md#getting-started)
- An editor that can read Markdown / JSON
- The following materials under `starter/`
  - [Fixed request](../../../challenges/hc-021/starter/request.txt.template)
  - [Fixed two-line display card](../../../challenges/hc-021/starter/fixtures/packet.txt.template)
  - [Rules body for manual supply](../../../challenges/hc-021/starter/customizations/rules.md.template)
  - [Same-text scoped draft](../../../challenges/hc-021/starter/customizations/variant-a.instructions.md.template)
  - [Scoped draft with one opposing line](../../../challenges/hc-021/starter/customizations/variant-b.instructions.md.template)
  - [Static case plan](../../../challenges/hc-021/starter/worksheets/case-plan.json.template)
  - [Diagnostic design worksheet](../../../challenges/hc-021/starter/worksheets/design.md.template)

Even if Copilot is unavailable, you can proceed with the static diagnosis alone.

## Preparation

The fixed packet is exactly these two lines.

```text
Place the blue notebook on the desk.
Place the white card next to it.
```

The fixed request says to display the two lines without changing their characters or order, explain rule provenance separately only when it can be verified directly, and mark internal state as `not-observed`. It prohibits business analysis, source citations, file changes, tools, commands, another Agent, and network execution.

The rules body is the following two lines.

```text
Use the heading "Guidance" for the display card.
Display each fixed message as a separate bullet point.
```

`variant-a.instructions.md.template` is an inactive draft that adds frontmatter to this body, limiting the target to `starter/fixtures/packet.txt.template`. `variant-b.instructions.md.template` keeps the same frontmatter and bullet-list rule but changes only the heading to "Confirmation".

Read all files as UTF-8 training materials. Do not remove `.template` or copy them into `.github/`.

## Try it

1. Open the [static case plan](../../../challenges/hc-021/starter/worksheets/case-plan.json.template) and identify the one factor that changes in each case.
2. Separate the following cases into placement facts and hypotheses.

| case | Assumed method of supplying the rules | Diagnostic focus |
|---|---|---|
| no-instructions | No placement and no manual supply | Output from the fixed request alone |
| inactive-template | Inactive material with `.template` | Difference between file existence and activation |
| nonstandard-path | Assume `notes/copilot-instructions.md` | Difference between being Markdown and using a documented path |
| documented-path | Assume `.github/copilot-instructions.md` | Unknowns that remain even with correct placement |
| manual-body | Manually supply the full rules body | Content use without discovery |
| duplicate-text | Assume the base body + same-text variant A | Duplicate text |
| conflicting-text | Assume the base body + variant B | Conflict in only the heading line |

`notes/...` and `.github/...` are virtual paths for diagnosis. Do not create actual files in this repository.

3. Compare [variant A](../../../challenges/hc-021/starter/customizations/variant-a.instructions.md.template) and [variant B](../../../challenges/hc-021/starter/customizations/variant-b.instructions.md.template).
   - `description` and `applyTo` are the same.
   - The bullet-list rule is the same.
   - Only the heading "Guidance" / "Confirmation" differs.
4. In the [diagnostic design worksheet](../../../challenges/hc-021/starter/worksheets/design.md.template), write the direct observations, candidate causes, disconfirming evidence, and stop conditions for each stage.
5. Record the following separately for each case.
   - placement: Distinguish actual starter paths from virtual paths.
   - discovery: If there is no client display, record `not-observed`.
   - content use: Do not infer it unless the full body was supplied manually.
   - output compliance: Record it only if you actually obtained a response.
6. Do not commit to a single cause. Propose the next minimal check that changes only one factor.

The key is not to infer discovery or content use backward from a good output, and not to conclude from a bad output alone that placement is incorrect.

## Optional: Compare

Use two new conversations to perform a short manual check with the same model and settings.

1. Paste only the fixed packet after the [fixed request](../../../challenges/hc-021/starter/request.txt.template).
2. In a separate conversation, paste the fixed request, the full [rules body](../../../challenges/hc-021/starter/customizations/rules.md.template), and the fixed packet in that order.

Compare only output compliance. In step 2, you can verify the body that you manually supplied, but you have not verified discovery from the repository. No output difference, worse output, and an incomparable result are also valid observations.

## Verification points

- Did you separate placement, discovery, content use, and output compliance?
- Did you preserve the relationship among the packet, request, and rules body across all seven cases?
- For the manual case, did you use the full rules text rather than a summary?
- Did you explain duplicate text separately from the one-line conflict?
- Did you avoid concluding that the body was used merely because an active path exists?
- Did you avoid generalizing that a particular heading always "wins"?
- Did you leave unobserved items as `not-observed`?

## Further exploration

- Summarize the four stages, direct observations, stop conditions, and minimal repairs on one page.
- Without changing existing cases, design an inactive `*.template` option that changes only one boundary, such as "ambiguous scope" or "different target harness."
- If verification in a real environment is necessary, first plan an isolated trial that changes only one factor, and do not activate this repository's materials.

## Constraints, fallback, and safety

- The materials are a `SYNTHETIC_TRAINING_ONLY` synthetic display card. They do not involve real application specifications, private code, or secrets.
- Keep every sample in `starter/customizations/` as an inactive `*.template`.
- Do not create `.github/copilot-instructions.md` or `.github/instructions/*.instructions.md` in this repository.
- Instructions do not grant permissions or make execution safe. Obey the fixed request's prohibition on tools / commands / network use.
- If Copilot or reference-source displays are unavailable, perform the static diagnosis of placement and body differences only, and record discovery, content use, and output compliance as `not-observed`.
- Do not delete, reset, or stash existing settings, personal / home / organizational Instructions, or another person's files to align conditions.
