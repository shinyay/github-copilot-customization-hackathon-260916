# HC-017 タスクに合うモデルと推論量を選ぼう

## Challenge Story

受注承認の固定分析を短い表へ整理したいのに、「新しいモデルだから正確」「推論量を上げたから安全」と先に結論すると、入力差、tool差、未確認の補完を見落とします。モデルを変える比較と、同じモデルでeffortだけを変える比較も別の実験です。

このChallengeでは、利用中の通常Stableで既に承認済みの候補だけを使い、同じ7行、同じ初回依頼、同じ追問を比較します。必要な候補がなければdesign-onlyで完了でき、架空のmodel名や応答を実測欄へ入れません。

## この機能とは

**モデル選択**は同じ依頼を処理する推論器の選択、**Thinking Effort**は対応する同一model内の推論設定です。Instructions、tools、添付文脈を同時に変えると、modelまたはeffortだけの差とは言えません。

例えば、実験Mでは承認済みmodel AとBを比べます。実験Eでは別groupを作り、同じmodel Eの利用可能な値e1とe2だけを比べます。AとEが同じ表示名でも、Mの `baseline` 応答をEへ再利用しません。

要求したmodel名、pickerの表示名、応答hover等で観測した表示、provider、内部実装IDは同じとは限りません。観測できない値は未知のままにします。Autoはrequest単位でroutingされるため、このcontrolled comparisonから除外します。

