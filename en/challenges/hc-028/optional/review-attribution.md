# Observe standard review attribution

**Language:** [日本語](../../../../challenges/hc-028/optional/review-attribution.md) / **English**

[← HC-028 main scenario](../README.md)

## Purpose

Observe, within a limited scope, which head and Instructions version a standard Copilot code review directly identifies for the target PR. This is not a procedure for replacing the synthetic-material results with real observations.

## Prerequisites

- Copilot code review is available
- You can identify the target repository, PR, current head, and requester
- You can confirm how to request or rerequest a review and the scope of the displayed session / log
- You can save the raw bytes of the Instructions to be used in advance

## Permissions and safety

- Obtain approval from the repository owner separately before requesting a review, rerequesting it, or updating the head.
- Record only the minimum necessary private logs, actors, and repository names, and redact them when sharing.
- Do not reuse a record from another PR or an old head for the current observation.

## Procedure

1. Record the target PR's head SHA, request time, requester, and the refs and hashes of candidate Instructions.
2. Request one approved review.
3. From the displayed attribution, transcribe only what directly confirms the target head, Instructions file, and revision.
4. If you update the head and observe again, treat it as a separate record.
5. Return the stored version, documented rule, and observed version to separate fields in the HC-028 audit sheet.

## What to observe

- Whether the head at request time matches the head reviewed
- Whether the Instructions path or revision is displayed directly
- Whether attribution merely exists or identifies the specific version
- Whether an old-head result is incorrectly associated with the current head

## Stop conditions

- Any of eligibility, repository settings, requester, or the target PR/head is unknown
- The review or rereview has not been approved
- Attribution does not directly identify the target file or revision
- Missing information would need to be filled from a self-report, response language, or another PR's record

If the version cannot be identified, finish with `not-observed`.

[← Return to the HC-028 main scenario](../README.md)
