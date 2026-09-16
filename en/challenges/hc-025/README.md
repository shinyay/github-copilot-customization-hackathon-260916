# HC-025 Diagnose customization portability between Local Agent and Agent Host

**Language:** [日本語](../../../challenges/hc-025/README.md) / **English**

## Scenario

The team has drafts for a Skill, Prompt, Custom Agent, and Plugin that read a fixed packet. You want to use the same intent, originally designed for VS Code Local Agent, with Agent Host as well. Even when the body is identical, however, the metadata, placement, discovery, loading, available tools, and approval may not be the same.

In this scenario, read every sample as an inactive `.template` and diagnose how much can be used as-is, what must be ported, and where to stop with an unsupported or unverified result.

## What this feature is

Customization **portability** is not about whether a file can be copied. It asks whether the intent and safety boundaries can be preserved in another harness. Separate the following layers.

1. **file format**: YAML / JSON / Markdown and properties
2. **documented discovery**: documented storage locations and discovery methods
3. **observed discovery / loading**: whether candidates or their bodies were confirmed in a real environment
4. **effective tools**: tools that were actually usable, not merely declared
5. **approval**: confirmation or authorization for writes, external transmission, and similar actions

Skill, Prompt, Custom Agent, and Plugin are different types. In particular, Prompt Files are not loaded by Agent Host, so replacing a Prompt with a Skill must not be reported as success for the Prompt.

References:

- [VS Code Agent Host](https://code.visualstudio.com/docs/agents/concepts/agent-host)
- [Prompt files](https://code.visualstudio.com/docs/agent-customization/prompt-files)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [Custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [Agent Plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)

## Good fit

- Static diagnosis before moving customizations to multiple Copilot harnesses
- Separating shared body content from type-specific metadata
- Separating documented support from observations in a real environment
- Making unsupported, unverified, and additional-approval boundaries explicit

## Not a good fit

- Treating Agent Host as another name for Cloud Agent
- Inferring effective permissions or OS isolation solely from declared `read` / `search`
- Generalizing the result from one client to CLI, App, Cloud, or another version
- Activating the samples and testing every format at once

## Goals

- Diagnose the fixed packet and four types of drafts from the perspectives of Local Agent / Agent Host
- Record format, discovery, loading, effective tools, and approval in separate fields
- Classify each draft as "as-is," "port," "unsupported," "unverified," or "stop"
- Explain a minimal change proposal for type-specific metadata while preserving the shared body

## What you need

Everything in `starter/` is provided as an inactive `.template`.

- `request.txt.template`: Fixed request
- `packet.json.template`: Packet `LAB25-APP-01`
- `customizations/`: Skill, Prompt, Custom Agent, Plugin, and MCP drafts
- `invalid/`: Two fixtures with properties in the wrong location
- `permissions.json.template`: Permission boundaries for the teaching material
- `source-boundaries.md.template`: Documented support and non-claims
- `diagnosis.md.template` / `comparison.md.template`: Diagnosis worksheets

The canonical source baseline retained by the packet is the public upstream template `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`. Use the actual source at the following three paths in the current runtime workspace.

```text
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
```

Because a workspace created from a GitHub template has its own history, its local HEAD does not need to match the upstream template revision. This scenario does not investigate the Java business specification; it treats only the packet ID, upstream template repository / revision, three paths, and the boundary that a matching HEAD is unnecessary as fixed inputs. Do not perform a checkout / reset to align with the revision.

## Preparation

1. Review the [common getting started instructions](../../README.md#getting-started).
2. Read `starter/brief.md.template`, `request.txt.template`, `packet.json.template`, `permissions.json.template`, and `source-boundaries.md.template`, and distinguish the upstream template revision from the runtime workspace source.
3. Inspect the files under `starter/customizations/` and `starter/invalid/`. Do not remove `.template` or copy the files into `.github/`, the user home, or a Plugin installation location.
4. Record the diagnosis in copies of `diagnosis.md.template` and `comparison.md.template`, or in any notes you choose.

## Try it

1. Give Copilot the fixed request and packet in a new conversation, and ask it to diagnose the four types independently.
2. For each Skill, Prompt, Custom Agent, and Plugin, list the actual properties and shared body. Preserve the packet's upstream template fields, workspace source paths, and the boundary that a matching HEAD is unnecessary.
3. For Local Agent and Agent Host, separate `documented discovery` from `observed discovery`. If you did not test a real environment, leave observed values as `null` / `not-observed`.
4. For the two invalid fixtures, explain the problematic property and the minimal correction. Do not replace one format with another and then claim that the original format succeeded.
5. Record declared tools, effective tools, client connection, OS permissions, and approval separately.
6. Finally, classify each draft as "as-is," "port," "unsupported," "unverified," or "stop," and include the reason.

## Optional: Compare

As a brief manual self-check, you can try the same fixed request twice in new conversations.

- **Baseline**: Provide only `request.txt.template` and `packet.json.template`
- **Customized**: Add `source-boundaries.md.template`, `permissions.json.template`, and the four types of drafts to the same inputs

Compare separation of layers, handling of unsupported cases, and the amount of speculation rather than response length. This is not a performance comparison of actual harnesses.

## Verification points

- `LAB25-APP-01`, the public upstream template repository / revision, and the three source paths were not changed
- A matching local HEAD was not required for the template-derived workspace
- The four types were not forcibly combined into a single format
- Prompt not being loaded by Agent Host was not replaced by success in another format
- Documented support and observations in a real environment were not reduced to the same boolean
- Unobserved version, model, tools, or approval values were not filled in
- Every sample remains a `.template`

## Further exploration

- [Test one case each in Local Agent and Agent Host](optional/local-host-probes.md)
- [Investigate CLI / App / Cloud as separate clients](optional/other-clients.md)

Proceed only after completing the static diagnosis in the main scenario and only if you can prepare the necessary permissions and an isolated environment.

## Constraints, fallback, and safety

- The main scenario is complete with static diagnosis alone. Even if Local Agent or Agent Host is unavailable, you can leave observed values as `null` and organize the documented boundaries.
- Product storage locations and support can change, so recheck the official documentation above before actual use.
- Do not infer effective tools or approval from declared metadata.
- Do not create active files or perform installation, login, synchronization, configuration changes, external transmission, or writes.
- Do not perform a checkout / reset to align with the upstream template revision. The listed paths indicate where the source is located in the runtime workspace.
- If conditions cannot be aligned, record `incomparable`; if permissions or the environment prevent progress, record `blocked`; and if documentation says the feature is unsupported, record `unsupported`.
