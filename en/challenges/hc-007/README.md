# HC-007 Design an AI team with an investigator and a reviewer

**Language:** [日本語](../../../challenges/hc-007/README.md) / **English**

## Scenario

If one AI is asked to investigate an order approval and then review its own work, it may justify its initial hypothesis or overlook unverified points.

In this scenario, you will separate an **investigator**, which traces the approval path, from a **reviewer**, which independently challenges weakly supported claims, by implementing them as Custom Agents. The investigator's output is not forwarded automatically. A person reviews its content and confidential information before passing it to the reviewer. A person also makes the final decision to proceed, investigate again, or stop.

The subject is the `op=approve` path in `OrderAction.perform`. Trace the web action's role check, the service-side recheck, version and state, self-approval, active reference, and credit check without conflating them.

## What this feature is

A Custom Agent is a GitHub Copilot customization that defines a specific role, the tools it may use, prohibitions, and the expected output. This scenario uses the following two roles.

- **investigator**: Organizes facts, hypotheses, counter-evidence, unknowns, and verifications from source
- **reviewer**: Classifies each claim in the investigator's packet as `supported / contradicted / not decidable`

Merely assigning different role names does not create an independent review. Switching only the role in the same conversation history, or repairing the packet before giving it to the reviewer, does not reduce anchoring on the initial conclusion. Use a fresh conversation and the unmodified packet after a person has reviewed it.

In clients that support handoffs, `send: false` in the Agent definition leaves the handoff candidate displayed without sending it, so a person can review it first. In clients without handoffs, the same content can be transferred manually.

## Good fit / Not a good fit

**Good fit**

- Work whose investigation and challenge phases use different evaluation criteria
- Multi-stage investigations whose claims can be traced back to source
- Safety-focused workflows requiring human review before a handoff
- Work that preserves unknowns instead of filling them by force and leaves the final decision to a person

**Not a good fit**

- A simple one-question, one-answer task
- Self-review that only changes the role name within the same conversation
- Automatically forwarding a packet without showing it to a person
- Delegating approval, code changes, or production operations to AI

## Goals

- Enable two Custom Agents in a working repository
- Investigate the order approval path without changing the fixed packet
- Have a person review the investigator's unmodified packet before passing it to the reviewer
- Have the reviewer identify unsupported claims and verifications with weak discriminatory power
- Have a person record the final decision and remaining unknowns

## What you need

- A GitHub Copilot client that supports Custom Agents
- If you try a handoff, a client that supports handoffs
- A working repository containing the Java source used by the scenario
- The inactive materials in this directory

| Material | Purpose |
|---|---|
| [`starter/inputs/fixed-packet.md.template`](../../../challenges/hc-007/starter/inputs/fixed-packet.md.template) | Investigation request that remains unchanged in every conversation |
| [`starter/customization/order-investigator.agent.md.template`](../../../challenges/hc-007/starter/customization/order-investigator.agent.md.template) | Starting point for the investigator |
| [`starter/customization/order-reviewer.agent.md.template`](../../../challenges/hc-007/starter/customization/order-reviewer.agent.md.template) | Starting point for the reviewer |
| [`OrderAction.java.excerpt.md.template`](../../../challenges/hc-007/starter/reference/OrderAction.java.excerpt.md.template) | Read-only fallback material for the web action role check and service dispatch |
| [`OrderService.java.excerpt.md.template`](../../../challenges/hc-007/starter/reference/OrderService.java.excerpt.md.template) | Read-only fallback material for service-side authorization and business conditions |
| [`Actor.java.excerpt.md.template`](../../../challenges/hc-007/starter/reference/Actor.java.excerpt.md.template) | Read-only fallback material for the ADMIN bypass and exact role membership |
| [`BaseService.java.excerpt.md.template`](../../../challenges/hc-007/starter/reference/BaseService.java.excerpt.md.template) | Read-only fallback material for a null actor and service authorization |
| [`starter/worksheets/handoff.md.template`](../../../challenges/hc-007/starter/worksheets/handoff.md.template) | Simple worksheet for recording human review and the final decision |

You do not need a JDK, database, or running server.

## Preparation

