# HC-026 Roll out customization assets safely in stages

**Language:** [日本語](../../../challenges/hc-026/README.md) / **English**

## Scenario

Even when a team wants to share drafts of Instructions, Skills, and Plugins, it cannot safely widen the rollout while any of the owner, review, current version, previous version, distribution target, or restore target remains unknown.

In this scenario, audit two fictional assets across five record states. Check not only whether the content is good, but also the traceability of responsibility, versions, targets, and rollback, then design the conditions for proceeding and the conditions for stopping.

## What this feature is

This scenario does not cover GitHub organization settings themselves. It covers operational design for sharing Copilot customization assets safely. Separate the following for each asset.

- owner / reviewer / review status / update reason
- current / expected current / previous
- target / allowed target
- rollback candidate / digest

An old version and a previous version suitable for restoration are not the same thing. Even if `previousVersion: v1` is correct, a current version that does not match the expected `v2` is still a current-version problem. If the owner is unknown, do not invent a value; stop with `blocked`.

Use the following rules for individual and aggregate determinations.

1. If even one item is `fail`, the aggregate result is `fail`
2. If there is no `fail` but at least one item is `blocked`, the aggregate result is `blocked`
3. The aggregate result is `pass` only when every item is `pass`

The register determination is separate from the later operational decision to "proceed only with a pilot," "wait," or "do not share."

## Good fit

- Planning a staged rollout of Instructions, Skill, and Plugin drafts from a small group
- Tracking owner, review, version, target, and rollback in the same register
- Making a decision without hiding aggregate risk when only some assets are ready
- Operational design that includes maintaining the current state, reducing scope, waiting for review, and deciding that no additional asset is needed

## Not a good fit

- Inventing owners or approvals for a real organization
- Treating Plugin, MCP, and organization-setting permissions as covered by one blanket assurance
- Deciding whether to distribute based only on content quality
- Treating a paper register as a record of successful distribution or restoration

## Goals

- Audit all `2 assets × 5 states = 10 records` without omissions
- Explain the reason for `pass` / `blocked` / `fail` at the field level
- Verify previous, rollback candidate, and digest against one another
- Separate the aggregate rollup from the operational decision to share, wait, or reduce scope
- Create safe rollout and restore policies

## What you need

All materials in `starter/` are marked `SYNTHETIC_TRAINING_ONLY`.

- `request.md.template`: Fixed audit request
- `policy.md.template`: Fixed determination rules
- `asset-register.json.template`: Two assets, v1 / v2, and SHA-256 values
- `scenario-records.json.template`: Ten records across five states and two assets
- `versions/`: Inactive versioned assets
- `design.md.template` / `comparison.md.template`: Design and comparison worksheets

The fixed assets are `reading-rules` and `analysis-package`. The five states include a consistent state, a missing owner, a current-version mismatch, a disallowed target, and a rollback digest mismatch. Do not decide from filenames alone; inspect every field and the actual bytes.

## Preparation

1. Review the [common getting started instructions](../../README.md#getting-started).
2. Read `starter/request.md.template` and `starter/policy.md.template`.
3. Inspect `asset-register.json.template`, `scenario-records.json.template`, and `versions/`.
4. Before viewing the results, freeze in your own notes the review unit, division of responsibility, stop and withdrawal conditions, restore verification method, and handling of unknowns from `design.md.template`.
5. Do not remove `.template` or place assets in an active `.github/` location.

## Try it

1. Give Copilot the fixed request, fixed policy, asset register, and scenario records.
2. First, have it confirm the exact set of ten records and that there are no omissions or duplicates.
3. For every record, evaluate owner, reviewer, review status, update reason, current, expected current, target, allowed target, previous, rollback, and digest separately.
4. Calculate SHA-256 for the actual files under `starter/versions/` and compare the results with the asset register. Mark values you did not calculate as unverified.
5. Classify every record as `pass` / `blocked` / `fail`, then calculate the aggregate rollup using the fixed rules.
6. Without overwriting the register determination, propose one of the following with a reason: proceed to a pilot, reduce the target, wait for review, stop until restore verification is complete, or do not share.
7. Use `comparison.md.template` to summarize individual determinations, the aggregate rollup, the operational decision, and unverified real operations separately.

## Optional: Compare

You can audit the same ten records twice in new conversations.

- **Baseline**: Use only the fixed policy
- **Customized**: Also use the operational policy frozen in `design.md.template` before viewing the results

Do not rewrite the record determinations. Compare only whether the added policy made stop conditions, target reduction, and restore procedures clearer.

## Verification points

- All ten records across two assets and five states were retained
- Unknowns were not filled in by speculation
- `previous = v1` and a `current` mismatch were treated as separate problems
- The aggregate rollup preserved the priority of fail, followed by blocked
- The rollback candidate was connected to the digest of the actual bytes
- The register determination and operational decision were separated
- A paper policy was not promoted to successful real approval, distribution, or restoration

## Further exploration

- [Checks before a staged rollout to a real organization](optional/organization-rollout.md)

Proceed only if you can identify the owner, administrator, permissions, distribution source, and restore target and obtain additional approval.

## Constraints, fallback, and safety

- The main scenario is complete with an audit of synthetic materials and does not write to a real organization, change permissions, distribute assets, or restore assets.
- If you cannot calculate SHA-256, you may use the asset register values as fixture data, but do not describe them as independently verified.
- Stop if any of the owner, reviewer, target administrator, distribution-source bytes, or restore-target bytes is unknown.
- Do not treat Plugin and MCP permissions as one combined approval.
- Treat insufficient input as `blocked` and a comparison that cannot preserve the same bytes as `incomparable`.
- Even when real distribution cannot proceed, limited sharing, maintaining the current state, and deciding no additional asset is needed remain valid conclusions.
