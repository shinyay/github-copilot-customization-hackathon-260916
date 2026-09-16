# HC-042 読めない外部データの原因を層ごとに探そう

## Challenge Story

保守チームが外部資料を参照しようとしたところ、「設定はあるのに読めない」「空の結果が返った」「権限がないらしい」という記録が混在しました。
しかし、設定ファイルが存在すること、toolが選ばれたこと、通信できたこと、本人確認が通ったこと、対象資料を読む権限があること、取得結果が回答へ使われたことは別々の出来事です。
一つの原因へ急いで決めつけると、不要な権限要求や危険な迂回を提案してしまいます。

このChallengeでは、秘密を含まない合成packetを使い、どの層まで確認でき、次に何を安全に観測し、誰へ相談するかを決める診断方針を作ります。
別の教材や前のChallengeの成果は不要です。このページ、Packの固定資料、参加者が作る三つの文書だけで完結します。

## この機能とは

このChallengeで設計する**診断方針**は、外部アクセスの失敗を一つのtrue / falseへ潰さず、次の六層へ分けて扱うための参加者自身の文書です。
実サービスへ登録する設定、権限を付与する仕組み、接続を成功させる自動修復ではありません。

| 層 | 確かめること | まだ言えないこと |
|---|---|---|
| 発見 | 設定やserver候補が、そのclient / hostから発見されたか | 設定原稿の存在だけでは発見済みと言えない |
| tool採用 | 必要なtoolが選択され、callされたか | 一覧に見えるだけではcall済みと言えない |
| network | 対象経路で通信が成立したか | 通信成功だけでは安全性や認可を保証しない |
| authentication | 呼出し主体の本人確認が成立したか | 認証成功だけでは対象資料を読めると言えない |
| authorization | その主体が対象resourceを読む権限を持つか | serverが信頼済みでも認可成功とは限らない |
| 出力利用 | 返った出力が回答や判断へ実際に使われたか | 取得成功だけでは利用済みと言えない |

例えばrepositoryにMCP設定の原稿があっても、clientがそれを発見せず、toolも選ばれていないなら、networkや認証の成否はまだ観測されていません。
反対に空の正常応答が返った場合は「該当なし」であり得ますが、取得失敗で本文がない場合や、そもそもcallが未観測の場合とは区別します。

`present` / `absent` / `unknown` はpresenceの記録です。`unknown` を便宜的にfalseへ変えません。
server trustは、接続先やtoolを利用してよいかという安全判断であり、対象resourceのauthorizationとは別の軸です。
Instructionsの `applyTo` は指示の適用範囲、content exclusionは管理者側の除外制御であり、どちらも外部資料中の命令を権限へ変える仕組みではありません。
公開仕様の要約では、専用のAgents secrets / variablesはorganizationまたはrepository scopeで保存され、通常の値は環境変数、`COPILOT_MCP_` prefixの値はMCP専用として扱われます。
Actions、Codespaces、Dependabot等の値を同じ保存先から直接参照できるとは仮定しません。
Bash firewallの対象はAgentがBashから起動するprocessであり、MCP / setup経路はその制御の対象外です。ただし、対象外であることは通信成功、無制限許可、安全、認可済みを意味しません。
websiteのcode reviewに対するcontent exclusionにはPreview条件があり、VS CodeのEdit / Agent等へ同じ対応を一般化しません。

## 向いていること / 向いていないこと

**向いていること**

- 複数の失敗候補が混在する外部アクセス調査
- 未観測を残しながら、安全な次の確認と相談先を決めること
- MCP/setup経路、Bash経路、秘密の保存scope、認証、認可を分けること
- 不要な権限要求、秘密取得、危険な迂回を避けること

**向いていないこと**

- 実MCP serverの登録、OAuthやcredentialの実認証
- 秘密値やその値hashの取得・表示
- 任意のnetwork probe、firewallの無効化や迂回
- content exclusionを回避する実験
- 合成packetを現在のrepository、organization、accountの実policyとして扱うこと

文書上の診断が整っても、接続成功、製品品質、実権限、教育効果は保証されません。
情報不足のため停止する案や、「追加の確認は不要」と根拠付きで判断する案も有効です。

## Starter Kit

