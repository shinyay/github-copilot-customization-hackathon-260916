# HC-034 Cloud Agentから運用メモを取得するMCP連携を設計しよう

**言語:** **日本語** / [English](../../en/challenges/hc-034/README.md)

## シナリオ

CSV の再送を調査するときは、コードに加えて運用メモを参照したい場合があります。MCP ツールで取得する設計では、設定の保存、サーバーの起動、ツール一覧、製品での採用、呼び出し、返却、内容の裏付けを、一つの「成功」にまとめないことが重要です。

このシナリオでは、`SYNTHETIC_TRAINING_ONLY` の同じ `training-v1` メモを、通常の添付、MCP による取得案、全文を手動で供給する案で扱います。サーバー、Cloud Agent、code review、ネットワーク、DB は起動しません。

## この機能とは

MCP（Model Context Protocol）は、外部の情報や操作をツールとして提供する接続方式です。リポジトリの共有 MCP 設定で使う Cloud 向け JSON のルートキーは `mcpServers` です。VS Code の `.vscode/mcp.json` で使う `servers` 形式とは区別します。

このシナリオでは次の段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| config saved | 保存先、リビジョン、生のバイト列 | サーバーが起動した |
| syntax | JSON と必須フィールド | 製品が採用した |
| server started | プロセス / transport | ツールが一覧化された |
| tools listed | `tools/list` 相当 | 対象製品が採用した |
| product adopted | 製品側の選択記録 | ツールが呼び出された |
| called | call ID、ツール、引数 | 応答が返った |
| returned | リビジョン、本文、ハッシュ | 返却内容がソースで裏付けられた |
| content-supported | コードに基づく主張の照合 | 実際の障害や DB 状態が正しい |

`readOnlyHint` は、認可、ACL、実装の無害性、返却内容の正しさを保証しません。

## 向いていること / 向いていないこと

**向いていること**

- キー、スキーマ、リビジョンを持つ読み取り専用の検索
- 取得成否と返却内容の意味を分けた記録
- 同じ情報を、添付とツールによる取得で比較する設計
- `NOT_FOUND`、空の結果、引数不正、transport error の区別

**向いていないこと**

- 本番環境や顧客データへの無許可の接続
- シークレット、トークン、実際のエンドポイントの埋め込み
- `tools/list` を実際の呼び出しとして報告する
- ローカルでのプロトコル確認を、Cloud への接続成功とみなす
- 比較元から重要情報を隠して MCP を有利に見せる

## ゴール

`order-import-replay` / `training-v1` のメモについて、次を設計・診断します。

1. Cloud 形式の不活性な MCP 設定
2. `lookup_training_note` の最小 allowlist
3. リビジョンと本文の生のハッシュの照合
4. success / empty / `INVALID_ARGUMENT` / `NOT_FOUND` / transport error
5. コードに基づく主張と合成運用文の分離

## 用意するもの

固定ソース:

- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`

`starter/` には次があります。

- `request.txt.template`: `retrieval-plan` と `retrieval-diagnosis`
- `fixtures/operations-note.json.template`: 固定の研修用メモ
- `fixtures/manual-note.json.template`: 手動供給用の同一の生バイト列
- `fixtures/packets.json.template`: 取得段階とエラーの合成記録
- `customization/mcp.json.template`: 不活性な Cloud 形式の設定草稿
- `retrieval-contract.md.template`: 取得契約
- `design.md.template`: 設計票
- `worksheets/comparison.md.template`: 任意比較票

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. 2 つのメモファイルが同一の生バイト列であることを確認します。
2. `customization/mcp.json.template` は、リポジトリ設定や `.vscode/mcp.json` へ保存しません。
3. プレースホルダーの `command` / `args` は未解決の設計値であり、実在するサーバーとして扱いません。

## 試してみる

1. `starter/design.md.template` で、メモのキー、リビジョン、ハッシュ、許可リスト、再試行、停止条件を決めます。
2. `customization/mcp.json.template` の `mcpServers`、サーバー名、`type`、`command` / `args` のプレースホルダー、許可するツールを確認します。
3. `retrieval-contract.md.template` に、request/response のスキーマとエラー分類を書きます。
4. `fixtures/packets.json.template` の各パケットについて、どの段階まで資料で裏付けられているかを診断します。
5. `NOT_FOUND` を空の成功に、transport error を該当なしに置き換えません。
6. メモのコードに基づくセクションを 2 つのソースと照合し、合成運用文や未確認の DB 状態と分けます。

## 任意: 比較する

`starter/worksheets/comparison.md.template` を使って、次の条件を手動で比較できます。

- **Baseline**: 通常の方法で添付した同じメモ
- **Customized**: `lookup_training_note` で取得する設計
- **Manual-equivalent**: ツールが返す予定のメモ全文を手動で供給

メモのキー、リビジョン、本文のバイト列、ソース、パケットをそろえます。ただし、接続経路や優先順位まで同じとはみなしません。

## 確認ポイント

- `mcpServers` と VS Code の `servers` を混同していないか
- `training-v1` のリビジョンと生のバイト列を結び付けたか
- saved / started / listed / adopted / called / returned / supported を分けたか
- `NOT_FOUND`、空の結果、`INVALID_ARGUMENT`、transport error を分けたか
- `readOnlyHint` を安全性の保証として扱っていないか
- コードに基づく主張を 2 つのソースへ戻せるか
- ローカルでの確認を Cloud での採用へ昇格させていないか

## 発展

- `NOT_FOUND` とは別に、「正常に取得できたが結果集合が空」のスキーマを設計する
- Cloud Agent で接続を観測する準備には、[Cloud MCP の補足ガイド](optional/cloud-mcp.md) を使う
- Copilot code review で接続を観測する準備には、[Review MCP の補足ガイド](optional/review-mcp.md) を使う

## 制約・代替手段・安全

- リポジトリ設定、`.vscode/mcp.json`、サーバーのソース、workflow、Java、DB は変更しません。
- ネットワーク、シークレット、トークン、実際のエンドポイントは使用しません。
- MCP を利用できなくても、同じメモの添付、取得契約、パケットの診断で完了できます。
- サーバーや製品での採用を確認できない段階は、`not-observed` のままにします。
