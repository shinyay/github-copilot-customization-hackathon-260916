# HC-023 最小限で十分なカスタマイズを選ぼう

## Challenge Story

チームには、Instructions、Prompt、Skill、Agent、MCP、Pluginなど多くの選択肢があります。困りごとを見るたびに新しい機構を追加すると、設定の数、更新箇所、権限確認、利用条件が増えます。一方で、何も追加しないと毎回同じ手順を説明する負担が残るかもしれません。

このChallengeでは、10個のJava保守の状況を読み、**何を追加するかだけでなく、何を追加しないか**を設計します。機能名を当てるクイズではありません。同じ条件を満たす複数案、手動で十分という案、追加なしという案を、理由付きで認めます。

このページと統合後のStarter Kitだけで完結します。以前のChallenge、LAB、Plugin、Skill、回答例を実施済みにする必要はありません。10個のcaseはすべて最初から参加者へ公開し、追加確認用入力も同じPackに含めます。

## この機能とは

このChallengeは新しい製品機能を一つ有効化する課題ではなく、**困りごとに合う最小の準備を選ぶ方法**を学ぶ設計演習です。選択肢の概要は次のとおりです。

- **Instructions** — 繰り返し伝えたい読み方や規則。repository全体または対象pathへ絞る設計ができる。
- **Prompt** — 人が明示的に開始する、繰り返し使う依頼。保存形式や対応harnessを確認する必要がある。
- **Skill** — 作業手順と関連資料をひとまとまりにする。資源が存在すること、本文が使われること、scriptが実行されることは別。
- **Agent** — 役割と利用可能toolsの宣言。宣言したtoolsと実効tools、指示と権限は別。
- **MCP** — 外部またはlocal資源を取得する経路。接続、server trust、content authority、操作approvalを分ける。
- **Plugin** — SkillやMCP等を版付きで配る単位。packageの提供段階を、すべてのcomponentやharnessへ一般化しない。
- **manual context** — 同じ資料を人が明示的に渡す方法。小規模・一回限りなら保守しやすい場合がある。
- **none** — 追加のCustomizationを作らず、十分な固定依頼と既存資料だけを使う。

選択は、次の5観点で説明します。

1. **trigger** — 一回限りか反復か、明示開始か自動供給候補か。
2. **scope** — 誰・どのworkspace・どのpath・どのharnessへ届くか。
3. **resources** — source、packet、checklist、script、外部資源の何が必要か。
4. **permissions** — 読取りと、別承認が必要な実行・書込み・送信をどう分けるか。
5. **maintenance** — 所有者、更新頻度、版、複製、復元、手動負担をどう扱うか。

機構の数、名前、流行ではなく、状況との適合と維持費を比べます。設定案を作っただけで、発見、本文投入、実行、教育効果を確認したことにはなりません。

## 向いていること / 向いていないこと

**向いていること**

- 複数の機構が候補になり、追加の価値と保守費用を比べたいとき。
- 一回限り、反復、Local Agent、Agent Host、外部接続不可など条件が異なるとき。
- none、manual、機能を使う案を同じ観点で検討したいとき。
- 権限や対応harnessを、文章の便利さと別に確認したいとき。
- 選ばなかった案と、条件が変わった場合の代案を残したいとき。

**向いていないこと**

- case IDから一つの機能名を引く正解表を作ること。
- 追加した機構の数を成果や成熟度として採点すること。
- PromptをAgent Hostで必ず使える、Pluginなら全componentが使える等と推測すること。
- 架空の許可資料を実grant、server trust、install成功とみなすこと。
- 10 caseのうち都合のよいものだけを提出すること。
- 机上の選択案を実Copilotの動作や教育効果の実証とすること。

## Starter Kit

[Pack manifest](pack/manifest.json) は、10 case、10 request、五観点、同梱資源、不活性な回答・Review・Evidence原稿を両conditionへ同じbytesで配置します。

