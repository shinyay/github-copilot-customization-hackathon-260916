# Observe an MCP connection in code review

**Language:** [日本語](../../../../challenges/hc-034/optional/review-mcp.md) / **English**

[← HC-034 main scenario](../README.md)

## Purpose

In Copilot code review, make limited observations of adoption of a training-specific MCP tool and a read-only lookup.

## Prerequisites

- Copilot code review and the target repository are available
- The target PR/head and requester can be identified
- The owner and user scope of the shared MCP configuration can be verified
- The raw bytes and expected hash of `training-v1` can be saved

## Permissions and safety

- Obtain prior approval for the minimal addition to shared settings, review request, tool call, and removal at the end.
- Do not treat `readOnlyHint` as a guarantee of authorization, ACLs, or harmlessness.
- Protect default servers, shared users, and private logs.

## Procedure

1. Record the target head, configuration revision, and note revision/hash.
2. Add only the training server to the shared settings.
3. Request one approved review.
4. Retain only records that directly confirm tool adoption, call, and return.
5. Compare the returned code-derived section with source.
6. After the experiment, remove only the settings you added.

## What to observe

- Review target head and configuration revision
- Tool adoption, call ID, arguments, and return
- Returned revision/body hash
- `NOT_FOUND`, retrieval errors, and revision mismatches
- Difference between the read-only annotation and implementation safety

## Stop conditions

- Any of review eligibility, target head, requester, configuration owner, or note bytes is unknown
- There is no approval for the effect on shared users or the review request
- Continuing would require treating `readOnlyHint` as a guarantee of safety
- `NOT_FOUND` cannot be distinguished from a retrieval error
- Review requests would have to be repeated without limit

[← Back to the HC-034 main scenario](../README.md)
