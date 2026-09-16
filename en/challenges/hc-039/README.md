# HC-039 Decide the owner of organization-shared rules

**Language:** [日本語](../../../challenges/hc-039/README.md) / **English**

## Scenario

Suppose multiple teams share the rule, “Separate evidence from unverified items in investigation results.” Similar text can be written in a root `AGENTS.md`, organization Instructions, and organization/enterprise shared profiles, but their storage locations, usage surfaces, visibility, edit permissions, owners, and update responsibilities are not the same.

Using 12 synthetic ownership records, you will create a governance design that separates currently verified facts, unknowns, participant proposals, and pending approvals. You will not change real organization settings or shared profiles.

## What this feature is

This scenario separates three mechanisms.

- root `AGENTS.md`: shared work instructions for that repository. It is not an organization-wide ACL or enforced policy.
- organization Instructions: natural-language instructions stored in organization settings. Confirm supported surfaces, owner permissions, and the relationship with repository-side Instructions.
- Shared profile: the definition of a specialized role. Manage the role, version, usage scope, and maintenance responsibility in an organization or enterprise governance repository.

The selection rules are also separate.

- On supported GitHub surfaces, applicable repository Instructions may take precedence over organization Instructions.
- Selection among same-named profiles uses the name after removing `.md` / `.agent.md` from the filename, and selects in repository, organization, then enterprise order.

Instructions precedence and profile deduplication are not the same process. The range in which a profile can be used and the range in which the storage repository can be viewed or edited are also not the same.

## Good fit / Not a good fit

**Good fit**

- Making the owner, author, reviewer, and people responsible for updates, retirement, and restoration explicit.
- Separating current values from proposed values.
- Recording storage ACL, usage scope, edit permissions, and selected revision separately.
- Explaining decisions to reduce duplication, avoid sharing, or defer until additional approval.

**Not a good fit**

- Filling in an unknown owner with a real person's name or “administrator.”
- Inferring ACL, eligibility, or the selected revision from the path alone.
- Calling `AGENTS.md` or Instructions a ruleset or access control.
- Placing an inactive sample as an active shared profile.

## Goals

Fill in the 12 rows of [`starter/governance-design.md.template`](../../../challenges/hc-039/starter/governance-design.md.template) so that you can explain the following for each mechanism:

1. Currently verified owner, author, reviewer, and revision
2. Unknowns and where to verify them
3. Proposed division of responsibility and required approvals
4. Methods for updates, retirement, and restoration
5. The difference between Instructions precedence and profile deduplication

## What you need

- A text editor
- The synthetic materials under `starter/`
- Organization owner or enterprise admin permissions are not required for the main scenario

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-039/starter/request.txt.template) | Fixed request |
| [`governance-design.md.template`](../../../challenges/hc-039/starter/governance-design.md.template) | Worksheet for 4 tasks × 3 records |
| [`fixtures/ownership.json.template`](../../../challenges/hc-039/starter/fixtures/ownership.json.template) | 12 ownership records |
| [`reference/current-policy.md.template`](../../../challenges/hc-039/starter/reference/current-policy.md.template) | Snapshot of the current sharing policy |
| [`reference/mechanism-map.md.template`](../../../challenges/hc-039/starter/reference/mechanism-map.md.template) | Boundaries for storage, surfaces, precedence, and deduplication |
| [`customization/shared-rules.md.template`](../../../challenges/hc-039/starter/customization/shared-rules.md.template) | Inactive example of shared rules |
| [`customization/profile.agent.md.template`](../../../challenges/hc-039/starter/customization/profile.agent.md.template) | Inactive example of a specialized profile |

Do not remove `.template` or copy these files into an active path.

## Preparation

Open this directory by following [Getting started for the repository](../../README.md#getting-started). Review each of the following four tasks using `record-01` through `record-03`.

| task | Target |
|---|---|
| `root-rules` | Shared rules at the repository root |
| `org-instructions` | Organization Instructions |
| `org-profile` | Organization shared profile |
| `enterprise-profile` | Enterprise shared profile |

`record-02` contains missing responsibility information, and `record-03` contains inconsistencies among the selected ref, recorded revision, and content hash. The task and record names are not answer labels.

## Try it

1. Read `current-policy.md.template` and `mechanism-map.md.template`.
2. Before filling in the worksheet columns, decide on a rule that prevents mixing current facts with proposals.
3. For the 12 records, compare the storage repo/path, usage surface, usage scope, ACL, owner, author, reviewer, selected ref/revision/hash.
4. Leave unknown values as unknown, and write whom to ask and what to verify.
5. Record participant proposals in separate fields; do not convert them into approved current values.
6. For Instructions, verify the repository/organization relationship; for profiles, verify cross-scope deduplication and the selected revision.
7. If you consider adding shared rules or a specialized profile, use the inactive samples in `customization/` as references and decide the owner, reviewer, update process, and restoration process first.

## Optional: Compare

First diagnose the 12 records briefly using only `current-policy.md.template`, then reevaluate them with the governance worksheet. Compare whether unsupported completions, duplicated responsibility, and inability to restore were reduced—not whether the number of unknowns decreased.

## Verification points

- All 4 tasks × 3 records are covered.
- Owner, author, reviewer, ACL, usage scope, revision, and hash are separate.
- Unknown current values have not been overwritten by proposed values.
- Instructions precedence is not confused with same-name profile deduplication.
- Profile usage scope is not treated as identical to the storage repository ACL.
- Not sharing, deciding no addition is needed, and deferring are also valid conclusions.

## Further exploration

- Design a source of truth and drift detection for placing the same rule redundantly in two mechanisms.
- To observe real organization settings, see [limited observation of Organization Instructions](optional/org-instructions-live.md).
- To observe shared profiles, see [limited observation of shared profiles](optional/shared-profiles-live.md).

## Constraints, fallback, and safety

- In the main scenario, do not change organization settings, governance repositories, rulesets, or active profiles.
- Do not add real names, real organizations, or private ACLs to the synthetic materials.
- If you cannot verify the owner, ACL, or selected revision, stop rather than infer.
- Treat Public Preview status and eligibility as unobserved until verified in the real environment.
- Even without administrative permissions, you can complete the governance design using the text materials alone.
