# HC-033 Cloud Agentに再送調査Skillを渡そう

## Challenge Story

CSV再送の調査では、同じ `external_key` でも内容が同じ場合と違う場合があり、元受注、claim、journalの関係も確認する必要があります。毎回長い手順を貼り直す代わりにSkillへまとめられますが、Skill名やdescriptionが見えたこと、本文が使われたこと、resourceが読まれたこと、scriptが動いたことを一つの「利用成功」にまとめると、観測していない事実まで作ってしまいます。

このChallengeでは、再送調査の短い共通手順と詳細checklistを分け、自分のSkill原稿と同じ本文・全resourceを手動供給する設計を比較します。Cloud Agent、DB、script、import、replayは本編では実行しません。参加者が作るものはすべて不活性な `.template` です。このページとStarter Kitだけで完結し、元LAB、HC-009、前のChallenge、前Phaseの成果は不要です。

## この機能とは

Agent Skillは、特定のtaskで必要になったときに利用する手順書のpackageです。中心となる `SKILL.md` にはYAML frontmatterとMarkdown本文があり、同じdirectoryへchecklist、例、scriptなどのresourceを置けます。

このChallengeではSkillを次の4段階に分けます。

| 段階 | ここで確認するもの | 次の段階を自動で意味しない |
|---|---|---|
| description | どんなtaskで使うSkillか | 本文が読み込まれた |
| body | 調査順、停止条件、記録形式 | resourceが読まれた |
| resources | checklistなどの参照内容 | scriptが実行された |
| script | command、入力、exit result | 結果の意味が正しい |

project Skillの配置先として `.github/skills`、`.claude/skills`、`.agents/skills` などが公式Docsにありますが、Runtime v1でそれらすべてをactive成果として扱えるとは限りません。本編は `participant/hc-033/` の不活性原稿だけを提出し、active Skill directoryを作りません。

`allowed-tools` はSkillが必要とするtoolの事前許可を表せるfieldですが、製品・host・実行経路ごとの確認動作を同じだと一般化しません。本編はshellやscript実行を要求せず、新しいtool権限を付けません。

出典: [Adding agent skills for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)（文書確認日: **2026-09-15**）。

Docsの存在、Skill directoryの保存、linkの記載は、Cloud Agentによる発見、本文投入、resource読取り、script実行の観測ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 繰返し使う調査順、停止条件、Evidence形式をpackage化すること
- 短い本文と詳しいchecklistを理由付きで分けること
- sourceから分かることとDB確認が必要なことを分けること
- description / body / resources / scriptを別々に観測すること

**向いていないこと**

- 実CSV、顧客情報、productionの注文IDやDB出力をSkillへ保存すること
- source読解だけでclaimやjournalの実DB状態を断定すること
- Skillのlinkやfilenameだけで本文・resource・script利用を成功扱いすること
- import、replay、DB接続を無人で実行する手順にすること
- baselineを弱くしてSkillを有利に見せること

短いchecklistだけで十分なら `equal` や「Skill不要」、package化で手順が読みにくくなれば `worse`、発見や投入を確認できなければ `unknown` / `not-observed`、同じ本文とresourceをそろえられなければ `incomparable` が妥当です。

## Starter Kit

[Pack manifest](pack/manifest.json) のsourceKindは `baseline` です。Java sourceはRuntime v1の固定baselineを読み、Packへ複製しません。

### 固定source

Runtime root相対のsourcePathsは次のexact 5 pathです。

```text
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRowService.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRunService.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
```

静的に読む主な入口は次です。

- `OrderGroup.canonicalHash` — 数量の整数化、明細fingerprintのsort、payload fingerprintの組立て
- `OrderImportService.importDraft` / `findClaim` / `replay` — 既存claimと元受注を辿る入口
- `BatchRowService.executeRow` — 既存row照合、`importDraft`、完了処理への接続
- `BatchRunService.listRows` / `completeRow` — journal rowの一覧と完了記録への接続
- `OrderService` — 元受注側のservice境界

これはtransaction、同時実行、DB内の実データ、実際のreplay成功を証明しません。既存testを追加で読むことは禁止しませんが、sourcePathsへtestを水増しせず、実行していないtest resultを作りません。

### 配布される不活性素材

