# HC-027 評価計画を固定してからカスタマイズを比べる

## Scenario

Copilot の回答を見てから採点項目、試行回数、欠測の扱いを変えると、都合の良い結果だけを「改善」と呼べます。このシナリオでは、primary task と transfer-check task を使い、評価観点、順序、終了条件、欠測、回帰の扱いを結果を見る前に固定します。

素材はすべて合成データです。実 model の性能、人の採点、教育効果を測った値ではありません。

## この機能とは

評価の事前登録は、比較前に「何を同じにするか」「どの行を分母へ残すか」「失敗をどう扱うか」を固定する方法です。次を別々に扱います。

- task: `primary` / `transfer-check`
- variant: `reference` / `reusable-rules` / `manual-rules`
- block: `block-01` / `block-02` / `block-03`
- initial response / follow-up response
- 観測された `0` / 未観測の `null`
- 個別 row / task 内集約 / 全体の回帰判断

固定 identity は `2 task × 3 variant × 3 block = 18 row` です。`reusable-rules` と `manual-rules` は同じ凍結 body を使う想定ですが、前者は再利用可能なルール、後者は同じ全文を手動で渡す想定です。

## 向いていること

- カスタマイズ比較の rubric、分母、順序を事前に固定すること
- 欠測、失敗、一部回帰を消さずに残すこと
- 初回回答と追問後の回答を分けること
- 改善、同等、悪化、追加不要、比較不能を同じ規則で判断すること

## 向いていないこと

- 結果を見てから高得点の観点だけを採用すること
- `null` を `0` に置換して平均すること
- 合成18 rowを18回の LLM 実行と呼ぶこと
- 同じ starter 内の追加データを blind test と呼ぶこと
- 外部 service へ private data を無承認で送ること

## ゴール

- 5つの評価観点と固定分母を定義する
- 18 row の順序、終了条件、欠測・失敗規則を固定する
- initial / follow-up と task 別の回帰を分けて集計する
- 欠落、重複、variant 混入を検出する
- 結論と限界を、結果を見た時点を含めて説明する

## 用意するもの

`starter/` には次の不活性素材があります。

- `request.md.template`: 固定評価依頼
- `primary-request.md.template` / `primary-packet.txt.template`
- `transfer-request.md.template` / `transfer-packet.txt.template`
- `design.md.template`: 5観点と集約規則のワークシート
- `schedule.md.template`: 18 row の固定 schedule
- `rules-draft.md.template`: task 値を含めない再利用可能なルール本文
- `synthetic-trials.md.template`: 計画固定後に読む合成結果
- `regression-toy.md.template`: 1 target の悪化を隠さない練習
- `comparison.md.template`: 比較記録

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. 最初は `synthetic-trials.md.template` を開かず、`request.md.template`、2つの task request / packet、`design.md.template`、`schedule.md.template` だけを使います。
3. 5観点、分母5、variant の順序、block の終了条件、欠測・失敗、initial / follow-up、個別回帰、全体 rollup を自分のメモへ固定します。
4. 結果を先に見た場合は、その分析を「事前登録済み」と呼ばないと決めます。
5. すべての `.template` を不活性のまま使い、active な repository customization は作りません。

## 試してみる

1. Copilot に固定依頼と `design.md.template` を渡し、task の目的を測れる5観点を提案させます。採用理由と判定方法も固定します。
2. `schedule.md.template` の18 rowが exact にそろい、重複がないことを確認します。
3. variant の順序と各 block の停止条件を決めます。途中で結果に合わせて変えません。
4. `rules-draft.md.template` へ、packet の具体値や勝敗を含まない再利用可能な規則だけを書きます。
5. ここで初めて `synthetic-trials.md.template` を読みます。18 rowを削除せず、failed / not-run / `null` も分母の記録へ残します。
6. primary と transfer-check を別々に集計し、initial と follow-up を分けます。
7. `regression-toy.md.template` を使い、1 target の悪化を他 target の同等で隠していないか確認します。
8. `comparison.md.template` へ、coverage、欠測、task 別結果、全体判断、限界をまとめます。

結論は `improved`、`not-needed`、`equal`、`worse`、`blocked`、`incomparable` のどれでも構いません。

## 任意: 比較する

短い手動セルフチェックとして、同じ task を新しい会話で2回試せます。

- **Baseline**: 固定 task だけを渡す
- **Customized**: 同じ task に、結果を見る前に固定したルール本文を全文追加する

入力、会話の新しさ、順序をそろえ、回答を見てルールを修正しません。この手動確認は合成18 row の本編とは別に記録します。

## 確認ポイント

- 5観点、順序、終了条件、欠測、回帰方針を結果前に固定した
- 18 row の exact identity を保った
- `null` と `0`、initial と follow-up を分けた
- 欠落、重複、variant 混入を検出した
- primary と transfer-check の回帰を平均で隠していない
- `reusable-rules` と `manual-rules` の body を同一に保った
- 合成結果を実 model 評価や教育効果へ昇格させていない

## 発展

- [外部評価 tool / service を検討する](optional/external-evaluation.md)

publisher、version、送信範囲、model、費用、承認を確認できる場合だけ、合成演習とは別の評価として進めます。

## 制約・Fallback・安全

- 本編は local の合成素材だけで完了し、model 実行、network 送信、課金を必要としません。
- `synthetic-trials.md.template` を先に見た場合も分析はできますが、事前登録の証明はできません。閲覧順を限界として記録します。
- 費用や時間を観測していなければ `null` とし、`0` にしません。
- 実行失敗、採点不能、未実施の row を削除しません。
- 外部機能の publisher、対応 version、取得元、認証、送信対象、費用上限、承認のどれかが不明なら停止します。
- private prompt、source、token、個人情報を無承認で外部へ送りません。
