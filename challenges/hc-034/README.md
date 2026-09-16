# HC-034 Cloud Agentから運用メモMCPを呼ぶ設計をしよう

## Challenge Story

CSV再送の調査では、コードだけでなく運用メモも参照したいことがあります。毎回添付する代わりにMCP toolから取得する設計はできますが、設定を保存した、serverが起動した、tool一覧に見えた、製品が採用した、呼ばれた、返った内容が説明を支えた、という段階はすべて別です。

このChallengeでは、研修専用の同じ `training-v1` メモを、通常添付、MCP取得案、手動全文供給案で比較します。MCP server、Cloud Agent、code review、network、DBは本編では起動しません。参加者が作るのは不活性な `.template` 設定草稿と取得契約です。このページとStarter Kitだけで完結し、元LAB、HC-011、前のChallenge、前Phaseの成果は不要です。

## この機能とは

MCP（Model Context Protocol）は、外部の情報や操作をtoolとして提供する接続方式です。repositoryの共有MCP設定では、Copilot cloud agentとCopilot code reviewが利用するserverをJSONで定義できます。現在のGitHub Docsでは、Cloud向けJSONのroot keyは `mcpServers` です。

VS Codeの `.vscode/mcp.json` で使う `servers` 形式とは別です。見た目が近くても、そのまま相互変換できるとは限りません。本編の `mcp.json.template` はCloud形式の**草稿**であり、repository settingsへ保存しません。placeholderのcommand / argsは未解決の配置先で、実在する接続先ではありません。

このChallengeでは次の段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| config saved | 保存先、ref、raw bytes | serverが起動した |
| syntax | JSONと必要fieldの静的確認 | 製品が採用した |
| server started | process / transportの開始記録 | toolsが一覧化された |
| tools listed | `tools/list` 相当の記録 | 対象製品がtoolを採用した |
| product adopted | Cloud / reviewの選択記録 | toolが呼ばれた |
| called | call ID、tool名、arguments | responseが返った |
| returned | revision、body、body hash | 内容がsourceを支持した |
| content-supported | code-derived記述をsourceへ照合 | 実障害履歴やDB状態が正しい |

GitHubのrepository MCP設定はCloud Agentとcode reviewで共有され、既定のGitHub MCP / Playwright MCPへ追加する形です。Cloud Agentとcode reviewは現在MCPのtoolsを扱いますが、resources / promptsやremote OAuthの対応には制限があります。また、許可したtoolは自律的に使われるため、最小のread-only allowlistと実装確認が必要です。

code reviewでは `annotations.readOnlyHint: true` がtool採用条件の一つですが、認可、ACL、無害な実装、返却内容の正しさを保証しません。

出典: [Configure MCP servers for your repository](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/configure-mcp-servers)（文書確認日: **2026-09-15**）。

Docsの確認、JSON草稿、local protocolの検査は、Cloud接続、製品採用、実callの観測ではありません。

## 向いていること / 向いていないこと

**向いていること**

- key、schema、revisionを持つread-only lookupの設計
- 取得成否と返却内容の意味を別々に記録すること
- 同じ運用メモを添付とtool取得で比較すること
- `NOT_FOUND`、空データ、引数不正、transport errorを区別すること

**向いていないこと**

- productionや顧客データへ無許可で接続すること
- secret、token、実endpointを教材へ埋め込むこと
- `tools/list` をactual callとして報告すること
- `readOnlyHint` をACLや安全性の保証として扱うこと
- local stdio / protocol検査をCloud接続成功にすること
- baselineから重要なメモを隠してMCPを有利に見せること

小さな固定メモなら添付で十分という「追加不要」は有効です。MCP案が同等なら `equal`、接続面だけ増えて追跡性が落ちるなら `worse`、版や本文をそろえられなければ `incomparable`、製品非対応は `unsupported`、権限や環境不足は `blocked` と記録できます。

## Starter Kit

[Pack manifest](pack/manifest.json) のsourceKindは `baseline` です。Java sourceはRuntime v1の固定baselineを読み、Packへ複製しません。

### 固定source

Runtime root相対のsourcePathsは次のexact 2 pathです。

```text
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java
```

