# HC-040 Deliver one Skill as a Plugin

**Language:** [日本語](../../../challenges/hc-040/README.md) / **English**

## Scenario

You will consider how to deliver one Skill for investigating order CSV retransmissions to multiple people. If the Skill content is the same for a manual copy and a Plugin package, the comparison should focus not on the amount of knowledge but on versions, delivery destinations, updates, restoration of an older version, and the burden of checking for drift.

Create Skill v1 and v2, making the raw bytes of the manual copy and package copy match at each revision. Do not install or enable the Plugin, connect to a marketplace, or run it in Cloud.

## What this feature is

A Skill is a procedure for a specific task. A Plugin is a package for distributing components such as Skills together. Putting one Skill in a package does not automatically improve the meaning of its content.

The basic Agent Plugins 1.0 structure is `plugin.json` at the package root and `skills/<name>/SKILL.md`. This scenario handles only one Skill and does not add MCP, Hooks, Custom Agents, commands, LSP, or a second Skill.

Cloud settings involve `enabledPlugins` and `extraKnownMarketplaces`, but only inactive `.template` samples are included. Do not treat the fictional marketplace as a real, trusted connection destination.

The Skill concerns order retransmission investigations.

- Proceed from `OrderImportService.importDraft` to the search for an existing claim.
- Separate the boundaries of `findClaim` and `replay`.
- Verify the evidence for payload canonicalization in `OrderGroup.canonicalHash`.
- Separate source inspection from DB mutations, CSV imports, and replay execution.

## Good fit / Not a good fit

**Good fit**

- Managing the Skill's source of truth, version, hash, and delivery destinations.
- Removing differences in manual and package content from the comparison.
- Designing procedures and responsibilities for the v2 update and v1 restoration.
- Comparing maintenance burden, including the decision not to adopt a package.

**Not a good fit**

- Adding components on the package side and turning this into a capability comparison.
- Treating schema conformance alone as successful installation, enablement, discovery, or use.
- Improving the Skill content on only one side.
- Presenting a floating ref or fictional marketplace as trusted.

## Goals

Create a delivery, update, and restoration plan that satisfies the following:

1. Decide the sources of truth for v1 and v2.
2. Make the manual/package copies of the same revision byte-identical.
3. Apply `same-key-check` and `changed-payload-check` to both revisions.
4. Record `prepare-v1`, `update-v2`, and `restore-v1` as separate states.
5. Separate the planned number of copies from the observed number of active copies.
6. Maintain a one-Skill component inventory.

## What you need

- A text editor
- An environment that can calculate SHA-256. PowerShell's `Get-FileHash` is sufficient
- The fixed materials under `starter/`
- Eligibility to use Plugins or Cloud is not required for the main scenario

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-040/starter/request.txt.template) | Fixed request |
| [`distribution-design.md.template`](../../../challenges/hc-040/starter/distribution-design.md.template) | Design for source of truth, version, delivery, and restoration |
| [`reference/lifecycle.md.template`](../../../challenges/hc-040/starter/reference/lifecycle.md.template) | Four content-check rows and six lifecycle rows |
| [`reference/source-map.md.template`](../../../challenges/hc-040/starter/reference/source-map.md.template) | Target investigation symbols and execution boundaries |
| [`customization/SKILL.md.template`](../../../challenges/hc-040/starter/customization/SKILL.md.template) | Inactive Skill starting point |
| [`customization/plugin.json.template`](../../../challenges/hc-040/starter/customization/plugin.json.template) | Starting point for a one-Skill package manifest |
| [`customization/plugin-settings.json.template`](../../../challenges/hc-040/starter/customization/plugin-settings.json.template) | Inactive Cloud settings sample |

## Preparation

Open this directory by following [Getting started for the repository](../../README.md#getting-started). If you make working copies, keep the `.template` suffix and do not place them under `.github/`, a user plugin directory, or marketplace settings.

Hold the following constant before comparing:

- `same-key-check` and `changed-payload-check`
- The full Skill v1 content and raw bytes
- The one point to change in v2
- The manual/package paths for each revision
- The plugin name/version and one-Skill inventory
- The lifecycle revision

## Try it

1. Read `source-map.md.template` and `SKILL.md.template`, then verify the boundaries for the existing claim, canonical hash, and stopping before replay.
2. Create Skill v1 and record its UTF-8 encoding, line endings, BOM, byte length, and SHA-256.
3. Byte-copy v1 to the manual and package locations, then compare both hashes.
4. Create Skill v2 by improving exactly one explanation of the investigation order or unknowns.
5. Make v2 use the same bytes in the manual and package locations as well.
6. On the package side, use only the one-Skill structure of `plugin.json` and `skills/training-order-evidence/SKILL.md`.
7. Fill in the four content-check rows in `lifecycle.md.template`.
   - v1 × 2 tasks
   - v2 × 2 tasks
8. For both manual and package delivery, fill in `prepare-v1`, `update-v2`, and `restore-v1`.
9. Do not elevate matching hashes into evidence of installation, active version, discovery, or call.

Example of static verification in PowerShell:

```powershell
Get-FileHash -Algorithm SHA256 <manual-skill-path>
Get-FileHash -Algorithm SHA256 <package-skill-path>
```

## Optional: Compare

For manual delivery and a Plugin package, compare only:

- The copy procedure from the source of truth to the delivery destination
- Visibility into the version and component inventory
- Drift detection during the v2 update
- Verification items when restoring v1
- The additional maintenance burden for one Skill

Keep the effectiveness of the Skill content fixed by using the same bytes.

## Verification points

- At each v1 and v2 revision, manual/package copies are byte-identical.
- There are four rows for 2 tasks × 2 revisions.
- There are six rows for 2 delivery methods × 3 lifecycle states.
- The package contains only one Skill and no additional components.
- Manifest metadata, planned copies, active copies, fetched version, discovery, and call are separate.
- If the package is excessive, continuing with manual delivery or deciding that no addition is needed are available choices.

## Further exploration

- Design drift detection, a person responsible for verification, and update stop conditions for an increase to two delivery destinations.
- To observe actual install/update/restore operations, see [limited observation of the Plugin lifecycle](optional/plugin-lifecycle-live.md).

## Constraints, fallback, and safety

- In the main scenario, do not install or enable the Plugin or change marketplace or Cloud settings.
- Do not use the fictional `training-marketplace` as a real connection destination.
- Do not remove `.template` or create active Skills or settings.
- Matching hashes indicate only that the stored bytes match. Discovery, use, and knowledge effects are unobserved.
- Even without access to Plugins, you can complete the scenario with the package draft, byte identity, and lifecycle ledger.
- Even if you cannot run the source, you can create a static Skill from the included symbol descriptions. Do not infer DB or replay results.

In this scenario, the term `manifest` refers to the Plugin package's `plugin.json` and component inventory. It does not mean a legacy distribution contract or deliverable.
