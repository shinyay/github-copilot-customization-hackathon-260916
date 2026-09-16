# HC-038 Classify Cloud Hook failures correctly

**Language:** [日本語](../../../challenges/hc-038/README.md) / **English**

## Scenario

You will consider a design that invokes a checker when a Cloud Agent starts and before tool use. “A Hook was declared,” “it was invoked for the event,” “the checker returned,” and “the tool was permitted” are separate observations. Furthermore, if deny, command error, timeout, and HTTP failure are collapsed into one kind of failure, you will confuse situations that should stop with situations that should return to the normal permission flow.

Using the same complete checker text and synthetic packets E01–E12, you will create a 12-row diagnosis table and inactive `sessionStart` / `preToolUse` connection proposals. You will not enable a real Hook.

## What this feature is

A Hook is a customization that invokes an external checker at a defined event.

- `sessionStart`: preparation checks when a session starts. Success does not prove that all subsequent tools are protected.
- `preToolUse`: a decision immediately before tool use. In Cloud, do not assume behavior identical to local interactive approval.

Representative `preToolUse` inputs are `sessionId`, `timestamp`, `cwd`, `toolName`, and `toolArgs`. The output uses `permissionDecision` and, for a deny, `permissionDecisionReason`. The fixture's `reportedEvent` and `checkerExit` are instructional observation fields, not product fields.

Separate failure boundaries as follows.

| Situation | Handling |
|---|---|
| Explicit allow | A candidate permission decision. Tool completion is a separate observation |
| Explicit deny + reason | deny |
| Cloud `ask` | deny rather than waiting for interaction |
| command crash / nonzero | deny even if stdout looks like allow |
| command timeout | Documented fail-open. Return to the normal permission flow |
| HTTP network error / non-2xx / timeout | fail-open. This does not indicate successful communication or tool completion |
| Empty stdout / invalid JSON | Do not treat it as identical to explicit allow |

## Good fit / Not a good fit

**Good fit**

- Separating declaration, invocation, checker result, permission, and tool result.
- Distinguishing command and HTTP failure handling.
- Deciding who stops, rechecks, and recovers when the checker breaks.
- Reviewing JSON drafts and safety boundaries before activation.

**Not a good fit**

- Calling a checker based on simple phrase matching a complete barrier.
- Treating the event as triggered merely because the checker was read.
- Treating a timeout or HTTP 503 as the same deny as command nonzero.
- Changing the default branch, firewall, endpoint, or secret from the main scenario.

## Goals

Fill in E01–E12 in [`starter/diagnosis-design.md.template`](../../../challenges/hc-038/starter/diagnosis-design.md.template) so that you can explain:

1. The difference between a declared event and an observed invocation
2. The difference between checker/transport results and product output
3. The responsibility boundary between `sessionStart` and `preToolUse`
4. The difference between deny and fail-open
5. Who stops additional operations, who approves resumption, and what additional observations are required

## What you need

- A text editor
- An environment where you can read bash drafts and JSON
- The fixed materials under `starter/`
- Eligibility to use Cloud or Hooks is not required for the main scenario

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-038/starter/request.txt.template) | Fixed request |
| [`diagnosis-design.md.template`](../../../challenges/hc-038/starter/diagnosis-design.md.template) | Diagnosis table for 12 packets |
| [`fixtures/events.json.template`](../../../challenges/hc-038/starter/fixtures/events.json.template) | E01–E12 |
| [`tools/checker.sh.template`](../../../challenges/hc-038/starter/tools/checker.sh.template) | Inactive checker shared by both events |
| [`reference/hook-contract.md.template`](../../../challenges/hc-038/starter/reference/hook-contract.md.template) | Field and failure boundaries |
| [`hooks-session-start.json.template`](../../../challenges/hc-038/starter/customization/hooks-session-start.json.template) and [`hooks-pre-tool.json.template`](../../../challenges/hc-038/starter/customization/hooks-pre-tool.json.template) | Inactive Hook JSON examples |

Keep everything with the `.template` suffix.

## Preparation

Open this directory by following [Getting started for the repository](../../README.md#getting-started). First, fix the checker, packets, decision rules, and design revision.

The JSON examples are instructional drafts that reference `starter/tools/checker.sh.template`. Do not copy them to `.github/hooks/` or the default branch.

## Try it

1. Read `reference/hook-contract.md.template` and separate product fields from fixture fields.
2. Read `tools/checker.sh.template`, then write what manual inspection establishes and what it does not establish about event triggering.
3. Review E01–E12 in order.

| packet | Fixed situation |
|---|---|
| E01 | `sessionStart` declared, no invocation observed |
| E02 | `sessionStart` invoked, exit 0 |
| E03 | `sessionStart` invoked, nonzero |
| E04 | command exit 0, allow |
| E05 | command exit 0, deny + reason |
| E06 | command exit 0, ask |
| E07 | command exit 1 |
| E08 | command exit 2, stdout looks like allow |
| E09 | HTTP 503 |
| E10 | command timeout |
| E11 | HTTP timeout |
| E12 | command exit 0, empty stdout |

4. For each row, record the declared event, invocation evidence, transport, checker result, product-field validity, expected handling, and stop/recovery.
5. Read the two JSON files in `customization/` and compare only event responsibilities without changing the checker bytes.
6. Separate the conditions for returning to normal decisions after fail-open from the conditions for stopping until human verification.

## Optional: Compare

First diagnose manually using only the checker and packets, then review the Hook connection proposals and revise the diagnosis. Separate whether what was added is the “event-connection responsibility boundary” or the “capability of the checker itself.”

## Verification points

- E01–E12 are all present.
- Declaration, invocation, exit/response, permission, and tool completion are separate.
- `permissionDecision` is not confused with fixture-specific fields.
- `ask`, command nonzero, command timeout, HTTP failure, and empty stdout are distinguished.
- fail-open is not called tool success.
- You have not claimed to create an active Hook or real Cloud observation.

## Further exploration

- Add one packet for invalid JSON or missing event information, and design only the required observations and person responsible for stopping.
- To check in a real environment, see [limited observation of sessionStart](optional/session-start-live.md) or [limited observation of preToolUse](optional/pre-tool-live.md).

## Constraints, fallback, and safety

- In the main scenario, do not change Hooks, checkers, endpoints, firewalls, secrets, or the default branch.
- Stop if you cannot hold the evidence for checker, packets, and product fields constant.
- Even without a Cloud or bash execution environment, you can complete the diagnosis table and recovery design using text alone.
- A JDK, Java application, and external endpoint are unnecessary. Do not treat anything you did not run as successful.
- Do not design logging that retains the full prompt or secrets.
