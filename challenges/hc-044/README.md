# HC-044 CopilotのApproveとmerge可能を区別しよう

## Challenge Story

保守PRに「問題なさそう」というpositive assessmentがあり、正式なApprove eventも一件あります。
それでも、required approvalへ算入できるactorか、現在のhead向けか、必要票数へ届いたか、全changed filesが対象か、上位policyやCIが満たされたかは別に確認する必要があります。
一つの「承認済み」という言葉へまとめると、古いapprovalや重複eventで不足を埋めたり、approval条件だけでmerge可能と断定したりします。

このChallengeでは、合成のpolicy snapshotとreview eventを使い、どの証拠から何を言え、どこから先は保留・エスカレーションかを文書で設計します。
実Approve、review request、ruleset変更、mergeは行いません。このページとPackだけで完結し、別の教材や前のChallengeの回答は不要です。

## この機能とは

Copilot code reviewには、変更へのassessment、正式なreview event、Approveを許可する設定、required approvalへ算入する設定など、近い名前の状態があります。
このChallengeで設計する `approval-policy` は、それらを人が確認する順序と責任分担を定める参加者自身の運用文書です。
独自のmerge gateを実装するInstructionsではありません。

| 概念 | このChallengeでの意味 |
|---|---|
| assessment | 変更への評価。positiveでも正式な一票とは限らない |
| review event | Approve等として記録された個別event |
| count eligibility | そのeventをrequired approvalへ算入できるか |
| target head | eventがどのcommit / headを対象にしたか |
| eligible actor | 実効policy上、そのactorのeventを数えられるか |
| stale approval | 新head等により現在の判断へ使えない古いevent |
| duplicate event | 同じ証拠を二票として数えてはいけない重複 |
| all changed files | 全changed fileが必要scopeを満たすかというrollup |
| required count | 適格な一票ずつを数えた後の必要票数 |
| effective policy | enterprise、organization、repositoryの実効制約 |
| other merge gates | CI、conversation resolution等、approval以外のmerge条件 |

例えばpositive assessmentだけがあるA01では「好意的な評価」は言えても、一票あるとは言えません。
当該head向けの適格なApproveが一件あるA03でも、必要数が二件ならapproval要件は未充足です。
さらに必要票が揃っても、CI等が未観測なら「merge可能」とは断定できません。

個々のeventが適格かという**per-event eligibility**と、適格票の合計、全changed files、必要数を満たすかという**rollup**を別々に判断します。
公開仕様の要約では、repository設定で「CopilotがApproveできること」と「そのApproveをrequired approvalへ数えること」は別のtoggleです。
pathによる算入範囲を使う場合は、全changed fileが宣言済みpatternのいずれかへ一致する必要があり、一部fileの一致だけでは足りません。
enterprise / organization / repositoryの管理階層やpublic Preview条件も、合成snapshotの一項目だけから実効値を決めません。

## 向いていること / 向いていないこと

**向いていること**

- review証拠を、言える範囲ごとに分ける運用判断
- stale / duplicate / wrong-head eventを除いた票数確認
- repository設定だけでは不明な上位policyを保留すること
- 過度に止める負担と、誤って通す危険のtrade-off整理

**向いていないこと**

- positive assessmentを自動的にrequired approvalへ変えること
- 旧head、重複event、自己申告で必要票を埋めること
- 一部fileだけを見てall-files条件を満たしたとすること
- approval条件だけからmerge可能を断定すること
- 実Approve、設定・ruleset変更、review request、merge

文書が完成しても、実repositoryのapproval設定、actor資格、merge可能性、教育効果を確認済みとは言えません。

## Starter Kit

[Pack manifest](pack/manifest.json) の条件は `baseline` と `approval-policy` です。
sourceKindは `synthetic`、sourcePathsは `[]` です。実PRやJava sourceを評価する課題ではないため、便宜的なsource pathを割り当てません。
Packはschema v1に従います。固定schemaは9616 bytes、SHA-256 `183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e` ですが、schema一致はApprove算入やmerge可能性の証拠ではありません。

