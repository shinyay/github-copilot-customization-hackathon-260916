# HC-041 Distinguish repository facts from stale memories

**Language:** [日本語](../../../challenges/hc-041/README.md) / **English**

## Scenario

A handoff document contains the fact "the inspection command is `check-a`," together with a citation path. However, the same path in the current version may say `npm run verify`. Facts from another repository, a user preference, and a self-report saying that something was "used this time" are also mixed into the same bundle.

Audit the composite F01–F06 fact cards on two surfaces, Cloud and standard code review, and create a policy for retention, holding, proposing updates, and revalidation. Do not store, reuse, or delete any real Memory.

## What this feature is

Repository facts in GitHub Copilot Memory are facts about a repository that may be reused. Even when a citation is present, check the following separately.

- Whether the same repository is being targeted.
- Whether the citation path can be read at the current branch/revision.
- Whether the current content supports the scope of the claim.
- Whether it can be a candidate for use on the target surface (`eligible`).
- Whether there is direct Evidence that it was actually used this time (`used`).

`eligible`, `used`, and `supported` are separate. Also distinguish repository facts handled by standard code review from user preferences.

GitHub Copilot Memory, the Local Memory tool in VS Code, and memory handled by the Copilot App may have similar names, but their storage scopes and operations are not necessarily the same. In addition, a description of the retention period does not guarantee that a fact is correct, that a new session has an empty state, or that deletion is complete.

## Good fit / Not a good fit

**Good fit**

- Compare the source/target repository, scope, and citation path/revision.
- Record the scope of the claim supported by the current content.
- Distinguish eligible from used.
- Define revalidation triggers such as branch updates, path changes, and surface changes.

**Not a good fit**

- Treat a claim as correct solely because the citation path exists.
- Use a fact from another repository as a fact for the same repository.
- Treat a user preference as a repository fact in standard review.
- Treat a response saying "I remembered it" as Evidence of storage or reuse.
- Treat a new session, disabling a setting, or elapsed time as Evidence that Memory is empty or deletion is complete.

## Goals

Fill in the 12 rows in [`starter/fact-audit-design.md.template`](../../../challenges/hc-041/starter/fact-audit-design.md.template).

- 6 cards × Cloud
- 6 cards × standard code review

For each row, explain the current citation check, supported scope, reason for eligibility, direct Evidence of use, and the retain/hold/revalidate trigger.

## What you need

- A text editor
- The synthetic materials under `starter/`
- Eligibility to use Memory, Cloud, or standard review is not required for the main scenario

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-041/starter/request.txt.template) | Fixed request |
| [`fact-audit-design.md.template`](../../../challenges/hc-041/starter/fact-audit-design.md.template) | 12-row audit worksheet |
| [`fixtures/fact-cards.json.template`](../../../challenges/hc-041/starter/fixtures/fact-cards.json.template) | F01–F06 |
| [`reference/current-policy.md.template`](../../../challenges/hc-041/starter/reference/current-policy.md.template) | Sufficient general audit procedure |
| [`reference/memory-scope.md.template`](../../../challenges/hc-041/starter/reference/memory-scope.md.template) | Product/surface/scope boundaries |
| [`reference/repo-a-current.md.template`](../../../challenges/hc-041/starter/reference/repo-a-current.md.template) | repo-a current snapshot |
| [`reference/repo-a-previous.md.template`](../../../challenges/hc-041/starter/reference/repo-a-previous.md.template) | repo-a previous snapshot |
| [`reference/repo-b-current.md.template`](../../../challenges/hc-041/starter/reference/repo-b-current.md.template) | Snapshot from another repository |

## Preparation

Follow [Getting started with the repository](../../README.md#getting-started) and open this directory. Fix the cards, snapshots, surfaces, decision columns, and policy revision.

Fixed cards:

| card | Material |
|---|---|
| F01 | Cites current material from the same repository |
| F02 | Cites previous material from the same repository |
| F03 | Cites material from another repository |
| F04 | User preference |
| F05 | The path/revision cannot be checked in the current material |
| F06 | Only a self-report that it was "used" is present |

The cards do not have answer labels.

## Try it

1. Read `current-policy.md.template` and the three snapshots.
2. Compare sourceRepo, targetRepo, scope, citation path/revision, and the current content.
3. Write only the scope supported by the content. Do not automatically discard an old citation or a citation from another repository; record the reason.
4. Record `eligible / not-eligible / unknown` separately from `used evidence present / absent / unknown`.
5. Use separate rows for Cloud and standard review, and do not require user preferences to carry over into review.
6. Distinguish retention, holding, proposing an update, and retirement.
7. Define the next revalidation trigger, such as a branch update, citation path change, or task surface change.
8. Do not mark real Memory store, reuse, retention, or delete operations as observed.

## Optional: Compare

First fill in the 12 rows using only the general audit procedure, then add your own revalidation triggers and hold rules and review the results. Compare confusion between current facts and proposals, disappearance of unknowns, and excessive revalidation burden rather than the number of retained items.

## Verification points

- F01–F06 are handled on both the Cloud and review surfaces.
- The same repository, current branch/revision, citation path, and meaning of the content are checked.
- `eligible` and `used` are distinguished.
- Repository facts and user preferences are separated for each surface.
- A missing or inaccessible path is not converted to false.
- Real Memory operations, retention, and empty Memory are not marked as observed.

## Further exploration

- For each card, add one answer to "Which repository change would trigger revalidation?"
- To observe real Memory reuse, see [Limited observation of Memory reuse](optional/memory-reuse-live.md).

## Constraints, fallback, and safety

- In the main scenario, do not change Memory settings or perform store, reuse, delete, or delete-all operations.
- Do not add real user information or private repository content to the synthetic materials.
- If a citation cannot be retrieved, do not conclude that it is not eligible; mark it as unknown/hold.
- Do not create a memory-free control using a new session or by disabling a setting.
- Even without product eligibility, the audit can be completed using only the included snapshots and fact cards.
- In this scenario, `evidence` means grounds supporting cited content or actual use; it is not a file to submit.
