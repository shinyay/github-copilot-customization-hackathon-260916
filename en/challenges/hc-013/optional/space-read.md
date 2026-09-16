# Checklist Before Reading an Authorized Copilot Space

**Language:** [日本語](../../../../challenges/hc-013/optional/space-read.md) / **English**

[Return to the HC-013 main scenario](../README.md)

## Purpose

This supplemental guide explains how to safely compare the local card designed in HC-013 with the contents of an already prepared, dedicated Copilot Space.
It is not a procedure for creating a new Space.

Keep the layers being verified separate:

1. Whether you can connect to remote GitHub MCP
2. Whether the Copilot Spaces tool is available
3. Whether you can view the target Space
4. Whether you can view each source referenced by the Space
5. Whether the returned content, version, and range match the fixed local materials

Do not conclude that source content was retrieved merely because the connection succeeded or the Space name was displayed.

## Prerequisites

- You have completed the HC-013 main scenario and verified `work\context-card.json.template`.
- You can use a disposable workspace and a new conversation separate from the main scenario.
- You know the exact owner/name of a dedicated training Space already approved by its owner.
- You can confirm Copilot eligibility, existing official authentication, and the organization's MCP policy.
- You can confirm existing viewing permissions for the target Space and for each source separately.

At the time you perform the exercise, check the current requirements and supported source types for using Spaces from an IDE in
[Using Copilot Spaces](https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/use-copilot-spaces)
and [GitHub MCP server in your IDE](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/use-the-github-mcp-server?tool=vscode).
A source type visible on the web is not necessarily returned in the same way in an IDE.

## Permissions and safety

- Obtain separate approval from the environment and Space owners to attempt reading the known owner/name.
- Limit the approved scope to reading through existing authentication.
- Do not create new shares, add sources, upload content, issue a PAT, or change OAuth, ACL, or organization policy.
- Do not explore candidates with `list_copilot_spaces` or similar tools. Stop if the exact owner/name is unknown.
- Check the tool schema displayed at execution time before supplying arguments; do not construct them based on assumptions.
- `starter\examples\github-spaces.mcp.json.template` is a reference example. Do not copy it into this repository as active configuration.

`X-MCP-Readonly: "true"` restricts the tools to read operations; it does not grant permission to view the Space or its sources.

## Procedure

1. Open a new workspace and conversation, and record the state of the IDE, Copilot, and remote GitHub MCP in use.
2. Confirm that the Copilot Spaces tool has been discovered and enabled.
3. Confirm that official authentication and organization policy permit the target read.
4. Use the approved exact owner/name and the tool schema verified at that time to read the target exactly once.
5. Record the Space instructions, description, source type, and each source's revision, range, and return state separately.
6. If the card appears as Add text content, compare the entire card, not only `textContent.text`, with
   `work\context-card.json.template`.
7. Check array order, values, omissions, and `missing` / `error` / `empty` / `partial`.
8. Do not conflate the original hashes and display hashes for B1/B2/B3; determine which version the Space retains.
9. After verification, record that retrieved context may remain in the conversation, and clean up only approved additions.

## What to observe

- MCP connection, tool discovery, tool enabled state, authentication, and organization policy
- Space owner/name, instructions, and description
- Space ACL and each source's ACL
- Source type, revision, resolved commit, and returned range
- Differences among full content, empty content, partial content, missing content, and errors
- Matches, mismatches, or inability to verify between the local card and returned content
- Whether B3's display is the safe display version with the six lines removed

Being able to read a local source is not a substitute for retrieving the same source through the Space.

## Stop conditions

Do not proceed if any of the following applies:

- The exact owner/name, owner approval, eligibility, organization policy, Space ACL, or source ACL is unknown.
- You would need to explore someone else's Space or a list of candidates.
- New authentication, expanded permissions, sharing, source additions, uploads, or configuration changes are required.
- The instructions, full card content, source type, version, or range does not match the fixed materials.
- The content is empty, partial, missing, or in error, so the necessary range cannot be verified.
- B3 may contain authentication information that should have been removed.

Do not conclude from a 404 or read failure alone that the target does not exist or that an ACL denied access.

## Handling at the end

This guide can verify only the reading result for a specific client, time, and set of permissions.
It does not prove general guarantees about sharing or synchronization, other users' access, or educational effectiveness.
Do not carelessly save secrets, real account names, or complete raw responses.

[Return to the HC-013 main scenario](../README.md)
