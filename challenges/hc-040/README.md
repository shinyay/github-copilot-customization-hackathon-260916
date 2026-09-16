# HC-040 一つのSkillをPluginとして届けよう

## Challenge Story

架空の保守チームは、受注CSVの再送調査で使う一つのSkillを複数の担当者へ届けたいと考えています。手動でコピーすれば知識は渡せますが、どの版が有効か、更新後に旧版へ戻せるかを人ごとに確認する必要があります。Plugin packageにしても、Skillの本文自体が同じなら知識が増えたわけではありません。

このChallengeでは、参加者がSkill v1とv2を作って凍結し、各revisionでmanual条件とpackage条件の全文・raw bytesを完全に同一にします。比較するのは配布、更新、復元の見通しと負担です。Pluginをinstall、enable、marketplaceへ接続せず、Cloud AgentやJavaを起動しません。

このページとStarter Kitだけで完結します。以前のSkill、Plugin、Labs、前の回答は必要ありません。

## この機能とは

Skillは、特定の作業で必要になる手順書です。Pluginは、Skillなどのcomponentをまとめて配るpackageです。同じSkillを封筒へ入れて配っても、手順の意味が自動的に改善するわけではありません。packageの価値は、component inventory、version、配布先、更新、復元を一つの単位として扱えるかで検討します。

小さな例は受注CSVの再送調査です。`OrderImportService.importDraft` は `external_key` から既存claimを探し、`findClaim` と `replay` へ進みます。`OrderGroup.canonicalHash` はpayloadのcanonical化を行います。Skillは、既存claim、canonical hash、元受注、新しいDRAFTへの入口を順に調べ、DBを実行していないことを明示する手順にできます。

Agent Plugins 1.0のpackage原稿は、package rootの `plugin.json` と `skills/<name>/SKILL.md` を使います。本編は一つのSkillだけを含めます。MCP、Hook、Custom Agent、command、LSPを追加しません。

Cloudの宣言的な設定には `.github/copilot/settings.json` の `enabledPlugins`、必要な場合の `extraKnownMarketplaces` があります。しかし本編で作るのは `participant/hc-040/plugin-settings.json.template` という不活性な草稿です。実設定pathへ置かず、架空のmarketplace名を実在・承認済み接続先と呼びません。

製品説明の根拠は [About plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins) と Agent Plugins 1.0 schema `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` です。文書確認日は2026-09-15です。schemaに沿う原稿を作ることと、installable、installed、marketplace-connected、Cloudで利用可能であることは別です。

## 向いていること / 向いていないこと

**向いていること**

- 一つのSkillの版、component、配布先、更新、旧版復元をまとめて設計すること。
- manual copyとpackage copyのSkill bytesを照合し、知識の差を比較から除くこと。
- planned copy数と、実際に有効なcopy数・取得版・発見・callを分けること。
- Pluginを採用しない、manual配布を続ける判断の保守負担を説明すること。

**向いていないこと**

- Plugin packageへ別のMCP、Hook、agent、command、LSPを足して能力比較へ変えること。
- manifestの形式適合だけで、install、enable、発見、Skill利用を成功とすること。
- manual側だけSkill本文を改善し、packageの効果として数えること。
- 架空marketplaceやfloatingな取得先を、信頼済み・承認済みと表示すること。
- sourceやtestを読んだだけで、DB、Java、CSV import/replayが成功したとすること。

## Starter Kit

