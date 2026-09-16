# HC-032 Design an investigation role and tools for Cloud Agent

**Language:** [日本語](../../../challenges/hc-032/README.md) / **English**

## Scenario

When requesting an investigation of order approval, you may want to separate the person who gathers evidence from code from the person who actually makes changes. However, merely writing "read-only" in a profile does not change OS or repository permissions. Declaring a tool, having it available at runtime, and actually calling it are also separate facts.

In this scenario, design the responsibilities, stop conditions, and handoff to the change owner for a non-modifying investigator as an inactive Custom Agent profile.

## What this feature is

A Custom Agent profile defines a name, description, tools, role body, and other details in Markdown. A repository profile for GitHub.com is normally placed in `.github/agents/*.agent.md`, but this scenario keeps it under `starter/customization/*.template`.

Keep the following stages separate:

| Stage | What to verify | What that alone does not establish |
|---|---|---|
| saved | repository, ref, filename, raw hash | The product discovered the profile |
| displayed | A record that it appeared as an option | The profile was selected |
| selected | A direct record of selection | Every declared tool became effective |
| declared | The profile's `tools` | Effective tools at runtime |
| effective | Tools confirmed as available | A tool was called |
| called | Call ID, tool, input, result | The result's meaning is correct |

Prohibitions in the role body are behavioral instructions; they are not ACLs, network controls, or guarantees about tool implementation safety.

## Good fit / Not a good fit

**Good fit**

- Work where investigation and changes have different responsibilities or stop conditions
- Gathering evidence in a form that traces back to files and symbols
- Explicitly handing unverified items to the change owner
- Recording declared, effective, and called tools separately

**Not a good fit**

- Controlling filesystem or GitHub permissions with the profile body alone
- Assigning fixes, commits, posting, and approval to the investigator
- Using the number of tools or length of prohibitions as a proxy for quality
- Reporting a saved profile as discovered, selected, and executed
- Treating an unsupported handoff as an automatic transition

## Goals

For the fixed `approval-trace` task, create the following:

1. The investigator profile body
2. A control profile with the same declared tools
3. A manual body identical to the profile body
4. A handoff to the change owner
5. A ledger for tools and selection
6. A diagnosis of synthetic packets

## What you need

Fixed source:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`

The main static path is `OrderService.approve` → `BaseService.require` → `Actor.require`. This alone does not determine a particular user's authentication state, credit, inventory, persistence, or approval eligibility.

`starter/` contains the fixed request, design worksheet, two inactive profiles, manual body, handoff, tools ledger, synthetic packets, and optional comparison worksheet.

## Preparation

See [Getting started](../../README.md#getting-started) for the common preparation steps.

1. Read `starter/request.txt.template` and the three source files.
2. Do not move `starter/customization/*.agent.md.template` into active `.github/agents/`.
3. Use `starter/design.md.template` to decide the investigation scope, unknowns, stop conditions, and handoff first.

## Try it

1. Keep the `tools` in the control and investigation profiles identical: `read` / `search`.
2. In the role body of `evidence.agent.md.template`, record the source to inspect, evidence format, unknowns, stop conditions, and handoff.
3. Copy the same role body in full to `manual-body.md.template`, keeping the bytes of the compared sections identical.
4. In `handoff.md.template`, separate verified facts, inferences, unknowns, candidates to read next, and human judgment.
5. Read `fixtures/packets.json.template` and diagnose it without confusing selected, declared, effective, and called.
6. In `tools-ledger.md.template`, record the storage source, selection, tools, calls, observation method, and unknowns.

## Optional: Compare

Use `starter/worksheets/comparison.md.template` to perform a manual comparison of the following:

- **Baseline**: Fixed request + control profile
- **Customized**: Same tools + investigator body
- **Manual-equivalent**: Control profile + full text of the same role body

Do not claim that differences in profile name or supply location have also been eliminated. Compare evidence that traces back to source and the specificity of the handoff rather than response length.

## Verification points

- Are the investigator's and change owner's responsibilities separated?
- Do the control and investigation profiles have the same declared tools?
- Did you separate saved, displayed, selected, declared, effective, and called?
- Did you avoid describing the read-only wording in `description` as a permission?
- Is there evidence that traces back to the three source files, plus unknowns outside that scope?
- Does the manual body match the role body?
- Did you avoid claiming that changes, posting, execution, or approval occurred?

## Further exploration

- Consider in a separate document an alternative that narrows the declared tools from `read` / `search` to `read` only
- Use the [Cloud profile supplementary guide](optional/cloud-profile.md) to prepare to observe profile selection and tools in an actual Cloud Agent

## Constraints, fallback, and safety

- Do not create or run an active Custom Agent, Cloud task, change owner, Java execution, PR, or post.
- Do not elevate claims in synthetic packets to actual service history.
- Even if Custom Agents are unavailable, you can complete the scenario through static design of the profile draft, manual body, handoff, and tools ledger.
- Leave effective tools and actual calls as `not-observed` when they cannot be verified.
