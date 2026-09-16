# HC-033 Give Cloud Agent a Skill for replay investigation

**Language:** [日本語](../../../challenges/hc-033/README.md) / **English**

## Scenario

When investigating CSV replay, the same `external_key` may have either matching or different content, and the relationships among the original order, claim, and journal must also be checked. Instead of pasting a long procedure every time, you can package it as a Skill, but seeing the Skill name, using its body, reading a resource, and running a script must be treated separately.

In this scenario, separate a short investigation procedure from a detailed checklist and create an inactive Skill draft that can be compared with manually supplying the same body and resource.

## What this feature is

An Agent Skill packages procedures for a particular task into `SKILL.md` and related resources. This scenario separates the following four stages:

| Stage | What to verify | Does not automatically mean |
|---|---|---|
| description | Which tasks it is for | The body was loaded |
| body | Investigation order, stop conditions, record format | A resource was read |
| resources | Content such as a checklist | A script was run |
| script | Command, input, result | The result's meaning is correct |

The main scenario does not create or run a script, and it does not place the Skill in an active directory.

## Good fit / Not a good fit

**Good fit**

- Reusing repeated investigation sequences, stop conditions, and evidence formats
- Separating a short body from a detailed checklist
- Separating what source can establish from what requires database verification
- Observing description, body, resources, and script separately

**Not a good fit**

- Saving actual CSV data, customer information, production order IDs, or database output
- Determining actual database state for a claim or journal from source reading alone
- Treating a link or filename alone as successful use of a body, resource, or script
- Running import, replay, or database connections unattended

## Goals

Design a Skill draft that supports the following two tasks:

- `replay-plan`: Investigate matching content, different content, or a new claim for the same `external_key`
- `journal-boundary`: Organize investigation boundaries for the claim, original order, and journal

The deliverables are a Skill body, detailed checklist, manual bundle with the same content, resource ledger, and diagnosis of synthetic packets.

## What you need

Fixed source:

- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRowService.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRunService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`

`starter/` contains the fixed request, design worksheet, inactive `SKILL.md.template`, resource checklist, manual bundle, resource ledger, synthetic input/observation packets, and optional comparison worksheet.

## Preparation

See [Getting started](../../README.md#getting-started) for the common preparation steps.

1. Read `starter/request.txt.template` and `starter/fixtures/packets.json.template`.
2. Do not move `starter/customization/SKILL.md.template` into `.github/skills`, `.agents/skills`, or `.claude/skills`.
3. First define a stop boundary that prohibits actual database access, import, replay, and script execution.

## Try it

1. Use `starter/design.md.template` to decide the target tasks, body/checklist split, unknowns, and stop conditions.
2. In `SKILL.md.template`, write a short procedure that separates raw input, canonicalization, claim, original order, and journal.
3. Fill in the detailed verification items in `resources/checklist.md.template`.
4. Include the complete text of the same Skill body and checklist in separate sections of `manual-bundle.md.template`.
5. In `resource-ledger.md.template`, record individual hashes for the file, frontmatter, body, checklist, and manual sections.
6. Diagnose the description/body/resources/script states in `fixtures/packets.json.template`.
7. Do not confuse `canonicalHash` with the raw file hash, and do not write a digest you did not calculate.

## Optional: Compare

Use `starter/worksheets/comparison.md.template` to perform a manual comparison of the following:

- **Baseline**: A sufficient fixed request and ordinary reference material
- **Customized**: A design that supplies the Skill body and checklist as a package
- **Manual-equivalent**: Manually supply the full text of the same body and checklist

Keep the source, synthetic cards, body bytes, and resource bytes consistent. Do not claim that Skill discovery or priority is also identical.

## Verification points

- Did you distinguish replay from new creation, and matching from different content?
- Did you distinguish canonicalization from raw bytes?
- Can evidence for the claim, original order, and journal be traced back to source?
- Did you leave the database, transaction, and execution as unknown?
- Did you make description, body, resources, and script separate stages?
- Does the corresponding section in the manual bundle match in full?
- Did you avoid claiming that a script was created or run?

## Further exploration

- If adding a script, design only what it validates structurally and what it does not validate semantically
- Use the [Cloud Skill supplementary guide](optional/cloud-skill.md) to prepare to observe Skill use in Cloud Agent
- Use the [Review Skill supplementary guide](optional/review-skill.md) to prepare to try it in a review-focused task

## Constraints, fallback, and safety

- Do not create or run an active Skill directory, script, workflow, Java code, database, Cloud task, or review.
- Do not use actual CSV data, order IDs, customer information, database output, or secrets.
- Even without a Skill-capable client, you can examine the content through the inactive draft and manual bundle.
- If discovery, body injection, resource reading, or script execution cannot be verified, record each as `not-observed`.