source種別は `baseline` です。元アプリは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` に固定され、Runtimeの515-file baselineにあります。PackはJavaを複製・変更しません。

| Runtime rootから読むexact path | 戻るsymbol |
|---|---|
| `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | `OrderImportService.importDraft`, `OrderImportService.findClaim`, `OrderImportService.replay` |
| `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | `OrderGroup.canonicalHash` |
| `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderCsvTest.java` | `OrderCsvTest.canonicalPayloadNormalizesQuantityWhitespaceAndProductOrder` |

test定義は、quantityの空白やproduct順序をcanonical化する境界へ戻る入口です。testやDBを実行したこと、実運用の再送結果を確認したことにはしません。

[Pack manifest](pack/manifest.json) は、両conditionへ次の不活性素材を同じbytesで渡します。

| 素材 | 役割 |
|---|---|
| `brief.md.template` | 一つのSkillだけを扱う非実行境界 |
| `request.txt.template` | 両condition・両revisionに共通のtask全文 |
| `design.md.template` | Skill本文、package metadata、配布・復元を設計する |
| `comparison.md.template` | conditionごとのEvidenceひな型 |
| `input/SKILL.md.template` | Skillを自分の言葉で作る開始点 |
| `input/plugin.json.template` | Agent Plugins 1.0の一Skill manifest開始点 |
| `input/plugin-settings.json.template` | Cloud設定の不活性な参考原稿 |
| `input/source-map.md.template` | 上の3 pathとsymbolへの入口 |
| `input/lifecycle.md.template` | v1、v2、旧版復元の台帳 |

taskは `same-key-check` と `changed-payload-check` です。両方で同じsource、依頼、判定観点を使います。

- `same-key-check` は、同じ `external_key` と既存claimを調べる順序、canonical hash、元受注への入口を確認します。
- `changed-payload-check` は、同じkeyでpayloadが変わった場合に、どこを根拠として確認し、どこから先を未観測とするかを確認します。

参加者はSkill v1を作って凍結し、その全文をmanualとpackageへbyte-copyします。次に、調査順や不明点の説明を一つ改善したSkill v2を作り、再び両conditionへ同じbytesで渡します。v1とv2は別revisionですが、同じrevision内のmanual/packageは完全一致です。

ライフサイクルの `prepare-v1`、`update-v2`、`restore-v1` は台帳の状態であり、conditionではありません。conditionsはexactに `baseline` と `plugin-package` の二つだけです。

必要なのはGit、Node.js 22以降、テキスト編集環境、Hubと非公開Runtimeを扱う通常の参加権限です。Plugin install、Cloud、marketplace、organization設定、JDK、DBは本編に不要です。

## Open Question

**同じSkill全文を手動配布する場合とPluginで配る場合に、どの版が一つだけ有効か、更新と復元をどう確認すればよいでしょうか。**

- v1とv2の正本をどこに置き、manual/packageのbyte一致を誰が確認しますか。
- manifestのversionとSkill hashが食い違ったとき、どの状態で停止しますか。
- planned copy数、配布予定、実際に有効なcopy、実取得版をどう分けますか。
- v2が不適切だったとき、v1へ戻ったことをどのhashで確認しますか。
- 一Skillのためにpackageを導入する負担が大きい場合、manualを選ぶ基準は何ですか。

Plugin採用、manual継続、配布自体を見送ることのどれも、理由があれば有効です。

## Design Time

1. `same-key-check` と `changed-payload-check` の固定依頼、3 source、判定観点を先に決めます。Skillの正解手順をStarterからそのまま写さず、自分の言葉で必要な順序と停止条件を書きます。
2. Skill v1を作り、UTF-8、改行、raw bytes、SHA-256、revisionを凍結します。manual/packageのv1へ同じbytesをcopyする計画を作ります。
3. v1を変更せず、v2で改善する点を一つだけ決めます。たとえば、`findClaim` と `replay` の順序、canonical hashの確認、DB未実行の残し方です。
4. Skill v2を凍結し、manual/packageのv2へ同じbytesをcopyします。片条件だけ文面を変えません。
5. package manifestはschema URL、name、version、descriptionと一Skill inventoryだけにします。追加componentを入れません。
6. `prepare-v1`、`update-v2`、`restore-v1` ごとに、selected version、manifest metadata、Skill hash、planned copy数、復元元hash、確認担当を決めます。
7. 実有効copy数、実取得版、発見、本文投入、callは観測していないため、`null` / `not-observed` とする欄を残します。
8. 比較前にv1/v2全文、task、source、判定観点、lifecycle revisionを凍結します。途中で変えたら新しいrunにします。

Skill知識の効果は両conditionで固定します。比較するのは配布・更新・復元負担だけです。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。dry-runとbuildはPluginをinstall・enableしません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-040 --condition baseline --team team-sora --run manual-distribution-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-040 --condition plugin-package --team team-sora --run package-design-01
node .\scripts\build-pack.mjs --challenge HC-040 --output .runtime/packs
```

既存出力を削除・上書きしません。生成されたPack directory、版、hashを記録し、manifest単体ではなくdirectoryをRuntimeへ渡します。

### 2. conditionごとにfresh Runtimeを用意する

