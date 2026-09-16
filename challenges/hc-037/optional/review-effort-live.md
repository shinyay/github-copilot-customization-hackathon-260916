# 標準review effortを限定観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-037/optional/review-effort-live.md)

[HC-037本編へ戻る](../README.md)

## 目的

同じcandidate PRへLiteとBalancedを一回ずつ依頼し、requested effort、表示されたeffective effort、finding、確認負担、費用の観測範囲を分けて記録します。本編の評価計画を実サービスで確かめるための補足であり、実施は必須ではありません。

## 前提

- 変更してよい専用candidate PRがある。
- diff、依頼全文、base/head、評価規約を固定できる。
- Copilot code reviewと両effortを利用できる。
- 既存の自動reviewや共有設定の影響を確認できる。
- 回数、費用、時間の上限と終了時の担当者が決まっている。

## 権限と安全

- PR変更と各review requestについて、対象repositoryの明示的な許可を得る。
- private diff、token、個人情報、未加工logを外部へ転記しない。
- 共有設定の削除、履歴の巻き戻し、無制限の再要求を行わない。
- 整理するのは自分が追加したcandidateと依頼だけに限定する。

## 手順

1. candidate revision、base/head、依頼全文、評価規約を記録する。
2. 既存review、Memory、Instructions、Skills等の残留条件を確認し、不明なものはunknownにする。
3. Liteを一回だけ依頼し、requested/effective effort、actor、finding、開始・終了、確認負担、費用のうち見える項目を記録する。
4. 同じheadと依頼でBalancedを一回だけ依頼し、同じ項目を記録する。
5. 各findingを変更行とsource/testへ戻し、supported、unsupported、duplicate、false positive候補を分類する。
6. 片側の失敗や欠測を0 findingsへ変換せず、比較可能性を判断する。
7. 終了後は、承認範囲に従って自分の試験用成果だけを整理する。

## 観察すること

| 項目 | 分けて記録する内容 |
|---|---|
| effort | requestedと画面・結果で確認できたeffective |
| review | actor、対象head、finding本文、根拠 |
| 品質 | supported、unsupported、false positive、見落とし候補 |
| 負担 | 重複、確認時間、追加調査 |
| 運用 | 回数、時間、費用、既存自動reviewの影響 |

内部model、agentic fallback、CI visibilityなど見えない値は推測しません。

## 停止条件

- diff、依頼、base/head、実effort表示を固定できない。
- review requestまたは費用発生の承認がない。
- 片側だけの結果を、未実施側の0 findingsと比較する必要がある。
- 上限を超える再要求、共有設定の変更、機密情報の転記が必要になる。

## 本編へ戻る

観測結果は本編の評価項目へ対応付け、[HC-037の確認ポイント](../README.md#確認ポイント) で過剰な主張がないか確認します。
