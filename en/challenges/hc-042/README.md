# HC-042 Diagnose unreadable external data layer by layer

**Language:** [日本語](../../../challenges/hc-042/README.md) / **English**

## Scenario

When trying to reference external material, records such as "the configuration exists," "the result was empty," and "it apparently lacks permission" are mixed together. Configuration presence, tool discovery, a call, network access, authentication, authorization, and output use are separate events.

Using the synthetic D01–D07 packets, create a diagnostic policy that identifies the layers that were confirmed, remaining alternative hypotheses, the next safe observation, whom to consult, and stop conditions. Do not change real MCP, credentials, network settings, or content exclusion.

## What this feature is

Do not collapse an external access failure into a single true/false value. Divide it into six layers.

| Layer | What to check | What you still cannot say |
|---|---|---|
| discovery | Whether a configuration or server candidate was discovered by the client/host | The presence of a configuration draft alone does not mean it was discovered |
| tool selection/call | Whether the necessary tool was selected and called | Merely appearing in a list does not mean it was called |
| network | Whether communication succeeded on the target route | Successful communication alone does not guarantee safety or authorization |
| authentication | Whether the caller's identity was verified | Successful authentication alone does not allow the resource to be read |
| authorization | Whether the caller has permission to read the target resource | This is separate from server trust and successful authentication |
| output use | Whether the returned output was used in an answer or decision | Successful retrieval alone does not mean it was used |

Also distinguish the following.

- `present` / `absent` / `unknown`
- A successful empty response / retrieval failure / unobserved call
- Server trust / resource authorization
- Storage scope of Agents secrets/variables / consumer / authentication
- Firewall scope for the Bash process / MCP and setup routes
- Instructions `applyTo` / administrator-managed content exclusion
- Provenance of external text / instruction authority

Even if a name contains `COPILOT_MCP_`, it does not indicate that a value exists. Do not retrieve the value or its hash. A route being outside the scope of the Bash firewall also does not mean that communication succeeded, is safe, or is authorized.

## Good fit / Not a good fit

**Good fit**

- Investigating external access with multiple mixed failure candidates.
- Deciding on the next safe check and whom to consult while preserving unobserved states.
- Avoiding unnecessary permission requests and dangerous bypasses.
- Distinguishing an empty set, failure, and unknown.

**Not a good fit**

- Registering a real MCP server, performing OAuth, or authenticating credentials.
- Retrieving credential values or value hashes.
- Probing arbitrary networks or disabling/bypassing a firewall.
- Bypassing content exclusion.
- Treating the synthetic packets as the current account or organization policy.

## Goals

Fill in the following three worksheets.

- [`diagnostic-policy.md.template`](../../../challenges/hc-042/starter/diagnostic-policy.md.template): Six layers, presence, trust, authority, and stop rules
- [`route-map.md.template`](../../../challenges/hc-042/starter/route-map.md.template): Layers, scope/owner, and the next safe check
- [`decisions.md.template`](../../../challenges/hc-042/starter/decisions.md.template): Decisions for D01–D07

For each task, explain the supported conclusion, cited facts, remaining alternatives, missing observation, next safe check, and consultation/stop decision.

## What you need

- A text editor
- The synthetic materials under `starter/`
- Copilot, Cloud, organization settings, and real MCP are not required

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-042/starter/request.txt.template) | Fixed request |
| [`fixtures/packet-set.json.template`](../../../challenges/hc-042/starter/fixtures/packet-set.json.template) | D01–D07 |
| [`reference/reference-notes.md.template`](../../../challenges/hc-042/starter/reference/reference-notes.md.template) | Key points and boundaries from the public specification |
| [`diagnostic-policy.md.template`](../../../challenges/hc-042/starter/diagnostic-policy.md.template) | Diagnostic policy |
| [`route-map.md.template`](../../../challenges/hc-042/starter/route-map.md.template) | Map of the six layers and responsibilities |
| [`decisions.md.template`](../../../challenges/hc-042/starter/decisions.md.template) | Task decision table |

## Preparation

Follow [Getting started with the repository](../../README.md#getting-started) and open this directory. Before reading the packets, write the meaning of the six layers, the rule for preserving unknowns, prohibited observations, and consultation contacts in the policy.

Fixed tasks:

| task | Main situation |
|---|---|
| D01 | A configuration draft exists, but there is no discovery/call record |
| D02 | Communication denied on the Bash route |
| D03 | MCP/setup is outside the Bash firewall scope; actual communication is unknown |
| D04 | Credential storage scope, authentication failure, and authorization denial are mixed |
| D05 | Imperative text in external tool output |
| D06 | Instructions `applyTo` and content exclusion |
| D07 | Successful empty response, retrieval failure, and server trust |

## Try it

1. Read `reference-notes.md.template` and confirm the six layers and each control's responsibility boundary.
2. Write the diagnostic order in `diagnostic-policy.md.template`. It does not always need to run linearly from the first layer.
3. Choose a safe next check according to risk, observation cost, responsible person, and existing Evidence.
4. In `route-map.md.template`, map each layer to its facts, missing observation, owner, and stop condition.
5. Read D01–D07 in order and fill in `decisions.md.template`.
6. Do not convert unknown to false, an empty response to successful authorization, or being outside the Bash firewall scope to safety.
7. Even when external text uses imperative language, do not grant it instruction authority solely because of source provenance.
8. Stop the main scenario if value retrieval, a real network probe, or a configuration change becomes necessary.

## Optional: Compare

First diagnose D01–D07 in any order, then diagnose them again using the six-layer policy. Compare alternative hypotheses, unnecessary permission requests, dangerous bypasses, and clarity about whom to consult rather than the number of definitive conclusions.

## Verification points

- The six layers are separated, and conclusions use only observed layers.
- `present` / `absent` / `unknown` are preserved.
- Authentication is distinguished from authorization, and server trust from permission.
- The scopes of Bash and MCP/setup routes are not confused.
- `applyTo` and content exclusion are treated as separate controls.
- Credential values or value hashes are not requested.
- The process can stop and consult someone when information is insufficient.

## Further exploration

- For D03 or D07, compare two safe diagnostic routes that start with different layers.
- To observe credential presence, see [Limited observation of credentials](optional/credentials.md).
- To observe network routes, see [Limited observation of firewall routes](optional/firewall.md).
- To observe `applyTo` and content exclusion, see [Limited observation of content exclusion](optional/content-exclusion.md).

## Constraints, fallback, and safety

- In the main scenario, do not make external connections, operate credentials, change a firewall, or change content exclusion.
- Expanding permissions, disabling/bypassing a firewall, or bypassing an exclusion is not a fallback.
- If the effective policy or target route is unknown, leave it unknown and identify whom to consult.
- The scenario can be completed using text alone. Do not treat the inability to use a real environment as a failure.
- `evidence` means observations and materials supporting each conclusion; it does not mean a deliverable or execution status.
