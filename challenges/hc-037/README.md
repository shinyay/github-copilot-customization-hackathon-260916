# HC-037 LiteとBalancedのレビュー品質を比べよう

## Challenge Story

税額まわりの変更を標準code reviewへ依頼するとき、チームはLiteとBalancedのどちらを選ぶべきか迷っています。長い指摘が多い方を勝ちにすると、根拠のない警告や確認の手間まで「品質」に数えてしまいます。一方、実サービスをすぐ使えない環境でも、比較前に何を固定し、何をEvidenceへ残すかは設計できます。

このChallengeの本編は、同じ二つの候補差分について**レビュー評価計画**を作る演習です。標準reviewは依頼しません。Liteを計画する `baseline` とBalancedを計画する `balanced-plan` の両方を `planned-not-requested` として記録し、実effort、内部model、指摘、費用を観測したことにはしません。

このページとStarter Kitだけで完結します。以前のChallenge、元のLabs、前の回答、既存のreview設定は必要ありません。

## この機能とは

Copilot code reviewのeffortは、標準reviewへどの深さで分析してほしいかを依頼ごとに選ぶ設定です。LiteとBalancedは、Chatのmodel picker、thinking effort、Custom Agentの役割、手動promptの長さとは別です。要求したeffortと実際に表示されたeffortも分けて記録します。

小さな例として、`TaxAmounts` は税率ごとに金額を集約し、`Money.tax` を使ってbucketごとに丸めます。`0.10` と `0.1000` のような表現を含む候補差分を読むときは、変更行だけでなく、集約、丸め、既存testの意味へ戻る必要があります。ただし、このページは `candidate-01` と `candidate-02` のどちらに問題があるかを教えません。一方には通常の変更が含まれますが、対応表や期待分類は配布しません。

本編で行うのは、次の四つの計画セルを同じ評価方法で埋めることです。

| condition | requested effort | task | candidates |
|---|---|---|---|
| `baseline` | Lite | `amount-review` | `candidate-01`, `candidate-02` |
| `balanced-plan` | Balanced | `amount-review` | `candidate-01`, `candidate-02` |

手動promptを「標準review相当」の第三条件にはしません。人によるsource読解は事前点検として残せますが、LiteやBalancedのreview出力には数えません。