Packは全3条件へ次の共通payloadを同じbytesで配置します。

```text
payload/brief.md.template
payload/request.txt.template
payload/design.md.template
payload/packets.json.template
payload/evidence/comparison.md.template
```

HC-033固有のpayloadは次の4件です。

```text
payload/SKILL.md.template
payload/checklist.md.template
payload/manual-bundle.md.template
payload/resource-ledger.md.template
```

配置先は `.hackathon/challenge/hc-033/starter/` です。Evidenceひな型だけは `.hackathon/challenge/hc-033/starter/evidence/comparison.md.template` に置かれます。

`packets.json.template` には次の中立資料が含まれます。

- `R33-01`〜`R33-03` — 数量表記と行順だけが違う入力、内容の違う入力、claim情報が不足する入力
- `P33-01`〜`P33-04` — linkだけ、本文まで、resourceまで、実行資料不足などを診断するpacket

すべて研修専用の合成資料です。結論ラベル、実注文ID、計算済みを装う架空のcanonical digest、完成Evidenceは含みません。IDや並び順を正解として使わず、自分の基準で分類します。

### exact conditionsとtasks

condition IDsは次のexact 3件です。

```text
baseline
skill-package
manual-equivalent
```

task IDsは次のexact 2件です。

```text
replay-plan
journal-boundary
```

初回比較は **3 conditions × 2 tasks = 6セル**です。Phase 6全5Challengeでは39セルですが、これは実行済みrun数、Runtime condition総数、LAB unit数、公開件数ではありません。このChallengeのconsumer smokeはconditionごとの3 fresh runsで、各runに2 taskのセルを両方記録します。

### participant artifactsとsubmissionFiles

全条件で、参加者が作れるのは次のexact 5 pathだけです。すべて不活性な `.template` です。

```text
participant/hc-033/design.md.template
participant/hc-033/SKILL.md.template
participant/hc-033/checklist.md.template
participant/hc-033/manual-bundle.md.template
participant/hc-033/resource-ledger.md.template
```

Evidenceのexact pathは次です。

```text
.hackathon/evidence/hc-033/comparison.md
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
Skill and resources
```

`submissionFiles` はparticipant 5 filesとEvidence 1 fileの**exact 6 files**です。SKILL本文、checklist、manual bundle、resource ledger、設計、比較記録を空欄のまま提出しません。

### Runtime安全契約

- `allowedMutations: []`
- participantのallowed additionsは上記exact pathだけで、3条件すべてに同じ集合を許可
- overlayは `.hackathon/challenge/hc-033/**` 内の不活性 `.template` だけ
- `.github/skills`、`.agents/skills`、`.claude/skills`、script、workflow、Java、testを追加・変更しない
- `branchSafe: false`
- conditionごとに**別の非公開Runtime repository**、fresh workspace、fresh conversation、fresh profileを使う
- Runtimeの静的検査やexportが成功しても、`runtimeBehavior` と `educationalEffect` は `not-observed`

本編にCloud Agent、code review、DB、Java実行、network、secret、追加softwareは不要です。Node.js 22以降、Git、HubとRuntimeを扱う通常の参加権限が必要です。

## Open Question

**CSVの再送を調べるとき、共通の短い手順と詳細checklistをどう分ければ、元受注を不用意に変更せず、不明点を残せますか。**

唯一のSkill構成や最長のchecklistを当てる課題ではありません。本文を短くして必要なresourceへ進ませる設計、重要な停止条件を本文にも重ねる設計、scriptを置かず人の確認だけにする設計には、それぞれ利点と費用があります。

比較前に、再送と新規作成の混同、canonicalとraw bytesの混同、DB状態の推測、journal境界の取り落としのうち、どのfailure modeを減らしたいかを選んでください。

## Design Time

比較回答を見る前に、人が次を決めて `participant/hc-033/design.md.template` へ記録します。

