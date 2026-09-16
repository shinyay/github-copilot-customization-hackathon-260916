# HC-025 Local AgentとAgent Hostへ同じ設計を持ち運ぼう

## Challenge Story

チームはLocal Agent向けに、固定packetを読み取るSkill、Prompt、Agent、Pluginの原稿を用意しました。次にAgent Hostでも同じ意図を使いたいと考えています。しかし、Markdown本文が同じでも、metadata、保存場所、発見方法、本文の読み込み、利用できるtools、approvalは同じとは限りません。

このChallengeでは、同じ不活性なkitをLocal AgentとAgent Hostの二つの観点から診断します。どの原稿をそのまま使えるか、どこを移植するか、どこで非対応・未確認として止めるかを設計します。PromptがHostで読まれないとき、Skillへ置き換えて「Promptも成功した」と報告しません。

Agent HostはCloudの別名ではありません。ローカルまたはリモートに配置され得るhostの概念であり、CLI、Copilot App、GitHub.comのCloud Agentも同じ一条件へまとめません。本編の比較対象はVS CodeのLocal AgentとAgent Hostだけです。

## この機能とは

**portability（可搬性）**は、ファイルをコピーできるかだけでなく、同じ意図を別のharnessで保てるかを確認することです。このChallengeでは次の5層を分けます。

1. **file format** — YAML / JSON / Markdownとしてどのpropertyを持つか。
2. **discovery** — そのharnessがどの保存元・pathから候補を探すと文書化されているか。
3. **loading** — 本文が実際に読み込まれたか。文書上の非対応と実機観測を分ける。
4. **effective tools** — 原稿の宣言ではなく、そのrunで実際に利用可能だったtool集合。
5. **approval** — tool利用、書込み、外部送信などの確認・許可がどう観測されたか。

固定kitには次の種類があります。

- **Skill** — `name` / `description` と本文を持つ。Promptの `model` / `tools` をそのままSkill propertyにできるとは限らない。
- **Prompt** — 明示的な依頼用のmetadataを持つ。公式文書ではAgent HostはPrompt Filesを読み込みません。
- **Custom Agent** — role、`target`、tools等のmetadataを持つ。宣言toolsと実効toolsは別。
- **Plugin** — 標準のmanifest、Skills、MCPと、client固有namespaceを区別する。

公式文書の2026-09-15時点の説明では、Prompt FilesはLocal Agentで当面利用できますが、Local Agent自体は将来削除予定で、削除日・版は不明です。この文書上の境界を、参加者環境で実際に観測したfalse/trueへ置き換えません。

出典:

