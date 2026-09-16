# Observe standard review effort within a limited scope

**Language:** [日本語](../../../../challenges/hc-037/optional/review-effort-live.md) / **English**

[Return to the HC-037 main scenario](../README.md)

## Purpose

Request Lite and Balanced once each for the same candidate PR, and separately record the observable ranges of requested effort, displayed effective effort, findings, verification burden, and cost. This supplements the main scenario by checking its evaluation plan against the real service; performing it is optional.

## Prerequisites

- You have a dedicated candidate PR that you are allowed to change.
- You can hold the diff, full request text, base/head, and evaluation rules constant.
- You can use Copilot code review and both effort levels.
- You can check the effects of existing automatic reviews and shared settings.
- Limits for request count, cost, and time, as well as the person responsible at the end, have been decided.

## Permissions and safety

- Obtain explicit permission for the target repository, PR changes, and each review request.
- Do not copy private diffs, tokens, personal information, or raw logs to an external location.
- Do not delete shared settings, roll back history, or make unlimited repeated requests.
- Limit cleanup to only the candidate and requests you added yourself.

## Procedure

1. Record the candidate revision, base/head, full request text, and evaluation rules.
2. Check for residual conditions such as existing reviews, Memory, Instructions, and Skills; mark anything unclear as unknown.
3. Request Lite exactly once and record the visible items among requested/effective effort, actor, findings, start/end, verification burden, and cost.
4. Request Balanced exactly once with the same head and request, and record the same items.
5. Trace each finding back to changed lines and source/tests, then classify it as supported, unsupported, duplicate, or a potential false positive.
6. Do not convert a failure or missing observation on one side into 0 findings; determine whether the results are comparable.
7. After completion, clean up only your own test artifacts in accordance with the approved scope.

## What to observe

| Item | What to record separately |
|---|---|
| effort | requested and the effective effort visible in the UI or result |
| review | actor, target head, finding text, evidence |
| quality | supported, unsupported, false positive, potential miss |
| burden | duplicates, verification time, additional investigation |
| operations | request count, time, cost, effect of existing automatic reviews |

Do not infer invisible values such as the internal model, agentic fallback, or CI visibility.

## Stop conditions

- You cannot hold the diff, request, base/head, or displayed effective effort constant.
- There is no approval for the review request or incurred cost.
- You would need to compare a result from only one side with 0 findings for the unrun side.
- You would need to exceed the repeated-request limit, change shared settings, or copy confidential information.

## Return to the main scenario

Map the observations to the evaluation items in the main scenario, then use the [HC-037 verification points](../README.md#verification-points) to check that you are not making excessive claims.
