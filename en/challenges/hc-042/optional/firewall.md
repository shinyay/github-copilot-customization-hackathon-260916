# Observe firewall routes in a limited way

**Language:** [日本語](../../../../challenges/hc-042/optional/firewall.md) / **English**

[Return to the HC-042 main scenario](../README.md)

## Purpose

For each Bash, MCP, and setup route, distinguish which network policy applies and what was actually observed. Do not interpret being outside the Bash firewall scope as safe, reachable, or authorized.

## Prerequisites

- An approved dedicated environment is available.
- You can identify the target Bash/MCP/setup routes, current policy, and allowed destinations.
- You are eligible to inspect the network policy.
- Limits for the number of observations, time, logs, stopping, and restoration are defined.

## Permissions and safety

- Obtain separate permission for the harmless limited route, allowed destination, and number of observations.
- Do not disable or bypass the firewall, probe arbitrary endpoints, or expand allowed destinations.
- Do not transmit credentials or business data.
- Leave only the minimum necessary route/result information in logs.

## Procedure

1. Record the route, process origin, target policy, allowed destination, and owner.
2. Confirm from documentation whether the route is inside or outside the Bash firewall scope.
3. Observe only an approved harmless route, and only once.
4. Record the network result, authentication, authorization, and output use separately.
5. Even if MCP/setup is outside Bash controls, do not infer success or safety.
6. Restore only changes that you made.

## What to observe

| Item | Record |
|---|---|
| route | Bash / MCP / setup |
| policy | Target scope, owner, allowed destination |
| transport | Reachable, denied, timeout, unknown |
| identity | Authentication |
| access | Authorization |
| use | Returned output and actual use |

## Stop conditions

- Disabling or bypassing the firewall is necessary.
- The route, allowed destination, limits, or logging scope is unknown.
- The person responsible for stopping or restoration is unknown.
- Being outside the scope would need to be used as Evidence of success or safety.

## Return to the main scenario

Map the results back to the [HC-042 route map](../README.md#try-it), and do not automatically treat non-network layers as successful.