1. Skillの対象taskと非対象task。importやreplayを実行せず、静的調査で止まる境界。
2. `description` に書く選択条件と、本文へ書く調査順・停止条件。
3. 本文からchecklistへ分ける情報と、その分割理由。
4. `replay-plan` と `journal-boundary` を独立に完結させる固定依頼。前taskの回答を後taskの前提にしない。
5. sourceから確認できるclaimと、DBやruntimeが必要で未確認にするclaim。
6. Skill本文の凍結範囲、checklist全bytes、UTF-8 / LF、個別SHA-256。
7. `manual-equivalent` へ本文と全resourceをどの順序で全文供給するか。
8. description / body / resources / scriptの各Evidenceと、確認できない場合の `unknown` / `not-observed`。
9. condition間でsource、資料版、通常依頼、権限想定、model / effort / toolsが違った場合の停止条件。

本編で作るresourceは `checklist.md.template` です。scriptが必要だと考えても、新しいscript pathは許可されていないため本編へ追加しません。`resource-ledger.md.template` に「scriptなし」または「任意経路で未実行」と明記します。linkだけを実行証拠にしません。

`SKILL.md.template` のfrontmatter、本文、checklistを凍結してから比較します。本文を修正したくなった場合は、初回記録を残し、別run / `repetition=2` としてやり直します。

## Build

### 1. Hubで3条件の計画とPackを確認する

Hub checkoutのrootで実行します。

```powershell
node scripts\plan-run.mjs --dry-run --route core --challenge HC-033 --condition baseline --team team-sora --run hc033-baseline-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-033 --condition skill-package --team team-sora --run hc033-skill-package-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-033 --condition manual-equivalent --team team-sora --run hc033-manual-equivalent-01
node scripts\build-pack.mjs --challenge HC-033 --output .runtime/packs
```

`--output` はliteral `.runtime/packs` を使います。build結果はmanifest単体ではなくPack directoryです。既存出力があれば上書きせず停止します。

### 2. 条件ごとに独立したRuntimeを用意する

[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template) から3つの新しい非公開repositoryを作ります。1repositoryにつき1conditionだけを使い、fresh workspace、fresh conversation、fresh profileを用意します。同じrepositoryのbranch切替だけで比較しません。

各Runtime checkoutのrootで実行します。

```powershell
$pack = 'C:\work\hub\.runtime\packs\hc-033-v1'
$condition = 'baseline'
$runId = 'hc033-baseline-01'

npm run verify
node .hackathon\scripts\apply-pack.mjs $pack --team team-sora --condition $condition --run-id $runId
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
```

`.hackathon/template.json`、source baseline、condition、named branch、run bindingを確認します。`.hackathon/run.json` は手編集しません。既存成果やStarterを削除して再試行しません。

### 3. 不活性な参加者原稿を作る

Starterから次の6 filesを上書きなしで新規作成します。

```powershell
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$starter = "$root\.hackathon\challenge\hc-033\starter"

New-Item -ItemType Directory -Path .\participant\hc-033
New-Item -ItemType Directory -Path .\.hackathon\evidence\hc-033

[IO.File]::Copy("$starter\design.md.template", "$root\participant\hc-033\design.md.template", $false)
[IO.File]::Copy("$starter\SKILL.md.template", "$root\participant\hc-033\SKILL.md.template", $false)
[IO.File]::Copy("$starter\checklist.md.template", "$root\participant\hc-033\checklist.md.template", $false)
[IO.File]::Copy("$starter\manual-bundle.md.template", "$root\participant\hc-033\manual-bundle.md.template", $false)
[IO.File]::Copy("$starter\resource-ledger.md.template", "$root\participant\hc-033\resource-ledger.md.template", $false)
[IO.File]::Copy("$starter\evidence\comparison.md.template", "$root\.hackathon\evidence\hc-033\comparison.md", $false)
```

既存pathがあれば停止します。`.hackathon/challenge/` のStarter、Java、test、`.github/skills`、`.agents/skills`、workflowを変更しません。

### 4. Skill本文とresourceを設計する

`SKILL.md.template` には少なくとも、taskを選ぶためのname / description、再送調査の順序、根拠の保存、DBが必要になったときの停止を記入します。`checklist.md.template` には、external key、raw input、canonicalization、claim、元受注、journal、unknownを確認する詳しい観点を整理します。

完成した業務結論、特定カードの正解分類、実DB状態、実行済みcommandは書き込みません。`canonicalHash` の意味をraw file hashと混同せず、実際に計算していないdigestを記載しません。

### 5. manual bundleを全文で作る

