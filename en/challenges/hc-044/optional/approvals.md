# Observe Approval in a limited way

**Language:** [日本語](../../../../challenges/hc-044/optional/approvals.md) / **English**

[Return to the HC-044 main scenario](../README.md)

## Purpose

In an approved target repository, observe in a limited way a positive assessment, formal Approve event, counting toward required approvals, the approval requirement, and mergeability. Do not make setting changes or merging a success condition.

## Prerequisites

- You can fix the target repository, PR, current head, and changed files.
- You can confirm the required count and the effective enterprise/organization/repository policy.
- You can confirm the release state and eligibility for Copilot code review Approvals.
- Normal review permissions, a run limit, and a person responsible for stopping are defined.

## Permissions and safety

- Obtain separate permission for the review request, Approve observation, cost, and logging scope.
- Do not make unapproved setting or ruleset changes, request additional reviewers, or merge.
- Do not reuse a stale event or duplicate event.
- Do not copy private PR content or personal information outside the repository.

## Procedure

1. Record the current head, changed files, required count, effective policy, and other gates.
2. Confirm Approve permission and the count-toward-required-approvals setting separately.
3. After approval, request only one limited review.
4. Record the assessment and formal review event separately.
5. For each event, confirm actor eligibility, target head, stale/duplicate status, and path coverage.
6. Compare the distinct eligible count with the required count.
7. Separate the approval requirement from other gates such as CI, and record mergeability only to the extent observed.

## What to observe

- Assessment
- Formal event ID/state
- Actor, target head, and stale/duplicate status
- Approve permission and count eligibility
- All-files coverage
- Distinct eligible count and required count
- Effective policy
- CI, conversation, deployment, and other gates

## Stop conditions

- The release state, eligibility, effective policy, or current head/all files is unknown.
- An unapproved setting or ruleset change is necessary.
- The eligible actor, required count, or retry limit is unknown.
- Mergeability would need to be claimed from approval Evidence alone.

## Return to the main scenario

Map the results back to the [HC-044 verification points](../README.md#verification-points), separating assessment, vote, requirement, and mergeability.
