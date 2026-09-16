# Verify the storage sources and isolation of User instructions

**Language:** [日本語](../../../../challenges/hc-005/optional/user-scope.md) / **English**

[Back to the HC-005 main scenario](../README.md)

## Purpose

This supplemental guide checks the storage source, target host, separation from existing settings, and removal method before trying a short instruction designed for an individual at User scope. Creating the draft in the main scenario alone does not mean that it was saved, discovered, or reused as a User instruction.

Reference: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Prerequisites

- You can identify the version and type of VS Code and Agent Host in use
- You can prepare a disposable profile, a test workspace, and a fresh conversation
- The person involved can confirm the subscription and product settings needed to try User instructions
- You can distinguish this addition from existing personal settings

Current documentation describes `~\.copilot\instructions` and `~\.claude\rules` as storage sources for User instructions. Confirm the locations read by the target host in the current official documentation. Creating a new repository or VS Code profile does not necessarily isolate storage sources under HOME.

## Permissions and safety

- Obtain approval from the owner of the device and account to save, verify, and remove the one non-confidential instruction added for this test.
- Do not delete or move aside existing User instructions, Settings Sync, other profiles, or organization instructions.
- Do not write secrets, personal information, customer data, or real business decisions.
- Do not create an active User instruction in this training repository.
- If the original state or removal method is unknown, do not begin the test on an actual product.

## Procedure

1. Confirm the target host and the storage source described by the current official documentation.
2. Without reproducing existing content, choose a file name, short text, owner, and planned deletion time that make this addition identifiable.
3. From the synthetic cards in the main scenario, choose one personal display preference that does not contain a business answer.
4. Only in an approved disposable environment, add that sentence to the target User storage source. Do not overwrite an existing file.
5. In a fresh conversation, try the same synthetic task once from each of two workspaces.
6. If the client displays its source, record that display separately from the request you sent and the first output.
7. After the test, delete only the file added for this test and confirm that existing settings remain.

## What to observe

- Saved source, file name, text, and addition and deletion times
- Client / host / version, and which source the client reported discovering
- Information that directly confirms whether the text was passed into the conversation
- Whether the same text was reused in the two workspaces
- Difference between a manually pasted request and an automatically referenced instruction
- Possibility that other instructions from HOME, User, organization, or workspace scope were also included
- Any unverified stage among saving, discovery, content injection, output, and removal

Similar answers alone do not prove discovery or content injection of a User instruction.

## Stop conditions

- The target host, eligibility, owner approval, or storage source is unknown
- Existing settings cannot be distinguished from this addition
- Only this addition cannot be removed
- A bulk reset of existing User instructions or Settings Sync would be required
- A file inside the workspace would have to be treated as a substitute for User scope

You can still complete the classification and drafts in the HC-005 main scenario after stopping.

## Back to the main scenario

Keep observations from this test separate from the design comparison using the synthetic cards. Do not share the real HOME path or the contents of existing instructions; preserve only a safe summary.
[Return to the HC-005 procedure and safety boundaries](../README.md).