**SYNTHETIC_TRAINING_ONLY** — policy、review event、head、changed file、actor、CI状態は学習用の合成・改作資料です。
field名がGitHub APIの正式fieldや最新REST schemaと一致するとは主張しません。

Packは両条件へ同じ不活性な `.template` を、Runtime checkoutの次の範囲へ配置します。

| Runtime相対path | 内容 |
|---|---|
| `.hackathon\challenge\hc-044\starter\brief.md.template` | 背景、sourceKind、固定task、実操作禁止 |
| `.hackathon\challenge\hc-044\starter\request.txt.template` | 両条件へ渡す同一の十分な依頼 |
| `.hackathon\challenge\hc-044\starter\reference-notes.md.template` | 公開仕様の短い要約、Preview・管理階層の境界 |
| `.hackathon\challenge\hc-044\starter\readiness.json.template` | live review / mergeを `NOT EXECUTED`、未知をnullで保つ記録 |
| `.hackathon\challenge\hc-044\starter\policy-snapshot.json.template` | approval設定、必要数、scope、上位policy、他条件の中立fact |
| `.hackathon\challenge\hc-044\starter\review-events.json.template` | A01〜A07のassessment / event / head / actor資料 |
| `.hackathon\challenge\hc-044\starter\starter\approval-policy.md.template` | 確認順序と判断可能な主張の空ひな型 |
| `.hackathon\challenge\hc-044\starter\starter\decision-ledger.md.template` | task判断表の空ひな型 |
| `.hackathon\challenge\hc-044\starter\starter\escalation-plan.md.template` | 確認相手と不足情報の空ひな型 |
| `.hackathon\challenge\hc-044\starter\evidence\comparison.md.template` | 完成Evidenceの空ひな型 |

`sameHead` や `pathsEligible` の答えは配りません。比較対象のhead ID、changed file scope、actor資料を渡し、参加者が根拠を対応付けます。
件数、scope、新旧headはtask内の状態であり、Pack conditionではありません。

固定taskは次の七つです。

| Task | 状況 | 重点 |
|---|---|---|
| A01 | positive assessmentのみ、Approve eventなし | assessmentを一票として数えない |
| A02 | Approveを許可、eventあり、required approvalへの算入は無効 | Approveの存在と算入を分ける |
| A03 | 算入許可と当該headのeventがあるが、必要承認数は未充足 | 一票の適格性と合計の充足を分ける |
| A04 | 対象内と対象外のchanged fileが混在 | 一つでも対象外ならall-files条件を満たさない。空list / 欠落も分ける |
| A05 | 旧headのApprove、新head、重複event | staleとduplicateを件数で埋めず、新reviewの未観測を残す |
| A06 | organization / enterpriseの実効policyの一部が不明 | repository設定だけで有効と断定しない |
| A07 | approval条件の証拠は揃うが、CI等の情報が欠落 | approval条件とmerge可能を分ける |

Runtimeの中立baselineは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` の515ファイルに由来しますが、このChallengeの合成PR資料はそのJava sourceの評価ではありません。
source aggregate SHA-256は `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` です。
Runtimeの `.gitignore` と元 `.github\workflows\verify.yml` は二つの運用例外であり、approvalやmerge条件の証拠ではありません。

## Open Question

**どの証拠が揃えば何を判断でき、誰に何を確認してから先へ進みますか。過度に止める負担と誤って通す危険をどう扱いますか。**

観測不能を許可へ補完しない一方、根拠なく追加承認を常に要求するだけにもせず、保留・エスカレーション・再確認の費用を設計してください。

## Design Time

比較結果を見る前に、各conditionの方針を先に凍結します。

1. `baseline` では、自分が普段ならassessment、event、票数、merge可能性をどう確認するかを短く記録します。
2. `approval-policy` では、assessment、formal event、算入許可、head、actor、stale / duplicate、all-files、必要票数、実効policy、他merge条件の確認順を設計します。
3. per-event eligibilityの列と、票数・all-files・必要数のrollup列を分けます。
4. 何が不明なら誰へエスカレーションし、どの主張まで保留するかを決めます。
5. A01〜A07で同じ列を使い、policyやeventをconditionごとに都合よく変えません。
6. 途中で方針を改稿する場合は新runにし、以前の誤判断を削除しません。

参加者成果は各condition専用Runtimeの次のexact pathへ作ります。

- `participant\hc-044\approval-policy.md`
- `participant\hc-044\decision-ledger.md`
- `participant\hc-044\escalation-plan.md`

判断表の表現、確認順、責任分担は自由ですが、positive assessmentを票にする、旧headやduplicateで不足を埋める、approvalからmerge可能を直接導く設計にはできません。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。`--run` とRuntimeの `--run-id` はconditionごとに同じIDを使います。
dry-runはreview、Approve、ruleset、mergeを変更しません。

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-044 --condition baseline --team team-sora --run hc044-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-044 --condition approval-policy --team team-sora --run hc044-policy-01
node .\scripts\build-pack.mjs --challenge HC-044 --output .runtime/packs
```

