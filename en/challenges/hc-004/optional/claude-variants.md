# Consider `CLAUDE.local.md` and `.claude/rules/` separately

**Language:** [日本語](../../../../challenges/hc-004/optional/claude-variants.md) / **English**

[Return to the HC-004 main exercise](../README.md)

## Purpose

This supplementary guide considers local-only instructions and path-limited Rules separately from the main root
`CLAUDE.md` exercise. Because they have different purposes and observation points, do not enable both at the same time
and treat them as one comparison.

Reference: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Prerequisites

- You can verify in current official documentation that the client you plan to use supports the target format
- You can prepare a disposable workspace and fresh conversation separate from the root trial
- You can check for existing repository, home, User, and organization instructions
- You can conduct the trial without changing the model, harness, or tools used in the main exercise

## Permissions and safety

- Obtain approval from the workspace or device owner to try only the non-sensitive instructions added for this exercise.
- Do not delete or move aside existing home instructions, User settings, or organization settings.
- Do not write secrets, personal information, real data, or business answers.
- Do not add an active `CLAUDE.local.md` or `.claude/rules/` to this teaching-material repository.
- Try root, local, and Rules one at a time to avoid a state where the influential save location cannot be identified.

## Procedure

### A. Consider `CLAUDE.local.md`

1. Decide on a concise rule to use only locally and the reason for it.
2. Assuming that **the name `local` alone does not guarantee Git exclusion**, check tracking status and ignore rules
   separately in a disposable checkout.

   ```powershell
   git ls-files --error-unmatch -- CLAUDE.local.md
   git check-ignore -v -- CLAUDE.local.md
   ```

3. Read separately whether one command displayed the file as tracked and whether the other displayed a matching ignore rule.
   Do not treat no output alone as evidence that the file is excluded.
4. Create a new file only in the approved independent trial, and try the fixed request once in a fresh conversation.
5. When finished, remove only the file you added.

Even if the file is excluded from Git, that does not mean secrets may be stored in it. Git status alone also does not
show discovery or body delivery by the client.

### B. Consider `.claude/rules/`

1. Decide in advance which path to target and which path to observe as out of scope.
2. Use a **`paths` array**, not `applyTo`, for path selection in Rules. The following is an inactive example for
   checking syntax.

   ```yaml
   ---
   paths: ["wholesale-core/src/**/*.java"]
   ---
   ```

3. Put only concise, generalizable rules in the body; do not include the answer for order approval.
4. In an approved independent trial, open a matching Java file and a non-matching file separately.
5. Save the reference source shown by the client, the request sent, and the response. Stop if the Rules appear to act
   on an out-of-scope file.

## What to observe

- The saved path and body
- Which source the client reported discovering
- Whether any information directly confirms that the body was supplied
- Tracking status and ignore rules for the local file
- Differences between files matching and not matching the Rules `paths`
- The possibility that root or existing home / User / organization instructions were mixed in
- The intent visible in the response and internal processing that could not be confirmed

Even if the same body is used, metadata, priority, and discovery scope are not necessarily identical.

## Stop conditions

- Any of the client's support status, environment-owner approval, or the separation method cannot be confirmed
- Overwriting an existing file, changing ignore rules, or force-adding a file would be required
- Root, local, Rules, or multiple external instructions cannot be isolated one at a time
- A home change or deletion of existing settings would be required
- An effect on an out-of-scope path is suspected and its cause cannot be explained

HC-004's main exercise can still be completed after stopping. For an unsupported format, manual supply can verify only
the body; it does not constitute trying discovery for that format.

## Return to the main exercise

Keep observations from this supplement separate from the root `CLAUDE.md` results.
[Return to the HC-004 procedure and safety boundaries](../README.md).
