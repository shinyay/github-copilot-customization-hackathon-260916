# HC-036 Draft・Open・更新時のレビュー発火を設計しよう

## Challenge Story

Pull Requestへ自動reviewを設定するとき、チームは新規Open、Draftから初めてReadyになったとき、Draftのままの更新、新しいpush、人による再要求を区別したいと考えました。「DraftからOpenになった瞬間だけ」と決めてしまうと、新規Openを落としたり、requestと実行完了の時間差を無視したり、古いheadのreviewを現在headへ流用したりします。

このChallengeでは、4つの合成設定と5つの合成eventを使って、reviewの発火方針と時系列Evidenceを設計します。全素材は **`SYNTHETIC_TRAINING_ONLY`** です。実Pull Request、review要求、ruleset、個人・organization・enterprise設定は作成・変更しません。このページとStarter Kitだけで完結し、元LAB、前のChallenge、前Phaseの成果は不要です。

## この機能とは

GitHub Copilot code reviewの自動設定は、「どのeventでreviewを**要求するか**」を決めます。要求された後にqueueへ入り、実行が始まり、完了するまでには別の状態と時間があります。

このChallengeでは次の段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| request | request ID、event、actor、ruleset | queueへ入った |
| queue | queue状態、attemptとの対応 | 実行が始まった |
| start | attempt ID、started時刻、対象head | reviewが完了した |
| complete | completed時刻、reviewed head、結果参照 | 現在headもreview済み |

さらに、event actor、個人設定、repository ruleset、organization / enterprise policy、対象branch、base/head、reviewed headを分けます。`requested: false` は「今回調べている要求経路で要求を確認できない」という情報で、別経路のreview全体が存在しないことまでは意味しません。

現在の公式Docsでは、repository rulesetの **Automatically request Copilot code review** を基本に、**Review draft pull requests** と **Review new pushes** を追加できます。基本の自動要求は新規Openを対象にするため、`basic-request` の設計から `new-open` を落としません。Draftから初めてReadyになるevent、Draft中のevent、新しいpush、人による再要求は別々に扱います。

手動の再要求はReviewers欄から行う独立eventです。`manual-rereview` を追加conditionへ変えず、4条件すべてで診断する共通taskにします。実行主体や課金の帰属、利用資格は環境によって確認が必要で、本編では観測済みとしません。

出典:

- [About GitHub Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review)
- [Configuring code review by GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review)
- [Using GitHub Copilot code review](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review)

文書確認日: **2026-09-15**。Docsの確認は、参加者のruleset、request、queue、review event、費用、権限を実機観測した記録ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 新規Open、初回Ready、Draft中、新push、手動再要求を分けること
- 設定差分を一つずつ比較すること
- request / queue / start / completeを相関付けること
- base / head / reviewed headを対応付け、古い結果を見分けること

**向いていないこと**

- 実repositoryのrulesetや自動review設定を教材のために変更すること
- requestを即時完了として扱うこと
- 古いheadへのreviewを現在headの完了へ流用すること
- `draft-request` と `push-request` の直接差を一因子比較と呼ぶこと
- 手動再要求を第五のconditionにすること
- queue時間、重複抑制、review成功を公式根拠なしに発明すること

自動設定を増やさない案も有効です。設定差が不要なら `equal` / 追加不要、要求が増えすぎれば `worse`、actorやrulesetを特定できなければ `unknown`、条件が混入すれば `incomparable`、資格・権限不足は `blocked` / `unsupported` と記録できます。

## Starter Kit

[Pack manifest](pack/manifest.json) のsourceKindは `synthetic`、sourcePathsはexactに空配列です。

```json
{
  "sourceKind": "synthetic",
  "sourcePaths": []
}
```

本編はreview eventと状態の設計であり、題材がJava PRに見えても `Money.java` などの実sourceを参照集合へ足しません。Runtime v1の515 source filesは変更せず、不変検査の対象として残します。

### `SYNTHETIC_TRAINING_ONLY`

