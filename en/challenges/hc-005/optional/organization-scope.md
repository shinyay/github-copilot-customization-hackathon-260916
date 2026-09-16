# Verify approval and supported scope for organization instructions

**Language:** [日本語](../../../../challenges/hc-005/optional/organization-scope.md) / **English**

[Back to the HC-005 main scenario](../README.md)

## Purpose

This supplemental guide checks the target product, approver, impact scope, and restoration responsibility before expanding a team draft to organization scope. Completing a draft or having access to a settings screen does not constitute approval to change the entire organization.

References:

- [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [GitHub Organization instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-organization-instructions)

The target clients and delivery methods described by the official materials are not necessarily the same. Review the current versions of both documents for the target organization and clients, and record any difference as unresolved.

## Prerequisites

- You can identify the target organization, products and clients in use, and source where the instructions will be stored
- You can confirm a subscription and policy that support organization instructions
- You can identify the organization owner and affected users
- The owner can confirm existing instructions, target scope, and the method for restoring the original state

## Permissions and safety

- Obtain explicit approval from an organization owner that limits the target, text, duration, pilot participants, and restoration responsibility.
- Even if you are an owner, do not overwrite or delete existing instructions without approval.
- Do not expand a personal draft or an unapproved proposal to the entire organization as-is.
- Do not reproduce secrets, personal information, customer data, or existing internal instructions in training materials or shared notes.
- Organization operations are not required to complete the main scenario. Do not perform them without approval.

## Procedure

1. For each target client, confirm the supported scope and enablement method described by the current official documentation.
2. List differences between the documents, unverified points for each client, and points that cannot be generalized.
3. Review the audience, exclusions, owner, agreement, expiration, and removal conditions for the team draft from the main scenario.
4. Agree with the owner on a method that does not overwrite existing settings, the pilot scope, and the start and stop conditions.
5. Only after approval, add a short, non-confidential instruction to a limited pilot.
6. Have pilot participants try the same synthetic task in a fresh conversation, and record the source displayed by the client and the first output.
7. When the expiration or stop condition is reached, follow the owner's procedure to remove only the addition made for this test.

## What to observe

- Scope of owner approval, target organization, pilot participants, and duration
- Target clients and the supported scope described by current official documentation
- Saved text and how it is distinguished from existing instructions
- Which source the client reported discovering
- Information that directly confirms content injection, and inferences made only from output
- Signs that users or clients outside the target scope were affected
- Which owner was consulted when instructions conflicted
- Whether only the addition made for this test could be removed

Separating repositories does not necessarily remove instructions supplied by an account or organization.

## Stop conditions

- Owner approval, eligibility, target client, original state, or restoration responsibility is unknown
- Proceeding would require treating differences between official documents as resolved
- Existing organization instructions would have to be overwritten or deleted
- The impact on users outside the target scope cannot be limited
- A personal draft or unapproved proposal would have to be distributed as-is

You can complete the HC-005 main scenario even if you stop. Unverified support can remain unverified.

## Back to the main scenario

If you conduct an organization pilot, keep its record separate from the synthetic-card design in the main scenario. Do not share the organization name, user information, or the contents of existing instructions.
[Return to the HC-005 procedure and safety boundaries](../README.md).
