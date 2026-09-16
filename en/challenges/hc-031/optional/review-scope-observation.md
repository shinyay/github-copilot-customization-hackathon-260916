# Observe Instructions scope in code review

**Language:** [日本語](../../../../challenges/hc-031/optional/review-scope-observation.md) / **English**

[← HC-031 main scenario](../README.md)

## Purpose

Make limited observations of the supply scope for Instructions on Java, XML, and mixed diffs in standard Copilot code review.

## Prerequisites

- Copilot code review and the target repository are available
- The target PR/head and Java/XML/mixed diffs can be identified
- The revision and raw bytes of the Instructions drafts can be saved
- The available attribution display can be verified

## Permissions and safety

- Obtain prior approval for placing active Instructions, requesting or re-requesting reviews, and updating the head.
- Redact private review logs, actors, and source when sharing.
- Do not use a reply to a review comment as a substitute for a new prompt or re-review.

## Procedure

1. Record each Java, XML, and mixed diff and its head SHA.
2. Separate the check without Instructions from the check with approved drafts in place.
3. Request one review for each head.
4. Record only the drafts, paths, and revisions that can be confirmed directly from attribution.
5. Return design predictions and actual observations to separate fields in the scope matrix.

## What to observe

- Mapping between PR/head and task
- Draft hash and attribution
- Differences in supply for Java/XML/mixed
- Product exclusion intended by `excludeAgent`
- Whether supply is being inferred only because the response content is similar

## Stop conditions

- Any of review eligibility, approval, target revision, draft bytes, or attribution scope is unknown
- Java/XML/mixed inputs cannot be prepared under the same conditions
- Supply would have to be inferred only from a reply, response language, or source access
- Review requests would have to be repeated without limit

[← Back to the HC-031 main scenario](../README.md)