[Pack manifest](pack/manifest.json) の条件は `baseline` と `diagnosis-policy` です。
sourceKindは `synthetic`、sourcePathsは `[]` です。Java sourceの挙動を調べる課題ではないため、便宜的なsource pathを割り当てません。
Packはschema v1に従います。固定schemaは9616 bytes、SHA-256 `183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e` ですが、schema一致は外部アクセス成功の証拠ではありません。

**SYNTHETIC_TRAINING_ONLY** — Packのpacket、状態、event、policy説明は安全な学習用に合成・改作した固定資料であり、実account、実network、実credential、実access policyの観測結果ではありません。
credential値、値のhash、tokenらしい文字列、実送信先は含みません。`COPILOT_MCP_TRAINING` のような名称が出る場合も値はありません。

Packは両条件へ同じ不活性な `.template` を、Runtime checkoutの次の範囲へ配置します。

| Runtime相対path | 内容 |
|---|---|
| `.hackathon\challenge\hc-042\starter\brief.md.template` | 背景、sourceKind、固定task、実操作禁止 |
| `.hackathon\challenge\hc-042\starter\request.txt.template` | 両条件へ渡す同一の十分な依頼 |
| `.hackathon\challenge\hc-042\starter\reference-notes.md.template` | 公開仕様の短い要約、用語、確認時点 |
| `.hackathon\challenge\hc-042\starter\readiness.json.template` | live / 製品実行を `NOT EXECUTED`、未知をnullで保つ準備記録 |
| `.hackathon\challenge\hc-042\starter\packet-set.json.template` | D01〜D07の中立packet IDとfact |
| `.hackathon\challenge\hc-042\starter\starter\diagnostic-policy.md.template` | 診断方針の空ひな型 |
| `.hackathon\challenge\hc-042\starter\starter\route-map.md.template` | 六層と制御の対応図の空ひな型 |
| `.hackathon\challenge\hc-042\starter\starter\decisions.md.template` | task判断表の空ひな型 |
| `.hackathon\challenge\hc-042\starter\evidence\comparison.md.template` | 完成Evidenceの空ひな型 |

固定packetは次の七つです。期待分類ラベルや唯一の正解は配布しません。

| Task | 全条件に供給する状況 | 判断すること |
|---|---|---|
| D01 | 設定原稿は存在するが、発見とtool選択の記録は欠落 | 原稿存在だけで発見やcallを認定せず、次の観測を決める |
| D02 | Bash経路の通信拒否を記した資料 | network層の候補、許可の要否、停止先を決め、他層を成功扱いしない |
| D03 | MCP経路とsetup経路の資料、Bash制御の説明 | Bash firewall対象外と、通信成功・安全・認可を分ける |
| D04 | Agentsの保存scopeとpresence、認証失敗と認可拒否の異なる資料 | storage、consumer、authentication、authorizationを分け、値を取得しない |
| D05 | tool出力の業務メモと、無害だが命令口調の文章 | 内容の出所・真正性とinstruction authorityを分ける |
| D06 | Instructionsの `applyTo` と標準reviewのcontent exclusionを記した資料 | 指示適用範囲、管理者の除外制御、製品・Preview条件を分ける |
| D07 | 空の正常応答と、取得失敗で本文がない資料 | 空集合、失敗、未観測を保持し、server trustから認可成功を推定しない |

Runtimeの中立baselineは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` の515ファイルに由来しますが、このChallengeの判断根拠には使いません。
source aggregateはSHA-256 `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` です。
Runtime側の `.gitignore` と元 `.github\workflows\verify.yml` は二つの運用例外であり、合成packetの由来やaccess成功の証拠ではありません。

## Open Question

**原因を決めつけず、安全な次の観測と相談先を選べる診断方針を、どの順序・粒度で作りますか。どの情報が足りなければ停止しますか。**

六層を常に上から直線実行する必要はありません。
危険度、観測費用、担当者、すでにある証拠に応じて順序を変え、どの条件なら確認を省略できるかも説明してください。

## Design Time

比較結果を見る前に、各conditionで使う方針を先に凍結します。

1. `baseline` では、自分が普段ならどの順番で何を確認するかを短く書きます。資料を減らしたり、難しいpacketを隠したりしません。
2. `diagnosis-policy` では、六層、presence、server trust、停止先、相談先、禁止行為を含む方針を設計します。
3. taskごとに、結論、根拠にしたpacket箇所、残る代替仮説、追加観測、停止先を記録する形式を決めます。
4. `unknown`、空の正常応答、取得失敗、未観測を別の値として残す方法を決めます。
5. 同じD01〜D07を一巡する前に方針本文とrevisionを固定します。途中で直す場合は新しいrunとし、前の失敗を削除しません。

参加者成果は各condition専用Runtimeの次のexact pathへ作ります。

- `participant\hc-042\diagnostic-policy.md`
- `participant\hc-042\route-map.md`
- `participant\hc-042\decisions.md`

分類木、図の形式、優先順位は自由です。六層の意味、固定task、禁止境界は変えません。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。`--run` の値は、この後のRuntime applyで同じ `--run-id` として使います。
dry-runはrepository作成、MCP登録、認証、network accessを行いません。

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-042 --condition baseline --team team-sora --run hc042-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-042 --condition diagnosis-policy --team team-sora --run hc042-policy-01
node .\scripts\build-pack.mjs --challenge HC-042 --output .runtime/packs
```

