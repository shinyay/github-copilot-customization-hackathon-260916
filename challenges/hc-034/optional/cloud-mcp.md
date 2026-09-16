# Cloud Agent で MCP 接続を観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-034/optional/cloud-mcp.md)

[← HC-034 のメインシナリオ](../README.md)

## 目的

研修専用の read-only MCP server だけを使い、Cloud Agent で設定保存、server 起動、tool 一覧、採用、call、return を限定的に観測します。

## 前提

- Cloud Agent と対象 repository を利用できる
- repository の共有 MCP 設定所有者を特定できる
- `training-v1` の raw bytes と expected hash を保存できる
- secret 不要の研修 server と安全な配置先を用意できる

## 権限と安全

- 共有設定への最小追加、server 起動、Cloud task、tool call、費用、終了時の解除について事前承認を得ます。
- 既定の MCP server を削除せず、allowlist は `lookup_training_note` だけにします。
- production data、顧客情報、secret、実 endpoint を扱いません。

## 手順

1. 既存共有設定を記録し、追加部分と復元方法を決めます。
2. `training-v1` の revision と raw body hash を保存します。
3. 承認済みの研修 server を起動し、protocol と tool schema を確認します。
4. Cloud Agent で対象 server/tool が採用されたことを直接確認します。
5. `lookup_training_note` を 1 回呼び、arguments、return revision、body hash を記録します。
6. code-derived section を source へ照合します。
7. 自分が追加した設定と server だけを停止・解除します。

## 観測すること

- config saved / syntax / started / listed / adopted / called / returned / supported
- expected revision と returned revision の一致
- `NOT_FOUND`、invalid argument、transport error の区別
- local protocol 成功と Cloud 採用の違い

## 停止条件

- 資格、承認、設定所有者、training note bytes のいずれかが不明
- 既定設定を保護できない
- secret 不要の研修環境に限定できない
- 返却 revision または body hash が一致しない
- local protocol 結果だけで Cloud 採用を主張する必要がある

[← HC-034 のメインシナリオへ戻る](../README.md)