Starter、合成PR、packet、participant原稿、Evidenceでは **`SYNTHETIC_TRAINING_ONLY`** を可視のまま保持します。PR ID、branch、actor、ruleset、request ID、attempt ID、base/headは研修専用で、実GitHub eventや実利用者を表しません。

### 配布される不活性素材

Packは全4条件へ次の共通payloadを同じbytesで配置します。

```text
payload/brief.md.template
payload/request.txt.template
payload/design.md.template
payload/packets.json.template
payload/evidence/comparison.md.template
```

HC-036固有のpayloadは次の3件です。

```text
payload/policy.md.template
payload/event-matrix.md.template
payload/correlation.md.template
```

配置先は `.hackathon/challenge/hc-036/starter/` です。Evidenceひな型だけは `.hackathon/challenge/hc-036/starter/evidence/comparison.md.template` に置かれます。

`packets.json.template` の `P36-01`〜`P36-06` は、要求のみ、queue、実行中、対応headの完了、古いhead、actor / ruleset情報不足などを診断する中立資料です。完成した発火可否matrix、expected分類、正解名は含みません。IDや順番を正解として使わず、自分の方針とEvidence基準で診断します。

### exact conditionsとtasks

condition IDsは次のexact 4件です。

```text
baseline
basic-request
draft-request
push-request
```

task IDsは次のexact 5件です。

```text
new-open
first-ready
still-draft
new-push
manual-rereview
```

初回比較は **4 conditions × 5 tasks = 20セル**です。Phase 6全5Challengeでは39セルですが、これは実行済みrun数、Runtime condition総数、LAB unit数、公開件数ではありません。このChallengeのconsumer smokeはconditionごとの4 fresh runsで、各runに5 taskのセルをすべて記録します。

### participant artifactsとsubmissionFiles

全条件で、参加者が作れるのは次のexact 4 pathだけです。すべて不活性な `.template` です。

```text
participant/hc-036/design.md.template
participant/hc-036/policy.md.template
participant/hc-036/event-matrix.md.template
participant/hc-036/correlation.md.template
```

Evidenceのexact pathは次です。

```text
.hackathon/evidence/hc-036/comparison.md
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
Events and heads
```

`submissionFiles` はparticipant 4 filesとEvidence 1 fileの**exact 5 files**です。policy、20セルmatrix、correlation、設計、Evidenceを空欄のまま提出しません。

### Runtime安全契約

- `allowedMutations: []`
- participantのallowed additionsは上記exact pathだけで、4条件すべてに同じ集合を許可
- overlayは `.hackathon/challenge/hc-036/**` 内の不活性 `.template` だけ
- ruleset、repository / organization / enterprise settings、PR、review、workflow、Java、testを追加・変更しない
- `branchSafe: false`
- conditionごとに**別の非公開Runtime repository**、fresh workspace、fresh conversation、fresh profileを使う
- Runtimeの静的検査やexportが成功しても、`runtimeBehavior` と `educationalEffect` は `not-observed`

本編にCopilot code review利用資格、repository管理権限、Actions、課金、実PR、secret、追加softwareは不要です。Node.js 22以降、Git、HubとRuntimeを扱う通常の参加権限が必要です。

## Open Question

**早期のfeedbackと不要な繰返しをどう両立させ、どのeventを自動要求にし、どこを人の再要求に残しますか。**

すべてのeventでreviewを要求することや、回数を最小にすることだけが正解ではありません。Draft中に早くfeedbackする案、Readyまで待つ案、新pushごとに更新する案、人が必要なheadだけ再要求する案には、それぞれ見落とし、noise、費用、待ち時間のtrade-offがあります。

比較前に、対象branch / scope、event方針、重複・unknownの扱い、必要なcorrelation fields、停止条件を自分で決めてください。

## Design Time

比較packetを見る前に、人が次を決めて `participant/hc-036/design.md.template` へ記録します。