`manual-bundle.md.template` へ、凍結した**同じSKILL本文**と**checklist全文**を区画を分けて収録します。要約、Skillの実行結果、別版のchecklistで代用しません。

次を別々にhash化して `resource-ledger.md.template` へ残します。

- `SKILL.md.template` 全file
- SKILL frontmatter
- SKILL body
- `checklist.md.template` 全file
- manual bundle内のSKILL body区画
- manual bundle内のchecklist区画
- manual bundle全体

比較するのは対応する個別区画です。manual bundle全体hashとSKILL body hashを直接等値比較しません。scriptは作成・実行せず、stageを `not-observed` とします。

## Compare

### 固定tasks

`replay-plan` の固定依頼:

> 同じ `external_key` のCSV入力について、`OrderGroup.canonicalHash` と `OrderImportService.importDraft` から静的に確認できる再送・conflict・new claimの調査計画を作ってください。入力や受注を変更せず、DB状態、transaction、実行成功は未確認として分けてください。

`journal-boundary` の固定依頼:

> `BatchRowService`、`BatchRunService`、`OrderImportService`、`OrderService` を読み、関連journal、claim、元受注を対応付ける調査境界を作ってください。実DBへ接続せず、存在や成功を推測せず、次に必要なEvidenceと停止条件を示してください。

両taskにexact 5 source、同じ合成カード、十分な通常依頼を同梱します。`replay-plan` の回答を `journal-boundary` へ追加ヒントとして渡しません。

以下では `baseline` を **Baseline**、`skill-package` と `manual-equivalent` を供給方法の異なる **Customized** として説明します。Customized同士の発見経路や優先度が同じだとは扱いません。

| condition | 供給案 | 同じにするもの | 固有の限界 |
|---|---|---|---|
| `baseline` | 十分な固定依頼、source、普通の資料として使えるchecklist | source、カード、資料版、権限想定 | Skill自動供給を追加しない |
| `skill-package` | 凍結したSKILL本文とchecklistをSkillとして供給する案 | source、カード、本文bytes、resource bytes | 発見・投入・resource読取りは本編未観測 |
| `manual-equivalent` | 同じSKILL本文とchecklist全文を手動供給する案 | source、カード、本文bytes、resource bytes | 保存位置・優先度までSkillと同一ではない |

Baselineから重要情報を隠しません。checkerや補助道具を想定するなら全条件で同じように利用可能にします。`skill-package` の回答や要約をmanual条件へ渡しません。

6セルそれぞれで、次を比較します。

- replayとnew claim、matching / different contentを分けたか
- canonicalizationとraw bytesを分けたか
- claim、元受注、journalの境界をsourceへ戻せるか
- DB、transaction、実行結果を未確認として残したか
- description / body / resources / scriptのstageを混同していないか
- Skillなし、resource分割なし、script不要という判断の理由

最初の6セルは各1記録です。本文修正や追問は新しいrun / repetitionとして保存し、conditionやtaskを増やしません。

## Evidence

`.hackathon/evidence/hc-033/comparison.md` を人が記入します。required headingsをすべて残し、特に `Skill and resources` で次を分けます。

1. **Fixed task**: 2 taskの固定依頼、exact 5 source、カードID、run / repetition。
2. **Environment**: repository、branch、workspace、client / host / OS / channel、model / effort / tools。見えない値は `unknown`。
3. **Design**: description、body、resource境界、停止、script不要または未実行の理由。
4. **Skill and resources**:
   - descriptionが見えた
   - body投入が確認できた
   - checklistを読んだ
   - scriptを実行した
   - 各stageの観測手段、`unknown`、`not-observed`
5. **Comparison**: 3条件×2 task、本文・resourceの個別hash、壊れた等価条件。
6. **Observations**: source引用、packet内主張、unsupportedなDB / incident claim、未修正出力。
7. **Outcome**: `improved` / `equal` / `worse` / `incomparable` / `blocked` / `unsupported`、または追加不要・未利用の説明。
8. **Limits**: Skill発見、Cloud投入、script、DB、Java test、教育効果の未観測。

「回答がchecklistに似ていた」だけでSkill利用を逆算しません。resourceへのlinkがあるだけなら「linked」、本文を確認できなければ `not-observed`、script commandを記載しただけなら未実行です。Runtime検査やhash一致は、意味や実利用を保証しません。

