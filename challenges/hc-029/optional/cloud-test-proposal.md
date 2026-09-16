# Cloud Agent で test 提案を試す

**Language:** **日本語** / [English](../../../en/challenges/hc-029/optional/cloud-test-proposal.md)

[← HC-029 のメインシナリオ](../README.md)

## 目的

HC-029 で作成した不活性な rules と test 提案を、承認済みの専用 repository で Cloud Agent に渡す前の確認事項を整理します。提案 diff を既存作業へ自動適用する手順ではありません。

## 前提

- Cloud Agent と対象 repository を利用できる
- 開始 branch と変更先 branch を明確にできる
- JDK 8、Maven 3.9 系、Java 7 互換条件を確認できる
- 対象 test path と、変更禁止 path を確認できる

## 権限と安全

- Cloud task、model 利用、branch 作成、変更提案、test 実行、費用について事前承認を得ます。
- production code、`pom.xml`、既存 test 期待値を fallback として変更しません。
- active Instructions を置く場合は、対象 repository の所有者が内容と解除手順を確認します。

## 手順

1. 固定依頼、rules 本文、source revision、対象 test path を記録します。
2. rules を使わない試行と使う試行を分ける場合は、同じ source と依頼を使います。
3. Cloud Agent には提案範囲を `CommonRulesTest.java` だけと明示します。
4. 生成された変更を自動で merge せず、production/POM/既存期待値への変更がないか review します。
5. JDK と Maven の版を確認してから compile/test を実行し、command と終了結果を記録します。
6. 試行後は自分が追加した active customization だけを解除します。

## 観測すること

- rules が task 固有の依頼を不必要に重複していないか
- proposal が対象 test file だけに収まっているか
- JDK/Maven の実際の版と互換条件
- 実行した compile/test と未実施の確認
- branch、model、tools、入力差による比較不能要因

## 停止条件

- Cloud Agent、repository、branch、JDK、Maven のいずれかを確認できない
- task、model、費用、変更、test の承認がない
- production/POM/既存期待値の変更が必要になる
- source や入力を公平にそろえられない
- test 未実施を pass と扱う必要がある

[← HC-029 のメインシナリオへ戻る](../README.md)
