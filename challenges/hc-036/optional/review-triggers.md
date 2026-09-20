# Review trigger を限定観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-036/optional/review-triggers.md)

[← HC-036 のメインシナリオ](../README.md)

## 目的

承認済みの専用リポジトリで、自動 review 設定と PR イベントの関係を、範囲を限定して観測します。合成した 20 セルを実際のリポジトリでそのまま再現する手順ではありません。

## 前提

- Copilot code review と対象リポジトリを利用できる
- リポジトリ管理者と設定所有者を特定できる
- 対象ブランチ、PR/head、review の適用範囲を決められる
- 個人、organization、enterprise 設定と ruleset の影響を確認できる

## 権限と安全

- 自動 review 設定/ruleset の変更、PR イベント、review の要求、head の更新、費用、停止・復元について事前承認を得ます。
- 自分が追加した設定だけを復元し、共有設定を全削除しません。
- 発火しない場合も、review の要求を無制限に繰り返しません。

## 手順

1. 対象の適用範囲、head、設定の参照元/ref、actor を記録します。
2. 1 回の観測で変更する設定項目は、一つだけに限定します。
3. 承認済みのイベントを発生させ、request ID と時刻を記録します。
4. queue、attempt、start、complete、reviewed head を別々に追跡します。
5. 現在の head と reviewed head を照合します。
6. 観測後は自分が追加した設定だけを復元します。

## 観測すること

- イベントの種類と actor
- 個人/org/enterprise の設定、ruleset、対象ブランチ
- request / queue / attempt / complete
- base/head/reviewed head
- 重複要求、費用、回数上限

## 停止条件

- 管理者、review の利用資格、対象の適用範囲/head、設定所有者のいずれかが不明
- 複数の設定、複数の ruleset、actor の違いを分離できない
- 費用/回数上限または停止・復元の承認がない
- 追加要求を無制限に繰り返す必要がある

実際に観測した情報は合成資料へ混ぜず、必要な場合は別の安全な記録として扱います。

[← HC-036 のメインシナリオへ戻る](../README.md)