`OrderGroup.canonicalHash` のcanonicalizationと、`OrderImportService.importDraft` / `findClaim` / `replay` の静的な入口を読みます。運用メモ内のcode-derived区画がこのsourceで支持されるかを確認し、合成運用文、実DB状態、実障害履歴と分けます。

### 固定training note

全条件でnote keyは `order-import-replay`、revisionは `training-v1` です。`operations-note.json.template` と `manual-note.json.template` は**同一raw bytes**を持ちます。noteは `SYNTHETIC_TRAINING_ONLY` で、実際のincident、顧客、注文、journalを表しません。

同じrevision名でも本文bytesが違えば同一メモではありません。逆にbody hashが一致しても、toolが実際に返したことや内容が正しいことまでは証明しません。

### 配布される不活性素材

Packは全3条件へ次の共通payloadを同じbytesで配置します。

```text
payload/brief.md.template
payload/request.txt.template
payload/design.md.template
payload/packets.json.template
payload/evidence/comparison.md.template
```

HC-034固有のpayloadは次の4件です。

```text
payload/mcp.json.template
payload/operations-note.json.template
payload/manual-note.json.template
payload/retrieval-contract.md.template
```

配置先は `.hackathon/challenge/hc-034/starter/` です。Evidenceひな型だけは `.hackathon/challenge/hc-034/starter/evidence/comparison.md.template` に置かれます。

`packets.json.template` の `P34-01`〜`P34-06` は、起動記録のみ、一覧まで、callと版一致、返却版違い、取得error、`NOT_FOUND` などを診断する中立資料です。packetのIDや順番は正解ラベルではありません。

### exact conditionsとtasks

condition IDsは次のexact 3件です。

```text
baseline
mcp-retrieval
manual-equivalent
```

task IDsは次のexact 2件です。

```text
retrieval-plan
retrieval-diagnosis
```

初回比較は **3 conditions × 2 tasks = 6セル**です。Phase 6全5Challengeでは39セルですが、これは実行済みrun数、Runtime condition総数、LAB unit数、公開件数ではありません。このChallengeのconsumer smokeはconditionごとの3 fresh runsで、各runに2 taskのセルを両方記録します。

### participant artifactsとsubmissionFiles

全条件で、参加者が作れるのは次のexact 4 pathだけです。すべて不活性な `.template` です。

```text
participant/hc-034/design.md.template
participant/hc-034/mcp.json.template
participant/hc-034/manual-note.json.template
participant/hc-034/retrieval-contract.md.template
```

Evidenceのexact pathは次です。

```text
.hackathon/evidence/hc-034/comparison.md
```

required headingsは共通7件と固有1件です。

```text
Fixed task
Environment
Design
Comparison
Observations
Outcome
Limits
Retrieval and support
```

`submissionFiles` はparticipant 4 filesとEvidence 1 fileの**exact 5 files**です。manual noteは固定bytesを保つ成果物、design / retrieval contract / Evidenceは参加者自身の判断を記入する成果物です。

### Runtime安全契約

- `allowedMutations: []`
- participantのallowed additionsは上記exact pathだけで、3条件すべてに同じ集合を許可
- overlayは `.hackathon/challenge/hc-034/**` 内の不活性 `.template` だけ
- `.vscode/mcp.json`、repository settings、server source、workflow、Java、testを追加・変更しない
- `branchSafe: false`
- conditionごとに**別の非公開Runtime repository**、fresh workspace、fresh conversation、fresh profileを使う
- Runtimeの静的検査やexportが成功しても、`runtimeBehavior` と `educationalEffect` は `not-observed`

本編にCloud Agent、code review、repository管理権限、network、secret、MCP process、DB、Java実行は不要です。Node.js 22以降、Git、HubとRuntimeを扱う通常の参加権限が必要です。

## Open Question

**同じ運用メモを取得する入口をtoolにするとき、古い版、取得失敗、該当なし、コードで確認できる事実をどう区別しますか。**

唯一のMCP設定や「必ず導入する」という答えを求めません。添付で十分という判断、revisionとbody hashを両方確かめる設計、取得に失敗したらsourceだけで続ける設計、人へ確認して停止する設計には、それぞれ利点と費用があります。

比較前に、取得キー、許可tool、版照合、再試行、停止、code-derived / syntheticの境界を自分で決めてください。

## Design Time