- [VS Code Agent Host](https://code.visualstudio.com/docs/agents/concepts/agent-host)
- [Prompt files](https://code.visualstudio.com/docs/agent-customization/prompt-files)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [Custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [Agent Plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)

## 向いていること / 向いていないこと

**向いていること**

- 同じ意図を別harnessへ移す前に、形式と実利用を分けて点検するとき。
- Skill / Prompt / Agent / Pluginのmetadata差を具体的に確認するとき。
- 非対応、未確認、追加承認が必要な境界を明示するとき。
- Local Agentの結果をAgent Hostへ流用せず、同じkitで再診断するとき。
- 移植しない、別の仕組みに分けるという判断を説明するとき。

**向いていないこと**

- Agent HostをCloudの同義語として扱うこと。
- PromptがHostで非読込ならSkillへ置き換え、Prompt成功と報告すること。
- `read` / `search` の宣言だけで実効権限やOS隔離を断定すること。
- Plugin packageが読めることから、全component・全clientの対応を主張すること。
- 実版、model、tools、approvalを別clientや現在日付から補完すること。
- 4種類のprobeを4 conditionまたは8 conditionとして数えること。

## Starter Kit

[Pack manifest](pack/manifest.json) は、固定packet、Skill / Prompt / Agent / Plugin原稿、不正property例、permissions、空の診断・Evidence原稿を両conditionへ同じbytesで不活性に配置します。

予定PackはRuntime v1向けで、schemaVersion / challengeVersion / minimumTemplateVersionがすべて1、`allowedMutations: []`、condition strategyはseparate-repository、`branchSafe: false` です。

source種別は `baseline` です。固定packetは、次の3 pathを同じ順序で保持します。

```text
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
```

source provenanceは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` です。このpacketは実アプリのpathを識別する資料であり、業務仕様の正解や前runの回答ではありません。本編はpacket ID、3 path、未確認境界を保持することだけを求め、Javaの業務動作を新たに調査しません。

Packは全2条件へ次の14個の不活性payloadを同じbytesで配る予定です。

| payload leaf | 用途 |
|---|---|
| `brief.md.template` | Local Agent / Agent Hostの境界と禁止操作 |
| `request.txt.template` | 同じkitを同じ順序で診断する固定依頼 |
| `packet.json.template` | 固定packet ID、3 source path、boundary |
| `kit/hc025-packet/SKILL.md.template` | name / descriptionと共通本文を持つSkill原稿 |
| `kit/hc025-packet.prompt.md.template` | Prompt固有metadataと同じ共通本文 |
| `kit/plugin/com.github.copilot/agents/hc025-reader.agent.md.template` | VS Code向けAgent原稿 |
| `kit/plugin/plugin.json.template` | Agent Plugins 1.0の標準manifest原稿 |
| `kit/plugin/mcp.json.template` | server 0件の標準MCP config原稿 |
| `invalid/prompt-fields-in-skill.md.template` | Prompt由来の `model` / `tools` をSkillへコピーした不正例 |
| `invalid/agents-at-plugin-root.json.template` | Plugin rootへ `agents` を置いた不正例 |
| `permissions.json.template` | read/search、manual approval、write/networkなしという教材範囲 |
| `source-boundaries.md.template` | 文書根拠、実観測、非主張の境界 |
| `diagnosis.md.template` | probeごとの空の診断票 |
| `evidence/comparison.md.template` | 完成回答を含まないEvidenceひな型 |

Skill、Prompt、Agentのbodyは同じ意図を持ちますが、metadataは種類ごとに正当に異なります。不正例は具体的なpropertyを診断するためのfixtureで、製品全体の完全なschema validatorではありません。完成済みの対応表や、全harnessの結果を決めた資料は配りません。

exact condition IDsは `baseline`, `host` です。両conditionともactiveなCustomizationを置かず、同じ不活性kitを資料として診断します。

## Open Question

**同じ意図を保ったまま、どの原稿をそのまま使い、どこを移植し、どこを非対応・未確認のまま止めますか。**

参加者は共通body、種類ごとのmetadata、保存元、発見、loading、tools、approvalを対応付けます。全部を一つの形式へ変換する必要はありません。Promptを移行しない、Hostでは別の明示依頼を使う、Plugin packageは後回しにする等の案も理由があれば有効です。

「両方で動いた」を目標にせず、同じ意図を失わないこと、非対応を成功に見せないこと、追加承認の境界を説明することを問いにします。

## Design Time

診断前に、次を `participant/hc-025/portability-plan.md` へ決めます。

1. Skill / Prompt / Agent / Pluginをどの順序で独立probeするか。
2. 共通bodyに残す意図と、種類固有metadataへ置く内容。
3. file-format、文書化されたdiscovery、実discovery、loading、effective tools、approvalを分ける列。
4. unsupported propertyを見つけたときの最小修正案と、別機構へ置き換えない停止条件。
5. Local AgentとAgent Hostで同じbody bytes、packet ID、3 path、probe順を保つ方法。
6. version、channel、model、effort、tools、approvalを観測できない場合にnullを残す規則。
7. activeな実機probeが必要になった時点で本編を止め、別承認・別runへ分ける方法。

固定kitを診断したあと、参加者が提案する `common-body.md.template` を凍結します。その同じbodyをSkill、Prompt、Agentの不活性なdraftへ反映し、baselineとhostで別本文を作って結果を合わせません。

## Build

### Hub checkoutで統合状態を確認する

以下は **Hub checkout** で2 conditionの計画とPackを確認します。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-025 --condition baseline --team team-sora --run hc025-local-diagnosis-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-025 --condition host --team team-sora --run hc025-host-diagnosis-01
node .\scripts\build-pack.mjs --challenge HC-025 --output .runtime/packs
```

dry-runは計画表示だけで、Local Agent、Agent Host、Plugin、MCP、modelを起動しません。build済み出力は `.runtime\packs\hc-025-v1` ディレクトリです。既存出力を上書きしません。

### 2つの独立したRuntime checkoutを用意する

Runtime templateから2つの新しい非公開repositoryを作ります。`baseline` はLocal Agent側の資料診断、`host` はAgent Host側の資料診断です。別repository、名前付きbranch、fresh workspaceを使います。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-025-v1'
$Condition = 'baseline'
$RunIds = @{
  baseline = 'hc025-local-diagnosis-01'
  host     = 'hc025-host-diagnosis-01'
}
$RunId = $RunIds[$Condition]
if (-not $RunId) { throw 'HC-025の固定conditionを選んでください' }
git status --short --branch
git switch -c "hc-025-$Condition-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

Hub dry-runの `--run` とRuntime applyの `--run-id` には同じ `$RunId` を使い、`.hackathon/run.json` は手編集しません。

両conditionで参加者が新規作成できる予定pathは次の7件です。

- `participant/hc-025/diagnosis.md`
- `participant/hc-025/portability-plan.md`
- `participant/hc-025/common-body.md.template`
- `participant/hc-025/skill-draft.md.template`
- `participant/hc-025/prompt-draft.md.template`
- `participant/hc-025/agent-draft.md.template`
- `participant/hc-025/plugin-draft.json.template`

これらはすべて探索対象外の不活性な設計成果です。本編では `.github/skills`、`.github/prompts`、`.github/agents`、Plugin install先、User保存元へactive fileを追加しません。`.vscode/mcp.json`、settings、home、同期、login、installも変更しません。

各conditionでSkill、Prompt、Agent、Pluginの4 probeと2不正例を同じ順序で読みます。4 probeはconditionではありません。実clientを起動しない本編では、実discovery、loading、effective tools、approvalObservedはすべてnull / `not-observed` です。

## Compare

このページでは `baseline` を **Baseline**、`host` を比較表示上の **Customized** と呼びます。CustomizedはAgent Hostを有効化して成功させた条件という意味ではなく、同じ不活性kitを別harnessの仕様から診断する条件です。

| condition | 対象 | active file | 主な診断 |
|---|---|---|---|
| `baseline` | VS Code Local Agent / extension-host側 | なし | 同じkitの形式・配置仕様・対応境界 |
| `host` | VS Code Agent Host側 | なし | 同じkitの形式・配置仕様・対応境界 |

Skill / Prompt / Agent / Pluginの4種類と不正例は、両conditionが読むprobeです。2条件 × 4種類を8 conditionと数えません。

両conditionでpacket、kit、common body、source path、permissions、probe順を同一にします。種類固有のmetadata差は保持します。baselineだけPromptをactive化したり、hostだけSkillへ変換したりしません。

文書化された境界としてPrompt FilesのHost非読込を記録できますが、これは「この実機でloading=falseを観測した」という値ではありません。実機を起動しない場合は `documentedSupport: not-loaded` と `observedLoading: null` のように別々に残します。

`read` / `search` の宣言、実効tool、client接続、OS権限、approvalも別です。未知toolが無視される場合やclient接続が必要な場合を、宣言だけで解決済みにしません。

結果は `equal`、`worse`、`incomparable`、`blocked`、`unsupported`、移植しない、要確認を含めて提出できます。これはモデル品質比較ではありません。

## Evidence

各Runtimeで `.hackathon/evidence/hc-025/comparison.md` を参加者が作ります。必須見出しは次の9件です。

`Fixed task`, `Environment`, `Condition`, `Materials`, `Observations`, `Design rationale`, `Comparison set`, `Outcome`, `Limits`

`diagnosis.md` では各probeについて次を別列にします。

- `fileFormat`: 実際のpropertyと本文hash。
- `unsupportedProperties`: 具体的なproperty名と理由。
- `documentedDiscovery`: 公式資料が説明する保存元・対応境界。
- `observedDiscovery`: 実clientで候補を観測したか。本編ではnull。
- `loading`: 実際の本文利用。本編ではnull。
- `effectiveTools`: 実効tool集合。本編ではnull。
- `approvalObserved`: 実承認表示。本編ではnull。
- `proposedAction`: そのまま、移植、非対応、未確認、停止のいずれかと理由。

固定packet ID、3 source path、common body、kit各原稿、permissionsのhashを両conditionで照合します。PromptのHost非読込という文書上の事実と、実機観測値を同じbooleanにしません。

限定fixtureでformat errorを見つけても、製品の完全なschema実装を検証したとはしません。静的なRuntime検査後も `runtimeBehavior` / `educationalEffect` は `not-observed` です。

## Submit

各Runtime checkoutで不活性な診断成果とEvidenceを完成させます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

各Runtime Pull Requestへdiagnosis、portability plan、共通body、4 draft、Evidenceを含めます。activeなCustomizationや実機成功receiptは含めません。

[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ2条件のRuntime URL / PR / run、同じkitのhash、移植するもの・止めるもの、unsupported / unknown、追加承認境界をまとめます。[Submission Guide](../../docs/submission-guide.md) に従い、local username、home path、private code、raw logs、tokenを貼りません。

## Judging

- タイトルと比較対象をLocal Agent / Agent Hostとして扱い、Cloudへ読み替えていないか。
- format、discovery、loading、effective tools、approvalを別々に記録したか。
- Skill / Prompt / Agent / Pluginの具体的metadata差を説明したか。
- PromptのHost非読込をSkill成功へ置き換えていないか。
- 共通body、packet、3 pathを両conditionで保持したか。
- 文書上の対応と実機観測を別欄にし、live値をnullのまま残したか。
- 不正propertyを隠さず、最小修正または停止理由を示したか。
- install、Cloud実行、両harness成功を合格条件にしていないか。

機構数、copy数、すべてを移植したことは加点しません。

## Bonus Mission

次の二つは本編と分離した任意の準備ガイドです。どちらも `OPTIONAL_GUIDE_ONLY` / `live-unobserved` で、active probeやclient操作の権限を追加しません。

- [Local Agent / Agent Host live probeの準備境界](optional/local-host-probes.md) — 一つずつactive probeを行うための準備。
- [CLI / App / Cloud等の準備境界](optional/other-clients.md) — 各clientを別々に記録する準備。

Bonusでは、どちらか一つについて必要な環境、資格、追加承認、停止理由を紙上で整理します。`other-clients` のCloud別branch handoffはRuntime v1の `cross-branch-handoff` が既知blockedであり、`run.json` 編集や `branchSafe` 偽装で回避しません。

## Support / Fallback

Local Agentの選択肢が対象versionに存在しない、またはAgent Hostを利用できない場合も、同じkitの文書診断を提出できます。対象harnessのlive discovery、loading、effective tools、approvalはnull / `not-observed` とし、過去版や別clientの結果で補いません。

PromptのHost非読込は文書上の境界として残し、PromptをSkillへ置き換えた別probeを同じ結果へ混ぜません。Agent HostをCloudの別名にしたり、CLI/App/Cloudを本編へ追加したりしません。

条件を揃えられなければ `incomparable`、Runtimeや追加承認で止まれば `blocked`、対象harnessや形式が非対応なら `unsupported` とします。終了時は自分の不活性draftとEvidenceだけを管理し、既存Plugin、User/home設定、他人の環境を削除・reset・stashしません。