予定PackはRuntime v1向けで、schemaVersion / challengeVersion / minimumTemplateVersionがすべて1、`allowedMutations: []`、condition strategyはseparate-repository、`branchSafe: false` です。

source種別は `baseline` です。次の7 pathはRuntimeの固定515-file baselineに実在し、caseの参照先を識別するために使います。

```text
wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
wholesale-core/src/main/resources/application-context.xml
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/OrderStates.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java
```

source provenanceは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`、source treeは515 files、SHA-256 `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` です。Java pathは実物ですが、caseの状況、架空の権限、配布・保守計画は合成教材です。業務動作の正答を作る課題ではありません。

Packは全2条件へ37個の不活性payloadを同じbytesで配る予定です。

### 共通9ファイル

- `brief.json.template`
- `mechanisms.json.template`
- `checklist.md.template`
- `evidence-note.txt.template`
- `operations-note.json.template`
- `review-role.md.template`
- `answers.md.template`
- `review.md.template`
- `evidence/comparison.md.template`

### caseとrequestの20ファイル

- `cases/case-01.json.template` から `cases/case-10.json.template`
- `requests/case-01.txt.template` から `requests/case-10.txt.template`

### 版付きpackageの4ファイル

- `package/v1/plugin.json.template`
- `package/v1/skills/order-import-evidence/SKILL.md.template`
- `package/v2/plugin.json.template`
- `package/v2/skills/order-import-evidence/SKILL.md.template`

### caseを単独で読めるようにする4ファイル

- `scope-paths.json.template`
- `resource-permission.md.template`
- `harness-boundaries.md.template`
- `fixed-review-packet.md.template`

講師用の完成回答、caseごとの期待機能名、記入済み採点資料はPack・README・参加者が読める検査へ含めません。

10 caseは次の状況を扱います。表は状況と資源だけを示し、選ぶ機構の正解表ではありません。

| case | 固定する状況・資源 |
|---|---|
| `case-01` | repository全体で反復する根拠整理。固定sourceと共通brief |
| `case-02` | 深いJava/XMLだけに必要な読み方と非対象path |
| `case-03` | 人が明示的に繰り返す同じrequest。自動起動不要 |
| `case-04` | checklistとメモひな型を伴うbatch読解。script実行は不許可 |
| `case-05` | 読取りreview役とtool範囲。自動handoffやSubagentなし |
| `case-06` | 同じ全文メモが配布済みで、外部接続は不許可 |
| `case-07` | Agent Host向けの再利用。Localの過去結果を成功根拠にしない |
| `case-08` | 同じ全文を将来resourceから供給する案。実serverなし |
| `case-09` | 同じ1 Skillのv1/v2を、版と復元付きで配る設計 |
| `case-10` | 一回限りで固定source・依頼・出力条件がすでに十分な追加確認case |

`case-10` も最初から配布される**追加確認用入力**です。全caseが閲覧可能なため、未知の入力に対する厳密な評価ではないという限界を残します。

exact condition IDsは `baseline`, `checklist` です。

## Open Question

**同じJava保守の困りごとについて、複数案から何を採用し、何を追加しないと決めますか。その理由は利用条件が変わっても説明できますか。**

各caseで少なくとも二つの候補を考え、採用案だけでなく、採用しない案、追加不要の案、前提が成立しないときの代案を説明してください。noneやmanualを「機能を知らない回答」として低く扱いません。

たとえば反復頻度、対象harness、利用できる資源、別承認の要否、更新担当が一つ変わるだけで、同じ選択が妥当とは限りません。機能名ではなく、5観点の関係を問いにします。

## Design Time

10 caseの回答を作る前に、次を決めます。

1. trigger / scope / resources / permissions / maintenanceを自分の言葉で定義する。
2. 各caseで最低二案を比べる書式。none、manual、追加機構の候補を排除しない。
3. 採用理由、不採用理由、前提、未確認、条件変更時の代案をどこへ書くか。
4. 対応harnessや権限の重大な誤りを、文章の良さで相殺しない方法。
5. `baseline` では回答作成中に五観点checklistを明示的に参照せず、`checklist` では同じchecklistを使う手順。
6. 同じ人が両条件を行う場合の順序・carryoverと、前回答を貼らない方法。
7. 10 caseすべてのID、request、resource、source pathを同じ順序で扱う完全性確認。
8. 回答を見たあとに評価軸を変更しない停止条件。

このREADME自体が5観点を説明するため、Baselineの参加者が観点をまったく知らないという統制はできません。比較するのは、回答作成時に**明示的なchecklistを使うか**という設計差です。記憶や学習効果の実験ではありません。

## Build

### Hub checkoutで統合状態を確認する

以下は **Hub checkout** でconditionごとの計画とPackを確認します。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-023 --condition baseline --team team-sora --run hc023-baseline-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-023 --condition checklist --team team-sora --run hc023-checklist-01
node .\scripts\build-pack.mjs --challenge HC-023 --output .runtime/packs
```

