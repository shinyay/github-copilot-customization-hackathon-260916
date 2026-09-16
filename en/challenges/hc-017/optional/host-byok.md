# Exploration guide for evaluating BYOK in Agent Host

**Language:** [日本語](../../../../challenges/hc-017/optional/host-byok.md) / **English**

## Purpose

This supplementary guide safely observes the path that uses a provider from Agent Host, separately from the [HC-017 main guide](../README.md) and BYOK in a local client. Do not treat a successful local connection as success in the Host.

## Prerequisites

- You can verify a supported Agent Host and execution OS
- You can verify the usage conditions for required Experimental settings, the provider, the actual model ID, and secure input
- You can verify eligibility and organizational policy for the Host, Copilot, provider, and model
- You can record the Host's execution location, profile data, settings storage location, and differences from the local client

## Permissions and safety

- Obtain separate permission for Experimental settings, provider registration, credential entry, the first communication from the Host, and incurring costs.
- Limit candidate input to approved, harmless synthetic text.
- Do not send or modify private code, the fixed input from the main guide, existing profile data, or ordinary User settings.
- Do not leave secrets in the repository or logs.

## Procedure

1. Verify the Host's supported OS, settings surface, provider support, and execution location in official documentation.
2. Organize which settings are shared and not shared between the local client and Host.
3. Record the visible portion of the Host settings and provider selection before starting.
4. Only when every approval is in place, select the provider through the Host's official procedure and send harmless synthetic text once.
5. Record the model display, response, and cost information observable in the Host.
6. Revert only the Host settings you changed and verify restoration.

## What to observe

- Host and execution OS
- Settings differences from the local client
- Requested provider / model and observed display
- Results of verifying secure input, communication, response, and cost
- Host state after cleanup

A single response in the Host does not demonstrate the model comparison from the main guide, the local path, or the quality of a private task.

## Stop conditions

- Approval is incomplete for the supported Host / OS, Experimental settings, provider, credentials, or cost
- Verification is possible only in the local client
- Proceeding requires private code, the fixed input from the main guide, or changes to an ordinary profile
- You cannot safely revert only the Host-side changes

[Back to the HC-017 main guide](../README.md)