1. `baseline`、`basic-request`、`draft-request`、`push-request` の差分。
2. `basic-request` が新規Openを対象にする設計を落とさないこと。
3. `draft-request` はbasicへDraft optionだけを追加し、`push-request` はbasicへnew pushes optionだけを追加すること。
4. `draft-request` と `push-request` を直接の一因子比較と呼ばないこと。
5. `manual-rereview` をconditionではなくactorの異なる共通taskとして扱うこと。
6. request / queue / start / completeの観測fields。
7. event ID/type、actor、PR ID、target branch、base/head、ruleset source/scope/ref、request ID、attempt ID、reviewed headの対応。
8. どの情報不足で原因を一つに決めず `unknown` / `incomparable` とするか。
9. sourceなしのsynthetic課題で、実PR・実review・実settingsを操作しない停止境界。

`policy.md.template` には参加者の発火方針、`event-matrix.md.template` には20セルの判定、`correlation.md.template` には時系列とheadの対応を書きます。資料内の値と参加者の判定・根拠を別区画にします。

## Build

### 1. Hubで4条件の計画とPackを確認する

Hub checkoutのrootで実行します。

```powershell
node scripts\plan-run.mjs --dry-run --route core --challenge HC-036 --condition baseline --team team-sora --run hc036-baseline-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-036 --condition basic-request --team team-sora --run hc036-basic-request-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-036 --condition draft-request --team team-sora --run hc036-draft-request-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-036 --condition push-request --team team-sora --run hc036-push-request-01
node scripts\build-pack.mjs --challenge HC-036 --output .runtime/packs
```

`--output` はliteral `.runtime/packs` を使います。build結果はmanifest単体ではなくPack directoryです。既存出力があれば上書きせず停止します。

### 2. 条件ごとに独立したRuntimeを用意する

[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template) から4つの新しい非公開repositoryを作ります。1repositoryにつき1conditionだけを使い、fresh workspace、fresh conversation、fresh profileを用意します。同じrepositoryのbranch切替だけで比較しません。

各Runtime checkoutのrootで実行します。

```powershell
$pack = 'C:\work\hub\.runtime\packs\hc-036-v1'
$condition = 'baseline'
$runId = 'hc036-baseline-01'

npm run verify
node .hackathon\scripts\apply-pack.mjs $pack --team team-sora --condition $condition --run-id $runId
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
```

`.hackathon/template.json`、sourceKind `synthetic`、sourcePaths `[]`、condition、named branch、run bindingを確認します。`.hackathon/run.json` は手編集しません。実PRやsettingsを作って不足を補いません。

### 3. 不活性な参加者原稿を作る

Starterから次の5 filesを上書きなしで新規作成します。

```powershell
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$starter = "$root\.hackathon\challenge\hc-036\starter"

New-Item -ItemType Directory -Path .\participant\hc-036
New-Item -ItemType Directory -Path .\.hackathon\evidence\hc-036

[IO.File]::Copy("$starter\design.md.template", "$root\participant\hc-036\design.md.template", $false)
[IO.File]::Copy("$starter\policy.md.template", "$root\participant\hc-036\policy.md.template", $false)
[IO.File]::Copy("$starter\event-matrix.md.template", "$root\participant\hc-036\event-matrix.md.template", $false)
[IO.File]::Copy("$starter\correlation.md.template", "$root\participant\hc-036\correlation.md.template", $false)
[IO.File]::Copy("$starter\evidence\comparison.md.template", "$root\.hackathon\evidence\hc-036\comparison.md", $false)
```

既存pathがあれば停止します。`.hackathon/challenge/` のStarter、ruleset、settings、PR、review、workflow、Java、testを変更しません。全原稿で `SYNTHETIC_TRAINING_ONLY` を保持します。

### 4. policyとcorrelationを完成させる

`policy.md.template` で、各conditionの設定差分、対象branch / scope、manual再要求の責任、重複・unknown・停止を定義します。個人設定とrulesetが同時に働く可能性、複数ruleset、actor違いを一つの原因へ丸めません。

`correlation.md.template` では、次を一行ずつ対応付けます。

- event ID / type
- actor
- synthetic PR ID
- target branch
- base SHA / head SHA
- setting source / scope / ref
- request ID
- queue state
- attempt ID
- started / completed
- reviewed head
- packet内の資料値
- 参加者の判定 / 根拠 / unknown

