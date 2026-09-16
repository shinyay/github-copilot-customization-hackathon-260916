# Observe credential presence in a limited way

**Language:** [日本語](../../../../challenges/hc-042/optional/credentials.md) / **English**

[Return to the HC-042 main scenario](../README.md)

## Purpose

For Agents secrets/variables, confirm the observable range of the name, storage scope, consumer, and presence without viewing the value. Treat credential presence, authentication, authorization, and successful external access separately.

## Prerequisites

- An approved dedicated repository or organization is available.
- You can identify the target name, storage scope, and consumer.
- You can confirm your eligibility and the organization policy for managing and using Agents secrets/variables.
- A value-free observation method and a person responsible for restoration are defined.

## Permissions and safety

- Obtain separate permission for presence observation, the target scope, the consumer, and the recording scope.
- Do not retrieve the credential value, value hash, raw log, or actual destination.
- Do not treat a redacted display as permission to retrieve the value.
- Do not expand the scope to other storage locations such as Actions, Codespaces, or Dependabot.

## Procedure

1. Record the target name, repository/organization scope, consumer, and owner.
2. Confirm presence without opening the value.
3. Use separate fields for presence, provision to the consumer, authentication, and authorization.
4. If necessary, observe the result of an existing harmless operation, but do not record secret values or transmitted content.
5. Only if you changed a setting, restore it using the approved procedure.

## What to observe

- Name and storage scope
- Presence observation result
- Consumer
- Authentication result
- Authorization result
- Output use
- Unknowns and reasons they cannot be observed

## Stop conditions

- Retrieving the value or value hash is necessary.
- The storage scope, consumer, or target name is unknown.
- The actual destination, authorization scope, or person responsible for restoration is unknown.
- The scope would need to expand to personal credentials or another secrets product.

## Return to the main scenario

Map the results to the [six layers in HC-042](../README.md#what-this-feature-is), and do not convert presence into successful authentication/authorization.
