# Observe code review setup

**Language:** [日本語](../../../../challenges/hc-035/optional/review-setup.md) / **English**

[← HC-035 main scenario](../README.md)

## Purpose

Using a small approved review, make limited observations of whether Copilot code review uses dedicated setup or shared setup.

## Prerequisites

- Copilot code review, GitHub Actions, and the target repository are available
- The target PR/head and corresponding Ubuntu runner can be identified
- Candidate revisions/raw bytes for dedicated setup and shared setup can be saved

## Permissions and safety

- Obtain prior approval for saving the active setup, requesting the review, using the runner, and removing the addition at the end.
- Do not generalize Cloud Agent runner support to code review.
- Do not read, display, register, move, or request secret values.

## Procedure

1. Record the target head and the candidate revisions and bytes of the dedicated/shared setup.
2. Select one to verify and do not add comparison factors.
3. Save the approved setup and request one review.
4. Record only the scope in which the adopted setup revision, runner, and each step can be directly verified.
5. After the experiment, remove only the setup you added.

## What to observe

- Selection between dedicated setup and shared setup
- Adopted revision and review head
- Runner and each step
- Difference between setup success/failure and the review result
- Whether the setup ref is being inferred from the Instructions head-adoption rule

## Stop conditions

- Any of review eligibility, approval, target head, runner, or setup bytes is unknown
- The person responsible for selecting dedicated/shared setup is unknown
- Cloud Agent support information would be needed to fill gaps
- Review requests would have to be repeated without limit

[← Back to the HC-035 main scenario](../README.md)
