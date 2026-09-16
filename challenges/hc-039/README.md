# HC-039 組織で共有する規約のownerを決めよう

## Challenge Story

架空の「つばさ保守組織」では、「調査結果は根拠と未確認を分ける」という規約を複数teamで共有したいと考えています。rootの `AGENTS.md`、organization Instructions、共有profileのどこにも似た文章は書けますが、保存場所、利用surface、使える人、更新責任は同じではありません。

全員がprofileを利用できることと、そのprofileを保存したrepositoryを全員が閲覧・編集できることも別です。ownerが資料にないまま「たぶん管理者」と補うと、現状の事実と将来の提案が混ざります。

このChallengeでは、同じ12行の合成台帳を `baseline` で診断し、`governed-design` で自分の所有・更新方針を適用します。実organization設定、repository作成、ruleset、共有profile操作は行いません。このページとStarter Kitだけで完結し、前のChallengeやLabsの回答は不要です。

## この機能とは

このページでは、似て見える三つの仕組みを分けます。

- root `AGENTS.md` は、そのrepositoryで共有する作業上の指示文書です。アクセス制御や組織全体の強制policyではありません。
- organization Instructionsは、organization設定に保存する自然言語の指示です。対象product、owner権限、repository側のInstructionsとの関係を確認します。
- 共有profileは、専門役の定義です。organizationまたはenterpriseのgovernance repositoryに保存し、role、版、利用範囲、保守担当を管理します。

小さな例として、「根拠と未確認を分ける」という一文を共有するとします。root規約なら特定repoの全体方針、organization Instructionsならorganization設定から関連surfaceへ提供される自然言語指示、profileなら「調査役」など特定役の本文にできます。三か所へ重複して書くことが自動的な改善ではありません。

優先・選択規則も一つの機構ではありません。

- GitHub website向けのInstructionsでは、該当するrepository Instructionsがorganization Instructionsより上位です。関連する指示が提供されても、常に文章どおりの応答になる保証ではありません。
- 同名profileのdeduplicationは、ファイル名から `.md` / `.agent.md` を除いた名前に基づき、repo、organization、enterpriseの順で選ばれます。これはInstructions本文の優先順位と同じ処理ではありません。

organization profileはorganizationの `.github` または `.github-private` repositoryの `agents/`、enterprise profileは指定されたgovernance repositoryを使います。保存repositoryのACL、organization memberとしての利用scope、profileの採用revisionは別々に記録します。共有profileの案内はPublic Previewです。