比較回答を見る前に、人が次を決めて `participant/hc-034/design.md.template` へ記録します。

1. note key `order-import-replay`、revision `training-v1`、body hashの役割。
2. Cloud形式 `mcpServers` とVS Code形式 `servers` を混ぜない保存契約。
3. allowlistするtoolを `lookup_training_note` に絞る理由。`*` を安易に使わない。
4. `config saved` から `content-supported` までの各stageをどう観測するか。
5. `NOT_FOUND`、正常な空データ、`INVALID_ARGUMENT`、server / transport errorの分類。
6. code-derived区画をexact 2 sourceへ照合し、合成運用文と分ける方法。
7. `operations-note.json.template` と `manual-note.json.template` のraw bytesを凍結・照合する方法。
8. `retrieval-plan` と `retrieval-diagnosis` を独立に完結させる固定依頼。
9. source、note bytes、通常依頼、model / effort / toolsの想定が条件間で違ったときの停止条件。

placeholder command / argsは、将来の配置先を決めるための未完成欄です。実在command、導入済みserver、接続成功として書きません。secretは不要な研修設計とし、値の登録や確認を要求しません。

## Build

### 1. Hubで3条件の計画とPackを確認する

Hub checkoutのrootで実行します。

```powershell
node scripts\plan-run.mjs --dry-run --route core --challenge HC-034 --condition baseline --team team-sora --run hc034-baseline-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-034 --condition mcp-retrieval --team team-sora --run hc034-mcp-retrieval-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-034 --condition manual-equivalent --team team-sora --run hc034-manual-equivalent-01
node scripts\build-pack.mjs --challenge HC-034 --output .runtime/packs
```

`--output` はliteral `.runtime/packs` を使います。build結果はmanifest単体ではなくPack directoryです。既存出力があれば上書きせず停止します。

### 2. 条件ごとに独立したRuntimeを用意する

[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template) から3つの新しい非公開repositoryを作ります。1repositoryにつき1conditionだけを使い、fresh workspace、fresh conversation、fresh profileを用意します。同じrepositoryのbranch切替だけで比較しません。

各Runtime checkoutのrootで実行します。

```powershell
$pack = 'C:\work\hub\.runtime\packs\hc-034-v1'
$condition = 'baseline'
$runId = 'hc034-baseline-01'

npm run verify
node .hackathon\scripts\apply-pack.mjs $pack --team team-sora --condition $condition --run-id $runId
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
```

`.hackathon/template.json`、source baseline、condition、named branch、run bindingを確認します。`.hackathon/run.json` は手編集しません。applyや検査の失敗を設定緩和で回避しません。

### 3. 不活性な参加者原稿を作る

Starterから次の5 filesを上書きなしで新規作成します。

```powershell
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$starter = "$root\.hackathon\challenge\hc-034\starter"

New-Item -ItemType Directory -Path .\participant\hc-034
New-Item -ItemType Directory -Path .\.hackathon\evidence\hc-034

[IO.File]::Copy("$starter\design.md.template", "$root\participant\hc-034\design.md.template", $false)
[IO.File]::Copy("$starter\mcp.json.template", "$root\participant\hc-034\mcp.json.template", $false)
[IO.File]::Copy("$starter\manual-note.json.template", "$root\participant\hc-034\manual-note.json.template", $false)
[IO.File]::Copy("$starter\retrieval-contract.md.template", "$root\participant\hc-034\retrieval-contract.md.template", $false)
[IO.File]::Copy("$starter\evidence\comparison.md.template", "$root\.hackathon\evidence\hc-034\comparison.md", $false)
```

既存pathがあれば停止します。`.hackathon/challenge/` のStarter、repository settings、`.vscode/mcp.json`、server、Java、test、workflowを変更しません。

### 4. Cloud形式の設定草稿を完成させる

`participant/hc-034/mcp.json.template` はrootに `mcpServers` を持つCloud向け草稿にします。server名、`type`、placeholder command / args、許可tool `lookup_training_note` を読み分けられる形にします。VS Code向け `servers` を混ぜません。

草稿のsyntaxを静的に確認しても、repository settingsへ保存した、serverが起動した、Cloud Agentやreviewが採用したとは記録しません。本編でlocal server sourceやprocessを作らず、network接続も行いません。

### 5. 同じtraining noteを照合する