queueを即障害と断定せず、完了時刻があってもreviewed headが違えば現在headの完了にしません。

## Compare

### condition差分

以下では `baseline` を **Baseline**、`basic-request`、`draft-request`、`push-request` を設定差分の異なる **Customized** として説明します。3つのCustomizedを一つの同一設定としてまとめません。

| condition | 合成設定の差分 | 比較する相手 |
|---|---|---|
| `baseline` | 自動要求なし。人による要求は独立eventとして記録可能 | `basic-request` |
| `basic-request` | Automatically request Copilot code reviewだけを想定 | `baseline`、`draft-request`、`push-request` |
| `draft-request` | `basic-request` にReview draft pull requestsだけ追加 | `basic-request` |
| `push-request` | `basic-request` にReview new pushesだけ追加 | `basic-request` |

`draft-request` と `push-request` は、それぞれbasicから別のoptionを変えています。両者を直接比べて「一つの因子だけが違う」とは説明しません。

### exact 20セル

次のcross-productを**欠落・重複なくexactに1回ずつ** `event-matrix.md.template` へ記録します。セル名は識別子であり、発火する・しないの正解ラベルではありません。

| condition \ task | `new-open` | `first-ready` | `still-draft` | `new-push` | `manual-rereview` |
|---|---|---|---|---|---|
| `baseline` | `baseline/new-open` | `baseline/first-ready` | `baseline/still-draft` | `baseline/new-push` | `baseline/manual-rereview` |
| `basic-request` | `basic-request/new-open` | `basic-request/first-ready` | `basic-request/still-draft` | `basic-request/new-push` | `basic-request/manual-rereview` |
| `draft-request` | `draft-request/new-open` | `draft-request/first-ready` | `draft-request/still-draft` | `draft-request/new-push` | `draft-request/manual-rereview` |
| `push-request` | `push-request/new-open` | `push-request/first-ready` | `push-request/still-draft` | `push-request/new-push` | `push-request/manual-rereview` |

各taskの固定資料:

- `new-open` — 最初からOpenとして作られた合成PR
- `first-ready` — Draftから初めてReadyになった履歴を持つ合成PR
- `still-draft` — Draftのままのevent。`first-ready` の途中段階へ統合しない
- `new-push` — prior reviewがあるOpen PRへ新headが追加された履歴
- `manual-rereview` — actor、対象head、prior attemptを明示した手動再要求event

全セルで同じevent definition、packet version、観測fieldsを使います。前セルの診断を次セルへ追加ヒントとして渡しません。各conditionのrunは5 taskを含みます。

比較するのは、すべてを「発火」にすることではなく、設定差分、event、actor、request、attempt、headを説明できることです。資料不足なら原因を一つに決めず、`unknown` / `incomparable` を残します。

最初の20セルは各1記録です。追問やpacket修正は新しいrun / repetitionとして保存し、戻し操作で「初回」を再現したことにしません。

## Evidence

`.hackathon/evidence/hc-036/comparison.md` を人が記入します。required headingsをすべて残し、特に `Events and heads` で次を分けます。

1. **Fixed task**: exact 4 conditions、exact 5 tasks、20セル集合、packet version、run / repetition。
2. **Environment**: synthetic marker、repository、branch、workspace、client / host / OS / channel、model / effort / tools。見えない値は `unknown`。
3. **Design**: 対象scope、event方針、manual責任、重複・停止。
4. **Events and heads**:
   - event ID / type
   - actor
   - setting source / scope / ref
   - base / head
   - request ID
   - queue
   - attempt / start / complete
   - reviewed head
   - 現在headとの一致
   - 観測手段、`unknown`、`not-observed`
5. **Comparison**: 4×5 exact集合、一意性、隣接する一因子比較、壊れた条件。
6. **Observations**: packet内主張、参加者の判定、古いhead、情報不足、unsupported claim。
7. **Outcome**: `improved` / `equal` / `worse` / `incomparable` / `blocked` / `unsupported`、または設定追加不要・未利用の説明。
8. **Limits**: 実settings、実PR、request、queue、review、runner、資格、費用、教育効果の未観測。