## Submit

各Runtimeでparticipant 5 filesとEvidenceを完成させ、apply時と同じPack directoryを使います。

```powershell
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
node .hackathon\scripts\verify-run.mjs $pack --stage submitted
node .hackathon\scripts\export-submission.mjs $pack
```

export対象がexact 6 filesであることを確認します。固定内容のmanual bundleは同一bytes要件を満たす提出物ですが、同じ内容であること自体を創作の加点にはしません。設計、SKILL、checklist、resource ledger、Evidenceには参加者自身の具体的判断が必要です。

各conditionのRuntime PRと、[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、condition → Runtime repository / PR / run、2 task、本文/resource hash、4 stage、outcome、failure / unknownを対応付けます。実CSV、注文ID、顧客情報、DB出力、secret、local absolute path、未加工logは提出しません。

Runtime verifierの成功は静的な契約受理です。`runtimeBehavior` / `educationalEffect` は `not-observed` のままで、Skill利用や学習効果の実証にはなりません。

## Judging

- 再送と新規作成、matching / different contentを分けたか
- `canonicalHash` とraw bytes / file hashを混同していないか
- description、body、resources、scriptを別stageとして記録したか
- 同じSKILL本文と全resourceをmanual条件へ全文供給し、個別hashで照合したか
- bundle全体hashと本文hashを誤って直接比較していないか
- exact 5 sourceへ戻れる根拠と、DBが必要なunknownを残したか
- DB接続、script実行、Skill発見・利用を実施済みにしていないか
- equal、worse、Skill不要、resource分割不要、script不要、blocked、incomparableを認めたか

Skillのファイル数、本文の長さ、resource数、引用数、`improved` の獲得自体は加点しません。

## Bonus Mission

本編の6セルと凍結本文を変更せず、「scriptを追加するなら何を形式検査し、何を意味検査しないか」を設計票へ追記します。入力、期待する整数exit code、実行成立の確認、対象heading、意味の非保証を分けてください。

本編ではscript fileを追加・実行しません。任意実測を行う場合も新しい独立runにし、DB接続、import、replay、実データを使わず、本編のSkill利用成功へ合算しません。

## Support / Fallback

本編は不活性なSkill原稿、同全文bundle、固定資料比較だけで完了できます。Skill対応clientやCloud Agentがなくても、description / body / resourceの設計と6セルの比較を提出できます。機能非対応は `unsupported`、同じ本文/resourceをそろえられなければ `incomparable`、Hub/Runtimeへ進めなければ `blocked` とします。

任意routeは `cloud-skill` と `review-skill` の2件で、どちらも **OPTIONAL_GUIDE_ONLY**、`required: false`、`liveStatus: "live-unobserved"` です。

### [Cloud Skill確認ガイド](optional/cloud-skill.md)

将来、本文・resourceの実利用をCloudで確認するための準備だけを扱います。

- prerequisite: Cloud利用資格、承認済み専用repository、参照resourceの安全review、起動と費用上限の別承認
- initial scope: scriptを起動しない
- runtime requirement: `cross-branch-handoff: blocked`
- runtime requirement: `cloud-skill-observation: not-checked`
- stop: 保存元/ref、資格、承認、resourceの安全性、branch binding、費用上限が不明

### [Review Skill確認ガイド](optional/review-skill.md)

別のreview-focused taskでSkill利用を準備するガイドです。本編のCSV再送taskやconditionへ混ぜません。

- prerequisite: code review利用資格、対象head、要求者、実review要求の別承認
- runtime requirement: `standard-review-observation: not-checked`
- stop: head、actor、資格、要求範囲、費用・回数上限が不明

guide読了、Skill保存、link表示を実利用や本編改善の証拠にしません。Cloud別branchとRuntime v1 runのbindingはblockedのままです。review要求を無制限に繰り返さず、他人の設定、User設定、Memory、共有Skillを削除しません。

任意リンクを開けない場合も、上のprerequisite・停止条件・`not-checked` / blockedをEvidenceへ転記すれば本編は完了できます。[Support and Fallbacks](../../docs/support-and-fallbacks.md) も参照してください。
