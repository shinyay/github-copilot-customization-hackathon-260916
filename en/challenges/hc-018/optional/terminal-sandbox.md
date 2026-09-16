# Exploration guide for evaluating the terminal sandbox

**Language:** [日本語](../../../../challenges/hc-018/optional/terminal-sandbox.md) / **English**

## Purpose

This supplementary guide organizes the conditions for a limited evaluation of the Preview terminal sandbox, separately from the [HC-018 main guide](../README.md). Do not treat the synthetic packets or normal output from `node --version` in the main guide as an observation of a real sandbox.

## Prerequisites

- You can verify the supported client and Preview feature in official documentation
- The execution host is macOS, Linux, or WSL2 for which support is explicitly documented
- You can prepare an isolated workspace and a dummy path you own
- You can verify the initial state and restoration method
- You can perform a limited operation without installing additional dependencies

If only Windows native is available, do not infer support; stop after checking the documentation.

## Permissions and safety

- Obtain advance permission to enable the sandbox, use ordinary approval, perform a limited operation on the dummy path, and restore the state.
- Do not include elevation, removal of protections, the home directory, network access, or resetting existing approval rules.
- Do not add active settings or a probe program to this repository.
- Do not write outside a dummy path you own.

## Procedure

1. In the client's official documentation, verify the supported OS, target tools, limitations, and configuration location.
2. Select an isolated workspace and owned dummy path, and record the initial state.
3. Review the operation, cwd, change scope, expected OS result, and expected program result in advance.
4. Only when every approval is in place, enable the sandbox through the official UI and perform the limited operation once through ordinary approval.
5. Record proposal, approval, execution, OS result, and program result separately.
6. Revert only your changes and settings, then compare with the initial state.

## What to observe

- Client, host OS, and target terminal tool
- Visible portion of the sandbox settings
- Proposal and human decision
- Whether execution began
- Results returned by the OS and program
- Changes to the dummy path and their restoration
- Boundaries you could not verify

Normal execution does not prove a denial boundary, and one denial does not prove protection of every filesystem location, tool, or network path.

## Stop conditions

- Only Windows native, an unsupported OS, or an unverified Preview is available
- Proceeding requires installing dependencies, elevation, removing protections, or home / network operations
- You cannot verify an owned dummy path and restoration method
- Proceeding requires untraceable changes to User / Profile settings
- Observation requires bypassing or resetting approval

[Back to the HC-018 main guide](../README.md)
