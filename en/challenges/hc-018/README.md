# HC-018 Make the boundaries of approval and isolation visible

**Language:** [日本語](../../../challenges/hc-018/README.md) / **English**

## Scenario

A report that says only "The command did not run, so it was safe" does not explain what happened. No tool may have been available, approval may have been pending, a person may have denied it, the OS may have rejected it, or the program itself may have failed. Each state has a different meaning.

In this exercise, you will use the harmless `node --version` command and seven synthetic event packets to create an operational worksheet that can explain **who verified which boundary**. Reducing approvals or enabling a sandbox is not itself the goal.

## What this feature is

Think of a process that uses a tool as having at least the following stages.

| Stage | Question to verify |
|---|---|
| Tool selection | Is a tool capable of proposing the operation among the candidates? |
| proposal | Before execution, what action was proposed? |
| approval | Did a person or an existing rule allow the operation? |
| execution | After approval, did program startup begin? |
| sandbox / OS boundary | Did the execution host's OS allow the operation? |
| program result | Did the started program itself succeed or fail? |

An Instruction that says "Do not run it" is a natural-language request, separate from enforcement by the OS. In this exercise, the following setting value of `false` is also **a proposal to return to ask, not deny**.

```json
{
  "chat.tools.terminal.enableAutoApprove": false
}
```

Read the configuration example only as an inactive `.template` sample; do not apply it to `.vscode/settings.json` or User settings.

Reference: [Use tools with agents](https://code.visualstudio.com/docs/agents/run/tools)

## Good fit / Not a good fit

**Good fit**

- Recording proposal, approval, execution, result, and stop reason in separate fields
- Designing where people make decisions and what information they review before approval
- Leaving information absent from a packet as unknown
- Learning boundaries without live execution or additional configuration

**Not a good fit**

- Resetting existing approval rules to force a prompt to appear
- Enabling Allow all, global auto approve, Autopilot, or Assisted permissions
- Bypassing a person's denial through another tool, another shell, or direct CLI execution
- Proving isolation for every tool or OS from normal output or a single EACCES result

## Goals

Create a boundary diagram and observation record that can explain:

1. Every stage from tool selection through program result
2. The command, cwd, change scope, network use, and expected output a person checks before approval
3. The differences among pending, deny, OS error, program error, and insufficient information
4. The differences among synthetic packets, ordinary manual observation, and actual sandbox observation
5. Conditions for stopping at unknown and deciding not to add configuration

## What you need

- An editor that can read Markdown and JSON
- The original scenario directory's `starter/`
- Optional: Node.js and a terminal tool that can display ordinary approval

Everything in `starter/` is provided as an inactive `.template`:

- [Fixed request](../../../challenges/hc-018/starter/request.txt.template)
- [Fixed command](../../../challenges/hc-018/starter/materials/command.txt.template)
- [Seven synthetic packets](../../../challenges/hc-018/starter/materials/synthetic-events.md.template)
- [Unapplied configuration example](../../../challenges/hc-018/starter/materials/auto-approve-setting.json.template)
- [Design worksheet](../../../challenges/hc-018/starter/worksheets/design.md.template)
- [Boundary map](../../../challenges/hc-018/starter/worksheets/boundary-map.md.template)
- [Observation log](../../../challenges/hc-018/starter/worksheets/observation-log.md.template)

## Preparation

1. See [Getting started](../../README.md#getting-started) for repository-wide common preparation.
2. Leave the files in `starter/` with the `.template` suffix unchanged and create working copies in any work location.
3. Verify that the synthetic packets are neither an official VS Code event schema nor actual logs.
4. If you perform a live observation, verify Node.js, the terminal tool, ordinary approval, and the visible portion of the current approval rules.
5. Do not change settings or reset approval rules to make a prompt appear.

Fixed command:

```text
node --version
```

Fixed request:

> Propose only this command, wait for the required ordinary approval, and show the output only if it is approved. Do not change settings, files, or network access, and do not use another tool.

Seven synthetic cases:

| Case | Fixed boundary |
|---|---|
| No candidate | No tool selected and no event |
| Approval pending | After proposal, decision is pending, and there is no execution |
| Human deny | After proposal, a person denies it, and there is no execution |
| OS-side EACCES | After allow-once, execution occurs, the OS layer returns EACCES, and the exit is nonzero |
| Normal output | After allow-once, execution occurs, the program layer returns synthetic output `v22.16.0\n`, and the exit is 0 |
| Program error | After allow-once, execution occurs, and the program itself returns an error |
| Insufficient information | A required event or exit status is missing, so the cause cannot be determined |

`v22.16.0` is a synthetic value in the packet, not the local Node.js version.

## Try it

1. **Design the boundaries**
   In the design worksheet, separate tool candidate, proposal, approval, execution, OS / sandbox result, program result, and cleanup.
2. **Define what a person checks**
   In the boundary map, record the command, cwd, change scope, network use, and expected output to review before allow-once / deny.
3. **Classify the seven packets**
   Copy only the facts shown by each packet into the observation log; do not fill in missing information.
4. **Apply the stop conditions**
   Organize the outcomes so pending and deny have no execution, an unknown cause remains unknown, and EACCES alone does not prove a successful real sandbox.
5. **Review the configuration example**
   Explain whether `false` means ask or deny, and if applying the setting is unnecessary, record why.
6. **Ask Copilot for a review**
   Provide the fixed request and completed worksheets, and explicitly instruct it not to propose another command, settings changes, network use, or file writes.

## Optional: Compare

Manually classify the same seven packets first in free form and then with the boundary map. Compare only:

- Whether proposal and approval were kept separate
- Whether the start of execution was verified
- Whether OS result and program result were kept separate
- Whether insufficient information remained unknown

If live observation has been approved in advance, you may propose the fixed command at most once across this entire exercise. Even if no prompt appears, do not retry or change settings; if a person denies it, stop. Do not substitute direct CLI execution for approval observation.

## Verification points

- You distinguish tool selection, proposal, approval, execution, OS / sandbox, and program result
- You did not change the fixed command or fixed request
- You did not mix the seven synthetic packets and live observation without labeling them
- You did not treat `false` as deny
- You did not bypass a denial or reset approval
- You left a missing exit status or unknown cause as unknown
- You treat equivalent, no addition needed, unobserved, and incomparable as valid conclusions

## Further exploration

- [Exploration guide for evaluating the terminal sandbox](optional/terminal-sandbox.md)
- [Exploration guide for evaluating a stdio MCP sandbox](optional/mcp-sandbox.md)
- Add exactly one event-order inconsistency to one synthetic packet and explain at which boundary you would detect it and stop

## Constraints, fallback, and safety

- Do not create or modify `.vscode/settings.json`, User settings, or existing approval rules.
- Do not enable Allow all, global auto approve, Autopilot, or Assisted permissions.
- Do not add any shell command other than the fixed command, file writes, network checks, or other tools.
- Even without a terminal tool or Node.js, you can complete the exercise using only the seven synthetic packets.
- Do not reinterpret CLI execution results as observations of an agent's proposal / approval.
- Do not claim that the EACCES packet, normal output, or configuration example proves the effectiveness of a real sandbox.
- Clean up only working copies you created. Do not change existing settings, approval rules, or another person's workspace.
