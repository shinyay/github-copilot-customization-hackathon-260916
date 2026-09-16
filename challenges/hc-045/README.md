# HC-045 レビュー指摘を安全なCloud修正へ引き継ごう

## Challenge Story

税計算コードへのreviewで「税率ごとの集計方法が変わるかもしれない」という指摘候補が届きました。
そのままCloud修正へ転送すると、変更先、対象branch / head、許可scope、業務上の期待値、変更してはいけないtestが失われることがあります。
また、依頼の下書きができたこと、送信準備ができたこと、実際に送信したこと、相手が受理したこと、変更が適用されたことは別々の状態です。

このChallengeでは、実Java source三ファイルと、合成・改作した二つのcandidate / finding / handoff eventを照合し、未送信の安全な依頼草稿と独立した検証計画を作ります。
実Cloud修正、commit、push、mergeは行いません。このページとPackだけで完結し、別の教材や前のChallengeの回答は不要です。

## この機能とは

reviewからCloud修正へのhandoffは、指摘文をそのまま転送することではありません。
人がsourceへ戻って採否を判断し、変更対象、変更不可範囲、branch / head、期待するpost-image、独立した検証方法、停止条件を依頼へ保持する作業です。

このChallengeで作る `handoff-policy` は、実送信を自動化する設定ではなく、次の状態を混同しないための参加者自身の運用文書です。

| 状態 | このChallengeでの意味 |
|---|---|
| draft | 依頼本文を書き始めた。まだ送信準備や許可を意味しない |
| prepared | 対象、scope、branch / head、検証、停止を人が確認した |
| sent | 承認された経路で実際に送信したことを別証拠で確認した |
| accepted | 受信側が依頼を受理したことを確認した |
| applied | 対象headへ変更が適用されたことをsource / commitで確認した |

packet内の `humanValidated`、`sent`、`completed` に相当するtrueは、**教材に書かれた主張**です。
現実の許可、送信、受理、適用の証拠にはせず、裏付け情報と分けます。
製品上のFix with Copilotは依頼のdraftを作り、新しいPRまたは同じPRへのcommitを選ぶ経路を持ち得ますが、draft作成、送信、Cloud側の受理、source適用は別状態です。
その製品選択肢が存在しても、Runtime v1のbranch bindingを安全に移せるとは推定しません。

小さな例では、`TreeMap` を `HashMap` に変える候補と、`return` に `this.` を加える候補のどちらも、名前だけでは採用・不採用を決めません。
before、source anchor、after candidate、対象branch / head、scopeを固定資料と照合し、税率のscale、bucket集計、丸め規則、既存testの独立期待値へ戻ります。

## 向いていること / 向いていないこと

**向いていること**

- review指摘をsourceと照合してから限定依頼へ変えること
- branch / head / scopeの混線を防ぐhandoff
- 修正agentの自己申告と別の業務規則・既存testで検証する計画
- 「変更不要」「情報不足」「未送信」を理由付きで残すこと

**向いていないこと**

- candidate名やfindingの断定だけで正解を決めること
- packetのtrueを現実の許可・送信・適用に変換すること
- Moneyや既存testを修正対象へ広げること
- before / after candidateを実sourceへ適用すること
- Runtime v1のbranch制約を `run.json` 改変、`branchSafe` 偽装、事後apply、allow-allで回避すること

依頼草稿やstatic inspectionが完成しても、Cloud修正の成功、Java test pass、製品動作、教育効果は保証されません。

## Starter Kit

[Pack manifest](pack/manifest.json) の条件は `baseline` と `handoff-policy` です。
sourceKindは `baseline`、sourcePathsは次のexact 3 pathsです。これはmanifest / catalog上のslash形式の契約文字列です。
Packはschema v1に従います。固定schemaは9616 bytes、SHA-256 `183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e` ですが、schema一致はCloud修正やJava testの成功を証明しません。

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
- `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`

WindowsのRuntime checkoutで物理ファイルを開くときは、同じpathをbackslashでたどります。
Java sourceの由来は `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`、515 files、source tree SHA-256 `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` です。
PackはJava treeを複製しません。
Runtime側の `.gitignore` と元 `.github\workflows\verify.yml` は二つの運用例外であり、root README、Java、XML、testの変更許可ではありません。

三ファイルの読取範囲と意味を固定します。

| Runtime相対path | 行と意味 |
|---|---|
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java` | `bases` :9、`add` :16–20、`getTaxAmount` :30–35、`getTotalAmount` :38–40。税率bucketのkeyと税額合算を追う |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java` | `tax` :16–28。税率別baseから税額を求める丸め規則とDOWN / UP / HALF_UPを読む |
| `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java` | :8–25。税率のscale差を含む同率集計と丸め境界の独立期待値を読む |

