# HC-020 Provide a dedicated Tool from a VS Code extension

**Language:** [日本語](../../../challenges/hc-020/README.md) / **English**

## Scenario

There is a small process that counts `## Evidence`, `## Unknowns`, and `[[source:...]]` in a Markdown draft. Plain Node.js is sufficient for the process itself, but making it a Language Model Tool that a model can call requires designing the input, description, confirmation, errors, cancellation, and disposal.

In this scenario, you will verify the same pure analyzer with Node.js and review the Tool wrapper and Chat Participant examples as inactive `*.template` files. Even when the literal counts are correct, do not claim that the document's meaning or cited sources are correct.

## What this feature is

| Mechanism | Role |
|---|---|
| Language Model Tool | A function that a model calls as needed. It requires a declaration in `package.json` and registration with `vscode.lm.registerTool` |
| Chat Participant | A conversation entry point selected with `@`. It handles requests and streamed responses, and a model call is not required |
| Custom Agent | A mechanism for defining a role, Instructions, and tool composition. It is separate from registering a function through an extension API |
| Subagent | Execution delegated to a separate context. It is not another name for a Participant |
| Agent Plugin | A mechanism for distributing Skills and related components together. It is not the VS Code extension runtime itself |
| Plain Node.js | The baseline for verifying the pure calculation. It does not reproduce Tool discovery, confirmation UI, cancellation UI, or lifecycle |

Even if Node.js and the Tool return the same numbers, that does not prove that the Tool was registered, discovered, selected, confirmed, or cancelled.

