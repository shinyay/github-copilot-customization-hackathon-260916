# HC-035 指示と実行環境を混同せず準備しよう

## Challenge Story

古いJavaアプリの調査をCloud Agentへ頼むとき、「JDK8で扱う」「Maven 3.9系を使う」「Java 7 APIを越えない」と指示へ書くだけでは、実行環境にそのtoolがある証拠になりません。反対にsetupでJDKやMavenを用意しても、source/API制約を守ったことやtestが通ったことまでは保証しません。

このChallengeでは、モデルへ伝えるinstructions、事前setup、version check、tests、DB、agent startを別々に設計します。実Cloud Agent、setup workflow、Java、Maven、DBは本編では起動しません。参加者が作るのは不活性な `.template` 原稿と合成packetの診断です。このページとStarter Kitだけで完結し、元LAB、前のChallenge、前Phaseの成果は不要です。

## この機能とは

**Instructions** はモデルへ「守る制約、確認順、停止条件」を伝える文章です。**Copilot setup steps** はCloud Agentが作業を始める前のephemeral environmentへtoolやdependencyを用意するGitHub Actions形式の設定です。目的が違うため、一方をもう一方の証拠として扱いません。

このChallengeでは最低でも次の段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| instructions | JDK / Maven / API制約、停止指示 | toolがinstall済み |
| setup definition | job、steps、runner、permissions | workflowが採用された |
| setup step | 各stepの予定・packet内status | versionが要求に適合した |
| version check | `java` / `mvn` の版確認 | dependency取得やtestが成功した |
| tests | 実行command、整数exit code | DB testも実行された |
| DB | opt-in、engine、専用DB、接続結果 | unit test全体が成功した |
| agent start | setup後にAgentが開始した記録 | setupが成功した |

現在の公式Docsでは、Cloud Agent用setupはrepositoryの `.github/workflows/copilot-setup-steps.yml`、job名はexactに `copilot-setup-steps` です。default branchに存在しなければ採用されません。設定可能なjob fieldsは `steps`、`permissions`、`runs-on`、`services`、`snapshot`、`timeout-minutes` で、timeoutの最大値は59です。`actions/checkout` の `fetch-depth` は上書きされるという注記があります。

setup stepが非0終了すると残りのsetup stepsはskipされ、Agentはその時点のenvironmentで開始します。したがって「Agentが開始した」「PRができた」をsetup成功へ変換しません。workflowの手動実行やpath-filtered triggerが成功しても、Cloud taskでそのsetupが採用された証拠とは別です。

code reviewは専用 `.github/workflows/copilot-code-review.yml` があればそれを使い、なければ共有setupを使うというDocsがあります。custom instructionsがPRのheadから読まれる説明を、setupも同じrefから採用される証拠にしません。setup refは実機Evidenceがない限り `unknown` です。

### secrets保存先に関する現在と旧資料の差

現在の公式Docsは、repository / organizationの **Agents secrets and variables** を案内しています。また、以前GitHub Actionsの `copilot` environmentへ設定した値はrepository-level Agentsへ自動移行されたため、追加の移行操作は不要と説明しています。

これはDocs上の製品差分です。参加者のrepositoryが移行済み、値が設定済み、閲覧・管理権限があることを確認した記録ではありません。本編はsecretを必要とせず、値の登録、表示、確認、転載を要求しません。

### runner説明の留保

Cloud Agentのenvironment DocsにはUbuntuだけでなくWindowsへ切り替える説明があります。一方、code review runner DocsはUbuntu x64とARC-onlyのself-hosted要件を示します。2026-07-17のChangelogはCloud Agentとcode reviewのorganization runner設定が分離されたと説明しますが、現在のrunner Docsにはorganization-level設定を両productへ適用する説明もあります。

本編は承認済みUbuntu想定の**設計**に限定し、CloudのWindows説明をcode reviewへ拡張せず、実効runner scopeを確認済みとしません。

