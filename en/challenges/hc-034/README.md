# HC-034 Design an operations-note MCP call from Cloud Agent

**Language:** [日本語](../../../challenges/hc-034/README.md) / **English**

## Scenario

An investigation of CSV replay may need to consult an operations note in addition to code. When designing retrieval through an MCP tool, it is important not to collapse configuration storage, server startup, tool listing, product adoption, call, return, and validation of the content into a single "success."

In this scenario, handle the same `SYNTHETIC_TRAINING_ONLY` `training-v1` note as an ordinary attachment, an MCP retrieval design, and a manually supplied full-text alternative. Do not start a server, Cloud Agent, code review, network connection, or database.

## What this feature is

MCP (Model Context Protocol) is a connection method that exposes external information or operations as tools. The root key in Cloud-oriented JSON used for shared repository MCP configuration is `mcpServers`. Keep it distinct from the `servers` format used in VS Code's `.vscode/mcp.json`.

This scenario separates the following stages:

| Stage | What to verify | What that alone does not establish |
|---|---|---|
| config saved | Storage location, revision, raw bytes | The server started |
| syntax | JSON and required fields | The product adopted it |
| server started | Process / transport | Tools were listed |
| tools listed | Equivalent of `tools/list` | The target product adopted it |
| product adopted | Product-side selection record | The tool was called |
| called | Call ID, tool, arguments | A response was returned |
| returned | Revision, body, hash | The content supported source |
| content-supported | Verification of a code-derived claim | An actual incident or database state is correct |

`readOnlyHint` does not guarantee authorization, ACLs, harmless implementation, or correctness of returned content.

## Good fit / Not a good fit

**Good fit**

- Read-only lookup with keys, a schema, and revisions
- Recording retrieval success separately from the meaning of returned content
- Designing a comparison of the same information supplied as an attachment and retrieved through a tool
- Distinguishing `NOT_FOUND`, empty results, invalid arguments, and transport errors

**Not a good fit**

- Unauthorized connections to production or customer data
- Embedding secrets, tokens, or actual endpoints
- Reporting `tools/list` as an actual call
- Treating a local protocol check as successful Cloud connectivity
- Hiding important information from the comparison baseline to favor MCP

## Goals

For the `order-import-replay` / `training-v1` note, design and diagnose the following:

1. Inactive MCP configuration in the Cloud format
2. A minimal allowlist for `lookup_training_note`
3. Verification of the revision and raw body hash
4. Success / empty / `INVALID_ARGUMENT` / `NOT_FOUND` / transport error
5. Separation between code-derived claims and synthetic operational prose

## What you need

Fixed source:

- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`

`starter/` contains the following:

- `request.txt.template`: `retrieval-plan` and `retrieval-diagnosis`
- `fixtures/operations-note.json.template`: Fixed training note
- `fixtures/manual-note.json.template`: Identical raw bytes for manual supply
- `fixtures/packets.json.template`: Synthetic records of retrieval stages and errors
- `customization/mcp.json.template`: Inactive draft configuration in the Cloud format
- `retrieval-contract.md.template`: Retrieval contract
- `design.md.template`: Design worksheet
- `worksheets/comparison.md.template`: Optional comparison worksheet

## Preparation

See [Getting started](../../README.md#getting-started) for the common preparation steps.

1. Confirm that the two note files have identical raw bytes.
2. Do not save `customization/mcp.json.template` to repository settings or `.vscode/mcp.json`.
3. Treat the placeholder command / args as unresolved design values, not as an existing server.

## Try it

1. Use `starter/design.md.template` to decide the note key, revision, hash, allowlist, retry behavior, and stop conditions.
2. Verify `mcpServers`, the server name, type, command/args placeholders, and permitted tool in `customization/mcp.json.template`.
3. Write the request/response schema and error classifications in `retrieval-contract.md.template`.
4. For each packet in `fixtures/packets.json.template`, diagnose the stage through which its claims are supported by the material.
5. Do not convert `NOT_FOUND` into an empty success or a transport error into no matching result.
6. Compare the note's code-derived section with the two source files and keep it separate from synthetic operational prose and unverified database state.

## Optional: Compare

Use `starter/worksheets/comparison.md.template` to perform a manual comparison of the following:

- **Baseline**: The same note supplied as an ordinary attachment
- **Customized**: A design that retrieves it with `lookup_training_note`
- **Manual-equivalent**: Manually supply the complete note that the tool is expected to return

Keep the note key, revision, body bytes, source, and packet consistent. Do not claim that the connection path or priority is also identical.

## Verification points

- Did you avoid confusing `mcpServers` with VS Code's `servers`?
- Did you connect the `training-v1` revision to the raw bytes?
- Did you separate saved, started, listed, adopted, called, returned, and supported?
- Did you distinguish `NOT_FOUND`, empty results, `INVALID_ARGUMENT`, and transport errors?
- Did you avoid treating `readOnlyHint` as a guarantee of safety?
- Can the code-derived claim be traced back to the two source files?
- Did you avoid elevating a local check to Cloud adoption?

## Further exploration

- Design a schema for "retrieval succeeded normally, but the result set was empty" separately from `NOT_FOUND`
- Use the [Cloud MCP supplementary guide](optional/cloud-mcp.md) to prepare to observe the connection in Cloud Agent
- Use the [Review MCP supplementary guide](optional/review-mcp.md) to prepare to observe the connection in code review

## Constraints, fallback, and safety

- Do not modify repository settings, `.vscode/mcp.json`, server source, workflows, Java, or databases.
- Do not use a network, secrets, tokens, or actual endpoints.
- Even if MCP is unavailable, you can complete the scenario with the same note attachment, retrieval contract, and packet diagnosis.
- Leave stages where the server or product adoption cannot be verified as `not-observed`.