[Getting Started](../../docs/getting-started.md) に従い、二つの新しい非公開Runtime repositoryを用意します。各conditionで別repository、名前付きbranch、新規workspace、新しい会話を使います。repo分離だけでUser設定、organization設定、Memory、既存Skill/Pluginが消えたとは考えず、確認できない残留を記録します。

各 **Runtime checkout** のrootで、そのrepositoryのconditionを一つだけ適用します。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-040-v1'
$Condition = 'baseline'
$RunId = 'manual-distribution-01'
git status --short --branch
git switch -c "hc-040-$Condition-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
```

もう一方は `$Condition = 'plugin-package'`、`$RunId = 'package-design-01'` とします。どちらも `$RunId` をHub dry-runの `--run` と一致させ、EvidenceとHub Issueのrun IDにも同じbindingを記録します。applyしたbranchを維持し、`.hackathon/run.json` を編集しません。

### 3. conditionごとの不活性成果物を作る

| exact path | condition | 内容 |
|---|---|---|
| `participant/hc-040/distribution-plan.md.template` | 両方 | task、revision、hash、copy、update、restoreの台帳 |
| `participant/hc-040/manual/v1/SKILL.md.template` | `baseline` | 凍結したSkill v1全文 |
| `participant/hc-040/manual/v2/SKILL.md.template` | `baseline` | 凍結したSkill v2全文 |
| `participant/hc-040/package/v1/plugin.json.template` | `plugin-package` | v1の一Skill manifest |
| `participant/hc-040/package/v1/skills/training-order-evidence/SKILL.md.template` | `plugin-package` | manual v1と同じraw bytes |
| `participant/hc-040/package/v2/plugin.json.template` | `plugin-package` | v2の一Skill manifest |
| `participant/hc-040/package/v2/skills/training-order-evidence/SKILL.md.template` | `plugin-package` | manual v2と同じraw bytes |
| `participant/hc-040/plugin-settings.json.template` | `plugin-package` | 不活性なCloud設定草稿 |
| `.hackathon/evidence/hc-040/comparison.md` | 両方 | 当該conditionのEvidence |

すべて `.template` のままにします。activeなSkill directory、package install先、`.github/copilot/settings.json`、marketplace設定へコピーしません。manifestにMCP、Hook、agent、command、LSPを追加しません。

manualとpackageは別Runtimeにあるため、各hashをEvidenceへ記録し、両PRを対応付けて照合します。`baseline` のRuntimeではmanual側だけを確認します。

```powershell
Get-FileHash -Algorithm SHA256 .\participant\hc-040\manual\v1\SKILL.md.template
Get-FileHash -Algorithm SHA256 .\participant\hc-040\manual\v2\SKILL.md.template
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

`plugin-package` のRuntimeではpackage側だけを確認します。

