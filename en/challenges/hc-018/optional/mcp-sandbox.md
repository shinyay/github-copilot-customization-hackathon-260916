# Exploration guide for evaluating a stdio MCP sandbox

**Language:** [日本語](../../../../challenges/hc-018/optional/mcp-sandbox.md) / **English**

## Purpose

This supplementary guide organizes the conditions for a limited evaluation of the sandbox boundary of a local stdio MCP server, separately from the [HC-018 main guide](../README.md) and the [terminal sandbox guide](terminal-sandbox.md). Do not reuse terminal results as MCP results.

## Prerequisites

- You can use a local stdio path on macOS or Linux
- You already have a narrowly scoped, reviewed server and dummy operation
- You can verify the server startup method, transport, trust, sandbox settings, and approval behavior
- You can prepare an isolated workspace, initial state, and restoration method
- You can use the supported client, Copilot, and MCP feature

Do not infer support for a remote server, a different transport, or Windows.

## Permissions and safety

- Obtain advance permission for local stdio server trust and startup, sandbox settings, approval behavior, the dummy operation, and restoration.
- Do not add a new server, dependency, credential, remote transport, or home / network probe.
- Do not run the server if you cannot review its source and startup method.
- Do not add active MCP configuration or a probe program to this repository.

## Procedure

1. Review the server source, startup command, transport, and tool to be used.
2. Organize in the boundary map which stages the sandbox and approval affect.
3. Record the initial state of the server, workspace, and dummy target.
4. Only when every approval is in place, start the local stdio server and propose the limited dummy operation once.
5. Record tool selection, proposal, approval, execution, OS result, and program result separately.
6. Stop the server and restore only the settings and dummy target you changed.

## What to observe

- Client, host OS, server, transport, and tool
- Server trust and startup method
- Visible portion of the sandbox and approval behavior
- Proposal and human decision
- OS and program results
- Server shutdown and workspace restoration
- Boundaries you could not observe

Do not extrapolate an observation of one stdio server to the terminal, remote MCP, every tool, or every OS.

## Stop conditions

- Only Windows, remote transport, or an unreviewed server is available
- Approval behavior does not match the permitted conditions
- Proceeding requires credentials, network access, home access, dependency installation, or an additional probe path
- You cannot verify the server source or restoration method
- Proceeding requires a detour through User settings or another server

[Back to the HC-018 main guide](../README.md)