既存出力を削除して再利用せず、version / hashを確認するか未使用のHub checkoutを使います。

### 2. 条件ごとに独立したRuntimeを準備する

[Getting Started](../../docs/getting-started.md) と
[Runtime repository guide](../../docs/runtime-repository-guide.md) に従い、二条件を別の新しい非公開Runtime repository、名前付きbranch、workspaceで実施します。
次はbaselineの例です。Customized側は `$Condition` と `$RunId` を `approval-policy` / `hc044-policy-01` に替えます。

```powershell
$Pack = 'C:\work\hackathon-hub\.runtime\packs\hc-044-v1'
$Condition = 'baseline'
$RunId = 'hc044-baseline-01'

git status --short --branch
git switch -c "hc-044-$Condition"
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

既存変更、既存run、branch名、templateが衝突したら停止します。`.hackathon\run.json` の手編集、`branchSafe` 偽装、別branchへの移動で回避しません。

### 3. 不活性ひな型から参加者文書を作る

次は各 **Runtime checkout** のrootで、人が一度だけ実行します。既存成果を上書きしません。

```powershell
$Starter = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.hackathon\challenge\hc-044\starter')
$Participant = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('participant\hc-044')
$Evidence = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.hackathon\evidence\hc-044')

[System.IO.Directory]::CreateDirectory($Participant) | Out-Null
[System.IO.Directory]::CreateDirectory($Evidence) | Out-Null
[System.IO.File]::Copy((Join-Path $Starter 'starter\approval-policy.md.template'), (Join-Path $Participant 'approval-policy.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'starter\decision-ledger.md.template'), (Join-Path $Participant 'decision-ledger.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'starter\escalation-plan.md.template'), (Join-Path $Participant 'escalation-plan.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'evidence\comparison.md.template'), (Join-Path $Evidence 'comparison.md'), $false)
```

編集できるのは三つのparticipant成果と完成Evidenceだけです。
全条件で `allowedMutations: []` です。Java、Pack、starter、review、ruleset、repository / organization設定、PR、CIを変更しません。

### 4. A01〜A07を文書上で評価する

両条件で同じ `request.txt.template`、`policy-snapshot.json.template`、`review-events.json.template` を使い、A01〜A07を同じ順序・回数で評価します。
本編は人が合成資料を読み、三つの文書へ判断を書くことで完了します。

Copilotを草稿支援に使う場合も任意です。実際に渡した固定本文と環境を記録し、positive assessmentや合成eventを実Approveとして扱いません。
実review request、Approve、設定 / ruleset変更、mergeは行いません。

## Compare

| 条件 | 先に凍結するもの | 同じtaskへ行うこと |
|---|---|---|
| Baseline: `baseline` | 自分の通常の承認確認とエスカレーション | A01〜A07で言える主張、票、未知、次の確認を記録 |
| Customized: `approval-policy` | per-event eligibility、rollup、実効policy、他merge条件を分ける設計方針 | 同じA01〜A07を同じ列で記録 |

比較するのは、assessmentを票へ誤変換したか、stale / duplicate / wrong-headを数えたか、all-filesをsome判定したか、上位policyの未知を消したか、approvalからmerge可能を断定したか、過度な停止負担を増やしたかです。
同じpolicy、event、head、changed files、必要票数を両条件へ渡します。

差がなければ `equal`、誤判断や不要な確認負担が増えれば `worse`、入力・policyが揃わなければ `incomparable`、必要な確認主体へ到達できなければ `blocked`、対象設定やPreviewが利用できなければ `unsupported` が正当なoutcomeです。
追加不要、未観測、approval条件だけは満たし得るがmerge可能は不明、という結果も保存します。BaselineよりCustomizedが必ず良いとは仮定しません。

## Evidence

完成Evidenceは各runの `.hackathon\evidence\hc-044\comparison.md` です。最低限、次の見出しを内容付きで残します。

- `Fixed task`
- `Environment`
- `Baseline`
- `Designed policy`
- `Comparison`
- `Outcome`
- `Evidence boundaries`

A01〜A07ごとに、assessment、event ID、actor、target head、stale / duplicate判断、per-event eligibility、適格票数、all-files、必要票数、実効policy、他merge条件、言える主張、未知、エスカレーション先を対応付けます。

構造検査は、exact path、見出し、固定入力、許可範囲、提出集合を確認します。
製品観測は、実Approve、算入、dismissal、ruleset、CI、merge可能性を実repositoryで確認することですが、本編では未実施です。
教育効果は、設計によって参加者の判断が改善したかであり、一回の合成資料演習では未観測です。

exporterの `runtimeBehavior` と `educationalEffect` は `not-observed` のままです。
positive assessment、packetのtrue、静的validator passを、実required approvalやmerge可能の証拠にしません。

## Submit

各Runtimeで次を実行し、自分のconditionの四ファイルだけをexportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

各conditionのeligible集合は次のexact 4 filesです。

- `participant\hc-044\approval-policy.md`
- `participant\hc-044\decision-ledger.md`
- `participant\hc-044\escalation-plan.md`
- `.hackathon\evidence\hc-044\comparison.md`

starter、元資料、optional guide、raw log、build outputは提出しません。
Runtime PRへ三つの参加者文書とそのconditionのEvidenceを含め、
[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ二条件のRuntime URL / PR URL、run対応、判断方針、保留・エスカレーション、比較、outcome、未知をまとめます。
[Submission Guide](../../docs/submission-guide.md) に従い、非公開PR内容、個人情報、未加工logをIssueへ貼りません。

## Judging

- assessment、formal review event、required approvalへの算入、merge可能を分離したか
- target head、eligible actor、stale approval、duplicate eventをeventごとに確認したか
- per-event eligibilityと票数 / all-files / 必要数のrollupを別に扱ったか
- 一つでも対象外fileがあればall-files条件を満たさないこと、空list / 欠落を別扱いしたか
- enterprise / organization / repositoryの実効policyが不明なら保留したか
- approval条件が揃ってもCI等が未観測ならmerge可能と断定しなかったか
- BaselineとCustomizedへ同じ入力を渡し、`equal`、`worse`、追加不要、保留を隠さなかったか

Approve数の多さ、停止時間の長さ、特定の結論は採点しません。

## Bonus Mission

A03とA04を組み合わせた紙上例を作り、「個々のeventは適格だが必要数不足」と「票数は足りるがall-files条件不足」を別々に説明してください。
実PR、実review、実設定は作らず、rollupの順序と誤判定時の影響だけを追記します。

## Support / Fallback

本編はVS Code Stableで読める合成資料と文書制作だけで完了できます。Copilot、Cloud、organization / account設定、public Preview、実Approve権限は必須ではありません。
実効policyが不明ならrepository設定だけから補完せず、unknown / `blocked` としてエスカレーション先を書きます。

将来の任意ガイドは [approvals](optional/approvals.md) です。
これは `OPTIONAL_GUIDE_ONLY` で、本編成果、実Approve、設定変更、review request、mergeの許可ではありません。
public Preview、enterprise / organization / repositoryの実効policy、対象head、全changed files、通常review権限、再試行上限が別途確認・承認されない限り、実機へ進みません。

positive assessmentを票にする、旧headやduplicateで不足を埋める、rulesetを変更して成功形へ合わせる、mergeすることはfallbackではありません。
詳細は [Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
