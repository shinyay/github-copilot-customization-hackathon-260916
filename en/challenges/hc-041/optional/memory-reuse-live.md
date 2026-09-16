# Observe Memory reuse in a limited way

**Language:** [日本語](../../../../challenges/hc-041/optional/memory-reuse-live.md) / **English**

[Return to the HC-041 main scenario](../README.md)

## Purpose

In a dedicated repository, observe in a limited way the storage candidacy, eligibility, use in Cloud, use in standard review, and persistence of an identifiable repository fact that you added. This is not a procedure for deleting all Memory or creating an "empty control."

## Prerequisites

- You can identify the target account, dedicated repository, and current branch.
- You can confirm eligibility to use GitHub Copilot Memory, Cloud, and standard review.
- You understand the scope affected by the user-level setting.
- You can distinguish records you added from existing records.
- You have a plan to observe Cloud and review independently.

## Permissions and safety

- Obtain separate permission for the Memory setting, limited record creation, Cloud/review trials, and end-of-test cleanup.
- Do not put real secrets, personal information, or private content into the fact.
- Do not delete all Memory, delete records that cannot be identified, or operate Memory in another product.
- Do not treat a new session or disabling a setting as Evidence of deletion or an empty state.

## Procedure

1. Record the target repository/branch, fact content, citation path/revision, and identifier.
2. Confirm separately that the current citation supports the fact and that the fact is eligible on the target surface.
3. After approval, create the limited record and note whether direct Evidence of storage exists.
4. Independently check for direct Evidence that the same repository fact was used once in Cloud and once in standard review.
5. Do not decide that it was used based only on a self-report in the response body.
6. Separate observations of persistence, retention, and cleanup, and handle only the records you added through the approved procedure.

## What to observe

- Repository, branch, fact, and citation
- Setting scope and Evidence of storage
- Eligibility and use for Cloud and review separately
- Current source support
- Persistence, retention, and cleanup
- Unknowns and reasons they cannot be checked

## Stop conditions

- You cannot identify the records you added.
- You cannot confirm the setting's impact across the user scope.
- You cannot observe Cloud and review independently.
- You would need to delete all existing Memory or records that cannot be identified.
- You would need to mix another product's Memory operations into the same verification.

## Return to the main scenario

Map the observations back to the [HC-041 verification points](../README.md#verification-points), keeping supported, eligible, used, stored, retained, and deleted separate.
