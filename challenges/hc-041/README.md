# HC-041 repo factsと古い記憶を見分けよう

## Challenge Story

架空repositoryの引継ぎで、「検査commandはcheck-a」というfactカードが見つかりました。引用pathは付いていますが、現在branchの資料にはcheck-bと書かれているかもしれません。別repositoryの事実や、読みやすさに関するuser preferenceも同じ束へ混ざっています。

引用があること、利用候補になれること、今回のCloud Agentや標準reviewで実際に使われたことは別です。新しいsessionを開いたことや設定を無効にしたことも、Memoryが空または消去済みである証拠にはなりません。

このChallengeでは、同じF01〜F06のfactカードをCloudと標準reviewの二surfaceで監査します。`baseline` では共通の引用確認手順を使い、`revalidation-policy` では自分の保持・再検証方針を設計します。Memory serviceへの保存、再利用、削除は行いません。このページとStarter Kitだけで完結し、前のChallenge、Labs、既存Memoryは不要です。

## この機能とは

GitHub Copilot Memoryのrepository factsは、repositoryについて再利用する事実です。引用が付いていても、同じrepositoryの現在branchで引用先を確認し、その本文が主張を今も支えるかを人が確かめる必要があります。

小さな例として、カードが「検査commandは `check-a`」と主張し、`docs/verify.md` を引用しているとします。現在branchの同じpathが `check-b` を示すなら、引用pathが存在するだけでは現在factを支持しません。逆に、現在資料と一致しても、それだけで今回の応答にMemoryが使われたとは言えません。

このページでは次を分けます。

- `eligible` は、対象surfaceで利用候補にできるかという判断です。
- `used` は、今回実際に利用された直接Evidenceがあるかという観測です。
- `supported` は、引用元が主張の範囲を現在も支えるかというsource確認です。

2026-09-15時点の公式説明ではCopilot MemoryはPublic Previewで、repository factsは同じrepositoryを対象にし、現在branchで引用を確認します。標準code reviewで使うのはrepository factsのみです。user preferencesをreviewへ転用しません。

GitHub Copilot Memory、VS CodeのLocal Memory tool、Copilot Appで扱う記憶やuser preferenceは、名前が似ていても保存範囲・surface・操作が同じとは限りません。一つの資料の説明を別製品へ相互転用しません。

28日未使用時のretentionは確認日時点の製品説明です。「28日以内なら正しい」「28日待てば無記憶の対照になる」「新sessionなら空になる」という保証ではありません。

製品説明の根拠は [Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory) です。文書確認日は2026-09-15です。Public Previewの資料や静的カードは、実Memoryの保存、共有、利用、残留、削除を観測した証拠ではありません。

## 向いていること / 向いていないこと

**向いていること**

- factカードのsource repository、target repository、scope、引用path/revision、現在branchを照合すること。
- 利用資格 `eligible` と、実際の利用 `used` を別々に記録すること。
- 保持、再検証、保留、更新提案のtriggerを決めること。
- 古い引用、別repoの事実、user preference、自己申告だけの資料を同じ手順で監査すること。

**向いていないこと**

- 引用があるだけで意味が支持されたとすること。
- 同repoであるだけで、現在branchやrevisionの確認を省くこと。
- user preferenceを標準reviewのrepository factとして扱うこと。
- 「覚えました」という返答を保存成功や後続利用の証拠にすること。
- 新session、設定解除、28日経過を、空Memory・削除・無記憶対照の証拠にすること。
- 本編のために既存Memoryを全削除すること。

## Starter Kit

SYNTHETIC_TRAINING_ONLY — repo-A / repo-B、training revision、factカード、引用、user preference、利用申告はすべてこのChallengeの合成資料です。実repositoryのGit SHA、実userの情報、実Memory recordではありません。

source種別は `synthetic`、`sourcePaths` は `[]` です。Runtimeの515-file baselineとprovenance検査は残りますが、Javaを読み書きしたり実行したりしません。

