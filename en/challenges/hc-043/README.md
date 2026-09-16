# HC-043 Run an event-driven Agent with minimum permissions

**Language:** [日本語](../../../challenges/hc-043/README.md) / **English**

## Scenario

Suppose you want to automatically organize the scope affected by a Java maintenance PR. The actor who opened the PR, the creator who created the automation, the entity paying the cost, the people who can read the session, and the person asked to stop it are not necessarily the same. Allowing label updates or pushes for a read task introduces unnecessary permissions and the burden of repeated triggering.

Using a synthetic automation packet and the E01–E05 event sequence, design the events to accept, permitted read effects, excluded write effects, output scope, cost owner, and stop/resume process. Do not register a real automation.

## What this feature is

Cloud Agents Automations starts a Cloud Agent session in response to a schedule or repository event. This scenario creates a minimum-permission policy for human review before use, not product configuration JSON/YAML.

| Item | What to check separately |
|---|---|
| actor | The entity that caused the event and its write access |
| creator | The entity that created the automation and holds management and cost responsibility |
| trigger | Accepted scope such as opened, synchronize, or schedule |
| read effects | Reads such as a PR summary or diff summary |
| write effects | Labels, review posts, repository updates, and pushes |
| repository visibility | private/internal, public, or unknown |
| configuration visibility | Scope within which the automation configuration is visible |
| session visibility | Scope within which the launched session can be viewed |
| stop/resume | Stop request, stop confirmation, and resume decision |
| cost owner | Entity responsible for Actions minutes and AI credits |

A private configuration does not necessarily mean that the session is also private. Treat a duplicate event, another notification for the same head, and synchronize for a new head separately. Operation names in the training materials are learning classifications, not actual GitHub tool IDs or an API schema.

## Good fit / Not a good fit

**Good fit**

- A recurring read task whose inputs, outputs, and stop conditions can be limited.
- Separating the actor, creator, viewing scope, and cost owner.
- Safely handling duplicate events, new heads, and creator absence.
- Comparing the decision to keep the entire process manual.

**Not a good fit**

- A one-time task that is safer for a person to read directly.
- Adding unnecessary label, review, commit, or push effects to a read task.
- Continued execution when the cost owner or person responsible for stopping is unknown.
- Using training fields as product guarantees or a formal schema.

## Goals

Complete the following three worksheets.

- [`automation-design.md.template`](../../../challenges/hc-043/starter/automation-design.md.template): Trigger, actor, minimum operations, visibility, and cost
- [`event-ledger.md.template`](../../../challenges/hc-043/starter/event-ledger.md.template): Accept/ignore/hold decisions for E01–E05
- [`stop-plan.md.template`](../../../challenges/hc-043/starter/stop-plan.md.template): Limits, stopping, confirmation, and resumption

You are finished when you can explain which unnecessary write effects are excluded and who must confirm what before execution.

## What you need

- A text editor
- The synthetic materials under `starter/`
- Eligibility or a cost allowance for Cloud Agents Automations is not required for the main scenario

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-043/starter/request.txt.template) | Fixed request |
| [`fixtures/automation-packet.json.template`](../../../challenges/hc-043/starter/fixtures/automation-packet.json.template) | Creator, actor, visibility, operations, and cost |
| [`fixtures/event-sequence.json.template`](../../../challenges/hc-043/starter/fixtures/event-sequence.json.template) | E01–E05 |
| [`reference/reference-notes.md.template`](../../../challenges/hc-043/starter/reference/reference-notes.md.template) | Key product boundary points |
| [`automation-design.md.template`](../../../challenges/hc-043/starter/automation-design.md.template) | Design worksheet |
| [`event-ledger.md.template`](../../../challenges/hc-043/starter/event-ledger.md.template) | Event decision table |
| [`stop-plan.md.template`](../../../challenges/hc-043/starter/stop-plan.md.template) | Stop/resume plan |

## Preparation

Follow [Getting started with the repository](../../README.md#getting-started) and open this directory. Before reading the events, fix the target product, eligible actor, trigger, head identity, read/write classification, output, limits, and person responsible for stopping.

Fixed tasks:

| task | Situation |
|---|---|
| E01 | private/internal, actor with write access, PR opened, read task |
| E02 | The same request from an actor without write access |
| E03 | Public repository or unknown policy |
| E04 | Duplicate event and synchronize for a new head |
| E05 | Creator absent, stop request, and risk of continued triggering |

## Try it

1. Read the actor, creator, visibility, billing, and operation classifications from `automation-packet`.
2. In `automation-design.md.template`, write the accepted repository, event filter, actor rule, and head/staleness rule.
3. For each operation, write needed/not needed and the reason.
   - read-pr-summary
   - read-diff-summary
   - save-analysis-output
   - update-label
   - post-review
   - push-commit
4. Record configuration visibility and session visibility separately.
5. In `event-ledger.md.template`, classify E01–E05 as accept, ignore, hold, or stop.
6. Define the duplicate key, head update handling, and conditions for not using stale output.
7. In `stop-plan.md.template`, write the run, time, and cost limits, stop route, stop confirmation, and resume conditions.
8. Do not widen the accepted scope when the creator or policy is unknown.

## Optional: Compare

First create a short proposal that only says "automatically summarize the PR," then review it using the minimum-permission worksheet. Compare unnecessary write effects, stale heads, visibility misunderstandings, stop responsibility, and human burden rather than the automation rate.

## Verification points

- The actor, creator, cost owner, viewers, and person responsible for stopping are separated.
- Unnecessary write effects are not permitted for the read task.
- Configuration visibility is not reused as session visibility.
- A duplicate event is distinguished from a new head.
- An actor without write access or an unknown policy is not automatically permitted.
- Training operations are not called actual tool IDs or product guarantees.
- Fully manual, no addition needed, and stop are all valid conclusions.

## Further exploration

- For E04, compare reusing the result for another notification on the same head with always reevaluating it.
- To observe a real automation, see [Limited observation of an event trigger](optional/event-trigger.md).

## Constraints, fallback, and safety

- In the main scenario, do not register an automation, create a schedule, trigger an event, update labels, post reviews, update a repository, commit, or push.
- Real policies, eligibility, billing, and stop/resume behavior remain unobserved until confirmed.
- Do not treat public/unknown targets the same as private/internal targets.
- Stop if the cost limit, person responsible for stopping, or session visibility is unknown.
- Even without Cloud access, the scenario can be completed using only the synthetic packets and worksheets.