生成先がすでに存在する場合は削除や上書きをせず、Pack version / hashを確認するか、未使用のHub checkoutでbuildします。

### 2. 条件ごとに独立したRuntimeを準備する

[Getting Started](../../docs/getting-started.md) と
[Runtime repository guide](../../docs/runtime-repository-guide.md) に従い、二条件を別の新しい非公開Runtime repository、名前付きbranch、workspaceで実施します。
次はbaselineの例です。Customized側は `$Condition` と `$RunId` を `diagnosis-policy` / `hc042-policy-01` に替えます。

```powershell
$Pack = 'C:\work\hackathon-hub\.runtime\packs\hc-042-v1'
$Condition = 'baseline'
$RunId = 'hc042-baseline-01'

git status --short --branch
git switch -c "hc-042-$Condition"
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

既存変更、既存run、名前衝突、template不一致なら停止します。`.hackathon\run.json` を手編集せず、別branchへの移動や `branchSafe` の偽装で続行しません。

### 3. 不活性ひな型から参加者文書を作る

次は各 **Runtime checkout** のrootで、人が一度だけ実行します。既存成果があれば上書きせず停止します。

```powershell
$Starter = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.hackathon\challenge\hc-042\starter')
$Participant = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('participant\hc-042')
$Evidence = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.hackathon\evidence\hc-042')

