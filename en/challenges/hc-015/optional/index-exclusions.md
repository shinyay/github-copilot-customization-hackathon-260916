# Guide to separating the index, search exclusions, and open files

**Language:** [日本語](../../../../challenges/hc-015/optional/index-exclusions.md) / **English**

[Back to the HC-015 main guide](../README.md)

## Purpose

For the same `allocate` query and fixed source, organize the differences among text search, semantic search, explicit attachments,
and open files or selections.
The goal is not to treat search exclusions as an ACL or replace an unprepared or unverified index with "0 search results."

This guide does not change settings or build an index.
It is also a separate exploration from the [Java language service guide](language-tools.md).

## Prerequisites

- You can use a separate workspace and new conversation from the HC-015 main guide.
- You can record the same query, fixed source, exclusion state, open files, and selection.
- You can verify the source and state of the index in the client you are using.
- You can verify eligibility and organizational policy for Copilot, the index service, and the source.
- You can read the source of existing settings without changing them.

The index source may differ among GitHub, Azure DevOps, and other workspaces.
Being able to read a status display does not mean you have verified indexing, communication, or successful search.

## Permissions and safety

- Building the index, communicating with services, and changing workspace settings require separate approval. Do not perform them in this guide.
- Do not modify source files, existing ignore rules, or organizational content exclusion.
- Do not work around reproducibility issues with `force-add` or by switching User/Profile settings.
- Do not use explicit attachments or open files to bypass content exclusion restrictions.
- Search exclusions are not an ACL for protecting secrets.

## Procedure

1. Record the client, runtime workspace, query `allocate`, and upstream template revision. A match with the local `HEAD` is not required.
2. Inspect the effective values and sources of `search.exclude`, `files.exclude`, and `.gitignore` without changing them.
3. Record open files, tabs, and the selection.
4. If you run text/file search, record the target scope, exclusions, and returned paths.
5. Before running semantic search, verify the index source, state, eligibility, and organizational policy.
6. Observe semantic search with the same query and source scope only if the index is available and you have separate approval.
7. If you use explicit attachments, record the exact paths and attachment display separately from search results.
8. Compare text search, semantic search, explicit attachments, and context from open files separately.

### Scope of each setting

| Setting / state | What to distinguish |
|---|---|
| `search.exclude` | Exclusion from text/grep search. It is not an ACL that blocks Explorer display or every context path |
| `files.exclude` | Effects on Explorer and search. Verify the documentation and effective value for the client you are using |
| `.gitignore` | Effects on Git tracking and search. Verify this separately from context from open files or selections |
| Open ignored file / selection | May enter context through a path separate from search exclusions. This does not authorize bypassing content exclusion |
| semantic index | Preparation for semantic search. It does not guarantee source access or full-text supply |

## What to observe

- Query, upstream template revision, and target scope of the runtime workspace
- Value and source of each exclusion setting
- Tabs, open files, and selection
- Paths returned by text/file search
- Index source, state, eligibility, and organizational policy
- Requested and returned scope of semantic search
- Exact paths and display of explicit attachments
- Ranges you could not verify

A Node.js literal scan or values in training JSON are not results from running VS Code search, indexing, or attachment features.

## Stop conditions

- You cannot verify the index source, state, eligibility, or organizational policy.
- Proceeding requires changing settings, building the index, or modifying existing ignore rules.
- Proceeding requires `force-add` or switching User/Profile settings.
- There is a possibility of bypassing organizational content exclusion.
- You cannot keep the query, source, exclusion state, tabs, and selection consistent across methods.

Treat an unverified semantic result as equivalent to `null`; do not fill it with an empty array or zero results.
Even if text search returns zero results, that does not mean the source is absent, reading was denied, or the conclusion is correct.

## How to interpret the result

This guide is a supplement for observing differences among settings and context paths.
It does not prove actual source ACLs, complete context supply, answer quality, or educational effectiveness.

References:

- [Workspace context and exclusion](https://code.visualstudio.com/docs/agents/reference/workspace-context)
- [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)

[Back to the HC-015 main guide](../README.md)
