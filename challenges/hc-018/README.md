# HC-018 承認と隔離の境界を可視化しよう

## Challenge Story

後輩が「コマンドが動かなかったので安全でした」と報告しました。しかし、tool候補がなかったのか、承認待ちだったのか、人が拒否したのか、OSが拒否したのか、プログラム自身が失敗したのかで意味は変わります。

このChallengeでは、無害な `node --version` 一つと7件の合成packetを使い、**誰がどの境界を確認したか**を説明できる運用票を設計します。設定やsandboxを有効化すること、承認回数を減らすことは目標ではありません。

## この機能とは

似ている五つの段階を分けます。

| 段階 | 確認する問い |
|---|---|
| tool選択 | その操作を提案できるtoolが候補にあるか |
| proposal | 実行前に、何を行う提案が作られたか |
| 承認 | 人または既存規則が、その操作を許可したか |
| sandbox / OS境界 | 許可後でも、実行ホストOSが操作を許したか |
| program result | 起動したプログラム自身が成功・失敗したか |

Instructionsの「実行しないでください」は自然言語の依頼で、OSの強制拒否とは別です。設定値 `false` も、この課題では**askに戻す意味でありdenyではありません**。

小さな例では、proposal後に承認がpendingなら実行は始まっていません。allow-once後の `EACCES` はOS layerの候補ですが、packetの形だけで実sandboxの成功とは言えません。exit statusがないerrorは、原因を決めず証拠不足として残します。