公式資料は2026-09-15に確認した [AI language models in VS Code](https://code.visualstudio.com/docs/agent-customization/language-models) を参照します。利用資格、表示、effort menu、adaptive reasoningは環境依存であり、この教材の文書確認を実機成功へ読み替えません。

## 向いていること / 向いていないこと

**向いていること**

- 同じ固定入力で、modelとeffortを別々のfactorとして比較する
- 根拠保持、入力にない追加、修正負担、欠測を記録する
- 候補を切り替えない、追加customization不要という判断を説明する
- controlledと呼べない残留や表示不足を `incomparable` とする

**向いていないこと**

- Auto、provider、credentials、組織policyを変更して候補を作る
- 異なるmodel間のeffort表示を同じ物理的計算量とみなす
- 出力量、長いthinking、単発のよい回答だけで精度や教育効果を証明する
- 内部思考全文、秘密ログ、未承認providerへのprivate codeを収集する

高effortやmodel切替が不要という結論も正当です。

## Starter Kit

[Pack manifest](pack/manifest.json) の `sourceKind` は `baseline`、conditionsは `baseline` / `model-alternate` / `effort-reference` / `effort-alternate` です。Java原本は **shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787**。Runtime rootの次を人が根拠確認に使います。

| ID | exact source path | 読む場所 |
|---|---|---|
| S1 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | `require` |
| S2 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | `require` |
| S3 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | `approve`、`validateActive` |
| S4 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Checks.java` | `version` |
| S5 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/CreditService.java` | `checkApproval` |

固定分析は次の**exact 7行**です。730 bytes、SHA-256は `8593ce3659396a8b451de79e3cdd437a2e97d8f56f7852809ae9ef198e83ce02` です。

```text
この固定入力はモデル比較用の教材であり、前のラボの回答ではない。
確認したソース: OrderService.approve、BaseService.require、Actor.require、Checks.version。
静的に読めること: actorがnullなら拒否する。MANAGERまたはADMINが権限検査を通る。
expectedVersionが実際のversionと一致しなければ拒否する。状態はSUBMITTEDを要求する。
起票者本人による承認は禁止で、ADMINもこの業務条件を省略しない。
activeと与信の検査を通った後にAPPROVED、承認者、承認日時を設定する。
Java/DBは未実行。実環境の認証・transaction適用・過去の設計理由はこの入力では確定しない。
```

初回依頼は次の全文です。

> 固定分析全文だけを使い、条件・拒否時・根拠 / 未確認の表へ整理してください。入力にない業務事実や実行結果を補わないでください。

追問は次の全文です。

> 元の固定分析と照合し、抜け・入力にない追加・未確認の断定があれば直してください。新しい業務事実を追加せず、修正箇所を示してください。

Packは全4条件へ同じbytesで次を `.hackathon/challenge/hc-017/` に不活性配置します。

- `brief.md.template`、`request.txt.template`
- `starter/design.md.template`、`starter/comparison.md.template`
- `materials/model-input.txt.template`、`materials/source-map.md.template`
- `materials/follow-up.txt.template`、`materials/comparison-protocol.md.template`
- `starter/controls.md.template`、`starter/responses.md.template`

実施前preflightは、(1) 利用可能で承認済みのmodelが二つあること、(2) 同じ承認済みeffort対応modelで二つの実在値を選べること、(3) model / effort / provider等の必要表示を記録できることです。満たさなければ4条件の設計と不足理由を作り、live部分は `blocked`、`unsupported`、`incomparable`、未観測とします。

組織policy、trust、provider、API key、Custom Endpoint、User設定を変更しません。BYOKやutility modelは本編に含めません。

## Open Question

**受注承認の固定分析を、根拠と未確認を落とさず短い表にするには、どの承認済みmodelとeffort設定を選びますか。切替や高effortが不要だと判断する条件は何ですか。**

品質だけでなく、修正負担、欠測、観測可能な時間・使用量、統制不能な要因も比較前に決めます。教材は特定modelの順位、料金、削減率を正解として固定しません。

## Design Time

`participant/hc-017/design.md` と `controls.md` に、応答を見る前に次を記録します。

1. **実験M**のmodel A / B、共通にできるeffortまたはadaptive条件、同じにするtools・承認・harness。
2. **実験E**のmodel Eと実pickerで確認したe1 / e2。Mとは別group・別runにする。
3. 要求model、観測表示と出所、provider、要求・観測effort、adaptiveの可視性、utility経路の不変更。
4. 固定7行、初回依頼、追問、提示順、source accessのhashと、前の応答を持ち込まない方法。
5. actor / role、version / SUBMITTED、自己承認 / ADMIN、active / 与信、更新項目、未確認事項の6観点。
6. 反復する場合の回数と停止条件。欠測を除外せず全件を残す。
7. model / provider / adaptive等が変わったときにcontrolled比較を止める条件。

**Mの `baseline` をEの `effort-reference` として再利用してはいけません。** model EがAと同じでも、Eはfresh repository、workspace、conversation、run-idで独立実施します。

## Build

### Hub checkoutで4条件を確認する

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-017 --condition baseline --team team-sora --run hc017-model-a-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-017 --condition model-alternate --team team-sora --run hc017-model-b-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-017 --condition effort-reference --team team-sora --run hc017-effort-e1-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-017 --condition effort-alternate --team team-sora --run hc017-effort-e2-01
node .\scripts\build-pack.mjs --challenge HC-017 --output .runtime/packs
```

既存build出力があれば上書き・削除せず停止します。

### 各conditionを独立Runtime checkoutへ適用する

```powershell
$condition = 'baseline'
$runId = 'hc017-model-a-01'
$Pack = 'C:\work\hub\.runtime\packs\hc-017-v1'
git switch -c $runId
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $condition --run-id $runId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

残る3条件も別repositoryで実行します。conditionやrun bindingを手編集しません。

### 成果物とlive実践を分ける

全4条件で次のexact pathだけを新規作成します。

- `participant/hc-017/design.md`
- `participant/hc-017/controls.md`
- `participant/hc-017/responses.md`

全conditionで `allowedMutations: []` を維持します。Evidenceは `allowedAdditions` ではなく、Runtime所有の `.hackathon/evidence/hc-017/comparison.md` です。Starterから新規作成し、既存fileを上書きしません。

preflightが成立したrunだけ、通常Chatへ固定7行と初回依頼を同じ順序で全文送信します。必要なら同condition内でだけ固定追問を一度行い、初回と追問後を分けて保存します。他conditionの表や応答を渡しません。

Mではmodelだけ、Eではeffortだけを変更します。観測表示が要求と一致するか確認できなければ、その事実を残して限定診断または `incomparable` とします。存在しない内部ID、時間、token、料金を補いません。

preflightが成立しない場合も、4条件それぞれのcontrols、想定する比較、未実施理由を完成できます。synthetic応答で空欄を埋めたり、Autoへ置き換えたりしません。

## Compare

Hub共通の比較表示は実験groupごとに分けます。Mでは **Baseline** = `baseline`、**Customized** = `model-alternate`、Eでは **Baseline** = `effort-reference`、**Customized** = `effort-alternate` です。Customizedはactive customizationの適用・成功を意味せず、そのgroupで変更するmodelまたはeffort側の表示語です。

| 実験 | condition | 固定するもの | 変えるもの |
|---|---|---|---|
| M | `baseline` | 7行、依頼、tools、承認、harness、対応可能なeffort条件 | 承認済みmodel A |
| M | `model-alternate` | 同上 | modelだけB |
| E | `effort-reference` | 7行、依頼、model E、provider、tools、承認 | effort e1 |
| E | `effort-alternate` | 同上 | effortだけe2 |

MとEは別のcomparison groupです。異なるmodel間でeffort labelが同じでも同じ計算量とは言えません。Mでeffort / adaptiveを対応付けられなければmodel-onlyの効果へ帰属せず、「model構成の診断比較」とします。Eでmodelやproviderまで変わればeffort-only比較を止めます。

`responses.md` では固定分析へ戻り、6観点ごとに保持、欠落、入力にない追加、要修正を人が確認します。初回と追問後を混ぜません。文量やthinkingの長さでは勝敗を決めません。

結果は同等、悪化、改善、追加不要、`blocked`、`unsupported`、`incomparable`、未観測を許容します。比較不能なrunを都合よく分母から除外しません。

## Evidence

各runの `.hackathon/evidence/hc-017/comparison.md` は次のexact 7見出しを使います。

`Fixed task` / `Environment` / `Design` / `Run log` / `Comparison` / `Outcome` / `Limits and cleanup`

- **Fixed task**: condition、run-id、M/E group、固定7行・初回依頼・追問・source・Packの識別とhash
- **Environment**: client、harness、OS、要求model、観測表示と出所、provider、要求・観測effort、adaptive、tools、承認
- **Design**: factor、事前予想、観測点、停止条件、modelを切り替えない判断
- **Run log**: 初回 / 追問後、全反復、欠測、実施またはdesign-only
- **Comparison**: 相手run-id、input / controls一致、MとEの分離、残留や統制不能
- **Outcome**: 6観点の保持・欠落・追加・修正負担と、同等 / 悪化 / 追加不要等
- **Limits and cleanup**: 内部ID、思考全文、実認証、transaction、DB、教育効果を観測していないこと、自分が変えた選択だけの復元

未観測値を0、default、要求名で埋めません。`runtimeBehavior` と `educationalEffect` は `not-observed` のままです。credential、秘密endpoint、生のprivate transcriptは提出しません。

## Submit

各conditionのRuntime branchで3成果物と記入済みEvidenceを検査・exportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

各Runtime PRは一つのcondition / runだけを表します。[共通Challenge Result Issue](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に4つのrun-id、Runtime PR、Pack、M/E group、比較結果、欠測を対応付けます。未実施conditionを完了済みとせず、相手runがなければ未実施と書きます。

`Challenge-specific design` には、MとEを別実験にした理由、未知のcontrols、固定入力の保持、追問による修正負担、選択しない判断を書きます。optional routeの記録は本編結果へ合算しません。

## Judging

- model選択とeffortを説明し、Instructions・tools・contextとの差を区別したか
- exact 7行、初回依頼、追問、source境界を全runで保ったか
- MとEを別group・別runにし、M baselineをEへ再利用していないか
- 要求modelと観測表示、provider、adaptive、未知値を正直に記録したか
- 6観点を固定分析とsourceへ戻って確認したか
- 欠測や統制不能を除外せず、Autoやsynthetic値で補っていないか
- equal / worse / blocked / 追加不要を有効な結果として扱ったか

高effort、出力量、応答速度、改善した回数だけでは採点しません。比較の誠実さ、根拠保持、修正負担、非主張を人が確認します。

## Bonus Mission

本編の入力と4条件を変えず、「どの観測ならmodel / effort切替を採用しないか」という停止規則を一つ追加してください。別model、第三effort、追加providerを試すBonusではありません。

## Support / Fallback

次はすべて `OPTIONAL_GUIDE_ONLY` / `live-unobserved` で、本編conditionや権限を増やしません。

- [byok-provider: provider登録の準備境界](optional/byok-provider.md) — provider、API、実model ID、データ取扱い、費用、secure inputの別承認が必要。未承認endpointへ固定分析やprivate codeを送りません。
- [utility-models: utility経路の観測準備](optional/utility-models.md) — Chat modelとutility modelを分けます。設定追跡と実効model観測ができなければ停止します。
- [host-byok: Agent Host BYOKの準備境界](optional/host-byok.md) — 対応Host / OS、Experimental設定、provider、鍵、費用、架空短文送信の別承認が必要です。Local疎通をHost成功へ転記しません。

provider登録、credential保存、User設定変更をRuntime v1は管理しません。候補が二つない、effort値が二つない、Autoしかない、実効表示を確認できない場合はdesign-onlyで提出し、`blocked` / `unsupported` / `incomparable` を記録します。

終了時は自分が選んだmodel / effortだけを元へ戻し、復元を確認します。新しい会話を開いただけでeffort resetとせず、既存provider、鍵、User設定、Memoryを一括削除しません。
