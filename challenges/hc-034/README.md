# HC-034 Cloud Agent から運用メモ MCP を呼ぶ設計をしよう

**Language:** **日本語** / [English](../../en/challenges/hc-034/README.md)

## Scenario

CSV 再送の調査では、コードに加えて運用メモを参照したいことがあります。MCP tool から取得する設計では、設定保存、server 起動、tool 一覧、製品採用、call、return、内容の裏付けを一つの「成功」にまとめないことが重要です。

このシナリオでは、`SYNTHETIC_TRAINING_ONLY` の同じ `training-v1` メモを、通常添付、MCP 取得案、手動全文供給案で扱います。server、Cloud Agent、code review、network、DB は起動しません。

## この機能とは

MCP（Model Context Protocol）は、外部の情報や操作を tool として提供する接続方式です。repository の共有 MCP 設定で使う Cloud 向け JSON の root key は `mcpServers` です。VS Code の `.vscode/mcp.json` で使う `servers` 形式とは区別します。

このシナリオでは次の段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| config saved | 保存先、revision、raw bytes | server が起動した |
| syntax | JSON と必要 field | 製品が採用した |
| server started | process / transport | tools が一覧化された |
| tools listed | `tools/list` 相当 | 対象製品が採用した |
| product adopted | 製品側の選択記録 | tool が呼ばれた |
| called | call ID、tool、arguments | response が返った |
| returned | revision、body、hash | 内容が source を支持した |
| content-supported | code-derived claim の照合 | 実障害や DB 状態が正しい |

`readOnlyHint` は認可、ACL、無害な実装、返却内容の正しさを保証しません。

## 向いていること / 向いていないこと

**向いていること**

- key、schema、revision を持つ read-only lookup
- 取得成否と返却内容の意味を分けた記録
- 同じ情報を添付と tool 取得で比較する設計
- `NOT_FOUND`、空、引数不正、transport error の区別

**向いていないこと**

- production や顧客データへの無許可接続
- secret、token、実 endpoint の埋め込み
- `tools/list` を actual call として報告する
- local protocol 確認を Cloud 接続成功とする
- 比較元から重要情報を隠して MCP を有利に見せる

## ゴール

`order-import-replay` / `training-v1` のメモについて、次を設計・診断します。

1. Cloud 形式の inactive MCP 設定
2. `lookup_training_note` の最小 allowlist
3. revision と raw body hash の照合
4. success / empty / `INVALID_ARGUMENT` / `NOT_FOUND` / transport error
5. code-derived claim と合成運用文の分離

## 用意するもの

固定 source:

- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`

`starter/` には次があります。

- `request.txt.template`: `retrieval-plan` と `retrieval-diagnosis`
- `fixtures/operations-note.json.template`: 固定 training note
- `fixtures/manual-note.json.template`: 手動供給用の同一 raw bytes
- `fixtures/packets.json.template`: 取得段階と error の合成記録
- `customization/mcp.json.template`: inactive な Cloud 形式設定草稿
- `retrieval-contract.md.template`: 取得契約
- `design.md.template`: 設計票
- `worksheets/comparison.md.template`: 任意比較票

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. 2 つの note file が同一 raw bytes であることを確認します。
2. `customization/mcp.json.template` は repository settings や `.vscode/mcp.json` へ保存しません。
3. placeholder command / args は未解決の設計値であり、実在する server として扱いません。

## 試してみる

1. `starter/design.md.template` で note key、revision、hash、allowlist、retry、停止条件を決めます。
2. `customization/mcp.json.template` の `mcpServers`、server 名、type、command/args placeholder、許可 tool を確認します。
3. `retrieval-contract.md.template` に request/response schema と error 分類を書きます。
4. `fixtures/packets.json.template` の各 packet について、どの段階まで資料内で主張されているかを診断します。
5. `NOT_FOUND` を空の成功へ、transport error を該当なしへ変換しません。
6. note の code-derived section を 2 source へ照合し、合成運用文や未確認の DB 状態と分けます。

## 任意: 比較する

`starter/worksheets/comparison.md.template` で次を手動比較できます。

- **Baseline**: 通常添付した同じ note
- **Customized**: `lookup_training_note` で取得する設計
- **Manual-equivalent**: tool が返す予定の note 全文を手動供給

note key、revision、body bytes、source、packet をそろえ、接続経路や優先度まで同じとは主張しません。

## 確認ポイント

- `mcpServers` と VS Code の `servers` を混同していないか
- `training-v1` の revision と raw bytes を結び付けたか
- saved / started / listed / adopted / called / returned / supported を分けたか
- `NOT_FOUND`、空、`INVALID_ARGUMENT`、transport error を分けたか
- `readOnlyHint` を安全性の保証として扱っていないか
- code-derived claim を 2 source へ戻せるか
- local 確認を Cloud 採用へ昇格させていないか

## 発展

- `NOT_FOUND` とは別に「正常に取得できたが結果集合が空」の schema を設計する
- Cloud Agent で接続を観測する準備は [Cloud MCP の補足ガイド](optional/cloud-mcp.md) を使う
- code review で接続を観測する準備は [Review MCP の補足ガイド](optional/review-mcp.md) を使う

## 制約・Fallback・安全

- repository settings、`.vscode/mcp.json`、server source、workflow、Java、DB は変更しません。
- network、secret、token、実 endpoint を使用しません。
- MCP を利用できなくても、同じ note の添付、取得契約、packet 診断で完了できます。
- server や製品採用を確認できない段階は `not-observed` のままにします。