[Use tools with agents](https://code.visualstudio.com/docs/agents/run/tools) 等の公開資料は2026-09-15に確認しています。資料、合成packet、普通のManual観測、実sandbox観測は別の証拠です。

## 向いていること / 向いていないこと

**向いていること**

- proposal、承認、実起動、結果、停止理由を別欄で記録する
- 人が判断する位置と、承認前に見せる情報を設計する
- 証拠不足をunknownのまま止める
- 追加設定不要、live未実施という判断を説明する

**向いていないこと**

- promptを出すため既存承認規則を全resetする
- Allow all、global auto approve、Autopilot、Assisted permissionsを有効にして比較を成立させる
- 人の拒否後に別tool、別shell、CLI直実行で迂回する
- 正常出力やEACCES一件から、全toolや全OSの隔離を証明する

## Starter Kit

[Pack manifest](pack/manifest.json) の `sourceKind` は `synthetic`、sourcePathsは空配列、conditionsは `baseline` / `boundary-review` です。Starter Kitの可視本文には **`SYNTHETIC_TRAINING_ONLY`** を置きます。合成packetはVS Code event schemaでも実ログでもありません。

固定コマンドは一つだけです。

```text
node --version
```

固定依頼は次のexact全文です。

> このコマンドだけを提案し、必要な通常承認を待ち、許可された場合だけ出力を示してください。設定・ファイル・ネットワーク・別toolは変更しないでください。

shellの複合コマンド、別version command、file書込み、network確認を加えません。合成packetの7ケースは次のとおりです。

| case | 固定された境界 |
|---|---|
| 候補なし | tool未選択、eventなし |
| 承認pending | proposal後、approval decisionはpending、executionなし |
| 人のdeny | proposal後、人がdeny、executionなし |
| OS側EACCES | allow-once後にexecution、OS layerのEACCES、非zero exit |
| 正常出力 | allow-once後にexecution、program layerの合成出力 `v22.16.0\n`、exit 0 |
| program error | allow-once後にexecution、プログラム自身のerror |
| 証拠不足 | 必要なeventまたはexit statusが欠け、原因を確定できない |

`v22.16.0` は固定packet内の合成値です。参加者環境のNode versionを測った値として使いません。

設定案の中心は次です。

```json
{
  "chat.tools.terminal.enableAutoApprove": false
}
```

これは `.template` の不活性原稿として読むだけです。`.vscode/settings.json`、User settings、既存approval rulesへ適用しません。`false` はaskでありdenyではありません。

Packは全conditionへ次を `.hackathon/challenge/hc-018/` に不活性配置します。

- `brief.md.template`、`request.txt.template`
- `starter/design.md.template`、`starter/comparison.md.template`
- `materials/command.txt.template`、`materials/events.md.template`、`materials/settings.json.template`
- `starter/boundary-map.md.template`、`starter/run-log.md.template`

必要なのはGit、Node.jsが既に使える場合の通常環境、Markdown / JSON編集、Hubと自分の非公開Runtimeへのアクセスです。Node、terminal tool、通常Manualを利用できなくても、合成packetの設計までで完了できます。

## Open Question

**後輩が「動かなかったから安全だった」と言ったとき、候補なし、承認待ち、人の拒否、OS側error、program errorを切り分けるには、どの記録が必要ですか。必要な人の確認を残す運用票を設計してください。**

どの段階で誰が何を見るか、承認前に何を表示するか、unknownで止める条件、追加設定を作らない条件も選びます。承認を自動化することが唯一解ではありません。

## Design Time

`participant/hc-018/design.md` に、観測前に次を記録します。

1. tool候補、proposal、approval、execution、result、cleanupの境界図。
2. client、harness、実行ホストOS、利用可能 / 選択tool、Manual状態、既存approval規則の可視性。
3. 人がallow-once / denyを選ぶ前に確認するcommand、cwd、変更範囲、network、期待出力。
4. pending、deny、EACCES、program error、exit status欠測で停止する基準。
5. 合成packet、ordinary Manual、stub、実sandboxを別の証拠として記録する方法。
6. promptを出すためのreset、Allow all、Autopilot、Assisted permissionsを使わない方針。
7. live観測が許可されない場合のdesign-only提出と、追加設定不要の理由。

各conditionはfresh Runtime repository、named branch、新しいworkspace・会話・run-idを使います。modelを使う場合もmodel / effort / toolsを条件間で揃え、HC-017のmodel比較を混ぜません。

## Build

### Hub checkoutで2条件を確認する

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-018 --condition baseline --team team-sora --run hc018-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-018 --condition boundary-review --team team-sora --run hc018-boundary-01
node .\scripts\build-pack.mjs --challenge HC-018 --output .runtime/packs
```

既存build出力を削除・上書きしません。

### conditionごとに新しいRuntime checkoutを使う

```powershell
$condition = 'baseline'
$runId = 'hc018-baseline-01'
$Pack = 'C:\work\hub\.runtime\packs\hc-018-v1'
git switch -c $runId
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $condition --run-id $runId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

`boundary-review` は別repositoryと別run-idで開始します。run bindingを手編集しません。

### 許可された成果物だけを作る

両conditionで次を作ります。

- `participant/hc-018/design.md`
- `participant/hc-018/run-log.md`

`boundary-review` だけ次を追加します。

- `participant/hc-018/boundary-map.md`
- `participant/hc-018/approval-policy.json.template`

`approval-policy.json.template` は適用しない不活性原稿です。「追加不要」と判断する場合も、理由と安全な案を残せます。`.vscode/settings.json` やUser settingsは作りません。

`run-log.md` は合成packetとlive観測を別表にし、client、host OS、tool候補、proposal、command、approval要否、既存規則、人の決定、実起動、stdout / stderr、exit status、停止理由を分けます。

ordinary Manualのlive観測が既に許可されている場合だけ、固定依頼を使い、**このChallenge全体で最大1回**提案します。観測したrunだけへlive rowを記録し、もう一方のrunへ複製して「観測済み」としません。promptが出なくても再試行やapproval resetをしません。人がdenyしたらそのrunは停止し、別toolで迂回しません。許可がなければ合成packetだけで完成します。

全conditionで `allowedMutations: []` を維持します。EvidenceはRuntime所有の `.hackathon/evidence/hc-018/comparison.md` へ記入し、`allowedAdditions` へ重複登録しません。

## Compare

Hub共通の比較表示では `baseline` を **Baseline**、`boundary-review` を **Customized** と呼びます。Customizedはactive customization、approval設定、sandboxの適用・成功を意味せず、このChallengeで境界票を使う設計側の表示語です。

| condition | 同じ入力で行うこと | 比較の境界 |
|---|---|---|
| `baseline` | 通常Manualの状態を記録し、live枠をこのrunで使うなら同じ無害な提案を1回だけ観測。7 packetを任意の方法で説明 | 最初から正しく分類できてもよい |
| `boundary-review` | 同じcommand、依頼、tools、model / effort、Manual状態で、自作の境界票を使い同じpacketを整理。live枠をbaselineが使った場合、このrunは未観測 | 設計差を比較。approval設定やsandboxのON/OFF差ではない |

Manualは「全commandで毎回promptが出る」保証ではありません。既存規則でauto-approvedなら、その可視範囲を記録します。promptを発生させるための設定変更はしません。

正常出力は拒否境界の証明ではなく、tool非選択はOS禁止の証明ではありません。EACCESやprogram errorの合成分類も実sandbox観測ではありません。2条件が同じなら同等です。

比較結果は `equal`（同等）、`worse`（悪化）、追加不要、`blocked`、`unsupported`、`incomparable`、未観測を許容します。live rowがないことを失敗とせず、設計だけの到達点を実機成功へ昇格しません。

## Evidence

各runの `.hackathon/evidence/hc-018/comparison.md` は次のexact 7見出しを使います。

`Fixed task` / `Environment` / `Design` / `Run log` / `Comparison` / `Outcome` / `Limits and cleanup`

- **Fixed task**: HC、condition、run-id、固定command / request、packet / Packのhash、`SYNTHETIC_TRAINING_ONLY`
- **Environment**: client、harness、host OS、tools、Manual状態、既存approval規則の見える範囲
- **Design**: 境界図、人が見る項目、falseとdenyの違い、追加設定不要の判断
- **Run log**: 7 synthetic casesとlive rowを分離し、proposal / approval / execution / result / exitを記録
- **Comparison**: 相手run-id、controls一致、設計差、prompt欠測、成立しないsandbox比較
- **Outcome**: 同等、悪化、blocked、unsupported、incomparable、未観測と根拠
- **Limits and cleanup**: approval reset、設定適用、sandbox probe、network、別tool、実隔離を行っていないこと、自分の追加分だけの整理

CLIで自分が `node --version` を実行した記録を、VS Codeのproposal / approval証拠にしません。原因不明のerrorをsandbox成功へ再ラベルしません。`runtimeBehavior` と `educationalEffect` は `not-observed` のままです。

## Submit

当該conditionのparticipant成果物と記入済みEvidenceを検査してexportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

baselineのRuntime PRには `design.md` / `run-log.md`、boundary-reviewにはそれらと `boundary-map.md` / `approval-policy.json.template` を含めます。Evidenceは両方に含めます。

[共通Challenge Result Issue](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、各run、Runtime PR、Pack、live実施 / 未実施、synthetic packet、比較結果を対応付けます。`Challenge-specific design` には、境界図、人が見る項目、falseとdenyの違い、未実行理由、追加設定不要の判断を書きます。

## Judging

- tool選択、proposal、approval、OS / sandbox、program resultを区別したか
- fixed commandとsingle-command requestを変えなかったか
- 7 synthetic casesとlive観測を無標識で混ぜていないか
- `false` をdenyとせず、Manualや既存規則の限界を説明したか
- deny後の迂回、approval reset、Allow all等で比較を作っていないか
- exit status欠測や原因不明をunknownのまま止めたか
- equal / blocked / unsupported / 追加不要を有効な結果として扱ったか

承認回数、tool数、正常実行数では採点しません。人の判断位置、Evidenceの完全性、停止の誠実さを見ます。

## Bonus Mission

7 packetの一つへ、event順序の不整合を一つだけ紙上で加え、どの境界で検出して停止するか説明してください。実設定、実event、sandbox probe、追加conditionは作りません。

## Support / Fallback

次の任意routeはどちらも `OPTIONAL_GUIDE_ONLY` / `live-unobserved` で、本編とは別の準備確認です。

- [terminal-sandbox: terminal sandboxの準備境界](optional/terminal-sandbox.md) — PreviewのmacOS / Linux / WSL2実行ホストが対象です。Windows nativeは資料読解まで。依存導入、elevation、保護解除、owned dummy pathの別許可が必要なら停止します。
- [mcp-sandbox: stdio MCP sandboxの準備境界](optional/mcp-sandbox.md) — macOS / Linuxのlocal stdioが対象です。terminal資料からWSL2対応を転用しません。server trust、起動、auto-approval挙動、dummy操作の別許可が必要です。

MCPとterminalのsandboxは別境界です。Windows、別transport、許可条件とauto-approvalが合わない、元状態を保てない場合は停止します。本編Packにprobe writer、MCP server、OS設定変更、home / network probeを追加しません。

terminal toolやManualが利用できなくても、4つのparticipant成果物のうちconditionで許可されたものとsynthetic Evidenceを完成できます。終了時に整理するのは自分の不活性原稿と当該runだけで、既存approval rules、User設定、他人のworkspaceを変更しません。
