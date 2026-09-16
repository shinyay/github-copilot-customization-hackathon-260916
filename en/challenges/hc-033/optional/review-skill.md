# Observe a Skill in code review

**Language:** [日本語](../../../../challenges/hc-033/optional/review-skill.md) / **English**

[← HC-033 main scenario](../README.md)

## Purpose

For a review-focused task, make limited observations of whether Copilot code review used a Skill's description, body, and resource. Do not mix this with the HC-033 CSV replay task.

## Prerequisites

- Copilot code review and the target repository are available
- The target PR/head and review-focused task can be identified
- The revision and raw bytes of the Skill body/resources can be saved
- The available attribution display can be verified

## Permissions and safety

- Obtain prior approval for saving the active Skill, requesting or re-requesting a review, and removing the addition at the end.
- Do not reuse Cloud Agent records as code review observations.
- Redact private logs, actors, and source when sharing.

## Procedure

1. Record the target head, Skill revision, and body/resource hashes.
2. Prepare a small review-focused diff.
3. Request one approved review.
4. Record the scope of description/body/resource use that can be confirmed directly from attribution.
5. Record unobservable stages as `not-observed` and do not repeat additional requests.
6. After the experiment, remove only the active Skill you added.

## What to observe

- Mapping between the target head and Skill revision
- Each description, body, and resource stage
- Review evidence that traces back to source
- Whether observations depend only on a link or a similar response

## Stop conditions

- Any of review eligibility, target head, requester, Skill bytes, or observation scope is unknown
- Active storage or the review request is not approved
- Cloud Agent records would be needed to fill gaps
- Review requests would have to be repeated without limit

[← Back to the HC-033 main scenario](../README.md)
