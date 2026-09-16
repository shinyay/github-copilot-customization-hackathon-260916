# PostgreSQL readiness を確認する

[← HC-035 のメインシナリオ](../README.md)

## 目的

DB test を始める前に、専用 PostgreSQL、接続範囲、opt-in、cleanup の条件がそろっているかを確認します。このガイド自体は DB を provision せず、接続や test を実行しません。

## 前提

- JDK 8 と Maven 3.9 系を確認できる
- DB test の opt-in 条件を確認できる
- 承認済みの専用 PostgreSQL instance/database がある
- DB 所有者、network/runner policy、復元範囲を特定できる

## 権限と安全

- DB 利用、接続、fixture、限定 test、停止、cleanup について DB 所有者の承認を得ます。
- shared/production DB、production data、未承認 fixture を使いません。
- credential を教材へ保存、表示、転載しません。

## 手順

1. engine/version、専用 DB 名、所有者、network 経路を記録します。
2. opt-in が有効な場合だけ実行対象 test を特定します。
3. fixture と cleanup の対象を、自分が追加するデータだけに限定します。
4. JDK/Maven の適合と DB 接続可否を別々に確認します。
5. 承認後に test を行う場合は、command、終了結果、cleanup 結果を別途記録します。

## 観測すること

- 専用 DB と shared/production DB の分離
- opt-in の有無
- 接続成功と test 成功の違い
- skip と pass の違い
- cleanup が自分の追加分だけに限定されているか

## 停止条件

- JDK/Maven、DB 所有者、専用 DB、network、復元範囲のいずれかが不明
- shared/production DB または production data が必要
- opt-in なしの skip を test success と扱う必要がある
- cleanup の対象を限定できない

[← HC-035 のメインシナリオへ戻る](../README.md)
