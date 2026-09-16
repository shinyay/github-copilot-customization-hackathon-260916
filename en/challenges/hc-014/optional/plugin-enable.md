# Checklist Before Enabling a Plugin

**Language:** [日本語](../../../../challenges/hc-014/optional/plugin-enable.md) / **English**

[Return to the HC-014 main scenario](../README.md)

## Purpose

Organize the items to check before trying the inactive Agent Plugin draft created in HC-014 in a future, approved experimental environment.
This page is not an execution procedure for install, register, or enable. It does not change the main scenario's `.template` files into active files.

Separate what you want to observe as follows:

1. Whether the client supports Agent Plugins 1.0
2. Whether the entire package could be reviewed
3. How the configured registration and enabled state are stored
4. Whether the Plugin was discovered
5. Whether the body of `order-import-evidence` was loaded when needed
6. Whether stale copies or a same-name Skill remain after an update or disablement

Configuration values, UI display, discovery, and body loading are separate observations.

## Prerequisites

- Verification of the HC-014 main scenario's v1 / v2 drafts, version ledger, and complete restoration is finished.
- You can confirm a client that supports Agent Plugins 1.0 and its official documentation current at that time.
- You can use a dedicated workspace and new conversation separate from the main scenario.
- You can confirm eligibility for Copilot and the target repository, and the organization's Plugin policy.
- You can review every component included in the package.

Check the specification current at the time of execution in:

- [VS Code Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- [Agent Plugins manifest](https://agent-plugins.org/plugin-authors/manifest)

Do not treat descriptions for another client or an older UI as evidence of availability in the current environment.

## Permissions and safety

- Installation, registration, enablement, and configuration changes require separate approval from the environment owner.
- Do not change the `.template` files under the main scenario's `starter\` or `work\`; perform experiments in an approved disposable environment.
- Do not trust the package name alone. Inspect the entire tree to ensure it contains no component other than the Skill.
- Do not let the verification cause additional marketplace downloads, publishing, Profile changes, or deletion from the home directory.
- Do not delete an existing Plugin, manual Skill, user setting, or organization setting to create the desired conditions.
- If Hooks, MCP, Agents, rules, or prompts have been added, stop treating it as the package for this scenario.

## Procedure

1. List every file under `work\package\v1` and `work\package\v2`, and confirm that each contains only a manifest and one Skill.
2. Recheck the helper results and raw hashes, and confirm that the manual Skill and package Skill for each version match.
3. From the client's official documentation, confirm the local Plugin location, configuration scope, and how the enabled state is stored.
4. Confirm the names and meanings of settings actually documented by the client in use, such as `chat.plugins.enabled` and `chat.pluginLocations`.
5. Decide whether to reproduce the setup as workspace settings or place it in Profile or user scope, considering traceability separately from execution permissions.
6. Only after separate approval is obtained, register exactly one target package in a disposable environment.
7. Observe package discovery, the Skill candidate, body loading, and version display separately.
8. After updating to v2, check whether an old v1 or same-name Skill remains at another origin.
9. After disabling it or ending the experiment, check the remaining configuration, candidates, body, and conversation context separately.

Do not perform step 6 or later in this repository. Even in an experimental environment, prioritize the official documentation and approved scope.

## What to observe

- Client, version, and Plugin support state
- Exact package path and raw hash
- Scope and provenance of stored settings
- Plugin discovery, Skill candidate display, and body loading
- Correspondence between the package version and Skill marker
- Same-name candidates, old versions, manual copies, and other origins in the home directory
- Configuration, candidates, and conversation context remaining after disablement

The `enabled` value in `starter\fixtures\lifecycle-origins.json.template` is synthetic.
It does not prove an actual client's enabled state, disappearance of a candidate, or cessation of body loading.

## Stop conditions

- You cannot confirm a compatible client, eligibility, organization policy, or environment-owner approval.
- You cannot review the entire package, or it contains an unexpected component.
- You would need to remove `.template` from the main scenario, move files to an actual discovery location, or change existing settings.
- You cannot isolate a same-name candidate without deleting an existing Plugin or someone else's settings.
- The raw bytes of the package and manual Skill do not match, or the one-factor v1/v2 diff does not match.
- You cannot distinguish whether you observed a configuration value, discovery, or body loading.

Even if you stop, you can still complete the HC-014 main scenario's learning about versions, structure, and restoration.

## Handling at the end

Results from an experiment apply only to the specific client, version, configuration scope, and time.
Do not treat success from the structure helper alone as success in installation, discovery, loading, update, or disablement.
Limit cleanup to items you added under approval; do not touch an existing Plugin, home directory, or someone else's settings.

[Return to the HC-014 main scenario](../README.md)
