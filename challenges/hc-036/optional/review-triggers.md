# Review trigger を限定観測する

[← HC-036 のメインシナリオ](../README.md)

## 目的

承認済みの専用 repository で、自動 review 設定と PR event の関係を限定的に観測します。合成 20 セルを実 repository へそのまま再現する手順ではありません。

## 前提

- Copilot code review と対象 repository を利用できる
- repository 管理者と設定所有者を特定できる
- 対象 branch、PR/head、review scope を決められる
- 個人、organization、enterprise 設定と ruleset の影響を確認できる

## 権限と安全

- 自動 review 設定/ruleset の変更、PR event、review 要求、head 更新、費用、停止・復元について事前承認を得ます。
- 自分が追加した設定だけを復元し、共有設定を全削除しません。
- 発火しない場合も review 要求を無制限に繰り返しません。

## 手順

1. 対象 scope、head、設定 source/ref、actor を記録します。
2. 1 回の観測で変更する option を一つに限定します。
3. 承認済みの event を発生させ、request ID と時刻を記録します。
4. queue、attempt、start、complete、reviewed head を別々に追跡します。
5. current head と reviewed head を照合します。
6. 観測後は自分が追加した設定だけを復元します。

## 観測すること

- event type と actor
- 個人/org/enterprise 設定、ruleset、対象 branch
- request / queue / attempt / complete
- base/head/reviewed head
- 重複要求、費用、回数上限

## 停止条件

- 管理者、review 資格、対象 scope/head、設定所有者のいずれかが不明
- 複数設定、複数 ruleset、actor 差を分離できない
- 費用/回数上限または停止・復元の承認がない
- 追加要求を無制限に繰り返す必要がある

観測した実情報を合成資料へ混ぜず、必要な場合は別の安全な記録として扱います。

[← HC-036 のメインシナリオへ戻る](../README.md)