製品説明の根拠は [Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review) と [Code review effort levels GA](https://github.blog/changelog/2026-08-07-copilot-code-review-effort-levels-are-generally-available/) です。文書確認日は2026-09-15です。資料の存在やGAの説明は、この教材で標準review、費用、agentic fallback、CI visibilityを観測した証拠ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 実reviewを依頼する前に、支持された指摘、誤検知、見落とし、確認負担の記録方法を決めること。
- 正常な変更も含め、finding数だけではない比較を準備すること。
- 片側の欠測や利用資格不足を、0件や敗北へ変換しない停止基準を作ること。
- LiteまたはBalancedを選ばない理由や、追加実験が必要な理由を説明すること。

**向いていないこと**

- 計画書を作っただけで、実reviewの品質、実effort、内部model、費用を評価済みとすること。
- Balancedの文量や指摘数を、そのまま高品質とみなすこと。
- 一回の結果を統計的な優位と呼ぶこと。
- 手動prompt、Custom Agent、別のmodel比較を混ぜて標準reviewの第三条件を作ること。
- candidate diffをRuntimeのJavaへ適用し、Java/testを実行済みとすること。

## Starter Kit

source種別は `baseline` です。元アプリは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` に固定され、Runtimeの515-file baselineに存在します。PackはJavaを複製・変更しません。

| Runtime rootから読むexact path | 戻るsymbol |
|---|---|
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java` | `TaxAmounts.add`, `TaxAmounts.getTaxAmount`, `TaxAmounts.getTotalAmount` |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java` | `Money.tax` |
| `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java` | `CommonRulesTest.taxIsRoundedPerRateRatherThanPerLine` |

test定義は読めますが、Java、Maven、DB、testを実行したとは書きません。source pathやsymbolへ戻ったことと、実行結果を得たことは別です。

[Pack manifest](pack/manifest.json) は、公開時に両条件へ次の不活性素材を同じbytesで渡します。

| 素材 | 役割 |
|---|---|
| `brief.md.template` | 本編が評価計画であり、review依頼ではないことを確認する |
| `request.txt.template` | 両条件で固定する未送信依頼全文 |
| `design.md.template` | 支持判定、誤検知、負担、欠測を設計する |
| `comparison.md.template` | conditionごとのEvidenceひな型 |
| `input/candidate-01.diff.template` | 中立名の候補差分 |
| `input/candidate-02.diff.template` | 中立名の候補差分 |
| `input/controls.json.template` | effort以外に固定する項目 |
| `input/rules.md.template` | 金額・丸め・根拠の共通規約 |
| `input/source-map.md.template` | 上の3 pathとsymbolへの入口 |

比較前に、source commit/ref、`amount-review`、両candidateのraw bytes、依頼全文、規約全文、評価観点、設計revisionを凍結します。Skills、MCP、既存review、Memory、CI visibilityの残留は「同じにできたかを確認する項目」であり、見えなければ `not-observed` のままです。

必要なのはGit、Node.js 22以降、テキストを編集できる環境、Hubと自分の非公開Runtimeを扱う通常の参加権限です。本編に標準reviewの利用資格や課金枠は不要です。

## Open Question

**金額に関する同じ候補を、どの指摘なら役立つと判定し、どんな誤検知・負担・欠測を残せば、LiteとBalancedを公正に選べるでしょうか。**

- findingが変更行とsource/testへ結び付いたと判断する最小単位は何ですか。
- 正常な変更への警告を、どのようにfalse positiveとして検討しますか。
- reviewerが確認する時間、重複指摘、根拠確認の手間をどう残しますか。
- 片側だけ実行できた場合、どの条件で比較を `incomparable` としますか。
- 一回の比較で選ばず、次の検証が必要だと判断する境界は何ですか。

LiteまたはBalancedを必ず推奨する課題ではありません。現状の情報では選べない、追加reviewは不要、別承認後に限定試行したい、という設計も有効です。

## Design Time

1. `candidate-01` と `candidate-02` を両条件で扱う四つの計画セルを作ります。片方のcandidateを省略しません。
2. finding候補ごとに、引用、変更行、支持source/test、支持範囲、`unsupported`、重複、正常変更への誤検知、確認負担を分ける欄を設計します。精度の分母がないときに比率を作りません。
3. `requested effort` と `effective effort`、内部model、actor、base/head、費用、agentic fallback、CI visibilityを別欄にします。本編ではrequested effort以外は原則 `null` または `not-observed` です。
4. 人の事前点検を保存する場合は、Lite/Balancedの出力と混ぜず、sourceへ戻った自分の読解として記録します。
5. 反復数、費用、時間上限は本編で仮定しません。任意実機を検討するときに別承認で決めます。良い結果が出るまで再要求する計画にはしません。
6. 計画を凍結した後で評価軸を変えたくなったら、revisionを上げて別の比較として扱います。以前の計画や別条件の回答を上書きしません。

参加者自身の判断を `participant/hc-037/evaluation-plan.md.template` と `participant/hc-037/review-request.md.template` へ保存します。後者は未送信原稿であり、PRへのreview request、コメント、API callではありません。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。dry-runは計画表示だけで、review依頼、repository作成、候補適用を行いません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-037 --condition baseline --team team-sora --run lite-plan-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-037 --condition balanced-plan --team team-sora --run balanced-plan-01
node .\scripts\build-pack.mjs --challenge HC-037 --output .runtime/packs
```

`--output` はWindowsでもCLI契約の `.runtime/packs` を使います。既存出力を削除・上書きしません。生成されたPack directory、版、hashを記録し、`manifest.json` 単体ではなくdirectoryをRuntimeへ渡します。

### 2. conditionごとにfresh Runtimeを用意する

[Getting Started](../../docs/getting-started.md) に従い、Runtime templateから**二つの新しい非公開repository**を作ります。各conditionで別repository、名前付きbranch、新規workspace、新しい会話を使います。repositoryや会話を分けただけで、User設定、organization設定、Memory、既存review、homeが消えたとは考えません。確認できない残留はEvidenceへ残します。

各 **Runtime checkout** のrootで、そのrepositoryに対応するconditionを一つだけ適用します。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-037-v1'
$Condition = 'baseline'
$RunId = 'lite-plan-01'
git status --short --branch
git switch -c "hc-037-$Condition-plan-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
```

もう一方の未使用Runtimeでは `$Condition = 'balanced-plan'`、`$RunId = 'balanced-plan-01'` とし、同じpreflightを行います。どちらも `$RunId` をHub dry-runの `--run` と一致させ、EvidenceとHub Issueのrun IDにも同じbindingを記録します。cleanなRuntime、templateVersion 1、applyしたbranchへのbindingを確認し、`.hackathon/run.json` を手編集しません。

### 3. 不活性な計画だけを作る

各conditionで作成できる参加者成果物は次の二つです。

| exact path | 保存する内容 |
|---|---|
| `participant/hc-037/evaluation-plan.md.template` | 四計画セル、支持判定、誤検知、負担、欠測、停止条件 |
| `participant/hc-037/review-request.md.template` | candidateとrequested effortを固定した未送信依頼原稿 |

Evidenceは `.hackathon/evidence/hc-037/comparison.md` に置きます。Starter原本を編集・renameせず、既存のコピー先を上書きしません。candidate diffをJavaへ適用せず、activeなreview設定、workflow、PR、review requestを作りません。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

この検査は許可pathとrun-stateの確認です。評価計画の妥当性、標準reviewの利用可能性、Java behaviorを自動採点しません。

## Compare

| condition | このページでの呼び名 | 比較する計画 |
|---|---|---|
| `baseline` | Baseline | requested effortをLiteとした `amount-review` の評価計画 |
| `balanced-plan` | Customized | requested effortをBalancedとした同じ `amount-review` の評価計画 |

固定するのはsource/ref、candidate-01/02の全文とraw bytes、依頼全文、規約全文、task、判定観点、revisionです。変更するのはrequested effortだけです。どちらも状態は `planned-not-requested` で、実review出力はありません。

したがって本編で比較できるのは、計画が同じ根拠単位を使えるか、欠測を隠さないか、負担と誤検知を評価できるかです。Lite/Balancedの実品質差や費用差を結論にしません。手動promptを追加して「標準review相当」の第三条件を作らないでください。

結論は `improved`、`same`（共通Issueのoutcomeでは `equal`）、`worse`、`no-addition-needed`、`not-observed`、`unsupported`、`blocked`、`incomparable` のいずれでも構いません。たとえば、Balanced計画の確認欄が増え過ぎれば `worse`、両計画が同じ判断材料しか持たなければ `same`、実reviewなしでは選べなければ `not-observed` や `incomparable` が正当です。

## Evidence

各Runtimeの `.hackathon/evidence/hc-037/comparison.md` に、少なくとも次のexact headingを残して記入します。

- `Fixed task`
- `Environment`
- `Condition and input`
- `Design`
- `Comparison`
- `Outcome`
- `Limitations`
- `Effort controls`
- `Candidate coverage`
- `Supported findings and false positives`
- `Missing observations and burden`

`Environment` にはcondition、run ID、source/ref、candidate hash、Pack/template hash、設計revision、利用surface、actor、既存reviewやMemoryの確認範囲を書きます。実施していない層は明示します。

各計画セルの状態は `planned-not-requested`。実effort、内部model、finding、費用は `null` または `not-observed` とします。資料を読んだこと、依頼原稿を保存したこと、形式検査が通ったことを、review request、review完了、費用観測、agentic fallback、CI visibilityの成功へ昇格させません。

未実施・不明・取得失敗を0件、pass、N/Aへ変換しないでください。片側だけ後日実行した場合も、もう片側を0 findingsとして比較せず、別承認の別runとして記録します。

## Submit

各 **Runtime checkout** でEvidenceと二つのparticipant原稿を完成させ、apply時と同じPackを指定します。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

conditionごとのRuntime PRには、評価計画、未送信依頼、Evidence、再現手順だけを含めます。candidateを適用したJava変更、review結果、費用receiptは含めません。

続いてHubの [共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、Baseline / CustomizedのRuntime URL、PR URL、実run ID、固定したcandidateとrevision、outcome、未観測、次に実機を行うなら必要な承認をまとめます。`Challenge-specific design` には、支持判定、false positive、確認負担、比較不能の線引きを書きます。

[Submission Guide](../../docs/submission-guide.md) に従い、private diff、未加工log、個人情報、token、local絶対pathをIssueへ貼りません。Runtimeの静的検査が通っても、`runtimeBehavior` と `educationalEffect` は `not-observed` のままです。

## Judging

- 両conditionでcandidate-01/02を欠けなく扱い、requested effort以外を固定したか。
- finding数ではなく、支持、誤検知、重複、確認負担、欠測を分けたか。
- 正常変更も検討でき、no-findingや追加不要を許す計画か。
- requested effort、effective effort、内部model、費用、CI visibilityを混同していないか。
- `planned-not-requested` を守り、Java/testや標準reviewを実行済みにしていないか。
- `same`、`worse`、`not-observed`、`incomparable` を不利な結果として隠していないか。

Balancedを選んだこと、欄や文字数が多いこと、finding想定数、引用数だけでは採点しません。形式validatorは人の内容評価を置き換えません。

## Bonus Mission

凍結済みの四計画セルを変更せず、追加の金額例があればどの欠測を解消できるかを一つ提案してください。必要なsource、candidate、判定観点、停止条件を書き、期待する勝者は決めません。これは新しい実reviewでも第三conditionでもなく、次の独立runの設計案です。

## Support / Fallback

標準reviewの利用資格がなくても、本編の評価計画は完成できます。Runtimeを用意できない場合はローカルで二つの不活性原稿を作り、提出手続きだけを `blocked` と分けてください。sourceへアクセスできない、candidate bytesが一致しない、残留条件を確認できない場合は、数値を補わず `blocked` / `incomparable` として停止します。

任意の [`review-effort-live`](optional/review-effort-live.md) は、標準reviewを実施する別承認前の準備ガイドです。本編のcondition、Pack実行、review許可ではありません。実行回数・費用・時間上限、利用資格、candidate用PRの変更許可、既存自動review、base/head、実effort表示を事前に固定できなければ止めます。現在の本編Packはsource mutationを許可しないため、このPackだけでcandidate PR作成からreviewまで完走できるとは案内しません。

任意routeを読んだことも実review成功ではありません。実サービス、内部model、費用、agentic fallback、CI visibilityは `live-unobserved` / `not-observed` のままです。終了時も既存review、PR履歴、User/org設定、Memoryを削除せず、自分が作った不活性原稿とRuntime PRだけを管理します。

執筆根拠は固定Labs commitの [LAB-37原稿](https://github.com/shinyay/github-copilot-customization-labs/blob/3474d21dd62bad2e594e84657dabe2eb9bb876c1/docs/labs/lab-37-code-review-effort.md) です。このリンクは参加者の事前履修先ではなく、原稿のprovenanceです。
