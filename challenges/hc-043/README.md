# HC-043 イベント駆動Agentを最小権限で動かそう

## Challenge Story

Java保守PRの影響範囲を自動で整理したいという相談が来ました。
しかし、PRを開いたactor、automationを作ったcreator、実行費用を負担する主体、結果を読める人、停止を依頼する人は同じとは限りません。
「PRを読む」だけの仕事へlabel更新やpushまで許可すると、必要以上の権限と継続発火の負担を持ち込みます。

このChallengeでは、合成のPR概要とevent列を使い、どのeventを受理し、どの読取操作だけを許し、どこへ出力し、誰が止めるかを文書で設計します。
実automationの登録や発火は行いません。このページとPackだけで開始でき、別の教材や前のChallengeの成果は不要です。

## この機能とは

Cloud Agents Automationsは、scheduleやrepository eventをきっかけにCloud Agentのsessionを起動する機能です。
このChallengeで作る `automation-policy` は、その製品へ登録するJSON / YAMLではなく、利用前に人が確認する最小権限の運用設計です。

次の役割と状態を分けます。

| 項目 | このChallengeで確認すること |
|---|---|
| actor | eventを起こした主体。write accessの有無を資料から判断する |
| creator | automationを作成し、費用や管理責任と結び付く主体 |
| trigger | opened、synchronize、schedule等のうち、何を受理する案か |
| read tools | PR、diff、固定概要を読む教材上の操作分類 |
| write tools | label、review投稿、repo更新、push等の副作用を持つ操作分類 |
| repository visibility | private / internal、public、unknownを区別する |
| private configuration | creatorだけに見える設定草稿・保存範囲 |
| session visibility | 起動後のsessionを誰が見られるか。設定の私有性をそのまま移さない |
| stop / resume | 誰が停止を依頼し、停止確認後に誰が再開判断するか |
| cost owner | Actions minutesとAI creditsを誰の利用として扱うか |

小さな例では、write actorがprivate repositoryでPRを開き、固定taskがdiffの要約だけなら、読取分類だけを候補にできます。
同じeventが二度届いた、新しいheadへ進んだ、non-write actorが起動した、creatorが不在になった場合は、同じ実行として扱わず停止・重複・再評価の方針が必要です。

Cloud Agents Automations、標準code reviewのruleset、Copilot Appのscheduled workflowは、名前や画面が近くても同じ保存場所、API、trigger、権限契約とは限りません。
一方で、Copilot AppからCloud automationを管理できる場合もあるため、「Appに見えるものはすべて別製品」とも断定しません。
対象製品、保存先、scope、起動されるsessionを資料に基づいて識別します。
公開仕様の要約では、Cloud Agents Automationsはprivate / internal repositoryを対象とし、作成にはwrite accessとcloud / automation policyが関係します。
non-write actorのeventは既定で無視され、設定はcreatorに私有かつGit外でも、起動後のsessionはrepositoryを閲覧できる人に見える場合があります。
Actions minutesとAI creditsはcreator側の利用として扱われます。これらはreference-notesの確認事項であり、このChallengeで実accountへ照合した観測ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 繰り返し発生し、入力・出力・停止条件を限定できる読取中心のtask
- actor、creator、費用主体、閲覧範囲を分けた運用設計
- duplicate event、新head、停止依頼を安全に扱う設計
- 自動化しない範囲や全手動を選ぶ判断

**向いていないこと**

- 一度きりで、人が直接読む方が安全・安価なtask
- label更新、review投稿、push等が本当は不要な読取task
- 費用主体、停止担当、実効policyが不明なままの継続実行
- 教材上のtool分類をGitHubの実tool IDやAPI schemaとして利用すること
- 実automationの稼働、停止、費用削減、教育効果をこの文書だけで証明すること

## Starter Kit

[Pack manifest](pack/manifest.json) の条件は `baseline` と `automation-policy` です。
sourceKindは `synthetic`、sourcePathsは `[]` です。
Java保守PRという題材ですが、実Java sourceの挙動分析ではなく、合成の変更概要と論理的な領域IDを使うため、OrderService等のinventory pathを便宜的に割り当てません。
Packはschema v1に従います。固定schemaは9616 bytes、SHA-256 `183c55bc0b395d8287430c5a363a39b4229dfd33479ffee00c6b79d611d1391e` ですが、schema一致はautomationの稼働や停止を証明しません。