Starterの `operations-note.json.template` と参加者の `manual-note.json.template` をraw bytesで照合します。文字列をparseして再serializeした結果、改行正規化後、整形後の見た目だけを同一としません。

`retrieval-contract.md.template` には次を記入します。

- note key / revision / expected body hash
- allowed toolとarguments schema
- successful returnで必要なfields
- `INVALID_ARGUMENT`
- `NOT_FOUND`
- 正常な空データを設けるなら、その明示的schema
- server / transport / timeout error
- retry上限と人へ確認して止まる条件
- code-derived / synthetic区画の照合

`NOT_FOUND` を空配列へ書き換えたり、取得errorを該当なしとして扱ったりしません。

## Compare

### 固定tasks

`retrieval-plan` の固定依頼:

> `order-import-replay` / `training-v1` の研修メモを取得・照合する契約を設計してください。config保存、server起動、tool一覧、製品採用、call、返却、内容支持を分け、古い版、`NOT_FOUND`、引数不正、transport errorの停止と再試行を示してください。

`retrieval-diagnosis` の固定依頼:

> 中立packetを読み、request、list、adoption、call、return revision/body hash、content supportのどこまでが資料内で主張され、何が不足しているか診断してください。`OrderGroup` と `OrderImportService` へ戻れる記述だけをcode-derivedとして扱ってください。

両taskへexact 2 source、同じ `training-v1` raw bytes、同じpacket集合、十分な通常依頼を与えます。

以下では `baseline` を **Baseline**、`mcp-retrieval` と `manual-equivalent` を取得・供給方法の異なる **Customized** として説明します。Customized同士を同じ接続経路とはみなしません。

| condition | 供給案 | 同じにするもの | 固有の限界 |
|---|---|---|---|
| `baseline` | 共通依頼、source、普通の添付メモ | note key、revision、body bytes、source、packet | 新しいMCP接続を追加しない |
| `mcp-retrieval` | `lookup_training_note` で同じ本文を取得する設計 | note key、revision、body bytes、source、packet | 本編では実callなし |
| `manual-equivalent` | tool返却予定と同じメモ全文を明示的に手動供給 | note key、revision、body bytes、source、packet | 添付位置・優先度までtoolと同一ではない |

Baselineとmanual-equivalentの情報が同じでも構いません。MCPを有利にするためBaselineからメモを隠しません。`mcp-retrieval` の回答や要約をmanual条件へ渡しません。

6セルそれぞれで、次を比較します。

- 取得stageと内容の意味を分けたか
- key、revision、body hashを対応付けたか
- `NOT_FOUND`、空、invalid、transportを分けたか
- code-derived記述をexact sourceへ戻したか
- 合成運用文を実障害履歴としていないか
- 添付だけで十分、MCP不要という判断の理由

最初の6セルは各1記録です。追問や設計変更は新しいrun / repetitionとして保存し、packet状態やerror kindを追加conditionにしません。

## Evidence

`.hackathon/evidence/hc-034/comparison.md` を人が記入します。required headingsをすべて残し、特に `Retrieval and support` で次を分けます。

1. **Fixed task**: 2 taskの固定依頼、exact 2 source、note key / revision、packet ID、run / repetition。
2. **Environment**: repository、branch、workspace、client / host / OS / channel、model / effort / tools。見えない値は `unknown`。
3. **Design**: Cloud形式、allowlist、revision/body照合、retry、停止。
4. **Retrieval and support**:
   - config saved
   - syntax
   - server started
   - tools listed
   - product adopted
   - called / call ID
   - returned revision / body hash
   - content-supported
   - error-kind
   - 観測手段、`unknown`、`not-observed`
5. **Comparison**: 3条件×2 task、同じnote bytes、壊れた等価条件。
6. **Observations**: packet内主張、source引用、code-derived / synthetic、unsupported claim。
7. **Outcome**: `improved` / `equal` / `worse` / `incomparable` / `blocked` / `unsupported`、または追加不要・未利用の説明。
8. **Limits**: settings保存、server、Cloud/review採用、call、network、DB、Java実行、教育効果の未観測。

今回はparticipant草稿の保存・構文と、合成packetが主張する内容を静的に診断できます。それ以外を実サービスの観測として埋めません。local protocol helperを別途検査しても、その結果はCloud接続成功や製品採用の証拠ではありません。

