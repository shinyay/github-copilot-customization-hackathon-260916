# Observe a Skill in Cloud Agent

**Language:** [日本語](../../../../challenges/hc-033/optional/cloud-skill.md) / **English**

[← HC-033 main scenario](../README.md)

## Purpose

In an approved dedicated repository, make limited observations of Skill discovery, body use, and resource reading. Do not run a script during the initial verification.

## Prerequisites

- Cloud Agent and the target repository are available
- The starting branch and the source repository/ref/file storing the Skill can be identified
- The raw bytes of the Skill body and all resources can be saved
- Resource contents have passed a safety review

## Permissions and safety

- Obtain prior approval for saving the active Skill, running the Cloud task, selecting the model, incurring costs, and removing the addition at the end.
- Do not use actual CSV data, a database, import, replay, or production data.
- Exclude scripts from the initial scope and do not run them even if they are linked.

## Procedure

1. Record the storage source, revision, and individual hashes for the Skill and resources.
2. Run either `replay-plan` or `journal-boundary` with a fixed request.
3. Retain only records that directly verify the description, body, and resource stages.
4. Verify the source evidence, database unknowns, and stop conditions.
5. After the experiment, remove only the active Skill you added.

## What to observe

- Whether the Skill appeared as an option
- Whether body use can be directly confirmed
- Whether reading the checklist can be directly confirmed
- Whether the script remains unexecuted
- Whether use is being inferred only from a link or similar response

## Stop conditions

- Any of eligibility, approval, starting branch, or Skill/resource bytes is unknown
- The resource safety review is incomplete
- Verification would require running a script, database, import, or replay
- The model, cost, or attempt limit has not been set

[← Back to the HC-033 main scenario](../README.md)