[Pack manifest](pack/manifest.json) は、両conditionへ次の同一bytesを渡します。

| 素材 | 役割 |
|---|---|
| `brief.md.template` | 本編がfactカード監査であり、Memory操作ではないことを確認する |
| `request.txt.template` | 両condition・両surfaceに共通の依頼全文 |
| `design.md.template` | scope、引用、eligible、used、再検証を設計する |
| `comparison.md.template` | conditionごとのEvidenceひな型 |
| `input/fact-cards.json.template` | F01〜F06の同じ6カード |
| `input/repo-a-current.md.template` | repo-Aのcurrent snapshot |
| `input/repo-a-previous.md.template` | repo-Aのprevious snapshot |
| `input/repo-b-current.md.template` | repo-Bのcurrent snapshot |
| `input/current-policy.md.template` | baselineで使う十分な一般監査手順 |
| `input/memory-scope.md.template` | product / surface / scope / Previewの境界 |

F01〜F06は期待分類を付けず、次の材料を持ちます。

| card | 固定する材料 |
|---|---|
| F01 | 同じrepoのcurrent資料を引用するfact |
| F02 | 同じrepoのprevious資料を引用するfact |
| F03 | 別repoの資料を引用するfact |
| F04 | 架空の一般的な出力形式に関するuser preference |
| F05 | 引用pathまたはrevisionをcurrent資料で確認できないfact |
| F06 | 「利用した」という自己申告だけがあるfact |

参加者版には保持・破棄の正解表を付けません。各カードのsource、scope、支持範囲、eligible、used、再検証triggerを参加者が判断します。

taskは `cloud-fact-audit` と `review-fact-audit` です。同じ6カードを両surfaceで扱うため、各conditionに12行、全体で24行あります。

| task | product surface | 固定する境界 |
|---|---|---|
| `cloud-fact-audit` | Copilot coding agent / Cloud | repository factsとuser preferenceを区別し、利用候補と実利用を分ける |
| `review-fact-audit` | standard code review | repository factsだけを対象にし、user preferenceの継承を要求しない |

必要なのはGit、Node.js 22以降、テキスト編集環境、Hubと非公開Runtimeを扱う通常の参加権限です。Memoryの利用資格、Cloud、標準review、設定変更は本編に不要です。

## Open Question

**どのカードを現在の根拠で支持でき、どれを保留・再検証し、次の変更で何を確認すべきでしょうか。**

- 同じrepo、現在branch、引用path/revision、本文の意味を、どの順序で確かめますか。
- `eligible` でも `used` の証拠がないカードを、どのように記録しますか。
- 古さだけで捨てず、どの変更や期限を再検証triggerにしますか。
- user preferenceとrepository factを、Cloudとreviewでどう分けますか。
- 引用先がない、取得できない、scopeが違う場合に、どこで `blocked` / `incomparable` としますか。

全カードを残すこと、すべて捨てること、再検証項目を増やすことが唯一解ではありません。現行手順で十分という判断も可能です。

## Design Time

1. F01〜F06を読む前に、sourceRepo、targetRepo、scope、引用path/revision、current照合、支持範囲、eligible、used、提案、再検証triggerの列を決めます。
2. `baseline` では、同梱された十分な一般手順とcurrent/previous資料を使い、同じ12行を監査します。カードの自己申告や `citationMatches` のような教材値だけで結論を出しません。
3. `revalidation-policy` では、同じ12行へ参加者独自の再確認タイミング、根拠不足の保留、現在factと更新提案の区別、廃止条件を適用します。
4. `cloud-fact-audit` と `review-fact-audit` を別行にし、標準reviewへuser preferenceを持ち込みません。
5. `eligible / not-eligible / unknown` と、`used evidence present / absent / unknown` を別々に記録します。eligibleをusedへ自動変換しません。
6. VS Code Local Memory toolやCopilot Appの説明を、GitHub Copilot Memoryのservice behaviorとして流用しません。
7. 比較前にカード全文、repo snapshot全文、task、surface、判定観点、設計revisionを凍結します。改版したら新しいrunにし、Baselineの分類をCustomizedの入力へ貼りません。

