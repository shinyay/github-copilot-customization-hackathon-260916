# HC-044 Distinguish Copilot Approve from mergeability

**Language:** [日本語](../../../challenges/hc-044/README.md) / **English**

## Scenario

A maintenance PR has a positive assessment and a formal Approve event. Even so, you must separately check whether the actor is eligible for the event to count as a required approval, whether it targets the current head, whether the required count has been reached, whether all changed files are covered, and whether higher-level policy and CI requirements are satisfied.

Using the synthetic policy snapshot and review events A01–A07, design what can be claimed from each piece of Evidence and where to hold or escalate. Do not perform a real Approve, review request, ruleset change, or merge.

## What this feature is

Distinguish states with similar names.

| Concept | Meaning |
|---|---|
| assessment | An evaluation of the changes. Even a positive assessment is not necessarily a formal vote |
| review event | An individual event recorded as Approve or another state |
| approve permission | A setting that allows Copilot to Approve |
| count eligibility | Settings and conditions that allow an event to count as a required approval |
| target head | The commit/head targeted by the event |
| eligible actor | Whether the effective policy allows that actor to be counted |
| stale / duplicate | An event for an old head or a duplicate event |
| all changed files | Whether the entire set of changed files matches the target pattern |
| required count | Number of distinct eligible approvals required |
| effective policy | Effective enterprise, organization, and repository constraints |
| other merge gates | CI, conversation resolution, deployment, and other requirements |

Separate **per-event eligibility**, which determines whether each event can be counted, from the **rollup** of distinct count, all-files coverage, and required count. Even if the approval requirement is satisfied, do not conclude that the PR is mergeable when other merge gates are unknown.

## Good fit / Not a good fit

**Good fit**

- Distinguishing an assessment, formal event, vote count, and mergeability.
- Excluding stale, duplicate, and wrong-head events.
- Holding when higher-level policy is unknown.
- Organizing the burden of excessive blocking and the risk of incorrectly allowing a change.

**Not a good fit**

- Converting a positive assessment into one vote.
- Filling the required count using an old head or duplicate.
- Treating a match for only some files as satisfying all-files coverage.
- Concluding that a PR is mergeable from approvals alone.
- Changing settings or rulesets to force a successful outcome.

## Goals

Complete the following three worksheets.

- [`approval-policy.md.template`](../../../challenges/hc-044/starter/approval-policy.md.template): Check order and permitted claims
- [`decision-ledger.md.template`](../../../challenges/hc-044/starter/decision-ledger.md.template): Per-event/rollup decisions for A01–A07
- [`escalation-plan.md.template`](../../../challenges/hc-044/starter/escalation-plan.md.template): Missing information, owner, safe stop, and retry limit

## What you need

- A text editor
- The synthetic materials under `starter/`
- Copilot code review Approvals and administrative access are not required for the main scenario

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-044/starter/request.txt.template) | Fixed request |
| [`fixtures/policy-snapshot.json.template`](../../../challenges/hc-044/starter/fixtures/policy-snapshot.json.template) | Approval settings, required count, scope, policy, and other gates |
| [`fixtures/review-events.json.template`](../../../challenges/hc-044/starter/fixtures/review-events.json.template) | Assessments/events for A01–A07 |
| [`reference/reference-notes.md.template`](../../../challenges/hc-044/starter/reference/reference-notes.md.template) | Key points from the public specification |
| [`approval-policy.md.template`](../../../challenges/hc-044/starter/approval-policy.md.template) | Check policy |
| [`decision-ledger.md.template`](../../../challenges/hc-044/starter/decision-ledger.md.template) | Decision table |
| [`escalation-plan.md.template`](../../../challenges/hc-044/starter/escalation-plan.md.template) | Escalation plan |

## Preparation

Follow [Getting started with the repository](../../README.md#getting-started) and open this directory. Before reading the packets, fix the check order for assessment, event, head, actor, path coverage, count, effective policy, and other gates.

Fixed tasks:

| task | Situation |
|---|---|
| A01 | Positive assessment only; no Approve event |
| A02 | Approve is permitted and an event exists, but counting toward required approvals is disabled |
| A03 | One vote is eligible, but the required count is 2 |
| A04 | Changed files inside and outside the target scope are mixed |
| A05 | Approve for an old head and a duplicate event |
| A06 | Organization/enterprise policy is unknown |
| A07 | Approval Evidence exists, but CI and other requirements are unknown |

## Try it

1. Read `reference-notes.md.template` and confirm the boundary of each concept.
2. In `approval-policy.md.template`, write the check order, claims permitted at each boundary, and stop criteria.
3. Evaluate each review event for A01–A07 individually.
4. Record the event ID, actor, target head, stale status, duplicate status, and count eligibility.
5. Remove duplicates and use only the current head before calculating the distinct eligible count.
6. Confirm that every element in the changed-file set is covered by the pattern. Distinguish an empty list from a missing list.
7. Confirm the required count and effective policy.
8. If other gates such as CI are unknown, distinguish the approval requirement from mergeability.
9. Map missing information into `escalation-plan.md.template`.

## Optional: Compare

First decide whether the PR is "approved" using one word, then use the worksheet to decompose the decision into per-event and rollup stages. Compare incorrect votes, all-files misjudgments, assumed higher-level policy, overclaiming mergeability, and verification burden rather than the number of stopped cases.

## Verification points

- Assessment, formal event, count eligibility, and mergeability are distinguished.
- Actor, head, stale status, and duplicate status are checked for each event.
- Per-event eligibility is separated from aggregate rollup.
- The entire changed-file set is evaluated.
- The decision is held when enterprise/organization policy is unknown.
- Even when the approval conditions are satisfied, the PR is not declared mergeable if other gates are unknown.
- No addition needed, hold, and stop are all valid results.

## Further exploration

- Combine A03 and A04, and explain "insufficient votes" separately from "insufficient all-files coverage."
- To observe a real Approve and whether it counts, see [Limited observation of Approval](optional/approvals.md).

## Constraints, fallback, and safety

- In the main scenario, do not change review requests, Approve events, dismissals, settings, rulesets, CI, or merge state.
- Do not convert a true value or positive assessment in the packet into a vote in a real repository.
- If the effective policy is unknown, do not fill it in from repository settings alone.
- Reusing stale/duplicate events or loosening a ruleset is not a fallback.
- Even without access to a real environment, the scenario can be completed using only the synthetic packets and worksheets.
- `evidence` means material or observations supporting an individual claim; it is not a submission bundle.