dry-runは計画表示だけで、Customizationの選択、設定変更、server起動、installを行いません。build済み出力は `.runtime\packs\hc-023-v1` ディレクトリです。既存出力を上書きしません。

### conditionごとに独立したRuntime checkoutを用意する

Runtime templateから2つの新しい非公開repositoryを作ります。各conditionで別repository、別branch、fresh workspaceを使い、同じ回答ファイルをコピーしません。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-023-v1'
$Condition = 'baseline'
$RunIds = @{
  baseline  = 'hc023-baseline-01'
  checklist = 'hc023-checklist-01'
}
$RunId = $RunIds[$Condition]
if (-not $RunId) { throw 'HC-023の固定conditionを選んでください' }
git status --short --branch
git switch -c "hc-023-$Condition-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

Hub dry-runの `--run` とRuntime applyの `--run-id` には同じ `$RunId` を使い、`.hackathon/run.json` は手編集しません。

参加者が新規作成できる予定pathは、両conditionで次の2件だけです。

- `participant/hc-023/answers.md`
- `participant/hc-023/review.md`

`answers.md` にcase-01〜10の採用案、別案、理由、前提、追加不要の検討を記録します。`review.md` に各caseの5観点、引用、未観測、対応・安全上の重大な懸念を記録します。

activeなInstructions、Prompt、Skill、Agent、MCP、Plugin、設定を作りません。v1/v2 packageは不活性な読解素材です。Java、既存test、User/home/組織設定を変更せず、server、script、実clientを起動しません。

各conditionで**10個すべての回答を新規作成**します。前conditionの文章をコピーして語尾だけ変えず、そのconditionで読んだ固定caseとrequestへ結び付けます。

## Compare

このページでは `baseline` を **Baseline**、`checklist` を **Customized** と呼びます。Customizedは製品Customizationを有効化した意味ではなく、五観点表を明示的に使う設計条件です。

| condition | 回答時の補助 | 必要な回答 |
|---|---|---:|
| `baseline` | 同じ完全なcase・request・資源。回答作成中はchecklistを明示参照しない | 10 |
| `checklist` | 同じ完全なcase・request・資源 + 五観点checklistを明示利用 | 10 |

10 caseは10個のtaskであり、10 conditionではありません。2 conditionそれぞれに10回答を作り、比較集合は**20個のdistinct answer**です。caseの欠落、duplicate、同件数のID置換、別condition回答の流用を認めません。

case順、request全文、resource、source path、回答書式を同一にします。Baselineだけ資料を減らしたり、checklist側だけ追加の業務回答を渡したりしません。同じ人が順番に行う場合はcarryoverがあり、別repositoryや新会話で人の記憶は消えません。厳密な教育効果比較には別承認の参加者割付・順序設計が必要です。