参加者が作るのは、保持・再検証・保留の方針です。実Memoryのstore、reuse、delete、全消去手順は作りません。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。dry-runとbuildはMemory service、Cloud、標準reviewを呼び出しません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-041 --condition baseline --team team-sora --run fact-audit-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-041 --condition revalidation-policy --team team-sora --run revalidation-01
node .\scripts\build-pack.mjs --challenge HC-041 --output .runtime/packs
```

既存出力を削除・上書きしません。生成されたPack directory、版、hashを記録し、manifest単体ではなくdirectoryをRuntimeへ渡します。

### 2. conditionごとにfresh Runtimeを用意する

[Getting Started](../../docs/getting-started.md) に従い、二つの新しい非公開Runtime repositoryを用意します。各conditionで別repository、名前付きbranch、新規workspace、新しい会話を使います。repoやsessionを分けただけでUser/org設定、Memory、homeが空になったとは書きません。既存状態を変更せず、確認できない影響をEvidenceへ残します。

各 **Runtime checkout** のrootで、そのrepositoryのconditionを一つだけ適用します。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-041-v1'
$Condition = 'baseline'
$RunId = 'fact-audit-01'
git status --short --branch
git switch -c "hc-041-$Condition-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
```

もう一方は `$Condition = 'revalidation-policy'`、`$RunId = 'revalidation-01'` とします。どちらも `$RunId` をHub dry-runの `--run` と一致させ、EvidenceとHub Issueのrun IDにも同じbindingを記録します。applyしたbranchを維持し、`.hackathon/run.json` を編集しません。

### 3. 不活性な監査方針だけを作る

両conditionで作成できる参加者成果物は次の一つです。

| exact path | 保存する内容 |
|---|---|
| `participant/hc-041/retention-policy.md.template` | 12行の監査、保持・再検証・保留、eligible/used、trigger、unknown |

Evidenceは `.hackathon/evidence/hc-041/comparison.md` に置きます。Starter原本を編集・renameせず、既存のコピー先を上書きしません。Memory設定、service、User preference、VS Code Local Memory、Copilot Appの記憶へ書き込みません。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

この検査が通っても、Memory保存、reuse、削除、Cloud利用、review利用を観測したことにはなりません。

## Compare

| condition | このページでの呼び名 | 比較すること |
|---|---|---|
| `baseline` | Baseline | 十分な一般監査手順で、同じ6カードをCloud/reviewの二surfaceへ適用する |
| `revalidation-policy` | Customized | 同じ12行へ自分の保持、保留、更新提案、再検証triggerを適用する |

固定するのはF01〜F06、current/previous snapshot全文、二task、二surface、判定観点、設計revisionです。変更するのは参加者の再検証・保持方針だけです。

比較では、支持できる主張の範囲、unknownの保持、再確認の時期、レビュー負担を読み比べます。全カードを残す/捨てる件数や、引用数だけで改善を決めません。現行手順で十分なら `no-addition-needed` が有効です。

結果は `improved`、`same`（Issueでは `equal`）、`worse`、`no-addition-needed`、`not-observed`、`unsupported`、`blocked`、`incomparable` のいずれでも構いません。再検証が過剰で負担だけ増えれば `worse`、実利用の証拠がなければ `not-observed`、scopeをそろえられなければ `incomparable` が正当です。

## Evidence

各Runtimeの `.hackathon/evidence/hc-041/comparison.md` に、次のexact headingを残します。

- `Fixed task`
- `Environment`
- `Condition and input`
- `Design`
- `Comparison`
- `Outcome`
- `Limitations`
- `Citation audit`
- `Scope and eligibility`
- `Retention and revalidation`

