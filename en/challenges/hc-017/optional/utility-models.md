# Exploration guide for observing a utility-model path

**Language:** [日本語](../../../../challenges/hc-017/optional/utility-models.md) / **English**

## Purpose

This supplementary guide observes one utility-model path, such as commit-message generation, separately from the Chat model covered in the [HC-017 main guide](../README.md). Do not assume that the model selected in the Chat picker is the effective model for the utility feature.

## Prerequisites

- You can limit the target to one utility feature
- You can prepare the same non-sensitive fixed input and the same workspace state
- You can use the corresponding client, Copilot, and utility feature
- You can verify an official method for displaying or observing the effective model
- If settings changes are required, you can revert only your changes

## Permissions and safety

- Obtain permission in advance for utility generation, observing the effective model, and any required settings changes.
- Do not commit, push, register a provider, or change credentials.
- Do not use private code or customer information as fixed input.
- Do not save generated output in the repository.

## Procedure

1. Choose one utility feature to observe and verify how its input path differs from Chat.
2. Record the non-sensitive fixed input, workspace state, and settings before generation.
3. Verify whether there is a UI or official procedure for observing the effective model.
4. Only with permission, generate once and record the display and generated result.
5. Do not treat the result of providing the same input to ordinary Chat as a substitute observation for the utility path.
6. Revert only the settings you changed and verify restoration.

## What to observe

- Utility feature and input path
- Fixed input and workspace state
- Requested setting and observable model display
- Generated result and missing observations
- Relationship to the Chat model selection
- State after cleanup

Do not extrapolate a single utility observation to the effective Chat-model path or the quality comparison in the main guide.

## Stop conditions

- You cannot verify the utility input path or effective model
- Proceeding requires untraceable changes to User / Profile settings
- Proceeding requires provider registration, credential changes, a commit, or a push
- Observation requires private code
- You cannot safely revert only your changes

[Back to the HC-017 main guide](../README.md)
