# Observe review triggers within a limited scope

**Language:** [日本語](../../../../challenges/hc-036/optional/review-triggers.md) / **English**

[← HC-036 main scenario](../README.md)

## Purpose

In an approved dedicated repository, observe the relationship between automatic review settings and PR events within a limited scope. This is not a procedure for reproducing the 20 synthetic cells unchanged in a real repository.

## Prerequisites

- You can use Copilot code review and the target repository.
- You can identify the repository administrator and setting owner.
- You can decide the target branch, PR/head, and review scope.
- You can confirm the effects of personal, organization, and enterprise settings and rulesets.

## Permissions and safety

- Obtain prior approval for changes to automatic review settings/rulesets, PR events, review requests, head updates, costs, stopping, and restoration.
- Restore only settings you added yourself; do not delete all shared settings.
- Even when no review is triggered, do not repeat review requests without limit.

## Procedure

1. Record the target scope, head, setting source/ref, and actor.
2. Limit each observation to changing one option.
3. Trigger the approved event and record the request ID and time.
4. Track queue, attempt, start, complete, and reviewed head separately.
5. Compare the current head with the reviewed head.
6. After the observation, restore only the settings you added yourself.

## What to observe

- Event type and actor
- Personal/org/enterprise settings, ruleset, and target branch
- request / queue / attempt / complete
- base/head/reviewed head
- Duplicate requests, cost, and request-count limit

## Stop conditions

- Any of the administrator, review eligibility, target scope/head, or setting owner is unknown
- You cannot isolate multiple settings, multiple rulesets, or actor differences
- There is no approval for cost/request-count limits or stopping/restoration
- You would need to repeat additional requests without limit

Do not mix observed real information into the synthetic materials. If necessary, handle it as a separate secure record.

[← Return to the HC-036 main scenario](../README.md)