元の `TaxAmounts` は `TreeMap` を使います。
既存testは、6.00 @ 0.10、6.00 @ 0.1000、10.00 @ 0.0800に対して、net 22.00、tax 1.00、bucket数2を期待しています。
これは**source / test定義を読んだ事実**であり、このChallengeでJavaやMavenを実行してpassを観測したという意味ではありません。

Packは両条件へ同じ不活性な `.template` を、Runtime checkoutの次の範囲へ配置します。

| Runtime相対path | 内容 |
|---|---|
| `.hackathon\challenge\hc-045\starter\brief.md.template` | 背景、sourceKind、固定task、実操作禁止 |
| `.hackathon\challenge\hc-045\starter\request.txt.template` | 両条件へ渡す同一の十分な依頼 |
| `.hackathon\challenge\hc-045\starter\reference-notes.md.template` | review / Cloud handoffの短い仕様要約と境界 |
| `.hackathon\challenge\hc-045\starter\readiness.json.template` | live / Java / Cloudを `NOT EXECUTED`、未知をnullで保つ記録 |
| `.hackathon\challenge\hc-045\starter\candidate-diffs.json.template` | 二候補のbefore、anchor、after、branch / head / scope |
| `.hackathon\challenge\hc-045\starter\finding-packet.json.template` | 断定された正解ではない合成・改作finding |
| `.hackathon\challenge\hc-045\starter\handoff-events.json.template` | draft / prepared / sent claim / return等の合成・改作event |
| `.hackathon\challenge\hc-045\starter\starter\handoff-policy.md.template` | handoff方針の空ひな型 |
| `.hackathon\challenge\hc-045\starter\starter\request-draft.txt.template` | 未送信依頼の空ひな型 |
| `.hackathon\challenge\hc-045\starter\starter\validation-plan.md.template` | 独立検証計画の空ひな型 |
| `.hackathon\challenge\hc-045\starter\evidence\comparison.md.template` | 完成Evidenceの空ひな型 |

candidate、finding、eventは**合成・改作資料**です。sourceKindがbaselineでも、このラベルを消しません。
正解ラベル、`classification`、`normal-candidate`、`expected` は配布しません。

| Candidate | 不活性な変更候補 | 固定された限定確認 |
|---|---|---|
| candidate-01 | `new TreeMap<BigDecimal, BigDecimal>()` を `new java.util.HashMap<BigDecimal, BigDecimal>()` にする候補 | source anchorは1か所。baselineのraw / Git blob SHA-256はいずれも `9d1472b68fb32c4a1b76b974c7c7414f1489cdc199c35b8a1e5592caab66945a`、候補post-image SHA-256 `a464229ba011bae07b326c6e0454c807669a5d694945888b188be4cc4c0397eb` |
| candidate-02 | `return getNetAmount().add(getTaxAmount());` に `this.` を加える候補 | source anchorは1か所。候補post-image SHA-256 `1d395143d6b3fe3cf5c447190485260aa2f205adbd09ed87112287983c1109e1` |

hash一致は固定bytesとpost-image構成の確認であり、候補の意味、正しさ、Java test passを保証しません。
元sourceにも候補にも、この教材作成時の限定確認では書き戻し・コンパイル・Cloud実行を行っていません。

二候補それぞれに三状態を対応付け、固定taskをH01〜H06とします。

| Task | Candidate | 状態 | 参加者が判断すること |
|---|---|---|---|
| H01 | candidate-01 | 送信前 | source照合、採否 / 保留、未送信依頼、想定branch / head / scope |
| H02 | candidate-01 | 送信の主張あり・実証不足 | packetのtrueと裏付けを分け、現実の許可・送信済みにしない |
| H03 | candidate-01 | 戻り資料あり | branch / head / scope一致、独立期待値、最終人手確認、停止 |
| H04 | candidate-02 | 送信前 | source照合、採否 / 保留、未送信依頼、想定branch / head / scope |
| H05 | candidate-02 | 送信の主張あり・実証不足 | packetのtrueと裏付けを分け、現実の許可・送信済みにしない |
| H06 | candidate-02 | 戻り資料あり | branch / head / scope一致、独立期待値、最終人手確認、停止 |

## Open Question

**指摘の妥当性・修正先・許可scope・独立した確認方法を落とさず引き継ぐため、何を依頼に書き、何を依頼せず、どの段階で人に戻しますか。**

修正を依頼する、変更不要とする、情報不足で保留する、いずれも候補です。
依頼を短くする利点と、branch / head / scope / 独立期待値を落とす危険のバランスを設計してください。

## Design Time

比較結果を見る前に、各conditionの方針を先に凍結します。