製品説明の根拠は [Organization instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-organization-instructions)、[Response customization](https://docs.github.com/en/copilot/concepts/prompting/response-customization?tool=webui)、[Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)、[Organization shared agents](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/prepare-for-custom-agents)、[Enterprise shared agents](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/prepare-for-custom-agents) です。文書確認日は2026-09-15です。資料の説明は、実org設定や実profile利用の観測ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 同じ規約について、保存先、利用者、owner、author、reviewer、更新責任を明示すること。
- 現在確認できる値と、参加者が提案する値を分けること。
- repository Instructionsの優先とprofileの同名dedupを別々に説明すること。
- 共有しない、重複を減らす、追加承認まで保留する選択を比較すること。

**向いていないこと**

- 保存pathだけで、採用版、利用資格、閲覧ACL、編集権限を証明すること。
- owner不明を、実在する人名や「管理者」の推測で埋めること。
- authorとreviewerが書かれているだけで、独立review済みとすること。
- root `AGENTS.md` やorganization Instructionsをruleset、強制ACL、実行許可と呼ぶこと。
- Public Previewの共有profileを、すべてのclient・enterprise機能でGAとすること。

## Starter Kit

SYNTHETIC_TRAINING_ONLY — organization、repository、owner候補、profile、revision、ACL、台帳の出来事は、このChallengeのための架空資料です。実組織、実owner、実権限を表しません。

source種別は `synthetic`、`sourcePaths` は `[]` です。元の515-file baselineとprovenance検査は残りますが、Javaの正しさを採点しません。実人名や実organizationの情報を追加しないでください。

[Pack manifest](pack/manifest.json) は、両conditionへ次の同一bytesを渡します。

| 素材 | 役割 |
|---|---|
| `brief.md.template` | 三つの仕組みと本編の非実行境界 |
| `request.txt.template` | 両conditionに共通の依頼全文 |
| `design.md.template` | ownership、scope、revision、更新・廃止を設計する |
| `comparison.md.template` | conditionごとのEvidenceひな型 |
| `input/ownership.json.template` | 4 task × 3 recordの同じ12行 |
| `input/current-policy.md.template` | 現行共有方針の合成snapshot |
| `input/shared-rules.md.template` | 共通規約の不活性な参考原稿 |
| `input/profile.agent.md.template` | 専門役の不活性な参考原稿 |
| `input/mechanism-map.md.template` | 保存先、利用surface、優先・dedupの区別 |

4つのtaskを独立に扱います。

| task | 点検する仕組み |
|---|---|
| `root-rules` | repository rootの共通規約 |
| `org-instructions` | organization設定の自然言語Instructions |
| `org-profile` | organization共有profile |
| `enterprise-profile` | enterprise governance repositoryのprofile |

各taskに同じ三種類の資料状態があります。

| record | 固定する資料状態 |
|---|---|
| `record-01` | 原状の台帳と本文 |
| `record-02` | owner / author / reviewer等の責任情報が一部不足 |
| `record-03` | 選択ref、記録revision、content hashの参照が食い違う |

両conditionはこの12行をすべて扱います。record名やtask名は期待分類ではありません。参加者は、確認済み現在値、unknown、提案値、承認待ちを自分で分けます。

台帳には、mechanism、保存repo/path、利用surface、利用可能な人、保存repo閲覧ACL、owner、author、reviewer、branch/ref/revision、content hash、更新責任、現在値の出典、提案値と承認状態を含めます。これらは参加者Markdownの項目であり、製品APIやPack schemaのfieldではありません。

必要なのはGit、Node.js 22以降、テキスト編集環境、Hubと非公開Runtimeを扱う通常の参加権限です。organization owner、enterprise admin、repository作成権限、Preview有効化は本編に不要です。

## Open Question

**同じ規約を配るとき、誰が更新を提案し、誰が内容を確認し、誰が保守し、どの版を誰が使うのがよいでしょうか。**

- repositoryだけに置く規約と、organizationへ共有する規約をどう分けますか。
- 保存repositoryを読めない利用者がprofileを使える場合、どの情報を別途伝える必要がありますか。
- ownerが不明な現状を、誰への確認待ちとして残しますか。
- 同じ名前のprofileが複数scopeにあるとき、採用版と更新責任をどう記録しますか。
- 規約を重複させない、または共有を見送る判断を、どのtradeoffで説明しますか。

役割の数、文書の数、共有範囲の広さを増やすことが唯一解ではありません。

## Design Time

1. 12行を読む前に、現状事実と提案を分ける列、unknownを維持する条件、承認が必要な変更を決めます。
2. `baseline` では、同梱された現行方針と所有台帳を十分な資料として診断します。不足を想像で補わず、現在のowner / reviewer / ref / hashを支持する出典を書きます。
3. `governed-design` では、同じ12行に参加者独自のowner、author、reviewer、更新、廃止、復元、承認方針を適用します。現在値と提案値を同じ欄に上書きしません。
4. Instructionsについて、repositoryとorganizationの関係、対応surface、関連指示が常に守られる保証ではないことを記録します。
5. profileについて、保存ACL、利用scope、同名dedup、selected branch/ref/revision、PR内で保持される版を記録します。Instructionsの優先説明を流用しません。
6. 共通規約草稿と専門役草稿は、自分の言葉で必要な最小範囲だけを書きます。MCP、Hook、追加tools、権限、実人名を入れません。
7. 比較前に12行、全文、判定観点、設計revisionを凍結します。改版したら新しいrunにし、Baselineの結果をCustomizedの入力へ使いません。

現状手順で十分、organization共有を見送る、profileを追加しないという方針も、理由があれば有効です。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。dry-runはorganization設定やrepositoryを変更しません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-039 --condition baseline --team team-sora --run governance-baseline-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-039 --condition governed-design --team team-sora --run governance-design-01
node .\scripts\build-pack.mjs --challenge HC-039 --output .runtime/packs
```

既存出力を削除・上書きせず、生成されたPack directory、版、hashを記録します。manifest単体ではなくdirectoryをRuntimeへ渡します。

### 2. conditionごとにfresh Runtimeを用意する

[Getting Started](../../docs/getting-started.md) に従い、二つの新しい非公開Runtime repositoryを用意します。各conditionで別repository、名前付きbranch、新規workspace、新しい会話を使います。repository分離だけでUser/org Instructions、Memory、home設定が消えたとは考えず、確認できない影響を残します。

各 **Runtime checkout** のrootで、そのrepositoryのconditionを一つだけ適用します。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-039-v1'
$Condition = 'baseline'
$RunId = 'governance-baseline-01'
git status --short --branch
git switch -c "hc-039-$Condition-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
```

もう一方は `$Condition = 'governed-design'`、`$RunId = 'governance-design-01'` とします。どちらも `$RunId` をHub dry-runの `--run` と一致させ、EvidenceとHub Issueのrun IDにも同じbindingを記録します。applyしたbranchを維持し、`.hackathon/run.json` を変更しません。

### 3. 許可された不活性原稿だけを作る

| exact path | baseline | governed-design |
|---|---|---|
| `participant/hc-039/governance-plan.md.template` | 現状12行の診断、unknown、確認先 | 独自の所有・更新・廃止・復元方針を適用した12行 |
| `participant/hc-039/shared-rules.md.template` | 作らない | 共通規約の不活性な草稿、または追加しない理由 |
| `participant/hc-039/profile.agent.md.template` | 作らない | 1つの専門役の不活性な草稿、または追加しない理由 |
| `.hackathon/evidence/hc-039/comparison.md` | 当該conditionのEvidence | 当該conditionのEvidence |

`.template` を外さず、root `AGENTS.md`、organization settings、`.github` / `.github-private` のgovernance repository、ruleset、active profileへコピーしません。実repository作成やorg writeを行いません。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

この検査は保存pathとrun-stateを確認するだけです。ownerの正しさ、ACL、利用資格、profile発見、Public Preview利用を実証しません。

## Compare

| condition | このページでの呼び名 | 比較すること |
|---|---|---|
| `baseline` | Baseline | 同梱された現行共有方針と所有台帳を、事実を補完せず12行すべて診断する |
| `governed-design` | Customized | 同じ12行へ自分の責任分担、更新、承認、廃止、復元方針を適用する |

固定するのは4 task、record-01〜03、台帳全文、規約・profileの参考全文、公式説明、判定観点、設計revisionです。変更するのは参加者が提案するgovernance方針だけです。

比較では、現在値と提案値、保存repo ACLと利用scope、Instructionsの優先とprofileの同名dedupを別々に見ます。役割や文書を増やしたことを改善とせず、unknownを残せたか、変更・復元の責任が明確かを読み比べます。

結果は `improved`、`same`（Issueでは `equal`）、`worse`、`no-addition-needed`、`not-observed`、`unsupported`、`blocked`、`incomparable` のいずれでも構いません。提案が重複更新を増やせば `worse`、現状で十分なら `no-addition-needed`、owner確認ができなければ `not-observed` / `blocked` が正当です。

## Evidence

各Runtimeの `.hackathon/evidence/hc-039/comparison.md` に、次のexact headingを残します。

- `Fixed task`
- `Environment`
- `Condition and input`
- `Design`
- `Comparison`
- `Outcome`
- `Limitations`
- `Ownership and scope`
- `Precedence and revision`
- `Change responsibility`

12行すべてについて、mechanism、保存repo/path、利用surface、利用scope、ACL、確認済みowner / author / reviewer、unknown、selected ref/revision/hash、提案値、承認待ち、更新・廃止・復元担当を記録します。架空資料であることもEnvironmentに残します。

原稿の保存、製品による発見、実際の利用、organization変更、profile選択を分けます。本編で確認できるのは不活性原稿と台帳の保存だけです。org write、repository作成、ruleset、profile発見、実投入、利用資格は `not-observed` です。

owner不明を埋めず、提案ownerを確認済みownerへ転記しません。保存repoがprivateという記述だけで利用scopeやACLを決めず、selected pathだけで採用revisionを決めません。未実施・取得失敗は0、pass、N/Aに変換しないでください。

## Submit

各 **Runtime checkout** でparticipant原稿とEvidenceを完成させます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

conditionごとのRuntime PRには、governance plan、governed-designだけの規約・profile草稿、Evidence、再現手順を含めます。activeな組織設定、実profile、ruleset、実人名の台帳は含めません。

Hubの [共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、Baseline / CustomizedのRuntime URL・PR・run ID、12行のcoverage、現在値と提案値の区別、Instructionsとprofileの別機構、outcome、未確認をまとめます。`Challenge-specific design` には、owner / author / reviewer、更新、廃止、復元、承認の方針を書きます。

[Submission Guide](../../docs/submission-guide.md) に従い、実organization名、実member、private ACL、secret、local絶対pathをIssueへ貼りません。静的検査から `runtimeBehavior` / `educationalEffect` をpassにしません。

## Judging

- 4 task × 3 recordの12行を両conditionで欠けなく扱ったか。
- owner、author、reviewer、保存repo、利用scope、ACL、revision、hashを別々に説明したか。
- Instructionsの優先とprofileの同名dedupを同一機構としていないか。
- unknownな現在値と、参加者が提案した将来値を分けたか。
- Public Preview、資格、実org writeを未観測のまま残したか。
- `same`、`worse`、`no-addition-needed`、`blocked` を理由付きで受け入れたか。

役割数、共有範囲、文書量、profileを追加したこと、形式validatorの成功だけでは採点しません。

## Bonus Mission

凍結済みの12行を変えず、一つの規約を二つの仕組みに重複して置いた場合の更新漏れを紙上で検討してください。どちらを正本にするか、重複を残すなら誰が差分を確認するか、重複を作らないなら利用者へどう伝えるかを短く追記します。実organization設定や第三conditionは増やしません。

## Support / Fallback

organization ownerやenterprise資格がなくても、本編の診断・設計は完了できます。Runtimeを用意できない場合は不活性原稿を手元に保ち、提出だけを `blocked` と分けます。owner、ACL、selected ref、現行本文を確認できないときは、推測値を入れずunknownで停止します。

任意の [`org-instructions-live`](optional/org-instructions-live.md) と [`shared-profiles-live`](optional/shared-profiles-live.md) は、別承認前の準備ガイドです。本編condition、org write、repository作成、profile依頼の許可ではなく、`live-unobserved` です。

前者はorganization ownerの許可、対象surface、既存本文、復元範囲を確定できなければ停止します。後者はorganization / enterpriseの資格、governance repository/ref、保存ACL、利用scope、Public Previewを分け、採用版が不明なら停止します。保存ACLと利用scopeを同じにしたり、未知ownerを補ったりしません。

終了時も実organization設定、既存profile、Memory、repository、PR履歴を削除せず、自分の不活性原稿だけを管理します。執筆根拠は固定Labs commitの [LAB-39原稿](https://github.com/shinyay/github-copilot-customization-labs/blob/3474d21dd62bad2e594e84657dabe2eb9bb876c1/docs/labs/lab-39-github-shared-governance.md) です。
