# Investigate CLI / App / Cloud as separate clients

**Language:** [日本語](../../../../challenges/hc-025/optional/other-clients.md) / **English**

[Return to the main scenario](../README.md)

## Purpose

Investigate CLI, Copilot App, Cloud Agent, and similar environments as separate clients, and organize where a customization with the same name is discovered and which body, tools, and approval are used. Do not treat Agent Host and Cloud Agent as synonyms.

## Prerequisites

- You can identify one specific client, version, channel, and execution location to investigate
- You can confirm eligibility for that client, model, Plugin component, and Cloud execution
- You have a validation target isolated from the normal environment and a way to restore it afterward

## Permissions and safety

- Obtain separate approval for installation, login, synchronization, Cloud operations, model use, external transmission, and cost.
- Do not change credentials, tokens, a normal profile, synchronization settings, or existing branches without permission.
- Check standard Plugin components separately from client-specific namespaces.
- Do not fill values unknown for one client using results from another client or the current version.

## Procedure

1. Choose one target client and record its official documentation and version.
2. Choose one format to inspect from `../starter/customizations/`.
3. Confirm the placement / installation method and required permissions documented for that client.
4. In an approved isolated environment, perform one check using the fixed request and fixed packet.
5. Record discovery, loading, effective tools, approval, external communication, cost, and errors.
6. Revert only the configuration you added, then treat another client as a new record.

## What to observe

- client / version / execution location
- customization type / source / discovery
- body loading
- declared tools / effective tools
- approval / network / cost
- result / limitation / cleanup

## Stop conditions

- The client, version, or officially supported scope cannot be confirmed
- Installation, login, synchronization, Cloud operations, external transmission, or cost has not been approved
- Private code or credentials cannot be excluded from transmission
- A conclusion would require reusing results from another client
- Changes cannot be safely reverted

Record the stop reason and return to the portability diagnosis in the [main scenario](../README.md).