1. `baseline` では、自分が普段ならreview指摘をどう照合し、何を依頼へ残すかを短く記録します。
2. `handoff-policy` では、指摘、source照合、採否、依頼、返却、最終確認、停止の対応を設計します。
3. candidateごとにbefore、source anchor、after candidate、branch、head、scopeを照合する列を作ります。
4. draft / prepared / sent / accepted / appliedを別状態にし、packetの主張と現実の証拠を分けます。
5. 税率のscale差、税率別bucket集計、Moneyの丸め規則、CommonRulesTestの期待値を独立検証の根拠へします。
6. 依頼草稿の想定変更対象を `TaxAmounts.java` だけに限定します。`Money.java` と `CommonRulesTest.java` は読取根拠であり変更対象外です。
7. H01〜H06を同じ列で評価し、途中の改稿は新runへ分けます。

参加者成果は各condition専用Runtimeの次のexact pathへ作ります。

- `participant\hc-045\handoff-policy.md`
- `participant\hc-045\request-draft.txt`
- `participant\hc-045\validation-plan.md`

送らない判断でも `request-draft.txt` を空にせず、未送信理由、必要な追加根拠、想定していた限定scopeを書きます。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。`--run` とRuntimeの `--run-id` はconditionごとに同じIDを使います。
dry-runはCloud依頼、commit、push、mergeを行いません。

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-045 --condition baseline --team team-sora --run hc045-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-045 --condition handoff-policy --team team-sora --run hc045-policy-01
node .\scripts\build-pack.mjs --challenge HC-045 --output .runtime/packs
```

既存出力を削除して再利用せず、version / hashを確認するか未使用のHub checkoutを使います。

### 2. 条件ごとに独立したRuntimeを準備する

[Getting Started](../../docs/getting-started.md) と
[Runtime repository guide](../../docs/runtime-repository-guide.md) に従い、二条件を別の新しい非公開Runtime repository、名前付きbranch、workspaceで実施します。
次はbaselineの例です。Customized側は `$Condition` と `$RunId` を `handoff-policy` / `hc045-policy-01` に替えます。

```powershell
$Pack = 'C:\work\hackathon-hub\.runtime\packs\hc-045-v1'
$Condition = 'baseline'
$RunId = 'hc045-baseline-01'

git status --short --branch
git switch -c "hc-045-$Condition"
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

既存変更、既存run、branch名、templateが衝突したら停止します。
`.hackathon\run.json` の手編集、`branchSafe` 偽装、Cloud-created branchへの事後apply、allow-allでbindingを移したことにしません。

### 3. 不活性ひな型から参加者文書を作る

次は各 **Runtime checkout** のrootで、人が一度だけ実行します。既存成果を上書きしません。

```powershell
$Starter = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.hackathon\challenge\hc-045\starter')
$Participant = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('participant\hc-045')
$Evidence = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.hackathon\evidence\hc-045')

[System.IO.Directory]::CreateDirectory($Participant) | Out-Null
[System.IO.Directory]::CreateDirectory($Evidence) | Out-Null
[System.IO.File]::Copy((Join-Path $Starter 'starter\handoff-policy.md.template'), (Join-Path $Participant 'handoff-policy.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'starter\request-draft.txt.template'), (Join-Path $Participant 'request-draft.txt'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'starter\validation-plan.md.template'), (Join-Path $Participant 'validation-plan.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'evidence\comparison.md.template'), (Join-Path $Evidence 'comparison.md'), $false)
```

編集できるのは三つのparticipant成果と完成Evidenceだけです。
全条件で `allowedMutations: []` です。`TaxAmounts.java` を含む三つのsource、Pack、starter、test、workflowを変更しません。
candidateのbefore / afterを実sourceへ適用しないでください。

### 4. H01〜H06を文書上で評価する

両条件で同じ `request.txt.template`、三つのcandidate / finding / event資料、同じJava source三ファイル、H01〜H06を使います。
各candidateの採否、保留理由、未送信依頼、branch / head / scope、独立検証、最終人手確認を文書へ記録します。

`request-draft.txt` は `TaxAmounts.java` だけを想定変更対象にし、`Money.java` と `CommonRulesTest.java` は読取根拠・変更不可範囲として明記します。
Copilotを草稿支援に使う場合も任意で、送信操作は行わず、draftをsentやacceptedへ進めません。

## Compare

| 条件 | 先に凍結するもの | 同じtaskへ行うこと |
|---|---|---|
| Baseline: `baseline` | 自分の通常の指摘照合、依頼、返却確認 | H01〜H06で採否、状態、scope、独立検証、停止を記録 |
| Customized: `handoff-policy` | source anchor、状態分離、branch / head / scope、独立期待値を含む設計方針 | 同じH01〜H06を同じ列で記録 |

