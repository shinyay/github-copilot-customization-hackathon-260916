# Exploration guide for evaluating a BYOK provider

**Language:** [日本語](../../../../challenges/hc-017/optional/byok-provider.md) / **English**

## Purpose

This supplementary guide organizes the conditions for safely evaluating a Bring Your Own Key provider separately from the [HC-017 main guide](../README.md). Do not use the main guide's fixed seven lines or private code; use only approved, harmless synthetic text as a candidate for transmission.

## Prerequisites

- You can verify an approved provider, API, and actual model ID from primary sources
- You can verify eligibility to use the provider and model, organizational policy, data-handling terms, and the permitted cost range
- You can handle credentials through secure input
- You can distinguish existing provider settings from the changes for this evaluation and restore the original state

## Permissions and safety

- Obtain approval separately for provider registration, credential entry, the first transmission, and incurring costs.
- Do not record secrets in the repository, configuration drafts, chat, screen sharing, or shell history.
- Do not send private code, the fixed input from the main guide, or customer data.
- Do not bulk-delete existing providers or keys to create comparison conditions.

## Procedure

1. Verify the endpoint, API, actual model ID, region, data retention, and cost limit in the provider's official documentation.
2. Verify that the target client's official UI provides secure input.
3. Record the visible portion of the provider selection and settings before starting.
4. Only with permission, register the provider and send harmless synthetic text once.
5. Record the requested model separately from the model display observable in the client.
6. Revert only the settings you added and verify restoration.

## What to observe

- Provider, API, requested model, and observed display
- Destination and data-handling terms
- Whether secure input was available
- Whether there was a response and which items could not be observed
- How to verify costs
- State after cleanup

A successful connection does not demonstrate the quality of the main-guide task or the overall safety of the provider.

## Stop conditions

- You do not have permission to register the provider or send data
- Any of the endpoint, API, model ID, cost, or data handling is unknown
- Credentials must be handled in plaintext
- Evaluation requires sending private code or the fixed input from the main guide
- You cannot safely revert only your changes

[Back to the HC-017 main guide](../README.md)
