# Code review で MCP 接続を観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-034/optional/review-mcp.md)

[← HC-034 のメインシナリオ](../README.md)

## 目的

Copilot code review で、研修専用 MCP tool の採用と read-only lookup を限定的に観測します。

## 前提

- Copilot code review と対象 repository を利用できる
- 対象 PR/head と要求者を特定できる
- 共有 MCP 設定の所有者と利用者範囲を確認できる
- `training-v1` の raw bytes と expected hash を保存できる

## 権限と安全

- 共有設定への最小追加、review 要求、tool call、終了時の解除について事前承認を得ます。
- `readOnlyHint` を認可、ACL、無害性の保証として扱いません。
- 既定 server、共有利用者、private log を保護します。

## 手順

1. 対象 head、設定 revision、note revision/hash を記録します。
2. 共有設定へ研修 server だけを追加します。
3. 承認された 1 回の review を要求します。
4. tool の採用、call、return を直接確認できる記録だけ残します。
5. return の code-derived section を source へ照合します。
6. 実験後は自分が追加した設定だけを解除します。

## 観測すること

- review 対象 head と設定 revision
- tool 採用、call ID、arguments、return
- returned revision/body hash
- `NOT_FOUND`、取得 error、版不一致
- read-only annotation と実装安全性の違い

## 停止条件

- review 資格、対象 head、要求者、設定所有者、note bytes のいずれかが不明
- 共有利用者への影響または review 要求の承認がない
- `readOnlyHint` を安全性の保証にしないと続行できない
- `NOT_FOUND` と取得 error を区別できない
- review 要求を無制限に繰り返す必要がある

[← HC-034 のメインシナリオへ戻る](../README.md)
