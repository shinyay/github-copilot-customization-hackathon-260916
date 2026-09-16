# HC-027 改善を主張する前に評価を固定しよう

## Challenge Story

Customizationの回答を見てから採点項目や試行回数を変えると、都合の良い結果だけを「改善」と呼べてしまいます。そこで、primary taskと追加確認taskを使い、評価観点、順序、終了条件、欠測、回帰の扱いを結果を見る前に固定します。

このChallengeは合成packetだけを使い、Hubと参加者Runtimeで単独完結します。外部評価service、以前のLAB、過去の回答は不要です。

## この機能とは

評価計画は、良かった回答を後から選ぶ手順ではなく、比較前に何を同じにし、どの行を分母へ残し、失敗をどう扱うかの約束です。このChallengeでは次を分けます。

- task: `primary` / `transfer-check`
- condition: `baseline` / `customized` / `manual-equivalent`
- block: `block-01` / `block-02` / `block-03`
- initial response / follow-up response
- 観測された0 / 未観測のnull
- 個別row / task内集約 / 全体の回帰判断

合成結果の点数は教材データであり、実モデル性能、人の採点、教育効果の測定値ではありません。

## 向いていること / 向いていないこと

**向いていること**

- Customization比較の分母、rubric、順序を事前登録すること
- 欠測、失敗、一部回帰を消さずに残すこと
- 初回回答と追問後の回答を分離すること
- 改善、同等、悪化、追加不要、比較不能を同じ手順で判断すること

**向いていないこと**

- 結果を見てから高得点の観点だけを採用すること
- nullを0へ置換して平均すること
- 合成18行を18回のLLM実行と呼ぶこと
- 同じPack内の追加packetを、アクセス不能なblind testと呼ぶこと
- 外部serviceへの送信、取得、課金を無承認で行うこと

## Starter Kit

[Pack manifest](pack/manifest.json) は `sourceKind: synthetic`、`sourcePaths: []` とし、`SYNTHETIC_TRAINING_ONLY` を表示した不活性素材を提供します。

Packの不活性素材は、Runtimeへの適用時にexact `.hackathon/challenge/hc-027/starter/` 配下へmaterializeされます。これは参加者が読む固定starter locationであり、manifestの許可をfolder globへ広げる意味ではありません。

- primary requestと4行packet
- transfer-check requestと4行packet
- 3 condition × 2 task × 3 blockを記入する空のschedule
- participantが5観点を定義するevaluation plan
- 教材著者が作成した合成trial packet
- 欠測、重複、1target回帰などを構造確認する中立的なtoy素材
- `comparison.md.template` などの空の記録用紙

固定row identityは `2 task × 3 condition × 3 block = 18` 行です。各Runtime conditionは、2 task × 3 blockの6行だけを担当します。Starter Kitは参加者の5観点、完成した集約方針、講師答案、旧coding、blind-keyを含みません。

合成trial packetは、`evaluation-plan.md` と `schedule.md` を固定した後に読みます。同じPack内にあるため厳密なblind試験とは呼びません。先に見た場合はその事実を記録し、事前登録済みと偽りません。

## Open Question

自分たちが「改善」と呼んでよい条件は何ですか。未実施、欠測、失敗、一部の回帰を残したまま、どこまで結論を出しますか。

5つの評価観点は参加者が決めます。項目数を増やして勝ちやすくせず、なぜその5観点で今回のtaskを判断できるのかを説明してください。

## Design Time

結果を読む前に、次を固定します。

1. 5つの評価観点と各観点の判定方法
2. 5点という固定分母
3. 18 rowのexact identityと、各conditionが担当する6行
4. conditionの実施順序と、その順序を選んだ理由
5. 各blockの終了条件
6. initialとfollow-upを別欄へ保存する規則
7. 未実施、process failure、採点不能をnullとして残す規則
8. 1taskまたは1blockだけ悪化した場合の回帰方針
9. taskをまたぐ値を単純平均しない集約方法

ABC / BCA / CABの順序は候補ですが、唯一解ではありません。別順序を使う場合も、全順序を先にpinし、途中で変更しません。費用や時間のreceiptがなければnullであり、0ではありません。

## Build