出典:

- [Configure the development environment](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment)
- [Using GitHub Copilot code review](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review)
- [Configuring runners for GitHub Copilot code review](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-runners)
- [Copilot code review customization and configurability improvements](https://github.blog/changelog/2026-07-17-copilot-code-review-customization-and-configurability-improvements/)
- [Configure secrets and variables for Copilot cloud agent](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/configure-secrets-and-variables)

文書確認日: **2026-09-15**。Docsの確認はsetup保存、採用、runner、secret、Cloud taskの実観測ではありません。

## 向いていること / 向いていないこと

**向いていること**

- instructionsとenvironment preparationの責任を分けること
- JDK、Maven、API制約を別々に確認すること
- setup失敗後のskip、残状態、agent startを正直に記録すること
- agent自身の準備案と事前準備案を同じ固定入力で比較すること

**向いていないこと**

- 「JDK8を使って」と書くだけでinstall済みとすること
- `mvn --version` を表示しただけで `[3.9,4.0)` 適合とすること
- `dependency:go-offline` をtest成功として扱うこと
- setup失敗後にAgentが開始したことをsetup成功にすること
- `java17` というAnimal Sniffer signature名をJDK17指定と読むこと
- secret、runner、firewall、proxy、TLS、組織設定を無許可で変更すること

事前setupが不要なら「agent-preparesで十分」、両案が同等なら `equal`、setupが複雑化して失敗面が増えれば `worse`、runnerやnetworkをそろえられなければ `incomparable`、利用資格や環境不足は `blocked` / `unsupported` と記録できます。

## Starter Kit

[Pack manifest](pack/manifest.json) のsourceKindは `baseline` です。Java projectはRuntime v1の固定baselineを使い、Packへ複製しません。

### 固定source

Runtime root相対のsourcePathsは次のexact 1 pathです。

```text
pom.xml
```

pomで分けて読む制約は次です。

| 制約 | pomで確認するもの | 混同しないもの |
|---|---|---|
| Java source / target | compilerの `1.7` | JDK7を使う指定 |
| JDK | Maven Enforcerの `[1.8,1.9)` | JDK17 |
| Maven | Maven Enforcerの `[3.9,4.0)` | versionを表示しただけの任意版 |
| Java API | Animal Sniffer execution `java-7-standard-api` | compiler source/targetだけ |
| signature | `java17:1.0` | JDK17指定 |

Animal Snifferの `java17` はsignature artifactの名前です。JDK17へ移行する指示ではありません。本編はpomを静的に分類し、compile、dependency取得、unit test、DB testを実行しません。

### 配布される不活性素材

Packは全2条件へ次の共通payloadを同じbytesで配置します。

```text
payload/brief.md.template
payload/request.txt.template
payload/design.md.template
payload/packets.json.template
payload/evidence/comparison.md.template
```

HC-035固有のpayloadは次の4件です。

```text
payload/instructions.md.template
payload/copilot-setup-steps.yml.template
payload/responsibility.md.template
payload/failure-handoff.md.template
```

配置先は `.hackathon/challenge/hc-035/starter/` です。Evidenceひな型だけは `.hackathon/challenge/hc-035/starter/evidence/comparison.md.template` に置かれます。

`packets.json.template` の `P35-01`〜`P35-05` は、要求に合う版の報告、Maven版不足、setup途中失敗後のAgent開始、準備済みだがtest未実行、DB opt-inなし / skipなどを診断する中立資料です。packetの `pass` やstatusは合成資料内の主張で、実環境の観測ではありません。

### exact conditionsとtasks

condition IDsは次のexact 2件です。

```text
baseline
preinstalled-plan
```

task IDsは次のexact 2件です。

```text
prepare-plan
setup-diagnosis
```

初回比較は **2 conditions × 2 tasks = 4セル**です。Phase 6全5Challengeでは39セルですが、これは実行済みrun数、Runtime condition総数、LAB unit数、公開件数ではありません。このChallengeのconsumer smokeはconditionごとの2 fresh runsで、各runに2 taskのセルを両方記録します。

手動promptをenvironment準備と等価にできないため、`manual-equivalent` conditionは作りません。

### participant artifactsとsubmissionFiles

全条件で、参加者が作れるのは次のexact 5 pathだけです。すべて不活性な `.template` です。

```text
participant/hc-035/design.md.template
participant/hc-035/instructions.md.template
participant/hc-035/copilot-setup-steps.yml.template
participant/hc-035/responsibility.md.template
participant/hc-035/failure-handoff.md.template
```

Evidenceのexact pathは次です。

```text
.hackathon/evidence/hc-035/comparison.md
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
Setup and constraints
```

`submissionFiles` はparticipant 5 filesとEvidence 1 fileの**exact 6 files**です。instructions、setup YAML、責任分担、失敗時handoff、設計、Evidenceを空欄のまま提出しません。

### Runtime安全契約

- `allowedMutations: []`
- participantのallowed additionsは上記exact pathだけで、2条件すべてに同じ集合を許可
- overlayは `.hackathon/challenge/hc-035/**` 内の不活性 `.template` だけ
- `.github/workflows`、pom、Java、test、DB設定、secret、repository / organization settingsを追加・変更しない
- `branchSafe: false`
- conditionごとに**別の非公開Runtime repository**、fresh workspace、fresh conversation、fresh profileを使う
- Runtimeの静的検査やexportが成功しても、`runtimeBehavior` と `educationalEffect` は `not-observed`

本編にCloud Agent、Actions実行、JDK、Maven、DB、secret、管理権限、追加softwareは不要です。Node.js 22以降、Git、HubとRuntimeを扱う通常の参加権限が必要です。

## Open Question

**JDK8・Maven 3.9系・Java 7 API制約を保つために、instructions、準備、版確認、検証、失敗時の引継ぎをどう分担させますか。**

唯一のsetup YAMLや「事前準備が必ず優れる」という答えはありません。Agent自身に必要なtoolを確認させる案、setupで決定的に用意する案、版不適合なら人へ戻す案には、それぞれ時間、再現性、保守、権限の費用があります。

比較前に、何をモデルへ伝え、何をenvironmentで用意し、何をcommandで確認し、どの失敗で止まるかを決めてください。

## Design Time

比較回答を見る前に、人が次を決めて `participant/hc-035/design.md.template` へ記録します。

1. pomから読み取るJDK8、Maven `[3.9,4.0)`、compiler `1.7`、Java 7 API制約。
2. `instructions.md.template` に書く制約、確認順、未確認の報告、変更禁止。
3. `copilot-setup-steps.yml.template` に書く準備step、version check、版不適合時の停止案。
4. instructions、setup、version check、dependency preparation、tests、DB、agent startの責任分担。
5. setup stepが非0終了したとき、残りskip、current state、agent startをどうhandoffするか。
6. `prepare-plan` と `setup-diagnosis` を独立に完結させる固定依頼。
7. runner / OS / network、source、通常依頼、model / effort / toolsの想定が条件間で違ったときの停止条件。
8. 実行していないJava / Maven / DB / Cloud操作を `not-observed` のまま残す方法。

setup原稿は、JDK8の準備、`mvn --version`、`dependency:go-offline` などを検討できますが、Maven 3.9系を確実にinstallする完成解は配られていません。version表示とrange適合検査を分け、不適合時の計画を参加者が補います。

## Build

### 1. Hubで2条件の計画とPackを確認する

Hub checkoutのrootで実行します。

```powershell
node scripts\plan-run.mjs --dry-run --route core --challenge HC-035 --condition baseline --team team-sora --run hc035-baseline-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-035 --condition preinstalled-plan --team team-sora --run hc035-preinstalled-plan-01
node scripts\build-pack.mjs --challenge HC-035 --output .runtime/packs
```

`--output` はliteral `.runtime/packs` を使います。build結果はmanifest単体ではなくPack directoryです。既存出力があれば上書きせず停止します。

### 2. 条件ごとに独立したRuntimeを用意する

[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template) から2つの新しい非公開repositoryを作ります。1repositoryにつき1conditionだけを使い、fresh workspace、fresh conversation、fresh profileを用意します。同じrepositoryのbranch切替だけで比較しません。

各Runtime checkoutのrootで実行します。

```powershell
$pack = 'C:\work\hub\.runtime\packs\hc-035-v1'
$condition = 'baseline'
$runId = 'hc035-baseline-01'

npm run verify
node .hackathon\scripts\apply-pack.mjs $pack --team team-sora --condition $condition --run-id $runId
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
```

`.hackathon/template.json`、source baseline、condition、named branch、run bindingを確認します。`.hackathon/run.json` は手編集しません。applyや検査の失敗をactive workflow、secret、permission追加で回避しません。

### 3. 不活性な参加者原稿を作る

Starterから次の6 filesを上書きなしで新規作成します。

```powershell
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$starter = "$root\.hackathon\challenge\hc-035\starter"

New-Item -ItemType Directory -Path .\participant\hc-035
New-Item -ItemType Directory -Path .\.hackathon\evidence\hc-035

[IO.File]::Copy("$starter\design.md.template", "$root\participant\hc-035\design.md.template", $false)
[IO.File]::Copy("$starter\instructions.md.template", "$root\participant\hc-035\instructions.md.template", $false)
[IO.File]::Copy("$starter\copilot-setup-steps.yml.template", "$root\participant\hc-035\copilot-setup-steps.yml.template", $false)
[IO.File]::Copy("$starter\responsibility.md.template", "$root\participant\hc-035\responsibility.md.template", $false)
[IO.File]::Copy("$starter\failure-handoff.md.template", "$root\participant\hc-035\failure-handoff.md.template", $false)
[IO.File]::Copy("$starter\evidence\comparison.md.template", "$root\.hackathon\evidence\hc-035\comparison.md", $false)
```

既存pathがあれば停止します。`.hackathon/challenge/` のStarter、`.github/workflows`、pom、Java、test、DB、secretを変更しません。

### 4. instructionsとsetup草稿を分ける

`instructions.md.template` には、pomを根拠にした制約、版確認、API制約、未確認を残すこと、Java sourceを変更しないことを書きます。「JDK8を使え」の一文だけで準備済みとはしません。

`copilot-setup-steps.yml.template` はactive化せず、次を静的に確認できる草稿にします。

- special job name `copilot-setup-steps`
- 承認済みUbuntu想定
- 必要最小限の `permissions`
- JDK8の準備案
- Maven versionの表示と `[3.9,4.0)` 適合判定を別stepまたは別記録にする案
- dependency preparationとtestsを別stepにする案
- timeoutは59以下
- 許可されるjob fields以外へ依存しない
- failure後のskipとcurrent stateのhandoff

workflowの `on` triggerは検査用起動の設計で、Cloud採用そのものではありません。`workflow_dispatch`、path-filtered `push` / `pull_request` を無条件に重複させず、選択理由を記録します。

### 5. responsibilityとfailure handoffを完成させる

`responsibility.md.template` で、次を別欄にします。

- instructions
- setup definition
- tool install
- version check
- dependency preparation
- unit tests
- DB tests
- agent start
- owner / observer / stop decision

`failure-handoff.md.template` では、失敗step、終了code、残りskip、現在確認できる版、未完了step、agent開始の有無、次に人が判断することを分けます。setup失敗後にAgentが開始しても、setup outcomeをpassに変更しません。

## Compare

### 固定tasks

`prepare-plan` の固定依頼:

> root `pom.xml` を読み、JDK8、Maven `[3.9,4.0)`、compiler source/target 1.7、Animal SnifferによるJava 7 API制約を分けてください。instructions、setup、version check、tests、DB、agent startの責任分担と停止条件を設計してください。

`setup-diagnosis` の固定依頼:

> 中立setup packetを読み、setup全体status、各step、残りstepのskip、version適合、agent start、unit test、DB testを別々に診断してください。packet内の主張を実環境の観測へ昇格させず、不足するEvidenceを示してください。

両taskへ同じpom、toolchain要求、通常依頼、packet集合を与えます。

以下では `baseline` を **Baseline**、`preinstalled-plan` を **Customized** として説明します。どちらも実行済みenvironmentではなく、準備責任を比較する設計条件です。

| condition | 準備経路の設計 | 同じにするもの | 固有の限界 |
|---|---|---|---|
| `baseline` | agent-prepares。Agent自身が準備・確認する計画 | instructions、task、pom、runner / OS / network想定 | 自力解決や通常の確認道具を禁止しない |
| `preinstalled-plan` | 同じ制約を事前setupで用意し、残状態をAgentへ渡す計画 | instructions、task、pom、runner / OS / network想定 | setup採用・実行は本編未観測 |

Baselineを弱くするために確認手段を奪いません。preinstalledを有利にするため、baselineへだけ曖昧な依頼を渡しません。両条件とも不活性原稿の設計比較で、実build時間、実成功率、同一modelの実行を測りません。

4セルそれぞれで、次を比較します。

- JDK、Maven、compiler、API制約を分けたか
- Maven version表示とrange適合を分けたか
- setup / tests / DB / agent startを分けたか
- failure後のskipと残状態を正直に引き継いだか
- `java17` をJDK17と誤読していないか
- agent-preparesで十分、preinstall不要という判断の理由

最初の4セルは各1記録です。設計変更や追問は新しいrun / repetitionとして保存し、packet状態を追加conditionにしません。

## Evidence

`.hackathon/evidence/hc-035/comparison.md` を人が記入します。required headingsをすべて残し、特に `Setup and constraints` で次を分けます。

1. **Fixed task**: 2 taskの固定依頼、`pom.xml`、packet ID、run / repetition。
2. **Environment**: repository、branch、workspace、想定runner / OS / network、client / host、model / effort / tools。見えない値は `unknown`。
3. **Design**: instructions、setup、version check、tests、DB、agent startの責任分担。
4. **Setup and constraints**:
   - pomのJDK range
   - Maven range
   - compiler source / target
   - Animal Sniffer signature / execution
   - setup保存先 / expected ref
   - workflow syntax / 検査
   - Cloud採用
   - 各step
   - agent start
   - unit test
   - DB opt-in / test
   - 各欄の観測手段、`unknown`、`not-observed`
5. **Comparison**: 2条件×2 task、同一入力、壊れた等価条件。
6. **Observations**: packet内主張、pom引用、誤読、skip、unsupported claim。
7. **Outcome**: `improved` / `equal` / `worse` / `incomparable` / `blocked` / `unsupported`、または事前setup不要・未利用の説明。
8. **Limits**: setup保存・採用・実行、runner、secret、Cloud、review、Java / Maven / DB、教育効果の未観測。

YAML syntax、pom引用、packet診断は静的に確認できます。それをsetup採用、Cloud起動、test成功へ読み替えません。Docsにsecret保存先が書かれていても、実値や実権限を確認しません。

## Submit

各Runtimeでparticipant 5 filesとEvidenceを完成させ、apply時と同じPack directoryを使います。

```powershell
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
node .hackathon\scripts\verify-run.mjs $pack --stage submitted
node .hackathon\scripts\export-submission.mjs $pack
```

export対象がexact 6 filesであることを確認します。空原稿、active workflow、pom / Java / test変更、secret、別condition、別run、余分なfileがあれば提出へ進みません。

各conditionのRuntime PRと、[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、condition → Runtime repository / PR / run、2 task、pom制約、responsibility、failure handoff、outcome、failure / unknownを対応付けます。secret値、個人情報、local absolute path、private source、未加工logは提出しません。

Runtime verifierの成功は静的な契約受理です。`runtimeBehavior` / `educationalEffect` は `not-observed` のままで、setup採用、Java成功、学習効果の実証にはなりません。

## Judging

- JDK8、Maven `[3.9,4.0)`、compiler 1.7、Java 7 API制約を分けたか
- `java17` signature名をJDK17指定と誤読していないか
- instructions、setup、version check、tests、DB、agent startを別欄にしたか
- `mvn --version` や `dependency:go-offline` をtest成功にしていないか
- setup失敗後のskipとagent startをsetup成功にしていないか
- baselineのagent-preparesを妨げず、同じ固定入力で比較したか
- Agents secretsの現在Docsと旧 `copilot` environmentの移行説明を区別し、実環境の設定済み・権限ありを主張していないか
- equal、worse、事前setup不要、未利用、unknown、blocked、incomparableを認めたか

setup step数、YAMLの長さ、tool数、`improved` の獲得自体は加点しません。

## Bonus Mission

本編の4セルと不活性原稿を変更せず、Mavenがrange外だった場合の二つの設計案を追記します。

1. setupで承認済みversionを用意してから再確認する案
2. Agentを開始させず、人へhandoffして止める案

権限、network、再現性、費用、失敗後の残状態を比べます。本編ではinstall、workflow実行、Cloud task、Java testを行わず、新しいconditionにも数えません。

## Support / Fallback

本編はpom読解、不活性なinstructions / setup草稿、固定packet診断だけで完了できます。Cloud AgentやActionsを利用できなくても、責任分担と4セルを提出できます。機能非対応は `unsupported`、runner / network想定をそろえられなければ `incomparable`、Hub/Runtimeへ進めなければ `blocked` とします。

任意routeは `cloud-setup`、`review-setup`、`postgres-readiness` の3件で、すべて **OPTIONAL_GUIDE_ONLY**、`required: false`、`liveStatus: "live-unobserved"` です。

### [Cloud setup確認ガイド](optional/cloud-setup.md)

default branchのsetup採用を将来確認するための準備ガイドです。

- prerequisite: 承認済みUbuntu環境、Actions / Cloud利用資格、準備処理と費用の別承認
- runtime requirement: `cross-branch-handoff: blocked`
- runtime requirement: `active-setup-workflow: not-checked`
- stop: setup ref、資格、runner、network、権限、費用上限、branch bindingが不明

### [Review setup確認ガイド](optional/review-setup.md)

専用 `copilot-code-review.yml` と共有setupの選択を別taskで準備するガイドです。

- prerequisite: code review利用資格、対応Ubuntu runner、対象head、実review要求の別承認
- runtime requirement: `active-setup-workflow: not-checked`
- runtime requirement: `standard-review-observation: not-checked`
- stop: 採用ref、runner scope、head、actor、資格、費用・回数上限が不明

### [PostgreSQL readinessガイド](optional/postgres-readiness.md)

DB課題を始める前の条件を読むだけのガイドです。provisionや接続、test実行は提供しません。

- prerequisite: JDK8、Maven `[3.9,4.0)`、承認済み専用PostgreSQL、DB所有者の許可
- runtime requirement: `dedicated-postgres: not-checked`
- stop: `db.tests` opt-in、engine、専用DB、credential所有者、復元範囲が不明

guide読了、workflow保存、Actions上の検査、Agent開始をCloud/review採用や本編改善の証拠にしません。secret値を登録・閲覧せず、self-hosted、Windows切替、larger runner、firewall無効化、TLS緩和、proxy変更を本編へ持ち込みません。

任意リンクを開けない場合も、上のprerequisite・停止条件・`not-checked` / blockedをEvidenceへ転記すれば本編は完了できます。[Support and Fallbacks](../../docs/support-and-fallbacks.md) も参照してください。