24行すべてについて、card ID、task/surface、sourceRepo、targetRepo、scope、引用path/revision、current照合、支持される範囲、eligible / not-eligible / unknownの根拠、usedの直接Evidence、保持/要確認/保留の提案、再検証triggerを記録します。これらは文書項目であり、Memory APIの実fieldではありません。

カード読解、Memory利用候補、実際の利用、保存、残留、削除を分けます。本編で確認できるのは合成カードと不活性方針の保存だけです。実Memory reuse/store/delete、Cloud利用、review利用、28日retentionの実観測は `not-observed` です。

新sessionや設定解除を空Memoryの証拠にせず、「覚えました」という自己申告を保存成功へ変換しません。引用pathの存在を意味支持へ、eligibleをusedへ、取得失敗をnot-eligibleへ自動変換しないでください。未実施・不明は0、pass、N/Aではなくunknownの理由を残します。

## Submit

各 **Runtime checkout** でretention policyとEvidenceを完成させます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

conditionごとのRuntime PRには、`retention-policy.md.template`、Evidence、再現手順だけを含めます。実Memory record、User preference、service操作log、削除操作は含めません。

Hubの [共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、Baseline / CustomizedのRuntime URL・PR・run ID、24行のcoverage、引用監査、scope/eligible/usedの区別、保持・再検証trigger、outcome、未観測をまとめます。`Challenge-specific design` には、いつ再検証し、どの不足を保留するかを書きます。

[Submission Guide](../../docs/submission-guide.md) に従い、実user情報、private repository本文、Memory内容、local絶対path、token、raw logをIssueへ貼りません。静的検査の成功から `runtimeBehavior` / `educationalEffect` をpassにしません。

## Judging

- F01〜F06をCloud/reviewの二surface、両conditionで欠けなく扱ったか。
- 同repo、現在branch、引用path/revision、意味の支持範囲を確認したか。
- eligibleとused、現在factと更新提案、repository factとuser preferenceを分けたか。
- 標準reviewではrepository factsだけという境界を守ったか。
- Public Preview、28日説明、実Memory操作を未観測のまま残したか。
- `same`、`worse`、`no-addition-needed`、`not-observed`、`blocked` を理由付きで受け入れたか。

保持したカード数、引用数、方針の長さ、すべて再検証にしたこと、形式validatorの成功だけでは採点しません。

## Bonus Mission

F01〜F06やcurrent資料を変更せず、「次にどのrepository変更が起きたら再検証するか」を一つ追加してください。branch更新、引用path変更、task surface変更などから選び、誰が何を照合するかを書きます。実Memory操作や第三conditionは増やしません。

## Support / Fallback

Memory、Cloud、標準reviewの利用資格がなくても、本編のfactカード監査は完了できます。Runtimeを用意できない場合は不活性方針を手元に保ち、提出だけを `blocked` と分けます。引用資料を取得できない、scopeやbranchを確認できない場合は、無効と断定せずunknownで停止します。

任意の [`memory-reuse-live`](optional/memory-reuse-live.md) は、実reuseを観測する別承認前の準備ガイドです。本編condition、Memory保存、削除、全消去の許可ではなく、`live-unobserved` です。対象accountの明示許可、自分の追加記録を識別できる専用環境、user全体へ及ぶ設定範囲、Cloudとreviewの独立観測、残留と復元を確認できなければ止めます。

新session、設定解除、28日待機、全Memory削除で無記憶対照を作りません。識別できない記録の削除や既存user全体の設定変更が必要なら `blocked` とします。VS Code Local Memory tool、Copilot Appの記憶、GitHub Copilot Memoryの仕様を相互に流用しません。

終了時も既存Memory、User/org設定、repository、PR履歴を削除せず、自分の不活性原稿だけを管理します。執筆根拠は固定Labs commitの [LAB-41原稿](https://github.com/shinyay/github-copilot-customization-labs/blob/3474d21dd62bad2e594e84657dabe2eb9bb876c1/docs/labs/lab-41-github-copilot-memory.md) です。