`requested=true` をstarted / completedへ昇格させず、`completed=true` でもreviewed headを確認します。資料内のactorやrulesetを実GitHubの設定だと説明しません。Runtime検査やmatrixの20件一致は、製品eventや教育効果の実証ではありません。

## Submit

各Runtimeでparticipant 4 filesとEvidenceを完成させ、apply時と同じPack directoryを使います。

```powershell
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
node .hackathon\scripts\verify-run.mjs $pack --stage submitted
node .hackathon\scripts\export-submission.mjs $pack
```

export対象がexact 5 filesであること、20セルが欠落・重複なしであることを確認します。空原稿、実settings / PR / review、Java変更、別condition、別run、余分なfileがあれば提出へ進みません。

各conditionのRuntime PRと、[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、condition → Runtime repository / PR / run、5 task、設定差分、代表的なcorrelation、outcome、failure / unknownを対応付けます。実PR URL、実利用者情報、secret、local absolute path、private source、未加工logを合成資料へ混ぜません。

Runtime verifierの成功は静的な契約受理です。`runtimeBehavior` / `educationalEffect` は `not-observed` のままで、review発火や学習効果の実証にはなりません。

## Judging

- exact 4 conditions × exact 5 tasksの20セルが欠落・重複なくあるか
- `basic-request` から新規Openを落としていないか
- `draft-request` と `push-request` をbasicとの差分として別々に扱ったか
- `manual-rereview` を追加conditionにせず、actorの異なるeventとして扱ったか
- request / queue / start / completeを分けたか
- actor、ruleset、base / head / reviewed headを対応付けたか
- 古いheadのreviewを現在headの完了へ流用していないか
- 実PR、実review、実settings、資格、費用を観測済みにしていないか
- equal、worse、設定追加不要、unknown、blocked、incomparableを認めたか

review回数、全セルの「発火」、設定数、matrixの行数、`improved` の獲得自体は加点しません。

## Bonus Mission

本編の4条件と20セルを変更せず、Draft reviewとnew pushesを**両方**有効にしたい場合の方針を紙上で設計します。早期feedback、重複、費用、停止、manual再要求の責任を説明してください。

これは二つのoptionを同時に変える発展案です。本編の一因子比較や正式conditionへ混ぜず、実ruleset、PR、review要求を操作しません。

## Support / Fallback

本編は `SYNTHETIC_TRAINING_ONLY` のpolicy、20セルmatrix、correlation設計だけで完了できます。Copilot code reviewを利用できなくても、eventとheadの診断を提出できます。機能非対応は `unsupported`、設定差分やevent historyをそろえられなければ `incomparable`、Hub/Runtimeへ進めなければ `blocked` とします。

任意route ID `review-triggers` の [Review trigger確認ガイド](optional/review-triggers.md) は **OPTIONAL_GUIDE_ONLY**、`required: false`、`liveStatus: "live-unobserved"` です。実eventとの相関を将来確認するための準備だけを扱います。

- prerequisite: repository管理者、code review利用資格、対象scope、個人 / organization / enterprise設定混入の確認、発火上限と停止の別承認
- runtime requirement: `standard-review-observation: not-checked`
- runtime requirement: `automatic-review-settings: not-checked`
- stop: actor、ruleset、対象branch、base/head、資格、設定所有者、費用・回数上限、復元範囲が不明

guide読了、ruleset画面の閲覧、設定案の保存を実requestや本編改善の証拠にしません。実PR/review/settings/ruleset操作は行わず、起動しない場合に要求を無制限に繰り返しません。共有設定の全削除、PR履歴の巻戻し、他人の設定変更をfallbackにしません。

任意リンクを開けない場合も、上のprerequisite・停止条件・`not-checked` をEvidenceへ転記すれば本編は完了できます。[Support and Fallbacks](../../docs/support-and-fallbacks.md) も参照してください。
