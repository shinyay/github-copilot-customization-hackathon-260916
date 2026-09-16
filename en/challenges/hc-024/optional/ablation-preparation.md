# Remove each of four mechanisms one at a time

**Language:** [日本語](../../../../challenges/hc-024/optional/ablation-preparation.md) / **English**

## Purpose

The [HC-024 main scenario](../README.md) covers the two factors Instructions and Skill. This supplementary guide removes one component at a time from a full configuration containing Instructions / Skill / Custom Agent / MCP, helping you organize which components were related to the observed results.

The comparison consists of the full configuration plus four single-component removals, for a total of five rows. It is not a design that covers all 16 combinations.

## Prerequisites

- You understand the fixed source, synthetic operations note, request, and evaluation criteria from the main scenario.
- You have an approved, disposable validation environment in which Custom Agent and MCP are available.
- You can keep the same model, effective tools, source, full note, and request across all rows.
- You can approve Agent selection, local server startup, server trust, and resource attachment separately.

## Permissions and safety

- This guide does not grant any permissions.
- Limit MCP to approved read-only resources.
- Do not equate an Agent's tool declarations with effective tools or OS permissions.
- Do not add write access, terminal access, external transmission, or changes to a normal profile.
- Even in the row without MCP, provide the same full operations note as a regular file so that the amount of information remains the same.
- Do not create active Agent / MCP configuration in this teaching repository.

## Procedure

1. Freeze the I, Skill, Agent role, and MCP resource for the full configuration.
2. Create these five rows: full, without-instructions, without-skill, without-agent, and without-mcp.
3. Use the same source, note, request, model, effective tools, and evaluation criteria in every row.
4. For without-mcp, provide as a file the exact same full note that MCP would have returned.
5. Record presence, discovery, loading, resource retrieval, usage, and output effect separately.
6. Separate from the comparison any row in which multiple components changed at once.

## What to observe

- Whether the Agent was selected, and whether its instructions and tools were actually used.
- Whether attaching a resource and the model selecting and calling a tool both occurred.
- Whether the amount of information is the same through MCP and through a file.
- Whether the difference caused by removing one component from full can be explained using the predefined evaluation criteria.
- Whether unobserved or unused values were incorrectly replaced with `false` or success.

Do not use only these five rows to make claims about all untested combinations or general causal relationships.

## Stop conditions

- An unapproved server, trust decision, Agent selection, or resource attachment becomes necessary.
- Only without-mcp has a different amount of information.
- The model or effective tools cannot be kept the same.
- Resource retrieval or tool calls cannot be observed.
- Write access, external transmission, or additional permissions become necessary.

[Return to Further exploration in the HC-024 main scenario](../README.md#further-exploration)