**SYNTHETIC_TRAINING_ONLY** — creator、actor、event、repository visibility、tool効果、費用、session visibilityの記録は学習用の合成・改作資料です。
実repository、実account、実billing、実automation sessionの観測結果ではありません。

Packは両条件へ同じ不活性な `.template` を、Runtime checkoutの次の範囲へ配置します。

| Runtime相対path | 内容 |
|---|---|
| `.hackathon\challenge\hc-043\starter\brief.md.template` | 背景、sourceKind、固定task、実操作禁止 |
| `.hackathon\challenge\hc-043\starter\request.txt.template` | 両条件へ渡す同一の十分な依頼 |
| `.hackathon\challenge\hc-043\starter\reference-notes.md.template` | 公開仕様の短い要約と教材schemaの境界 |
| `.hackathon\challenge\hc-043\starter\readiness.json.template` | live / automation実行を `NOT EXECUTED`、未知をnullで保つ記録 |
| `.hackathon\challenge\hc-043\starter\automation-packet.json.template` | creator、actor、visibility、tools、費用、session範囲の中立fact |
| `.hackathon\challenge\hc-043\starter\event-sequence.json.template` | E01〜E05のevent ID、順序、head資料 |
| `.hackathon\challenge\hc-043\starter\starter\automation-design.md.template` | automation設計の空ひな型 |
| `.hackathon\challenge\hc-043\starter\starter\event-ledger.md.template` | event判断表の空ひな型 |
| `.hackathon\challenge\hc-043\starter\starter\stop-plan.md.template` | 停止・再開計画の空ひな型 |
| `.hackathon\challenge\hc-043\starter\evidence\comparison.md.template` | 完成Evidenceの空ひな型 |

教材中の「PRを読む」「diffを読む」「結果を保存する」「labelを更新する」等は、効果を考えるための操作分類です。
GitHubの実tool ID、正式API field、tool schemaを配布したとは説明しません。
dedup、回数制限、停止を製品の既存設定fieldとして発明せず、参加者の運用要求と製品保証を別欄にします。

固定taskは次の五つです。

| Task | 状況 | 制作する運用判断 |
|---|---|---|
| E01 | private / internalでwrite actorによるPR opened、読取task | trigger / filter、必要最小tools、出力に含める情報 |
| E02 | 同じ依頼をnon-write actorが発火した資料 | 既定の無視と未観測を区別し、受理拡大を自動提案しない |
| E03 | public repositoryまたはcloud / automation policy不明 | `unsupported` / 未確認を保持し、本編資料演習と実機資格を分ける |
| E04 | 同eventの重複、PR synchronizeでheadが変化 | 同一head識別、再評価要否、出力の古さ、重複処理 |
| E05 | creator不在、停止依頼、継続発火リスク | 停止できる人・依頼先、停止確認、観測不足で止める条件 |

Runtimeの中立baselineは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` の515ファイルに由来しますが、このChallengeの固定PR概要はそのJava sourceの実分析ではありません。
source aggregate SHA-256は `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` です。
Runtimeの `.gitignore` と元 `.github\workflows\verify.yml` は二つの運用例外であり、automationのwrite権限や稼働証拠ではありません。

## Open Question

**Java PRの影響を読み取りだけで整理するなら、どのevent・actor・tools・出力範囲を選び、重複や新head、停止要求へどう対応しますか。自動化しない方がよい範囲はどこですか。**

すべて自動化する案、すべて手動にする案のどちらも自動的な正解ではありません。
発生頻度、誤起動の負担、必要なwrite効果、費用、停止責任を根拠に、自分の境界を決めてください。

## Design Time

比較結果を見る前に、各conditionの方針を凍結します。

1. `baseline` では、自分が普段ならどのeventを受け、どの操作を許し、どこへ出力するかを短く記録します。
2. `automation-policy` では、対象製品、creator、eligible actor、trigger、head、read / write分類、repository / session visibility、費用主体、停止・再開を明記します。
3. 読取taskに不要なwrite分類を列挙し、なぜallowlistへ入れないかを書きます。
4. duplicate eventと新headを識別する運用上のkey、古い出力を利用しない条件、再評価上限を決めます。
5. creator不在や停止依頼で、誰へ戻し、何が観測できるまで再開しないかを決めます。
6. E01〜E05の結論、根拠、未知、次の確認、停止を記録する列を先に固定します。

参加者成果は各condition専用Runtimeの次のexact pathへ作ります。

- `participant\hc-043\automation-design.md`
- `participant\hc-043\event-ledger.md`
- `participant\hc-043\stop-plan.md`

`automation-design.md` は未登録のprompt案、trigger / model選定基準、教材上のtool allowlist案、不要toolを説明するinactive Markdownです。
実automation用のJSON / YAMLや実tool ID一覧にはしません。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。`--run` とRuntimeの `--run-id` はconditionごとに同じIDを使います。
dry-runはautomationを登録・schedule・発火しません。

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-043 --condition baseline --team team-sora --run hc043-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-043 --condition automation-policy --team team-sora --run hc043-policy-01
node .\scripts\build-pack.mjs --challenge HC-043 --output .runtime/packs
```

