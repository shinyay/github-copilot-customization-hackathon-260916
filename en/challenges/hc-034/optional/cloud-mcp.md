# Observe an MCP connection in Cloud Agent

**Language:** [日本語](../../../../challenges/hc-034/optional/cloud-mcp.md) / **English**

[← HC-034 main scenario](../README.md)

## Purpose

Using only a training-specific read-only MCP server, make limited observations in Cloud Agent of configuration storage, server startup, tool listing, adoption, call, and return.

## Prerequisites

- Cloud Agent and the target repository are available
- The owner of the repository's shared MCP configuration can be identified
- The raw bytes and expected hash of `training-v1` can be saved
- A training server that requires no secret and a safe deployment location are available

## Permissions and safety

- Obtain prior approval for the minimal addition to shared settings, server startup, Cloud task, tool call, costs, and removal at the end.
- Do not delete default MCP servers, and restrict the allowlist to `lookup_training_note`.
- Do not handle production data, customer information, secrets, or actual endpoints.

## Procedure

1. Record the existing shared settings and decide the addition and restoration method.
2. Save the revision and raw body hash of `training-v1`.
3. Start the approved training server and verify its protocol and tool schema.
4. Directly confirm that Cloud Agent adopted the target server/tool.
5. Call `lookup_training_note` once and record the arguments, returned revision, and body hash.
6. Compare the code-derived section with source.
7. Stop and remove only the settings and server you added.

## What to observe

- config saved / syntax / started / listed / adopted / called / returned / supported
- Match between expected revision and returned revision
- Distinction among `NOT_FOUND`, invalid arguments, and transport errors
- Difference between local protocol success and Cloud adoption

## Stop conditions

- Any of eligibility, approval, configuration owner, or training note bytes is unknown
- Default settings cannot be protected
- The environment cannot be limited to secret-free training
- The returned revision or body hash does not match
- Cloud adoption would have to be claimed from local protocol results alone

[← Back to the HC-034 main scenario](../README.md)