1. conditionごとに独立したRuntime repository、新しいworkspace、新しいrunを作ります。
2. Hub checkoutで `baseline`、`customized`、`manual-equivalent` のdry-run計画だけを確認します。Runtime checkoutではRuntime READMEの手順でPackを適用します。
3. 結果packetを開く前に、すべてのconditionで次を作成します。
   - `participant/hc-027/evaluation-plan.md`
   - `participant/hc-027/schedule.md`
   - `participant/hc-027/trials.md`
   - `participant/hc-027/regression-policy.md`
4. `customized` と `manual-equivalent` では、同じ凍結bodyを `participant/hc-027/rules-body.md.template` に保存します。`baseline` ではこの追加bodyを作成・供給しません。
5. `manual-equivalent` は凍結body全文を同じ順序で手動供給します。要約、短縮、Customizedの出力を使いません。
6. 計画を固定した後で合成trial packetを読み、自分のconditionに属する6行を `trials.md` へ記録します。
7. 未実施や失敗のrowも削除せず、initial / follow-up / reasonをnullのまま残します。

この本編では外部評価service、実モデル実行、課金、network送信を必要としません。

## Compare

| 条件 | 追加body | 担当row | 固定するもの |
|---|---|---:|---|
| `baseline` | なし | 6 | task、packet、5観点、block、終了条件 |
| `customized` | 凍結bodyを常設供給する設計 | 6 | baselineと同じ入力と評価計画 |
| `manual-equivalent` | 同じbody全文を手動供給する設計 | 6 | baselineと同じ入力と評価計画 |

3つのcondition exportを照合し、18行のexact集合、重複なし、各condition 6行を確認します。primaryとtransfer-checkを1つの平均へ潰さず、個別taskの回帰を残します。

結論は `improved`、`not-needed`、`equal`、`worse`、`blocked`、`incomparable` のいずれでも構いません。観測できないcellは `unknown` または `null` とし、欠測行を消して肯定的な結論へ寄せません。

## Evidence

`.hackathon/evidence/hc-027/comparison.md` に、次の見出しをこの表記で残します。

- `Fixed task`
- `Environment`
- `Preregistered plan`
- `Trial coverage`
- `Baseline`
- `Customized`
- `Manual-equivalent`
- `Missing and failures`
- `Outcome`

`Preregistered plan` には計画を固定した時点と、結果packetを先に見たかどうかを記録します。`Trial coverage` は18行のidentity、conditionごとの6行、重複・欠落を示します。`Missing and failures` は0とnull、initialとfollow-up、未実施と失敗を分離します。

## Submit

各conditionのRuntimeで、そのconditionの6行、許可された成果物、comparisonを完成させ、submitted検査後にcondition別exportを作ります。3 exportを手作業で1つへ混ぜず、path、condition、run、row identityを保ったまま照合します。

Runtime Pull Requestとexportを対応付け、Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
へ、事前登録した5観点、18行coverage、欠測、回帰、outcomeを提出します。合成点が上がったことだけを改善理由にせず、判断規則と根拠を要約してください。

private prompt、local path、token、raw logは
[Submission Guide](../../docs/submission-guide.md)
に従ってredactします。

## Judging

- 5観点、順序、終了条件、欠測、回帰方針を結果前に固定したか
- 18 rowのexact identityと各condition 6行を保ったか
- nullと0、initialとfollow-upを分離したか
- 欠落、重複、condition混入を検出したか
- primaryとtransfer-checkの回帰を平均で隠していないか
- `customized` と `manual-equivalent` のbody全文が同じか
- equal、worse、not-needed、blockedを正当な結論として残したか
- 合成結果を実モデル評価や教育効果へ昇格させていないか

## Bonus Mission

本編を完了した後、同じ18行に別の集約方針を1つだけ適用し、探索的分析として比較します。事前登録した本編の結論は上書きせず、「最初からこの方針だった」と書き換えないでください。

## Support / Fallback

本編はlocalの不活性素材だけで完了できます。外部評価やWazaなどを検討する場合は、統合後の
[evaluation-readiness optional guide](optional/evaluation-readiness.md)
を使用します。このrouteは `OPTIONAL_GUIDE_ONLY`、`live-unobserved` で、`external-evaluation` capabilityは `not-checked` です。

publisher、対応version、binary取得元、認証、送信対象、model、費用上限、承認のどれかが不明なら停止します。取得、送信、課金を回避策として無断実行しません。合成packetを先に見た場合は `blocked` にする必要はありませんが、事前登録の証明は `unknown` とし、比較上の限界を報告します。

外部機能のavailabilityやPreview statusを確認できない場合も、名称やcommandを推測せずoptional routeを停止します。
