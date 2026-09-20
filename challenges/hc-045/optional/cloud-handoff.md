# Cloud handoff を限定的に観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-045/optional/cloud-handoff.md)

[HC-045本編へ戻る](../README.md)

## 目的

承認済みの review / Cloud 環境で、1つの finding から、対象を限定した依頼、受理、返却、独立した検証までを観察します。draft、prepared、sent、accepted、applied を直接的な根拠で分けます。

## 前提

- 対象の PR、ソースブランチ、current head を固定できる。
- 変更の scope を `TaxAmounts.java` だけに限定できる。
- `Money.java` と `CommonRulesTest.java` を read-only に保てる。
- 独立期待値、返却情報、停止・復元方法を決めている。
- code review、Cloud Agent、リポジトリ / PR の利用資格がある。
- 使用する workflow が対象の branch/head と scope を安全に維持できる。

## 権限と安全

- 依頼の送信、Cloud セッション、ソースの変更、テスト、commit、push、返却、最終確認について、個別の許可を得る。
- scope を広げる allow-all や、変更してはいけないパスの編集を行わない。
- branch/head を事後的に読み替えず、想定外の返却があれば停止する。
- merge はこの観察に含めない。

## 手順

1. finding、human assessment、ソースの anchor、candidate post-image を記録します。
2. ソースの branch/head、対象の branch/head、許可するパス、読み取り専用のパス、期待値、停止条件を固定します。
3. request draft を人がレビューし、prepared へ進む条件を確認します。
4. 承認後に1回だけ送信し、送信記録と受信側の acceptance を別々に記録します。
5. 返却された branch/head、変更されたパス、commit、test report を、依頼した scope と照合します。
6. 自己申告の test report とは別に、bucket 数、net、tax、rounding、変更されたパスの一覧を独立して確認します。
7. 最終判断を人に戻し、承認された範囲内で、自分が加えた試験用の変更だけを整理します。

## 観察すること

| 状態 | 必要な直接的な根拠 |
|---|---|
| draft | 依頼本文 |
| prepared | 人による scope / branch / head / validation の確認 |
| sent | 送信記録 |
| accepted | 受信側の受理 |
| applied | 対象の head にあるソース / commit |
| validated | 独立した期待値と変更されたパスの確認 |

## 停止条件

- branch/head/scope または独立した期待値が不明。
- `TaxAmounts.java` 以外の変更が必要。
- workflow が branch/head を安全に維持できない。
- 依頼、ソースの変更、テスト、commit、push、最終確認について個別の許可がない。
- 自己申告だけで正しさを確定する必要がある。

## 本編へ戻る

結果を [HC-045の確認ポイント](../README.md#確認ポイント) に対応付け、claim と直接的な根拠、handoff と independent validation を分けて記録します。