既存のbuild出力を削除して作り直さず、version / hashを確認するか未使用のHub checkoutを使います。

### 2. 条件ごとに独立したRuntimeを準備する

[Getting Started](../../docs/getting-started.md) と
[Runtime repository guide](../../docs/runtime-repository-guide.md) に従い、二条件を別の新しい非公開Runtime repository、名前付きbranch、workspaceで実施します。
次はbaselineの例です。Customized側は `$Condition` と `$RunId` を `automation-policy` / `hc043-policy-01` に替えます。

```powershell
$Pack = 'C:\work\hackathon-hub\.runtime\packs\hc-043-v1'
$Condition = 'baseline'
$RunId = 'hc043-baseline-01'

git status --short --branch
git switch -c "hc-043-$Condition"
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

既存変更、run、branch名、templateが衝突したら停止します。`.hackathon\run.json` を手編集せず、別branchへ移動して同じrunを継続しません。

### 3. 不活性ひな型から参加者文書を作る

次は各 **Runtime checkout** のrootで、人が一度だけ実行します。既存成果を上書きしません。

```powershell
$Starter = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.hackathon\challenge\hc-043\starter')
$Participant = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('participant\hc-043')
$Evidence = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath('.hackathon\evidence\hc-043')

[System.IO.Directory]::CreateDirectory($Participant) | Out-Null
[System.IO.Directory]::CreateDirectory($Evidence) | Out-Null
[System.IO.File]::Copy((Join-Path $Starter 'starter\automation-design.md.template'), (Join-Path $Participant 'automation-design.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'starter\event-ledger.md.template'), (Join-Path $Participant 'event-ledger.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'starter\stop-plan.md.template'), (Join-Path $Participant 'stop-plan.md'), $false)
[System.IO.File]::Copy((Join-Path $Starter 'evidence\comparison.md.template'), (Join-Path $Evidence 'comparison.md'), $false)
```

編集できるのは三つのparticipant成果と完成Evidenceだけです。
全条件で `allowedMutations: []` です。Java、Pack、starter、`.github`、label、repository設定、review、workflow、automation設定を変更しません。

### 4. E01〜E05を文書上で評価する

両条件で同じ `request.txt.template`、`automation-packet.json.template`、`event-sequence.json.template` を使い、E01〜E05を同じ順序・回数で評価します。
本編は人の読解と文書制作だけで完了します。

Copilotを草稿支援に使う場合も任意です。実際に渡した固定本文と環境を記録し、automation sessionが起動したとは書きません。
実登録、schedule、event発火、label更新、repository更新、review投稿、push、稼働・停止観測は行いません。

## Compare

| 条件 | 先に凍結するもの | 同じtaskへ行うこと |
|---|---|---|
| Baseline: `baseline` | 自分の通常のtrigger、tools、出力、停止の考え方 | E01〜E05の受理・無視・保留・停止を記録 |
| Customized: `automation-policy` | actor / creator、最小tools、visibility、cost、head、停止・再開を含む設計方針 | 同じE01〜E05を同じ列で記録 |

比較するのは、不要なwrite効果、actor / creatorの混同、private設定とsession visibilityの混同、headの古さ、重複処理、停止責任、人的負担です。
自動化率、起動回数、常時稼働は得点にしません。全手動を維持する合理的な案も比較対象です。

両条件へ同じ十分な固定入力を渡し、片側だけ成功するまで再試行しません。
差がなければ `equal`、権限や負担が増えれば `worse`、条件差で比較できなければ `incomparable`、責任者やpolicy不足で止まれば `blocked`、実機対象外なら `unsupported` を選べます。
追加不要、未観測、実行しない方がよいという結論も正当です。BaselineよりCustomizedが必ず優れるとはしません。

## Evidence

完成Evidenceは各runの `.hackathon\evidence\hc-043\comparison.md` です。最低限、次の見出しを内容付きで残します。

- `Fixed task`
- `Environment`
- `Baseline`
- `Designed policy`
- `Comparison`
- `Outcome`
- `Evidence boundaries`

E01〜E05ごとに、event ID、head、actor資料、creator資料、repository visibility、受理判断、許可するread分類、除外するwrite分類、出力、費用主体、未知、停止先を対応付けます。
duplicate eventを処理したという合成記録と、実automationが重複排除した観測を混ぜません。

構造検査、製品観測、教育効果を分けます。

- exact path、見出し、固定入力、許可範囲、提出集合の検査は**構造検査**です。
- automation作成、trigger、session起動、tool利用、停止、費用は**製品観測**ですが、本編では未実施です。
- 判断品質や参加者の理解向上は**教育効果**であり、一回の文書比較から証明しません。

exporterの `runtimeBehavior` と `educationalEffect` は `not-observed` のままです。
設定草稿の完成を稼働・停止の実証にせず、Actions minutesやAI creditsを実測したと捏造しません。

## Submit

各Runtimeで次を実行し、自分のconditionの四ファイルだけをexportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

各conditionのeligible集合は次のexact 4 filesです。

- `participant\hc-043\automation-design.md`
- `participant\hc-043\event-ledger.md`
- `participant\hc-043\stop-plan.md`
- `.hackathon\evidence\hc-043\comparison.md`

starter、元資料、optional guide、raw log、build outputは提出しません。
Runtime PRへ三つの参加者文書とそのconditionのEvidenceを含め、
[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ二条件のRuntime URL / PR URL、run対応、最小権限設計、停止計画、比較、outcome、未知をまとめます。
[Submission Guide](../../docs/submission-guide.md) に従い、非公開設定、秘密、個人情報、未加工logをIssueへ貼りません。

## Judging

- actor、creator、trigger、費用主体、閲覧者、停止担当を分けたか
- 読取taskへ不要なwrite分類を許さず、必要な出力範囲を説明したか
- private configurationとsession visibilityを同じ私有性として扱わなかったか
- duplicate event、新head、non-write actor、public / unknown policy、creator不在を区別したか
- 教材上のtool分類を実tool ID / API schemaや製品保証として捏造しなかったか
- Cloud Agents Automations、標準code review ruleset、Copilot App scheduled workflowの責任境界を保ったか
- BaselineとCustomizedへ同じtaskを渡し、`equal`、`worse`、全手動、停止を隠さなかったか

自動化率、実行回数、長いallowlist、特定modelの選択は採点しません。

## Bonus Mission

E04のduplicate eventと新headについて、同じheadの再通知を再利用する案と、常に再評価する案を紙上で比較してください。
誤った古さ、計算費用、人的確認、停止上限がどう変わるかを追記します。
実event、schedule、automation登録は追加しません。

## Support / Fallback

本編はVS Code Stableで読める合成資料と文書制作だけで完了できます。Copilot、Cloud、organization / account設定、Preview、実automation権限は必須ではありません。
資料だけで判断できないpolicyはunknownまたは `blocked` とし、受理範囲を広げて埋めません。

将来の任意ガイドは [event-trigger](optional/event-trigger.md) です。
これは `OPTIONAL_GUIDE_ONLY` で、本編の成果、Runtime成功、実automationの許可ではありません。
private / internal条件、creator権限、cloud / automation policy、費用・停止責任、対象eventが別途確認・承認されない限り、実登録や発火へ進みません。

実schedule、event作成、label / repo更新、review投稿、push、停止操作をfallbackとして行いません。
Cloud Agents Automations、標準review ruleset、Copilot App workflowを一つの契約へまとめて回避もしません。
詳細は [Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