比較するのは、理由の抜け、前提の明示、不要な機構、権限・harness誤り、保守の説明です。機能名の一致、設定数、導入数を採点しません。`equal`、`worse`、`incomparable`、`blocked`、`unsupported`、追加不要はすべて有効です。

## Evidence

各Runtimeで `.hackathon/evidence/hc-023/comparison.md` を参加者が作ります。必須見出しは次の9件です。

`Fixed task`, `Environment`, `Condition`, `Materials`, `Observations`, `Design rationale`, `Comparison set`, `Outcome`, `Limits`

特に次を残します。

- case-01〜10のexact ID、task、request、source/resource hash。
- conditionごとの `answers.md` と `review.md` のhash。
- 10回答すべての採用案、別案、追加不要、前提、未確認。
- 各caseのtrigger / scope / resources / permissions / maintenanceの根拠。
- 対応harness・安全上の重大な懸念。未レビューならfalseへ補完しない。
- checklistを実際に参照したか、前回答を見たか、carryoverがあるか。
- per-caseの判断と、10件全体の完全性確認を分けた記録。
- 比較相手のrepository、branch、run ID、Hub commit、Pack hash、bundle参照。

機械的に確認できるのは、ID集合、見出し、hash、欠落・重複等の構造です。自然言語の適合性は人が理由を読みます。元LABの数値閾値や講師答案を公開Challengeの自動合否へ持ち込みません。

設定案が保存されたことを、製品による発見、本文投入、実行と呼びません。本編ではAI利用・server・installは `not-used`、実機観測は `not-observed` です。Runtime exporterの `runtimeBehavior` と `educationalEffect` も `not-observed` のままです。

## Submit

各Runtime checkoutで10回答、review、Evidenceを完成させます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

Runtime Pull Requestには、そのconditionの `answers.md`、`review.md`、Evidence、再現手順を含めます。別conditionの回答を自分の観測としてコピーせず、比較相手への安全な参照を記録します。

[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ2条件のRuntime URL / PR / run、20回答の完全性、選択理由の変化、追加しなかった機構、failure、unknown、限界をまとめます。[Submission Guide](../../docs/submission-guide.md) に従い、private source、個人情報、local path、raw logsを転載しません。

## Judging

- 10 caseすべてを2 conditionで扱い、20個のdistinct answerを残したか。
- trigger、scope、resources、permissions、maintenanceを理由に使ったか。
- 各caseで複数案と、採用しない理由を説明したか。
- none / manual / 追加不要を正当な選択肢として扱ったか。
- PromptのHost制限、実効tools、server trust等の境界を推測で埋めていないか。
- 機能名や導入数ではなく、状況との適合と保守費用を人が評価したか。
- case-10を最初から公開し、全入力公開の限界を残したか。
- per-caseの判断と、全10件の集約完全性を別々に確認したか。

平均値だけで重大な権限・対応誤りを消したり、9件だけで完了としたりしません。

## Bonus Mission

10 caseのうち一つを選び、利用条件を一項目だけ変えます。たとえば「一回限りを毎週へ」「Local AgentをAgent Hostへ」「外部接続可を不可へ」と変更し、選択と不採用理由を再検討します。

元case、元condition、元回答を変更せず、別の設計メモとして扱います。アクセス不能な秘密testや第三conditionとは呼びません。

## Support / Fallback

本編はテキストエディターだけでも実施できます。Copilot、VS Code、Plugin、MCP、追加資格は不要です。Runtimeを用意できない場合は設計を手元に保存し、提出経路だけを `blocked` と分けて報告します。

HC-023には今回のoptional routeはありません。実install、server起動、User・組織設定、Agent Host起動を追加しません。case中の許可記述は合成状況であり、現実の操作許可ではありません。

条件の入力や順序を揃えられなければ `incomparable`、Runtime準備で止まれば `blocked`、対象harnessの案を検討できない場合は `unsupported` とします。終了時は自分の回答・Evidenceだけを管理し、固定case、既存設定、他人の成果物を削除・reset・stashしません。
