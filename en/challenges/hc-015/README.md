# HC-015 Take the shortest path to the code you need

**Language:** [日本語](../../../challenges/hc-015/README.md) / **English**

## Scenario

Someone asks, "Where does inventory allocation for an order begin, and where is the transaction determined?"
Searching for `allocate` finds the same word in multiple places in the Java code. However, search hits alone do not tell you
whether you read the definition, followed the XML import, or verified the actual transaction.

In this scenario, you will try finding the source with ordinary search, explicitly attaching two files from the start,
and manually providing the same two raw files in full. "Shortest" does not guarantee speed.
Results such as high preparation overhead, ordinary search being sufficient, or being unable to verify whether the full text was actually supplied are also important.

## What this feature is

**Attaching context is an operation that provides information; searching is an operation that finds information.**
Neither requires permanent repository customization.

- **Add Context**: A UI for explicitly adding files and other items to a Chat request. In this scenario,
  select the files themselves from `Files & Folders`. Distinguish this from entering a candidate name or attaching a symbol, selection, or folder.
- **text/file search**: Finds candidates by filename or text. A match for `allocate`
  does not establish a definition, reference, call count, or execution result.
- **Language features / LSP**: Java extensions and similar features resolve definition and reference locations.
  A person's Go to Definition / Find All References actions and the Agent's results from using Usages are separate observations.
- **semantic index**: An index for finding semantically related locations.
  It neither supplies the entire repository on every request nor grants read access.

Even if you can verify that an attachment is displayed, that does not necessarily mean all bytes were used internally.
If the index or language features are not ready, do not report the result as "0 results"; limit the claim to what text/file search can verify.

References:

- [Add context to chat](https://code.visualstudio.com/docs/chat/copilot-chat-context)
- [Workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context)
- [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)

## Good fit / Not a good fit

**Good fit**

- You want to preserve the supporting path, symbol, and range while investigating across Java and XML.
- You know the filenames but want to decide whether to search every time or provide the full text first.
- You want to break down "not found" into search scope, index, language features, access, and attachment range.
- You want to compare the cost of preparing full text with the reduction in additional searches and follow-up questions.

**Not a good fit**

- You need a guarantee that attachments are always faster or that longer context is always more accurate.
- You want to hide source files to disadvantage the search-based method.
- You want to treat search exclusions as an ACL.
- You want to use static Java/XML reading alone to prove Spring proxy behavior, the actual transaction, or database behavior.

## Goals

1. Starting from `OrderService.allocate`, reach the Java definition and XML transaction configuration.
2. Follow the import in A2 to the bean definition in A3, and show the path, range, and unverified items.
3. Do not conflate text search, file read, LSP, semantic search, and explicit attachments.
4. When attaching or manually supplying A1/A2, verify the fixed revision, byte counts, and SHA-256 values.
5. Treat source-text identity, the UI attachment display, and the range actually supplied internally as separate matters.
6. Do not modify Java, XML, configuration, the index, or extensions, and preserve anything that cannot be verified statically.

## What you need

- First complete the repository-wide [getting started](../../README.md#getting-started) instructions.
- Git
- Node.js 22 or later
- PowerShell
- An editor that can save UTF-8 with LF line endings
- Copilot Chat with ordinary text/file search and file attachment support
- A runtime workspace created from the public Runtime template

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

The Java extension, JDK, Maven, database, and semantic index are not required.
The upstream revision identifies the source provenance; the local `HEAD` of a runtime workspace created from the template
is not required to match this value.

Contents of `starter\`:

| Path | Purpose |
|---|---|
| `starter\request.txt.template` | Fixed request used by every method |
| `starter\worksheets\design.md.template` | Design sheet for search order, attachments, observations, and stop conditions |
| `starter\worksheets\context-plan.md.template` | Plan for supplying A1/A2 in full |
| `starter\worksheets\observations.md.template` | Worksheet for recording searches, attachments, and additional reads |
| `starter\fixtures\source-targets.json.template` | Fixed paths, byte counts, and SHA-256 values for A1/A2/A3 |
| `starter\fixtures\query.json.template` | Synthetic data that separates `allocate` from Java language features |
| `starter\fixtures\search-plan.json.template` | Synthetic data that separates search order, index state, and exclusion state |
| `starter\references\manual-input-layout.txt.template` | Manual full-text layout for A1/A2 |
| `starter\tools\prepare-manual-input.mjs.template` | Helper that verifies the fixed source and creates a new manual full-text input |

The JSON files are synthetic training data, not VS Code settings or a language service event format.

## Preparation

Use the original scenario directory `challenges\hc-015` as your working directory.

```powershell
$RuntimeRoot = (Resolve-Path (Read-Host 'Runtime workspace root')).Path
$RequiredSource = @(
  'wholesale-core\src\main\java\jp\co\tsubame\wholesale\service\OrderService.java',
  'wholesale-core\src\main\resources\application-context.xml',
  'wholesale-core\src\main\resources\spring\module-operations.xml'
)
$RequiredSource | ForEach-Object {
  if (-not (Test-Path -LiteralPath (Join-Path $RuntimeRoot $_) -PathType Leaf)) {
    throw "runtime workspaceにsourceがありません: $_"
  }
}
```

The local `HEAD` is not inspected. The helper compares the byte count and SHA-256 of each source file
with the fixed values from the upstream template revision. If they do not match, do not reset the existing workspace;
review the changes or prepare a new runtime workspace.

Fixed source:

| ID | Path relative to the runtime workspace root | Byte count / SHA-256 | What to investigate |
|---|---|---|---|
| A1 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | 29357 / `a9586d7b43c4577d548180f4ea883ae522f7d97c78927f6a53e1bd48a382b072` | Definition of `allocate`. Use lines 333–349 as an entry point, then read the surrounding code and referenced targets |
| A2 | `wholesale-core/src/main/resources/application-context.xml` | 5169 / `ff96dd85980eb533693bd8df6111eead091796f3192645c50944db599d7d081c` | Transaction configuration and imports. Use lines 44–53 and 82–89 as entry points, then read the entire file |
| A3 | `wholesale-core/src/main/resources/spring/module-operations.xml` | 1405 / `284d8e50c62a952aecfab1b3fab6877db5eebd9c5d674e2da40d1a6ef6359eb9` | Bean definition followed from A2. Use lines 10–14 as an entry point |

The combined body of A1 and A2 is 34526 bytes; including A3, it is 35931 bytes.
The bytes in the request, filenames, and delimiters are separate from the actual token count.
These are candidates to read, not an ACL. You may read required references additionally from the same source checkout.

Create new working copies of the templates.

```powershell
New-Item -ItemType Directory -Path .\work
Copy-Item .\starter\worksheets\design.md.template .\work\design.md
Copy-Item .\starter\worksheets\context-plan.md.template .\work\context-plan.md
Copy-Item .\starter\worksheets\observations.md.template .\work\observations.md
```

If `work` or any destination file already exists, do not overwrite it; verify its contents and owner.

## Try it

### 1. Design the route

Fill in `work\design.md` before viewing an answer.

- What counts as "reaching the required evidence."
- Search terms, target scope, when to open the full file, and the criterion for following XML imports.
- How to count searches, file reads, attachments, pasted content, and follow-up questions.
- How to verify preparation of the complete A1/A2 text and the attachment display.
- The criteria for additionally reading A3 and other sources.
- Stop conditions for revision mismatch, truncation, unrelated-tab contamination, or unknown language-feature/index state.

### 2. Start with search

In a new conversation, send the entire contents of `starter\request.txt.template` without attaching A1/A2 in advance.

1. Run text search for `allocate`.
2. Verify the exact path and definition, then read A1 in full.
3. Find A2 and read it in full.
4. Follow the import in A2 and read A3 if necessary.
5. Record the searched terms, opened paths, requested ranges, returned ranges, and ranges actually read.

Do not treat a text match as definition or reference resolution. If you use Java language features,
record separately from text search what you ran and which locations were returned.

### 3. Start with A1/A2 explicitly attached

In another new conversation, select the A1 and A2 files themselves from **Add Context → Files & Folders** in Chat.

- Verify that both exact paths are displayed.
- Do not substitute a symbol, selection, folder, or different file with the same name.
- Send the entire contents of the same `starter\request.txt.template`.
- Do not attach A3 in advance; record it as an additional read if it becomes necessary.
- Distinguish the attachment display from the range of full text used internally.

If you cannot verify the internally supplied range, record that state as `not-observed`.

### 4. Manually prepare the same raw full text

To consider equivalence with attachments, combine the raw bytes of A1/A2 into one text file with filename delimiters.
The helper is passed to standard input while retaining the `.template` suffix.

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-manual-input.mjs.template |
  node --input-type=module - prepare --runtime-root $RuntimeRoot --output .\work\manual-input.txt

Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-manual-input.mjs.template |
  node --input-type=module - verify --runtime-root $RuntimeRoot --output .\work\manual-input.txt
```

The helper verifies A1/A2/A3 against the fixed values and creates a new file containing only the full raw text of A1/A2
in the same order and with the same delimiters as `starter\references\manual-input-layout.txt.template`.
It does not overwrite an existing destination.

In another new conversation, provide all of `work\manual-input.txt` and the same fixed request.
Do not delete lines, trim, summarize, convert line endings, or append a previous answer.

## Optional: Compare

Compare the method that starts with search, the method with A1/A2 explicitly attached, and the method that manually supplies the same raw full text.
Keep the request, source revision, access, model, available read/search capabilities, and condition for additionally reading A3 fixed.

Compare whether each method reached the required evidence, unnecessary searches or follow-up questions, the burden of preparing full text,
and the verifiable range of attachments or pasted content. Record time or tokens only if you can measure them.
Do not summarize only one input or change to a different source set.

## Verification points

- Can you return to the path, symbol, and supporting range for `OrderService.allocate`?
- Can you connect A2's transaction configuration and import to A3's bean definition?
- Did you distinguish text search, file read, LSP, semantic search, and Add Context?
- Did you verify the byte counts, SHA-256 values, and order of A1/A2?
- Did you distinguish the prepared full text, attachment display, internally supplied range, and range actually read?
- Did you record why and to what extent you read A3 or additional source?
- Did you avoid claiming that static reading proves the actual proxy, actual transaction, database behavior, or past design intent?

## Further exploration

- [Guide to separating Java text search from definition and reference lookup](optional/language-tools.md)
- [Guide to separating the index, search exclusions, and open files](optional/index-exclusions.md)

Both are supplementary exploration guides. They are not completion criteria for this scenario.

## Constraints, fallback, and safety

- Do not modify the source, Java, XML, tests, database, workspace settings, or User/Profile settings.
- Do not automatically install or build the Java extension, JDK, or index.
- Do not change or bypass `search.exclude`, `files.exclude`, `.gitignore`, or organizational content exclusion.
- Do not treat search candidates or exclusions as an ACL.
- If the full text of A1/A2 does not fit, truncation is suspected, or the revision differs, stop rather than shortening only one file.
- If language features are unavailable, continue with text/file search only; do not invent LSP results.
- If the semantic index is unverified, do not report zero semantic results; leave them unverifiable.
- If Copilot file attachment is unavailable, you can complete the scenario with the search route and manual full-text route, or by reviewing only the design sheet.
- If you cannot use the helper, do not duplicate A1/A2; review only the supply plan using the fixed paths, hashes, and layout.