比較するのは、指摘の採否根拠、誤った修正依頼、branch / head混線、scope逸脱、期待値の弱体化、修正側の自己申告への依存、未送信と実行の混同です。
実際に修正した件数、commit、push、mergeは得点にしません。

両条件へ同じcandidate、finding、event、source、taskを渡し、片側だけ成功まで再試行しません。
差がなければ `equal`、不要・危険な依頼が増えれば `worse`、状態やinputが揃わなければ `incomparable`、Runtime v1のhandoff制約等で止まれば `blocked`、対象製品が利用できなければ `unsupported` が正当なoutcomeです。
変更不要、未送信、未観測も正当です。BaselineよりCustomizedが必ず良いとは仮定しません。

## Evidence

完成Evidenceは各runの `.hackathon\evidence\hc-045\comparison.md` です。最低限、次の見出しを内容付きで残します。

- `Fixed task`
- `Environment`
- `Baseline`
- `Designed policy`
- `Comparison`
- `Outcome`
- `Evidence boundaries`

H01〜H06ごとに、candidate、状態、before / anchor / after、branch / head / scope、採否、packetの主張、現実に確認した証拠、独立期待値、変更不可範囲、最終確認、停止先を対応付けます。
source / testを読んだ事実と、Javaを実行した結果を分けます。

構造検査は、exact path、sourcePaths、候補anchor、必要見出し、許可範囲、提出集合を確認します。
製品観測は、依頼の実送信、受理、Cloud branch、commit、source適用、test、push、mergeを確認することですが、本編では未実施です。
教育効果は、handoff方針で参加者の判断が改善したかであり、一回の文書比較では未観測です。

exporterの `runtimeBehavior` と `educationalEffect` は `not-observed` のままです。
packetのtrue、candidate hash、static validator passを、現実の許可・送信・適用・正しさへ読み替えません。

## Submit

各Runtimeで次を実行し、自分のconditionの四ファイルだけをexportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

各conditionのeligible集合は次のexact 4 filesです。

- `participant\hc-045\handoff-policy.md`
- `participant\hc-045\request-draft.txt`
- `participant\hc-045\validation-plan.md`
- `.hackathon\evidence\hc-045\comparison.md`

starter、candidate packet、元source、optional guide、raw log、build outputは提出しません。
Runtime PRへ三つの参加者文書とそのconditionのEvidenceを含めますが、Java source変更、commit済み修正、Cloud結果を含めません。
[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ二条件のRuntime URL / PR URL、run対応、採否・保留、限定依頼、独立検証、比較、outcome、未知をまとめます。
[Submission Guide](../../docs/submission-guide.md) に従い、非公開source本文、秘密、個人情報、未加工logをIssueへ貼りません。

## Judging

- candidate / finding / eventの合成・改作ラベルを保ち、正解ラベルなしでsourceへ戻ったか
- `TaxAmounts` の税率scale、bucket集計と、`Money` の丸め規則、既存testの独立期待値を説明したか
- before、source anchor、after candidate、branch、head、scopeを固定資料と照合したか
- draft / prepared / sent / accepted / appliedを分け、packetのtrueを現実の許可や送信にしなかったか
- request draftの変更対象を `TaxAmounts.java` だけにし、Money / testを読取根拠・変更対象外にしたか
- 修正側の自己申告だけでなく、業務規則と既存test定義による独立検証を計画したか
- BaselineとCustomizedへ同じH01〜H06を渡し、`equal`、`worse`、変更不要、未送信、blockedを隠さなかったか

修正件数、candidateのラベル当て、実送信、commit、mergeは採点しません。

## Bonus Mission

二候補のうち一つを選び、「変更を依頼する草稿」と「変更不要または情報不足として人へ戻す草稿」を同じscopeで紙上比較してください。
どの追加根拠があれば判断が変わるかを記録し、新しいcandidate、実source変更、実送信は追加しません。

## Support / Fallback

本編はVS Code StableでJava sourceと不活性資料を読み、文書を作るだけで完了できます。Copilot、Cloud、organization / account設定、Preview、実送信権限は必須ではありません。
Java / Maven実行環境がなくても、sourceと既存test定義を根拠にstaticな検証計画を作れます。実行結果は推測しません。

将来の任意ガイドは [cloud-handoff](optional/cloud-handoff.md) です。
これは `OPTIONAL_GUIDE_ONLY` で、本編成果や実送信の許可ではありません。
実Cloud修正はRuntime v1の `cross-branch-handoff: blocked` です。review / Cloud双方の利用条件、別承認されたscope / branch / head / 期待値がそろっても、この既知blockerをnot-checkedへ弱めません。

`run.json` 改変、`branchSafe` 偽装、Cloud-created branchへの事後apply、allow-all、commit / push / mergeで成功形を作ることはfallbackではありません。
実送信、修正loop、追加push、mergeは別承認対象です。
詳細は [Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