## Submit

各Runtimeでparticipant 4 filesとEvidenceを完成させ、apply時と同じPack directoryを使います。

```powershell
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
node .hackathon\scripts\verify-run.mjs $pack --stage submitted
node .hackathon\scripts\export-submission.mjs $pack
```

export対象がexact 5 filesであることを確認します。`manual-note.json.template` は固定bytesを保つ提出物ですが、同じ内容であること自体を創作の加点にはしません。design、MCP草稿、retrieval contract、Evidenceには参加者自身の具体的判断が必要です。

各conditionのRuntime PRと、[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、condition → Runtime repository / PR / run、2 task、note revision/body hash、取得stage、error分類、outcome、failure / unknownを対応付けます。secret、token、実endpoint、個人情報、local absolute path、private source、未加工logは提出しません。

Runtime verifierの成功は静的な契約受理です。`runtimeBehavior` / `educationalEffect` は `not-observed` のままで、MCP接続や学習効果の実証にはなりません。

## Judging

- `mcpServers` とVS Codeの `servers` を混同していないか
- `training-v1` のrevisionと同一raw bytesを全条件で保ったか
- config saved / started / listed / adopted / called / returned / content-supportedを分けたか
- `NOT_FOUND`、正常な空データ、`INVALID_ARGUMENT`、transport errorを同一視していないか
- `readOnlyHint` をACLや安全性の保証として扱っていないか
- code-derived記述をexact 2 sourceへ戻し、合成運用文を分けたか
- local stdio / protocol検査をCloud接続成功にしていないか
- equal、worse、MCP不要、未利用、unknown、blocked、incomparableを認めたか

tool数、設定量、call回数、引用数、`improved` の獲得自体は加点しません。

## Bonus Mission

本編の6セルと固定noteを変更せず、`NOT_FOUND` とは別に「正常に取得できたが結果集合が空」のresponse schemaを紙上で設計します。status、body、error field、retry、人への確認をどう区別するか説明してください。

本編のMCP設定やpacketへ新しいconditionとして混ぜず、実serverやnetworkを起動しません。任意実測をする場合も新しい独立runにし、local検査結果をCloud成功へ合算しません。

## Support / Fallback

本編は不活性なCloud設定草稿、同一note、固定packet比較だけで完了できます。MCPやCloud Agentを利用できなくても、取得契約、error分類、source照合、6セルを提出できます。製品非対応は `unsupported`、同じnote bytesを保てなければ `incomparable`、Hub/Runtimeへ進めなければ `blocked` とします。

任意routeは `cloud-mcp` と `review-mcp` の2件で、どちらも **OPTIONAL_GUIDE_ONLY**、`required: false`、`liveStatus: "live-unobserved"` です。

### [Cloud MCP確認ガイド](optional/cloud-mcp.md)

研修専用serverだけの接続を将来確認するための準備ガイドです。

- prerequisite: repository管理者、共有設定所有者の承認、既定MCP設定の保護、secret不要の配置
- runtime requirement: `cross-branch-handoff: blocked`
- runtime requirement: `shared-mcp-configuration: not-checked`
- stop: 管理者、所有者、既存設定、server配置、branch binding、復元範囲、費用上限が不明

### [Review MCP確認ガイド](optional/review-mcp.md)

同じ接続の `readOnlyHint` 採用を別productで準備するガイドです。本編Cloud条件へ混ぜません。

- prerequisite: code review利用資格、共有利用者の確認、実review要求の別承認
- runtime requirement: `standard-review-observation: not-checked`
- runtime requirement: `shared-mcp-configuration: not-checked`
- stop: head、actor、資格、共有範囲、設定所有者、費用・回数上限が不明

guide読了、JSON保存、local server起動、`tools/list` 成功をCloud/reviewの採用や本編改善の証拠にしません。既定GitHub/Playwright設定を解除せず、User設定へ迂回せず、共有設定を全消去せず、review要求を無制限に繰り返しません。

任意リンクを開けない場合も、上のprerequisite・停止条件・`not-checked` / blockedをEvidenceへ転記すれば本編は完了できます。[Support and Fallbacks](../../docs/support-and-fallbacks.md) も参照してください。