References: [Language Model Tool API](https://code.visualstudio.com/api/extension-guides/ai/tools), [Chat Participant API](https://code.visualstudio.com/api/extension-guides/ai/chat), [AI extensibility overview](https://code.visualstudio.com/api/extension-guides/ai/ai-extensibility-overview)

## Good fit / Not a good fit

**Good fit**

- Designing a pure function that can be shared by Node.js and a future Tool entry point
- Creating bounded input, explicit errors, and an honest output description
- Inspecting a wrapper contract that includes confirmation, cancellation, and Disposable handling
- Explaining a decision that Node.js alone is sufficient

**Not a good fit**

- Copying the same process into separate Node and Tool versions
- Calling a literal counter a Markdown parser, source verifier, or semantic evaluator
- Treating success in a stub or Node.js as success in a Development Host
- Creating an active extension in this repository

## Goals

1. Run the fixed four lines through the same analyzer in three states and verify the literal counts.
2. Explain the contract for input/output, errors, confirmation, cancellation, and lifecycle.
3. Distinguish Tool, Participant, Custom Agent, Subagent, and Agent Plugin.
4. Decide whether adding a Tool entry point provides value or Node.js is sufficient.

## What you need

- A working environment that has completed the [repository-wide getting started steps](../../README.md#getting-started)
- Node.js 22 or later
- The following materials under `starter/`
  - [Fixed request](../../../challenges/hc-020/starter/request.txt.template)
  - [Fixed four lines](../../../challenges/hc-020/starter/fixtures/counter-draft.txt.template)
  - [Pure analyzer](../../../challenges/hc-020/starter/helpers/analyzer.cjs.template)
  - [Tool / Participant wrapper example](../../../challenges/hc-020/starter/examples/extension.cjs.template)
  - [`package.json` example](../../../challenges/hc-020/starter/examples/package.json.template)
  - [Design worksheet](../../../challenges/hc-020/starter/worksheets/design.md.template)
  - [Count record worksheet](../../../challenges/hc-020/starter/worksheets/counts.md.template)
  - [Input contract worksheet](../../../challenges/hc-020/starter/worksheets/input-contract.md.template)

The VS Code API, a Development Host, extension installation, and an LLM are not required for the main scenario.

## Preparation

The fixed body is the following four lines. Preserve one terminating LF after the fourth line.

```text
## Evidence
[[source:README.md#L1-L2]]
## Unknowns
Runtime behavior has not been verified.
```

`[[source:README.md#L1-L2]]` is a synthetic string for literal counting. It does not verify a real file, quoted lines, or the correctness of a claim.

The analyzer's input contract is as follows.

- In JSON, an object whose only own field is `text`
- `text` is a string that is neither empty nor whitespace-only
- The limit is 8,192 Unicode code points. 8,193 or more raises a RangeError
- TypeError: `Provide exactly one nonempty string field named text.`
- RangeError: `Draft text exceeds 8192 Unicode code points.`
- Normalize CRLF to LF
- Count lines whose entire content is `## Evidence` / `## Unknowns`, allowing trailing spaces / tabs
- It also counts matches inside fenced code blocks, so it is not a Markdown parser
- It only counts markers shaped like `[[source:...]]`; it does not open paths or URLs

The output has exactly four fields: `evidenceSections`, `unknownSections`, `citationMarkers`, and `semanticValidation`. `semanticValidation` is always `not-performed`.

## Try it

Run the following from the repository root. Do not modify the fixture itself; create only the missing-heading state in memory.

```powershell
node --input-type=commonjs -e "const path=require('node:path'); const fs=require('node:fs'); const {analyze}=require(path.resolve(process.argv[1])); const original=fs.readFileSync(process.argv[2],'utf8'); const missing=original.replace(/^## Unknowns\r?\n/m,''); for (const [state,text] of [['original',original],['missing-heading',missing],['restored',original]]) console.log(state, JSON.stringify(analyze({text})));" .\challenges\hc-020\starter\helpers\analyzer.cjs.template .\challenges\hc-020\starter\fixtures\counter-draft.txt.template
```

The expected literal counts are as follows.

| state | Change | `evidenceSections` | `unknownSections` | `citationMarkers` |
|---|---|---:|---:|---:|
| original | Fixed four lines + terminating LF | 1 | 1 | 1 |
| missing-heading | Remove only `## Unknowns` and its line break. Keep the final sentence | 1 | 0 | 1 |
| restored | Return to the same body as original | 1 | 1 | 1 |

Record the results in the [count record worksheet](../../../challenges/hc-020/starter/worksheets/counts.md.template). All three states are valid inputs; do not turn the missing heading into an input error.

Next, read the [Tool wrapper example](../../../challenges/hc-020/starter/examples/extension.cjs.template) and [`package.json` example](../../../challenges/hc-020/starter/examples/package.json.template), then review the [design worksheet](../../../challenges/hc-020/starter/worksheets/design.md.template) and [input contract worksheet](../../../challenges/hc-020/starter/worksheets/input-contract.md.template).

- Tool registration name: `count_workshop_evidence`
- Prompt reference name: `workshopEvidence`
- Participant ID: `workshop-local.evidence-counter.reader`
- Participant reference name: `workshop-evidence`
- `prepareInvocation`: Validate the input with the same analyzer and return confirmation text
- `invoke`: Check for cancellation before calling the same analyzer
- Cancellation message: `Evidence counting was cancelled.`
- Add the Tool and Participant Disposables to `context.subscriptions`

Checking for cancellation at the entry point of a synchronous counter is different from being able to forcibly stop a long-running process in progress.

## Optional: Compare

Briefly compare the following for the same fixed request.

1. Expose only the Node.js entry point.
2. Keep the pure analyzer unchanged and add a Tool entry point.

Compare users, call frequency, confirmation UI, error explanations, maintenance burden, and discoverability. Even if the count results are the same, the value of the entry points is not necessarily the same. No addition, equivalence, and additional complexity are also valid conclusions.

## Verification points

- Did the three states produce `[1,1,1] → [1,0,1] → [1,1,1]`?
- Do Node.js and the wrapper use the same `analyze` function?
- Does the contract reject additional fields, whitespace-only input, and 8,193 code points?
- Did you correctly explain the four output fields and `not-performed`?
- Did you treat the Tool and Participant as separate entry points?
- Did you avoid elevating Node.js results into observations of registration, discovery, confirmation, or cancellation?

## Further exploration

- [Observe a Language Model Tool in a Development Host](optional/extension-tool-host.md)
- [Observe a Chat Participant in a Development Host](optional/chat-participant-host.md)

Both are optional explorations performed in an approved, independent development folder. Do not rename this repository's `*.template` files.

## Constraints, fallback, and safety

- The analyzer is a pure function with no file / network I/O or external dependencies.
- Literal counts do not verify Markdown structure, sources / URLs, quoted content, or semantic correctness.
- In addition to the JSON Schema in `package.json.template`, the analyzer itself checks the 8,192 Unicode code point limit.
- The wrapper and `package.json` examples are inactive. Do not create or install an active extension in this repository.
- Even without a Development Host, you can complete the scenario by using Node.js to verify the three states and reviewing the contract.
- If Node.js is unavailable, manually inspect the fixed four lines and the regex targets, and record the execution result as `not-observed`.
- During Host exploration, do not install into a normal profile, overwrite an existing package, publish to Marketplace, or make an unknown model call.
