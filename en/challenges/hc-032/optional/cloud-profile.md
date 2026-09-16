# Observe a profile in Cloud Agent

**Language:** [日本語](../../../../challenges/hc-032/optional/cloud-profile.md) / **English**

[← HC-032 main scenario](../README.md)

## Purpose

In an approved dedicated repository, make limited observations of a Custom Agent profile's storage source, selection, version, effective tools, and actual calls.

## Prerequisites

- Cloud Agent and the target repository are available
- The starting branch and the repository/ref/file storing the profile can be identified
- The raw bytes of the control and investigation profiles can be saved
- Limits can be set for the model, cost, and number of attempts

## Permissions and safety

- Obtain prior approval for saving and selecting the active profile, running the Cloud task, using the model, and removing the addition at the end.
- Do not treat the role body as an ACL or test its limits with dangerous write/post commands.
- Remove only the profiles you added; do not delete shared settings or history.

## Procedure

1. Record the profile's repository/ref/file, raw hash, and display name.
2. Explicitly select either the control or investigation profile.
3. Run the task only once using the same `approval-trace` request.
4. Transcribe only records that directly confirm selection, effective tools, and actual calls.
5. Verify the quality of the source evidence, unknowns, and handoff.
6. After the experiment, remove the active profile you added.

## What to observe

- Match between the saved profile and selected profile
- Difference between declared tools and effective tools
- Actual call ID, tool, input, and result
- Difference between prohibitions in the role body and actual permissions
- Whether facts outside the source are being invented

## Stop conditions

- Any of eligibility, approval, starting branch, or profile bytes is unknown
- Limits for the model, cost, or number of attempts have not been set
- Effective tools or calls would have to be inferred only from declared tools
- Write/post operations or changes to shared settings would be required

[← Back to the HC-032 main scenario](../README.md)