```powershell
Get-FileHash -Algorithm SHA256 .\participant\hc-040\package\v1\skills\training-order-evidence\SKILL.md.template
Get-FileHash -Algorithm SHA256 .\participant\hc-040\package\v2\skills\training-order-evidence\SKILL.md.template
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

各conditionに存在するpathだけをhashします。hash一致は保存bytesの一致であり、Plugin install、Skill発見、callの証拠ではありません。

## Compare

| condition | このページでの呼び名 | 比較する配布方法 |
|---|---|---|
| `baseline` | Baseline | 同じSkill v1/v2をmanualな不活性コピーとして管理する |
| `plugin-package` | Customized | 同じSkill v1/v2をAgent Plugins 1.0の一Skill package原稿として管理する |

各conditionで `same-key-check` / `changed-payload-check` をv1とv2へ適用するため、2 tasks × 2 revisions × 2 conditionsの8内容点検セルがあります。LLM出力やDB結果は比較対象ではありません。

さらに `prepare-v1`、`update-v2`、`restore-v1` の3状態を両conditionへ記録し、計6状態行を比較します。これはcondition追加ではありません。

固定するのは各revisionのSkill全文/raw bytes、task、source、判定観点です。変更するのは配布単位、manifest、版台帳、想定copy数、更新・復元手順です。Skill知識を片側だけ改善しません。

結論は `improved`、`same`（Issueでは `equal`）、`worse`、`no-addition-needed`、`not-observed`、`unsupported`、`blocked`、`incomparable` が有効です。packageの管理項目が増えるだけなら `worse`、manualで十分なら `no-addition-needed`、実取得版が不明なら `not-observed` として構いません。

## Evidence

各Runtimeの `.hackathon/evidence/hc-040/comparison.md` に、次のexact headingを残します。

- `Fixed task`
- `Environment`
- `Condition and input`
- `Design`
- `Comparison`
- `Outcome`
- `Limitations`
- `Skill byte identity`
- `Component inventory`
- `Version and restoration`

Evidenceには、v1/v2の全文hash、manual/packageの一致、task別の確認、manifest schema/name/version、全component inventory、selected version、planned copy数、`prepare-v1` / `update-v2` / `restore-v1` の状態、旧版復元hash、確認担当を記録します。

planned copy=1は実copy=1ではありません。実有効copy数、実取得版、install、enable、発見、本文投入、call、marketplace接続、Cloud実行は `null` / `not-observed` とします。schema検査やhash一致を、それらの成功へ昇格させません。

sourceを読んだことから、DB、CSV import、replay、Java testが成功したとは書きません。未実施・取得失敗・未知版を0、pass、N/Aへ変換せず、復元hashが一致しなければ `blocked` として停止します。

## Submit

各 **Runtime checkout** でparticipant原稿とEvidenceを完成させます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

BaselineのRuntime PRにはdistribution planとmanual v1/v2、CustomizedのRuntime PRにはdistribution plan、v1/v2 manifest+Skill、plugin-settings草稿を含めます。両PRに当該conditionのEvidenceと再現手順を含めます。install済みPluginやactive settingsは含めません。

Hubの [共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、二つのRuntime URL・PR・run ID、v1/v2のhash、8内容点検セル、6状態行、component inventory、更新・復元負担、outcome、未観測をまとめます。`Challenge-specific design` には、正本、版、copy、更新、旧版復元の方針を書きます。

[Submission Guide](../../docs/submission-guide.md) に従い、private package URL、token、User設定、local絶対path、raw logをIssueへ貼りません。Runtimeの静的検査から `runtimeBehavior` / `educationalEffect` をpassにしません。

## Judging

- Skill v1とv2をそれぞれmanual/packageで完全に同じraw bytesへそろえたか。
- 2 task × 2 revision × 2 conditionの8セルと、3 state × 2 conditionの6行を欠けなく扱ったか。
- packageを一Skillに限定し、MCP、Hook、agent、command、LSPを混ぜていないか。
- manifest形式、planned copy、実取得版、発見、callを別々にしたか。
- v2更新とv1復元のhash・責任・停止条件を説明したか。
- `same`、`worse`、`no-addition-needed`、`not-observed` を正当な結果として残したか。

Pluginを採用したこと、component数、manifestの長さ、形式validatorの成功、Skill本文の改善だけでは採点しません。

## Bonus Mission

凍結済みのv1/v2を変更せず、配布先が二つに増えた場合のdrift検出を紙上で設計してください。どのhashを、誰が、いつ比較し、不一致時にv2を進めるかv1へ戻すかを書きます。新しいPlugin component、condition、install操作は追加しません。

## Support / Fallback

PluginやCloudの利用資格がなくても、本編のpackage原稿と配布台帳は完成できます。Runtimeを用意できない場合は不活性原稿を手元に保ち、提出だけを `blocked` と分けます。Skill bytes、source/ref、schema、復元元を固定できない場合は、推測で進めず停止します。

任意の [`plugin-lifecycle-live`](optional/plugin-lifecycle-live.md) は、install / enable / update / restoreを実施する別承認前の準備ガイドです。本編conditionや実行許可ではなく、`live-unobserved` です。信頼済み取得先、固定ref/version、対応client/Cloud、利用資格、追加承認、既存copyと自分の追加分の識別、復元方法がそろわなければ止めます。

架空の `training-marketplace` を実在の接続先にせず、User設定へ黙って迂回しません。Agent Plugins 1.0の形式や他clientのGAを、Cloudですべてのcomponentが提供される保証へ変換しません。Cloud-created branchを既存Runtime runへ束ねる必要がある場合はcross-branch handoffを `blocked` とします。

終了時は既存Skill、Plugin、User/org設定、Memory、PR履歴を削除せず、自分の不活性原稿だけを管理します。執筆根拠は固定Labs commitの [LAB-40原稿](https://github.com/shinyay/github-copilot-customization-labs/blob/3474d21dd62bad2e594e84657dabe2eb9bb876c1/docs/labs/lab-40-cloud-plugins.md) です。
