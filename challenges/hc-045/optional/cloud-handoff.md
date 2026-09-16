# Cloud handoffを限定観測する

[HC-045本編へ戻る](../README.md)

## 目的

承認済みのreview/Cloud環境で、一つのfindingから限定request、受理、返却、独立validationまでを観察します。draft、prepared、sent、accepted、appliedを直接Evidenceで分けます。

## 前提

- 対象PR、source branch、current headを固定できる。
- 変更scopeを `TaxAmounts.java` だけに限定できる。
- `Money.java` と`CommonRulesTest.java` をread-onlyに保てる。
- 独立期待値、返却情報、停止・復元方法を決めている。
- code review、Cloud Agent、repository/PRの利用資格がある。
- 使用するworkflowが対象branch/headとscopeを安全に保持できる。

## 権限と安全

- request送信、Cloud session、source変更、test、commit、push、返却、最終確認について個別の許可を得る。
- scopeを広げるallow-allや、変更不可pathの編集を行わない。
- branch/headを事後的に読み替えず、unexpected returnは停止する。
- mergeはこの観察に含めない。

## 手順

1. finding、human assessment、source anchor、candidate post-imageを記録する。
2. source branch/head、target branch/head、allowed path、read-only paths、期待値、stop条件を固定する。
3. request draftを人がレビューし、preparedへ進める条件を確認する。
4. 承認後に一度だけ送信し、transmission Evidenceと受信側のacceptanceを別々に記録する。
5. 返却されたbranch/head、changed paths、commit、test reportを依頼scopeと照合する。
6. 自己申告のtest reportとは別に、bucket数、net、tax、rounding、changed-path inventoryを独立確認する。
7. 最終判断を人へ戻し、承認範囲内の自分の試験用変更だけを整理する。

## 観察すること

| 状態 | 必要な直接Evidence |
|---|---|
| draft | 依頼本文 |
| prepared | 人によるscope/branch/head/validation確認 |
| sent | transmission record |
| accepted | 受信側の受理 |
| applied | 対象headのsource/commit |
| validated | 独立した期待値とchanged-path確認 |

## 停止条件

- branch/head/scopeまたは独立期待値が不明。
- `TaxAmounts.java` 以外の変更が必要。
- workflowがbranch/headを安全に保持できない。
- request、source変更、test、commit、push、最終確認の個別許可がない。
- 自己申告だけでcorrectnessを確定する必要がある。

## 本編へ戻る

結果は [HC-045の確認ポイント](../README.md#確認ポイント) へ戻し、claimと直接Evidence、handoffとindependent validationを分離します。
