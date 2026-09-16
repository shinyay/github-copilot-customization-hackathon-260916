# HC-028 Determine which Instructions revision Copilot read

**Language:** [日本語](../../../challenges/hc-028/README.md) / **English**

## Scenario

When the same Instructions exist in base, head, default, and starting refs, it is easy to conflate the stored revision, the revision the product documentation says will be referenced, and the revision identified by the current observation.

In this scenario, use fixed materials marked `SYNTHETIC_TRAINING_ONLY` throughout and audit attribution without inferring the selected revision from the contents of a candidate diff or the language of a response.

## What this feature is

A revision audit separates at least the following three layers.

- **Stored revision**: Which file bytes are stored at which ref
- **Documented rule**: Which ref the target product officially says it uses
- **Observed attribution**: Whether the current record directly identifies the target revision and Instructions version

`base`, `head`, `default`, and `starting` are refs with different purposes. For example, do not generalize the head rule for code review to Cloud Agent or another automation.

## Good fit / Not a good fit

**Good fit**

- Registering the Instructions bytes and hash for each ref
- Separating product specifications from individual observations
- Avoiding reuse of an old-head record for the current target
- Treating the task diff and Instructions diff separately

**Not a good fit**

- Working backward from the response language or a self-report to infer the selected revision
- Calling a stored hash proof of the version actually supplied
- Filling in records with an unknown target file or revision by speculation
- Treating synthetic attribution as an observation from a real product

## Goals

Inspect four synthetic refs, two diffs, and three types of attribution records, then produce an audit result that can explain the following.

1. The stored version
2. The documented rule for each product
3. The attribution that could be confirmed directly this time
4. The criteria for identifying old head and unknown
5. The separation between task changes and customization changes

## What you need

All fixed inputs are in `starter/`.

- `request.md.template`: Fixed request
- `refs/*.md.template`: Synthetic Instructions for base / head / default / starting
- `ref-register.md.template`: Register of body hashes and file hashes
- `product-rules.md.template`: Boundaries of product-specific rules
- `attribution-records.md.template`: Synthetic revision-identified / old-head / unknown records
- `diffs/*.diff.template`: Task diff and customization diff
- `design.md.template`: Audit design sheet
- `worksheets/comparison.md.template`: Record sheet for the optional comparison

The synthetic ref IDs are not real Git SHAs, and the diffs are not applied.

## Preparation

See [Getting started](../../README.md#getting-started) for the common preparation.

1. Read the files in `starter/` and preserve every `SYNTHETIC_TRAINING_ONLY` notice.
2. Treat the `.template` files as inactive teaching materials and do not place them under `.github/**`.
3. If you recalculate hashes, separate the hash of the body alone from the hash of the entire file including frontmatter.

## Try it

1. Read `request.md.template`, then first fill in the audit criteria in `design.md.template`.
2. Compare the four files in `refs/` with `ref-register.md.template`.
3. Use `product-rules.md.template` to organize the product, asset, referenced ref, and scope of application.
4. For each record in `attribution-records.md.template`, use separate fields for the following.
   - Target revision
   - Claimed Instructions ref
   - Directly observed Instructions hash
   - Inference
   - Reason for unknown
5. Organize `diffs/task.diff.template` and `diffs/config.diff.template` without mixing their paths, purposes, or hashes.
6. If evidence conflicts or is missing, do not make a definitive claim; stop at `old-head` or `unknown`.

## Optional: Compare

Using `worksheets/comparison.md.template`, you can manually compare a **Baseline** that reads the materials without deciding an audit method and a **Customized** approach that freezes the audit method first. Use the same materials, and do not give only Customized additional answers or real-product logs.

## Verification points

- Were Stored revision / Documented rule / Observed attribution placed in separate fields?
- Were base / head / default / starting kept distinct?
- Was old head kept from being reused for the current target?
- Were the body hash and file hash distinguished?
- Were the task diff and customization diff separated?
- Was an unknown version left unfilled rather than inferred from the response content?
- Were synthetic records kept from being promoted to real-product observations?

## Further exploration

- Create an additional record in which the synthetic head advances once, and try a rule that invalidates the previous attribution
- To prepare for observing attribution in an actual code review, use the [supplementary guide to standard review attribution](optional/review-attribution.md)

## Constraints, fallback, and safety

- Do not create or change real PRs, Cloud Agent tasks, code reviews, branches, or repository settings.
- Do not paste private repository names, actors, or real review logs into the teaching materials.
- Even without access to a real product, the audit can be completed using only the synthetic materials.
- If attribution does not directly identify the target file or revision, leave it as `not-observed`.
