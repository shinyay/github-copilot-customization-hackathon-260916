# Observe a Cloud handoff in a limited way

**Language:** [日本語](../../../../challenges/hc-045/optional/cloud-handoff.md) / **English**

[Return to the HC-045 main scenario](../README.md)

## Purpose

In an approved review/Cloud environment, observe the process from one finding through a limited request, acceptance, return, and independent validation. Distinguish draft, prepared, sent, accepted, and applied using direct Evidence.

## Prerequisites

- You can fix the target PR, source branch, and current head.
- You can limit the change scope to only `TaxAmounts.java`.
- You can keep `Money.java` and `CommonRulesTest.java` read-only.
- Independent expectations, return information, and stop/restoration methods are defined.
- You are eligible to use code review, Cloud Agent, and the repository/PR.
- The workflow in use can safely preserve the target branch/head and scope.

## Permissions and safety

- Obtain separate permission for request transmission, the Cloud session, source changes, tests, commits, pushes, return, and final confirmation.
- Do not use an allow-all mechanism that expands the scope or edit a no-change path.
- Do not reinterpret the branch/head after the fact; stop for an unexpected return.
- Merge is not included in this observation.

## Procedure

1. Record the finding, human assessment, source anchor, and candidate post-image.
2. Fix the source branch/head, target branch/head, allowed path, read-only paths, expectations, and stop conditions.
3. Have a person review the request draft and confirm the conditions for proceeding to prepared.
4. After approval, send it only once, and record the transmission Evidence separately from acceptance by the recipient.
5. Compare the returned branch/head, changed paths, commit, and test report with the requested scope.
6. Independently verify the bucket count, net, tax, rounding, and changed-path inventory separately from the self-reported test report.
7. Return the final decision to a person, and clean up only your own test changes within the approved scope.

## What to observe

| State | Required direct Evidence |
|---|---|
| draft | Request body |
| prepared | Human confirmation of scope/branch/head/validation |
| sent | Transmission record |
| accepted | Acceptance by the recipient |
| applied | Source/commit at the target head |
| validated | Independent expectations and changed-path check |

## Stop conditions

- The branch/head/scope or independent expectations are unknown.
- A change outside `TaxAmounts.java` is necessary.
- The workflow cannot safely preserve the branch/head.
- Separate permission for the request, source change, test, commit, push, or final confirmation is missing.
- Correctness would need to be established from a self-report alone.

## Return to the main scenario

Map the results back to the [HC-045 verification points](../README.md#verification-points), separating claims from direct Evidence and the handoff from independent validation.