1. Follow the common [Getting started](../../README.md#getting-started) steps in a working repository.
2. Read `fixed-packet.md.template` and confirm that you will not change its questions, target source, or claims to evaluate.
3. Copy the following two files into the working repository and remove `.template` only there.

   | Copy from | Destination in the working repository |
   |---|---|
   | `starter/customization/order-investigator.agent.md.template` | `.github/agents/order-investigator.agent.md` |
   | `starter/customization/order-reviewer.agent.md.template` | `.github/agents/order-reviewer.agent.md` |

4. If needed, copy `starter/worksheets/handoff.md.template` to a location only you control, such as `notes/hc-007-handoff.md`.
5. Confirm that you can open the four source paths in the fixed packet. If you cannot obtain the source, use only the excerpts in `starter/reference/` and preserve the fact that you could not inspect the full source as an unknown.
6. Prepare fresh conversations for the investigator and reviewer.

## Try it

1. Open a fresh conversation for the investigator and provide the complete contents of `fixed-packet.md.template` unchanged.
2. Confirm that the investigator's packet treats the following as separate claims.
   - The MANAGER check in `OrderAction.perform`
   - Reauthorization in `OrderService.approve`
   - A null actor and the ADMIN bypass / exact role membership in `Actor.require`
   - The lock, expected version, and `SUBMITTED` state
   - The self-approval restriction
   - Active reference validation
   - The credit check
3. Save the investigator's output without editing it. Confirm that it stops at `HUMAN HANDOFF REQUIRED` and, in a client that supports handoffs, that the candidate remains displayed but unsent.
4. Have a person verify the following.
   - Out-of-scope source or speculation is not mixed into facts
   - Quotations and paths support their claims
   - No secrets, customer information, or real order information are included
   - Unresolved points remain in the packet
5. Record the review in the handoff worksheet and, if there is no problem, set `Confirmed for review: yes`. If redaction is required, stop the review and treat the revised version as new input.
6. In a fresh conversation for the reviewer, provide only the fixed packet and the investigator packet reviewed by a person. If using a handoff candidate, send it only after the human review.
7. Read the reviewer's `ACCEPT / REVISE / INSUFFICIENT ENVIRONMENT` decision and classification of each claim.
8. Have a person choose `proceed / revise / stop` and record the reason and unknowns. Do not proceed to a code change or approval process based only on the AI's decision.

Static source reading can determine branches in the code. It cannot determine whether a specific order can be approved, the database version or state, or whether active reference and credit checks will pass.

## Optional: Compare

Keep the fixed packet, source, model, and tools as consistent as possible, and manually try each of the following once.

1. Ask a general assistant: "Investigate this, then review your own work."
2. Split the work between the investigator and a fresh reviewer, with a person reviewing and transferring the packet

Compare unsupported claims, competing hypotheses, preservation of unknowns, discriminatory power of verifications, and the information available to a person for stopping the process, rather than the amount of text. If the inputs or environment cannot be kept consistent, do not decide which is better.

## Verification points

- The responsibilities and prohibitions of the two roles do not overlap
- The fixed packet was not rewritten during the process
- The investigator packet was not repaired afterward
- A person reviewed scope, citations, and confidential information before the handoff
- The reviewer did not supplement the packet with facts from outside it
- Verifications can distinguish between multiple hypotheses
- Runtime facts that cannot be decided from source remain unknown
- A person made the final decision

## Further exploration

Create a variant that removes the investigator's conclusion and gives the reviewer only the evidence table, unknowns, and proposed verifications. Compared with the regular handoff, observe whether this reduces anchoring on the conclusion or also removes necessary context. Do not change the original packet; treat this as a separate trial.

## Constraints, fallback, and safety

- If Custom Agents are unavailable, paste each of the two template bodies into a separate fresh conversation as the role prompt. This does not test Agent discovery or tool restrictions.
- If handoff functionality is unavailable, manually copy the packet after a person reviews it. Prioritize the safety review over automatic forwarding.
- If you cannot create a fresh conversation, do not claim an independent-review effect; limit the work to reviewing the role design.
- If you cannot read the full source, answer only within the excerpts and preserve missing paths as unknown.
- Do not inspect real orders, a database, a server, or external connections, and do not execute approvals or code changes.
- Do not put secrets, customer information, or private logs in a packet.
- Do not add automatic sending between Agents or an unattended final decision.
