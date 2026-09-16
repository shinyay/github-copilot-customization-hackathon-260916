# HC-019 カスタマイズの健康診断を作ろう

## Challenge Story

Instructions原稿はparseでき、一覧にも表示されています。それでも二つの行が互いに矛盾していたら、実際の作業ではどちらを守ればよいか分かりません。逆に、構文検査だけで意味や実利用まで失敗と決めるのも早計です。

このChallengeでは、同じ二行、同じwrapper、同じ合成inventoryを使い、自由レビューと自作checklistを比較します。参加者自身が元の目的を残す最小修正を選び、既成の一つの答えをコピーしません。

## この機能とは

customizationの健康状態を説明するには、少なくとも次を分けます。

| 観点 | 分かること / 分からないこと |
|---|---|
| 構文 | frontmatterや本文をparseできるか。意味の一貫性は別 |
| location | fileが想定scopeの候補pathにあるか。実投入は別 |
| harness | そのclient / agent hostが対象形式を扱うか |
| 意味 | 指示同士が競合せず目的を保つか。有限toyでも人の判断が必要 |
| discovery | 管理画面や探索で候補として見えたか |
| application | 実際のrequestへ投入された直接Evidenceがあるか |
| usefulness | taskに役立ったか。listed / enabled / parse passだけでは決まらない |

小さな例では、「EvidenceとUnknownsを必ず使う」と「Unknownsを使うな」は、それぞれ読めても同時には満たせません。parserを通ったこと、候補に出たこと、実requestへ投入されたこと、役立ったことを一つの「適用成功」にまとめません。

