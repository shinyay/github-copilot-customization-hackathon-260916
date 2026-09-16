# HC-011 Build an MCP Tool That Safely Retrieves Operations Notes

**Language:** [日本語](../../../challenges/hc-011/README.md) / **English**

## Scenario

When operations notes are copied and pasted each time, it becomes unclear which key was used to retrieve them, whether retrieval failed, and how much of the information came from code. At the same time, there is no need to connect to the production note system for a learning exercise.

In this scenario, you use a dependency-free local MCP server that returns exactly one synthetic training note, and compare manual reading, tool-based retrieval, and explicit errors.

## What this feature is

MCP (Model Context Protocol) is a protocol through which a client can use external tools and resources through a common interface. The bundled server runs over stdio and exposes one read-only tool, `lookup_training_note`.

The fixed key is `order-import-replay`. On success, the tool returns JSON text and `structuredContent`, distinguishing among the following:

- A code-derived fact that can be read from the fixed source excerpts
- A fictional operations note explicitly labeled `SYNTHETIC_TRAINING_ONLY`
- Information that cannot be confirmed as actual history or the current production state

An MCP Tool makes its input and return value easier to trace, but it does not automatically guarantee permissions, data classification, process management, or the correctness of an answer.

## Good fit / Not a good fit

**Good fit**

- A read-only lookup with a clear schema
- Learning about a tool boundary with a synthetic fixture
- Treating an invalid argument and an unknown key as different errors
- Comparing the traceability of manual copy/paste with tool input

**Not a good fit**

- Connecting to production or customer data without authorization
- Embedding secrets in configuration or source
- Adding write/delete operations to the first exercise
- Hiding a tool error in natural language and treating it as success

## Goals

1. Summarize the source excerpts, synthetic note, and unknown information separately.
2. Pass the fixed key to `lookup_training_note` and retrieve the same information.
3. Preserve the errors for `Order/Import` and `missing-note`.
4. Start and stop the server as a stdio subprocess owned by the MCP client, without adding unnecessary network connections or permissions.

## What you need

- Node.js 22 or later
- A client that supports MCP Tools (optional)
- A terminal and text editor

## Preparation

See [Getting started in the repository README](../../README.md#getting-started) for the common initial steps.

Contents of `starter/`:

```text
starter\
├─ request.txt.template
├─ customization\mcp.json.template
├─ fixtures\operations-note.json.template
├─ reference\
│  ├─ OrderGroup.java.excerpt.md.template
│  └─ OrderImportService.java.excerpt.md.template
├─ tools\mcp\training-notes-server.mjs.template
└─ worksheets\comparison.md.template
```

All of these files are distribution source materials. This repository does not create an MCP configuration with the `.template` suffix removed. To try the server, copy the files to a separate disposable workspace in the following form, and remove the suffix only from the copies.

```text
manual\hc-011\
├─ fixtures\operations-note.json
└─ tools\mcp\training-notes-server.mjs
```

To try a client configuration, refer to `starter\customization\mcp.json.template` and configure a disposable workspace according to the target client's official instructions and your organization's policies.
In the client flow, do not start the server from a terminal first. The configured MCP client uses `command` and `args` to
launch the stdio subprocess and owns its connection and termination.

The two source excerpts are fixed inputs created from the source of the public upstream template
`shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`.
The local `HEAD` of a runtime workspace created from the template is not required to match the upstream
revision.

## Try it

1. Read `starter\request.txt.template` and the two source excerpts.
2. Read `starter\fixtures\operations-note.json.template` directly, and summarize the code-derived fact, synthetic note, and unknown information separately.
3. Place the server, fixture, and MCP configuration in a disposable workspace, and confirm that the configuration's `command` and `args` point to the working copy of the server.
4. Load the configuration in an MCP-capable client. After the client launches the stdio subprocess, call `lookup_training_note` and pass `order-import-replay` as `noteKey`. Do not start the server manually from another terminal.
5. Pass `Order/Import` and verify that `INVALID_ARGUMENT` is returned, then pass `missing-note` and verify that `NOT_FOUND` is returned.
6. Confirm that the assistant's summary does not restate an error as success and preserves the note's training-only label.
7. Disconnect or exit the client, and confirm that the server subprocess owned by the client is no longer running.

## Optional: Compare

Use `starter\worksheets\comparison.md.template` to briefly compare manual reading and the MCP Tool for the same request and fixture. Do not give extra explanation only to the manual approach or use a different note for the tool approach.

## Verification points

- Is `order-import-replay` explicitly shown as the tool input?
- Does the server read nothing other than the local fixture and make no network connection?
- Are the code-derived fact and synthetic note kept separate?
- Are `INVALID_ARGUMENT` and `NOT_FOUND` distinguished?
- Does the response avoid calling a recommendation returned by the tool an actual internal policy or incident history?
- Were you able to terminate the server process?

## Further exploration

- Send an empty string, an extra property, and an unknown tool name, and observe the boundary between protocol errors and tool errors.
- Check the difference between the text and `structuredContent` displayed by the client.
- If you change the schema, recheck both the fixed key's success case and its error cases.

## Constraints, fallback, and safety

- The fixture is training-only and contains no production, customer, or personal data.
- The tool performs only one read-only lookup. Do not add write/delete or network operations.
- `noteKey` is limited to 1–80 lowercase alphanumeric characters and hyphens, and does not accept paths or URLs.
- MCP configuration formats and enablement methods differ by client. Do not change permissions or system settings based on assumptions.
- Even if the client does not support MCP, you can verify the server contract as the following **standalone direct test** by sending JSON-RPC lines to stdin. Only this path has the pipeline start the server process directly, and it must be treated separately from the MCP client flow.

  ```powershell
  @(
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"manual-check","version":"1"}}}',
    '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"lookup_training_note","arguments":{"noteKey":"order-import-replay"}}}'
  ) | node .\manual\hc-011\tools\mcp\training-notes-server.mjs
  ```

- If running local processes is prohibited, read the fixture and server source to inspect the schema and error design, and do not claim any execution results.
