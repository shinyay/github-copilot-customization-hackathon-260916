# HC-013 Organize Team Knowledge for Copilot Spaces

**Language:** [日本語](../../../challenges/hc-013/README.md) / **English**

## Scenario

You are handing materials about replay processing for order CSVs to the next maintainer. The materials mix code, test definitions, a synthetic operations note,
and references that differ only by version, so they must be organized without treating "content that was read," "content for which only a reference exists," and "content that still cannot be verified"
as the same thing.

In this scenario, you do not create an actual Copilot Space. Instead, you design a
**local context card** as a preliminary step before adding materials to a Space. Create safe full display content from the fixed sources,
then organize it in an order suited to the reader while preserving provenance, version, visibility, and unverified items.

## What this feature is

A Copilot Space is a reusable place that brings together instructions describing its purpose and sources providing evidence.
The instructions, the Space description, and each source's content, version, and viewing permissions are separate pieces of information.

The `context-card.json.template` in this scenario is not a response from the Space API.
It is an inactive sample for inspecting materials that could also be handled as ordinary file attachments before organizing them into a Space.
Being able to view a Space does not necessarily mean that you can view the sources it references. Also, knowing a branch name
does not establish that it is identical to the fixed version unless you have obtained the resolved commit and the content.

References:

- [About Copilot Spaces](https://docs.github.com/en/copilot/concepts/context/spaces)
- [Using Copilot Spaces](https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/use-copilot-spaces)
- [Creating Copilot Spaces](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/copilot-spaces/create-copilot-spaces)

## Good fit / Not a good fit

**Good fit**

- Inspecting provenance, version, purpose, and visibility before multiple people reuse the same materials
- Handing off code, test definitions, operations notes, and unresolved references without conflating them
- Designing the order and grouping of materials for the intended reader
- Treating unavailable, empty, partial, and read-error states separately

**Not a good fit**

- Using the card alone to prove authentication, ACLs, synchronization, or actual database behavior
- Filling in design reasons or incident history absent from the sources through speculation
- Using a local copy obtained by another route to make inaccessible material appear to have been retrieved
- Copying test lines containing authentication information directly into shared materials

If there are only a few materials and individual files plus a short handoff sheet are sufficient, choosing not to add a card is also reasonable.

## Goals

1. Verify the three fixed Java files without changing them.
2. Replace only the six lines in B3 that contain authentication information with whole-line explanatory markers.
3. Organize B1/B2/B3 and the three JSON materials into a local card without reducing their information.
4. Explain your chosen reading order, groups, and presentation of unverified items.
5. Distinguish the local card from an actual Space, and local access to source from remote viewing permissions.

## What you need

- First complete [Getting started](../../README.md#getting-started) for the repository.
- Git
- Node.js 22 or later
- An editor that can save UTF-8 with LF line endings
- A runtime workspace created from the public Runtime template

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

- Copilot Chat is optional. If it is unavailable, you can still complete the exercise as a human-led materials design task.

The upstream revision identifies the provenance of the source. A runtime workspace created with **Use this template** has
a new Git history, so its local `HEAD` is not required to match this value.

`starter\` contains the following inactive training materials.

| Path | Purpose |
|---|---|
| `starter\request.txt.template` | Fixed request given to Copilot or a person |
| `starter\worksheets\design.md.template` | Design sheet for instructions, the reader, ordering, and stop conditions |
| `starter\worksheets\handoff.md.template` | Handoff sheet for providing the materials as individual items |
| `starter\examples\context-card.json.template` | Empty template for the local card |
| `starter\examples\github-spaces.mcp.json.template` | Read-only configuration example for remote GitHub MCP; do not apply it |
| `starter\fixtures\source-packet.json.template` | Fixed metadata and a synthetic operations note for B1/B2/B3 |
| `starter\fixtures\snapshot.json.template` | Fixed-version identity for B1 |
| `starter\fixtures\provenance-packets.json.template` | Synthetic candidates for considering different retrieval states and versions |
| `starter\tools\prepare-display.mjs.template` | Helper that verifies the fixed source, performs limited replacement, and generates the card |

Do not remove the `.template` suffix or place these files as active MCP configuration or customization in the repository.

## Preparation

Use the source scenario directory `challenges\hc-013` as the working directory.
For the sources to read, use files already present in a runtime workspace created from the template.

```powershell
$RuntimeRoot = (Resolve-Path (Read-Host 'Runtime workspace root')).Path
$RequiredSource = @(
  'wholesale-batch\src\main\java\jp\co\tsubame\wholesale\batch\service\OrderImportService.java',
  'wholesale-batch\src\main\java\jp\co\tsubame\wholesale\batch\OrderGroup.java',
  'wholesale-batch\src\test\java\jp\co\tsubame\wholesale\batch\OrderImportPostgresTest.java'
)
$RequiredSource | ForEach-Object {
  if (-not (Test-Path -LiteralPath (Join-Path $RuntimeRoot $_) -PathType Leaf)) {
    throw "runtime workspaceにsourceがありません: $_"
  }
}
```

The local `HEAD` is not inspected. The helper compares each source's byte count and SHA-256 against fixed values from the upstream template revision.
If they do not match, do not reset the runtime workspace; inspect the changes or prepare a new runtime workspace.

The three fixed sources are:

| ID | Path relative to the source checkout | Purpose for reading |
|---|---|---|
| B1 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | Entry point for reading the current replay processing |
| B2 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | Read the grouping received by B1 and `canonicalHash` |
| B3 | `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | Read what the tests attempt to verify and their execution prerequisites; do not run them |

Do not share lines 86, 87, 237, 242, 431, or 437 of the original B3. The helper first verifies the fixed hash and line shapes,
then replaces only those six entire lines with the `HC013_DISPLAY_REDACTED` marker. It preserves all other lines and the line count.
It does not record the original values or hashes of the individual values.

Create a new working file for yourself.

```powershell
New-Item -ItemType Directory -Path .\work
Copy-Item .\starter\worksheets\design.md.template .\work\design.md
```

If `work` or the destination file already exists, do not overwrite it; inspect its contents and owner.

## Try it

### 1. Write the organization policy

Fill in the `hc013-design` block in `work\design.md`.

- `instructions`: Text that communicates the purpose and cautions to the reader
- `reader`: Intended reader
- `readingOrder`: An order containing B1/B2/B3/P1/P2/P3 exactly once each
- `groups`: Groups you choose that include all six materials
- `omissionPolicy`: Keep it as `preserve-full-display-and-metadata`

Do not write authentication values, removed original text, or historical reasons that were not provided.

### 2. Generate safe display materials

The helper remains a `.template`; execute it explicitly by passing its contents through standard input.

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-display.mjs.template |
  node --input-type=module - prepare --runtime-root $RuntimeRoot --work-root .\work

Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-display.mjs.template |
  node --input-type=module - verify --runtime-root $RuntimeRoot --work-root .\work
```

Generated files:

- `work\context-card.json.template`: An inactive local card containing all six materials
- `work\handoff.md`: A display that hands off the same six materials individually
- `work\manual-input.txt`: Text for manually providing the same instructions and full card content

The helper does not overwrite existing destinations. It stops if the source hashes, line shapes, design sheet, or already generated content do not match.

### 3. Read the organized materials

If you use Copilot Chat, open a new conversation and explicitly attach the following:

1. `starter\request.txt.template`
2. `work\context-card.json.template`

Ask for a response that separates current code, synthetic notes, and history that was not provided, and identifies the supporting path, version, range,
and unverified items. If the attachment display is not visible, the content may have been truncated,
or the source cannot be revisited, record that state and stop making assertions.

## Optional: Compare

Using the same request and the same six materials, manually compare the following in separate new conversations:

- Provide `work\handoff.md`.
- Provide `work\context-card.json.template`.
- Provide `work\manual-input.txt` as the message body.

Change only how the materials are bundled. Do not summarize only one version, remove metadata, add the original B3,
or mix a previous answer into the next input. You can compare only local organization methods,
not Space-specific sharing, retrieval, or synchronization effects.

## Verification points

- Can you explain an order and grouping suited to the reader and purpose?
- Are B1/B2/B3 and P1/P2/P3 all present, with their metadata and limitations retained?
- Have you distinguished the original hash from the display hash, and the original from the complete content after limited replacement?
- Have you treated `missing`, `error`, `empty`, `partial`, and an unresolved branch separately?
- Have you avoided conflating local source access, permission to view the Space, and permission to view each source?
- Have you avoided describing static reading of test definitions as Java or database execution results?

## Further exploration

- [Checklist before reading an authorized Space](optional/space-read.md)

The optional guide provides safety checks before reading an already approved, dedicated Space. It is not part of this scenario's completion criteria.

## Constraints, fallback, and safety

- Do not modify or run the source, Java, tests, database, or existing configuration.
- Do not create, enumerate, or share an actual Space; add sources; upload content; issue a PAT; or change OAuth, ACL, or organization policy.
- `github-spaces.mcp.json.template` is explanatory only. Do not copy it to this repository's `.vscode\mcp.json`.
- Do not restore B3's removed lines or authentication values in an answer, card, log, or negative comparison example.
- Do not conclude that unavailable content is nonexistent or access-denied; retain the reason it could not be verified.
- If Copilot is unavailable, human review of `design.md`, the generated card, and the handoff sheet is sufficient for completion.
- If the helper cannot be run, do not share the original; design the organization policy using only the fixtures and empty template.
- To try an actual Space, satisfy the optional guide's prerequisites and obtain separate approval, and treat it as work separate from this scenario.