公開資料は2026-09-15に [Create and manage agent customizations](https://code.visualstudio.com/docs/agent-customization/overview) と [Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions) を確認しています。管理UIや評価extensionの記載と、この本編の合成fixtureは別です。

## 向いていること / 向いていないこと

**向いていること**

- 構文、配置、harness、意味、discovery、application、usefulnessを段階的に点検する
- 自動検査と人の判断の担当を分ける
- 元の目的を説明したうえで、削除、書換え、scope調整等の最小修正を選ぶ
- 未確認なら止める条件と、追加customization不要の判断を残す

**向いていないこと**

- `listed: true` や `enabled: true` だけで `applied: true` と断定する
- parser passを意味pass、合成IDを実extension logへ読み替える
- 外部評価model、Waza score、管理UIの結果を未実施なのに作る
- 原本削除、通常profile移行、User設定変更、実home書込みを本編で行う

## Starter Kit

[Pack manifest](pack/manifest.json) の `sourceKind` は `synthetic`、sourcePathsは空配列、conditionsは `baseline` / `checklist-review` です。可視本文に **`SYNTHETIC_TRAINING_ONLY`** を置きます。

固定本文は次のexact 2行です。

```text
Use exactly the two headings Evidence and Unknowns.
Never include a heading named Unknowns.
```

これは実Instructionsではありません。固定wrapperは次の不活性frontmatterです。

```text
---
description: "Synthetic contradiction for evaluating instruction diagnostics"
applyTo: "**"
---
```

wrapperと本文を組み合わせる場合も `*.instructions.md.template` のままにし、自動探索対象へ置きません。`applyTo` が読めても、対象harnessでdiscovery / applicationされた証拠ではありません。

固定inventoryは `evidenceKind: "synthetic"`、selected / view harnessは `local-agent` です。次の二項目を持ちます。

| entry | 合成された状態 |
|---|---|
| `lab19-safe` | workspace scope、source `.github/instructions/lab19-safe.instructions.md`、local-agent / agent-host候補、enabled / listedはtrue、appliedはnull |
| `profile-only` | profile scope、source `vscode-profile-user-data/instructions/profile-only.instructions.md`、local-agent候補、enabledはfalse、listedはtrue、appliedはnull |

`vscode-profile-user-data/...` は教材上のlabelで、実profileを探索するpathではありません。inventoryは実Customizations editorの取得結果ではありません。

Packは全conditionへ次を `.hackathon/challenge/hc-019/` に不活性配置します。

- `brief.md.template`、`request.txt.template`
- `starter/design.md.template`、`starter/comparison.md.template`
- `materials/draft-p.txt.template`、`materials/inventory.json.template`、`materials/wrapper.txt.template`
- `starter/checklist.md.template`、`starter/repair.md.template`

必要なのはGit、Markdown / JSON編集、Hubと自分の非公開Runtimeへの通常アクセスです。実管理UI、Preview有効化、評価extension、外部model、Waza、migrationは不要で、実行しません。

固定依頼は次の意味を変えず使います。

> 原稿を有効化せず、どの二つの記述が競合するか、保存元やharnessから何が分かるか、実利用について何が未確認かを説明してください。意図を保つ最小修正と再確認方法を設計してください。

## Open Question

**構文、配置、意味、実利用を混同せず、少ない点検で危険な思い込みを見つけるchecklistを作るなら、何を自動確認し、何を人が判断しますか。元の意図を残す最小修正は何ですか。**

修正は一つの削除方法に限定しません。競合行の書換え、scopeの限定、要求の優先関係の明示、追加customizationを採用しない判断も、目的と根拠が説明できれば候補です。

## Design Time

`participant/hc-019/design.md` へ、原稿を直す前に次を記録します。

1. 元の目的と、競合している二行をどう特定するか。
2. 構文 / location / harness / meaning / discovery / application / usefulnessの点検順。
3. 各checklist項目の入力、見るEvidence、自動で分かること、人が判断すること、未知なら止める条件。
4. wrapper、本文、inventoryを両条件で同じbytesに保つ方法。
5. 最小修正の候補と、削除しすぎ・scope拡大・別harness流用を避ける基準。
6. 修正後に構文と意味を別々に再確認し、実discovery / applicationを未観測のまま残す方法。
7. 読み順の効果があるため、checklistの精度や速度向上を実証したと呼ばない方針。

各conditionはfresh Runtime repository、named branch、新しいworkspace・会話・run-idを使います。既存customizationやprofileを削除して条件を揃えません。

## Build

### Hub checkoutで2条件を確認する

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-019 --condition baseline --team team-sora --run hc019-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-019 --condition checklist-review --team team-sora --run hc019-checklist-01
node .\scripts\build-pack.mjs --challenge HC-019 --output .runtime/packs
```

既存build出力は削除・上書きしません。

### conditionごとに新しいRuntime checkoutを使う

```powershell
$condition = 'baseline'
$runId = 'hc019-baseline-01'
$Pack = 'C:\work\hub\.runtime\packs\hc-019-v1'
git switch -c $runId
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $condition --run-id $runId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

`checklist-review` は別repository / runで開始し、run bindingを手編集しません。

### 宣言された不活性成果物だけを作る

両conditionで次を作ります。

- `participant/hc-019/design.md`
- `participant/hc-019/review.md`

`checklist-review` だけ次を追加します。

- `participant/hc-019/checklist.md`
- `participant/hc-019/repaired.instructions.md.template`

baselineは同じ原稿とinventoryを自由な方法でレビューし、根拠と未確認を記録します。checklist-reviewは自作checklistを使い、構文、location / harness、意味、実利用を別判定してから不活性コピーへ最小修正を作ります。

修正案は一種類のanswer keyへ合わせません。削除、書換え、scope明示等から、元の目的を保つ最小案を参加者が選びます。修正不要と判断する場合も、競合をどう扱ったかと未変更原稿を残します。形式が整っただけで競合見落としを正解にしません。

全conditionで `allowedMutations: []` を維持します。`.github/instructions/**`、profile、User settingsへ原稿を置かず、管理UIを開いて有効化しません。Evidenceは `allowedAdditions` ではなく、Runtime所有の `.hackathon/evidence/hc-019/comparison.md` に記入します。

## Compare

Hub共通の比較表示では `baseline` を **Baseline**、`checklist-review` を **Customized** と呼びます。Customizedはactive Instructionsの適用・成功を意味せず、このChallengeでchecklistを使って不活性原稿を診断する側の表示語です。

| condition | 同じ入力で行うこと | 限界 |
|---|---|---|
| `baseline` | 同じ2行、wrapper、inventoryを自由レビューし、競合、根拠、未知を記録 | 正しい診断や修正を禁止しない |
| `checklist-review` | 自作checklistで観点を分け、不活性コピーへ自分の最小修正を作る | 再読の効果があり、診断精度・速度向上の実証ではない |

比較するのは、点検順、根拠の可視性、unknownで止める判断、修正理由、保守しやすさです。checklistがあってもbaselineと同じ、余計に複雑、追加不要という結果を許容します。

syntax pass、location候補、listed、enabled、applied、usefulを別欄にします。`applied: null` をfalseやtrueに補いません。wrapperを変更したり、別harnessのinventoryを流用したrunはcontrolled comparisonにしません。

結果は同等、悪化、改善、追加不要、`blocked`、`unsupported`、`incomparable`、未観測を記録できます。公開toy検査の固定形は、参加者の自由な修正を意味判定するgraderではありません。

## Evidence

各runの `.hackathon/evidence/hc-019/comparison.md` は次のexact 7見出しを使います。

`Fixed task` / `Environment` / `Design` / `Run log` / `Comparison` / `Outcome` / `Limits and cleanup`

- **Fixed task**: condition、run-id、fixed 2 lines、wrapper、inventory、request、Packの識別とhash、`SYNTHETIC_TRAINING_ONLY`
- **Environment**: client、harness、OS、保存元label、利用したparser / viewer、実UI未使用
- **Design**: checklistの分業、元の目的、最小修正の候補、停止条件
- **Run log**: line pair、wrapper同一性、inventory判定、修正差分、構文と意味の別確認
- **Comparison**: 相手run-id、同一入力、読み順、checklistの追加負担、成立しない対照
- **Outcome**: 同等、悪化、追加不要、blocked等と根拠
- **Limits and cleanup**: discovery、application、usefulness、実管理UI、外部評価、Waza、migrationを観測していないこと、自分の不活性コピーだけの整理

元原稿hash、競合する行、修正差分、残した目的を記録します。`listed: true` やparser passから実投入を推定しません。`runtimeBehavior` / `educationalEffect` は `not-observed` のままです。

## Submit

各conditionの許可成果物と記入済みEvidenceを検査・exportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

baselineのRuntime PRには `design.md` / `review.md`、checklist-reviewにはそれらと `checklist.md` / `repaired.instructions.md.template` を含めます。active Instructions、profile data、外部評価logは含めません。

[共通Challenge Result Issue](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ各run、Runtime PR、Pack、比較結果を対応付けます。`Challenge-specific design` には、自動 / 人手の分業、競合する行、選んだ最小修正、構文・意味・実利用の非同一性、追加不要の判断を書きます。

## Judging

- 構文、location、harness、意味、discovery、application、usefulnessを区別したか
- fixed 2 lines、wrapper、inventoryを条件間で同じにしたか
- checklistの自動判定と人の判断、未知で止める条件が具体的か
- 元の目的を説明し、自分の最小修正を選んだか
- `listed` / `enabled` / parser passを実投入や有用性へ昇格していないか
- 一つのanswer key、外部評価、Waza scoreで自由な修正を縛っていないか
- equal / worse / blocked / 追加不要を有効な結果として扱ったか

checklist項目数、修正行数、管理画面の候補数では採点しません。人が原稿、根拠、差分、非主張を確認します。

## Bonus Mission

一つの新しい不活性toy caseを提案し、「構文は通るがscopeが曖昧」「locationは候補だがharnessが違う」など、今回とは異なる一境界だけをchecklistへ追加してください。実profile、秘密の未見評価、別Challengeは作りません。

## Support / Fallback

次の4 routeはすべて `OPTIONAL_GUIDE_ONLY` / `live-unobserved` です。本編condition、Pack grant、実行許可を増やしません。

- [customization-editor: 管理画面の準備境界](optional/customization-editor.md) — 対応版 / harness、Preview、自己所有copy、必要最小ログの別許可が必要。listed / enabledをapplicationへ読み替えません。
- [diagnostic-evaluation: 外部診断の準備境界](optional/diagnostic-evaluation.md) — 別配布Preview extension、publisher、送信対象、model、費用の承認が必要。Analyze出力を真値にせず、自動修正は別承認です。
- [waza-readiness: Waza実行前の確認](optional/waza-readiness.md) — Skill、資源、extension / binary、OS、model、費用、送信の承認と実schema確認が必要。Download、scaffold、Runを本編で行いません。
- [copy-migration: copy migrationの準備境界](optional/copy-migration.md) — Insiders Experimental、対象Host、自己所有copy、原本保持の承認が必要。deleteOriginal、clearLocationSettings、同名上書きが必要なら停止します。

管理UIがない、別harness、active化未許可、外部評価未承認でも、synthetic fixtureと不活性成果物で本編を完了できます。実施していないscore、migration、applicationを作りません。終了時に整理するのは自分のparticipant copyだけで、原本、通常profile、User / home、設定を削除しません。