[System.IO.Directory]::CreateDirectory($Participant) | Out-Null
[System.IO.Directory]::CreateDirectory($Evidence) | Out-Null
[System.IO.File]::Copy((Join-Path $Starter 'starter\diagnostic-policy.md.template'), (Join-Path $Participant 'diagnostic-policy.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'starter\route-map.md.template'), (Join-Path $Participant 'route-map.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'starter\decisions.md.template'), (Join-Path $Participant 'decisions.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'evidence\comparison.md.template'), (Join-Path $Evidence 'comparison.md'), $false)
```

編集できるのは三つのparticipant成果と完成Evidenceだけです。
Pack、starter、Java、`.github`、`.vscode`、MCP設定、firewall、secret / variable設定は変更しません。全条件で `allowedMutations: []` です。

### 4. 同じ固定入力へ方針を適用する

両条件で `request.txt.template` と `packet-set.json.template` の同じbytes、D01〜D07の同じ順序を使います。
人が資料を読み、三つの文書へ判断を記入するだけで本編を完了できます。
Copilotを草稿支援に使う場合も必須ではなく、実際に渡した本文、client / host、model / effort / toolsを記録し、他条件の回答を追加ヒントにしません。

秘密値、値hash、raw session log、実送信先を収集しません。networkや認証を試してpacketの空欄を埋めることも行いません。

## Compare

| 条件 | 先に凍結するもの | 同じtaskへ行うこと |
|---|---|---|
| Baseline: `baseline` | 自分の通常の診断順序と停止基準 | D01〜D07を一巡し、根拠、未知、次の確認を記録 |
| Customized: `diagnosis-policy` | 六層、presence、trust、相談先、禁止境界を含む設計方針 | 同じD01〜D07を一巡し、同じ項目を記録 |

比較するのは、原因を一つへ早合点した件数ではなく、根拠へ戻れる結論、残した代替仮説、不要な権限要求、誤った安全保証、停止判断です。
資料、task、出力種、反復回数は同じにします。追加反復を行うなら両条件で同じtask集合と回数を事前宣言し、片側だけ成功まで繰り返しません。

差がなければ `equal`、設計方針で誤判断や負担が増えれば `worse`、入力や環境が揃わなければ `incomparable`、準備条件で止まれば `blocked`、対象機能や実機経路が利用できなければ `unsupported` が正当なoutcomeです。
方針の追加不要、未観測、片側未実施も隠しません。BaselineよりCustomizedが必ず良いとは仮定しません。

## Evidence

完成Evidenceは各runの `.hackathon\evidence\hc-042\comparison.md` です。最低限、次の見出しを内容付きで残します。

- `Fixed task`
- `Environment`
- `Baseline`
- `Designed policy`
- `Comparison`
- `Outcome`
- `Evidence boundaries`

D01〜D07ごとに、condition、方針revision、packet ID、結論、根拠、代替仮説、不足、次の確認、停止先を対応付けます。
合成packetに書かれた状態と、自分が現実に実行した行為を別欄にします。

次の三種類を混ぜません。

1. **構造検査**: exact path、必要見出し、固定入力hash、許可範囲、提出集合をRuntimeが検査した結果。
2. **製品観測**: tool発見、call、network、認証、認可、出力利用を実サービスで観測した結果。本編では未実施です。
3. **教育効果**: 方針によって参加者の理解や判断が改善したか。本編の一回の文書比較だけでは未観測です。

したがってexporterの `runtimeBehavior` と `educationalEffect` は `not-observed` のままです。
静的passを実接続成功へ読み替えず、製品観測や教育効果を架空値で補いません。

## Submit

各Runtimeで次を実行し、自分のconditionの四ファイルだけをexportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

各conditionのeligible集合は次のexact 4 filesです。

- `participant\hc-042\diagnostic-policy.md`
- `participant\hc-042\route-map.md`
- `participant\hc-042\decisions.md`
- `.hackathon\evidence\hc-042\comparison.md`

starter、元資料、optional guide、raw log、build outputは提出しません。
Runtime PRへ三つの参加者文書とそのconditionのEvidenceを含め、
[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ二条件のRuntime URL / PR URL、run対応、比較、outcome、失敗、未知、設計理由をまとめます。
blocked / unsupportedでrepositoryやPRを作れなかった場合は、Formの指示どおりN/Aと理由を記録します。
[Submission Guide](../../docs/submission-guide.md) のredaction規則を守ってください。

## Judging

- 六層を区別し、観測された層だけを根拠付きで判断したか
- `present` / `absent` / `unknown`、空の正常応答、取得失敗、未観測を潰さなかったか
- MCP/setupとBash firewall、authenticationとauthorization、server trustとpermissionを混同しなかったか
- `COPILOT_MCP_`、Agents secrets / variables、content exclusion、Instructions `applyTo` の責任境界を説明したか
- 不要な権限要求、秘密取得、危険な迂回を避け、停止先と相談内容を具体化したか
- BaselineとCustomizedへ同じ十分な固定入力を渡し、`equal` や `worse` も保存したか

接続成功数、断定数、長い文書、特定の診断順序は採点しません。

## Bonus Mission

D03またはD07を一つ選び、同じ固定factから始めても「最初に確認する層」が異なる二つの安全な経路を紙上で比較してください。
どちらが常に正しいと決めず、観測費用、危険、担当者、停止条件がどう変わるかを追記します。
新しいcondition、実network probe、実認証は追加しません。

## Support / Fallback

本編はVS Code Stableで読める不活性資料と文書制作だけで完了できます。Copilot、Cloud、organization設定、account設定、Preview、実MCPは必須ではありません。
Packを適用できない場合は資料を読んで設計草稿を作れますが、Runtime検査・exportは `blocked` / not-observedとして区別します。

将来の任意ガイドは [credentials](optional/credentials.md)、[firewall](optional/firewall.md)、[content exclusion](optional/content-exclusion.md) です。
これらは `OPTIONAL_GUIDE_ONLY` であり、読むことも本編成功には不要です。ページの存在、dry-run成功、合成approval値は、秘密取得、設定変更、認証、network access、除外回避の許可になりません。
資格、実効policy、対象経路、追加承認、復元責任者が不足する場合は停止します。

権限を広げる、firewallを無効化・迂回する、content exclusionを回避する、秘密値や値hashを表示する、他人の設定を削除することはfallbackではありません。
詳細は [Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
