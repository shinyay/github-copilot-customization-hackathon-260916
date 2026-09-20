# HC-011 運用メモを安全に取得するMCPツールを作ろう

**言語:** **日本語** / [English](../../en/challenges/hc-011/README.md)

## シナリオ

運用メモを毎回コピー＆ペーストすると、どのキーで取得したのか、取得に失敗したのか、どこまでがコードに基づく情報なのかが曖昧になります。一方、学習のために本番のメモシステムへ接続する必要はありません。

このシナリオでは、合成したトレーニング用メモを1件だけ返す、外部依存のないローカルMCPサーバーを使います。手動での読み取り、ツールでの取得、明示的なエラーを比較します。

## この機能とは

MCP（Model Context Protocol）は、クライアントが外部のツールやリソースを共通のインターフェースで利用するためのプロトコルです。同梱のサーバーはstdioで動作し、読み取り専用ツール `lookup_training_note` を1つ公開します。

固定キーは `order-import-replay` です。成功するとJSONテキストと `structuredContent` を返し、次の情報を区別します。

- 固定ソースの抜粋から確認できる、コードに基づく事実
- `SYNTHETIC_TRAINING_ONLY` と明記された架空の運用メモ
- 実際の履歴や現在の本番環境の状態としては確認できないこと

MCPツールを使うと入力と返却値を追跡しやすくなりますが、権限、データ分類、プロセス管理、回答の正しさが自動的に保証されるわけではありません。

## 向いていること / 向いていないこと

**向いていること**

- 明確なスキーマを持つ読み取り専用の検索
- 合成フィクスチャを使ってツールの境界を学ぶ
- 不正な引数と未知のキーを別のエラーとして扱う
- 手動でのコピー＆ペーストとツール入力の追跡しやすさを比較する

**向いていないこと**

- 無許可で本番環境や顧客データへ接続する
- シークレットを設定やソースへ埋め込む
- 最初の演習に書き込みや削除の操作を追加する
- ツールのエラーを自然文で隠し、成功として扱う

## ゴール

1. ソースの抜粋、合成メモ、未確認事項を分けて要約する。
2. `lookup_training_note` に固定キーを渡して同じ情報を取得する。
3. `Order/Import` と `missing-note` のエラーを保持する。
4. MCPクライアントが所有するstdioのサブプロセスとしてサーバーを開始・終了し、不要なネットワーク接続や権限を追加しない。

## 用意するもの

- Node.js 22以降
- MCPツールに対応するクライアント（任意）
- ターミナルとテキストエディター

## 準備

共通の開始手順は[リポジトリREADMEの「始め方」](../../README.md#始め方)を参照してください。

`starter/` の構成:

```text
starter\
├─ request.txt.template
├─ customization\mcp.json.template
├─ fixtures\operations-note.json.template
├─ reference\
│  ├─ OrderGroup.java.excerpt.md.template
│  └─ OrderImportService.java.excerpt.md.template
├─ tools\mcp\training-notes-server.mjs.template
└─ worksheets\comparison.md.template
```

すべて配布用の原稿です。このリポジトリでは、`.template` を外したMCP設定を作りません。サーバーを試す場合は、別の使い捨て作業場所へ次の構成でコピーし、コピーしたファイルだけ接尾辞を外します。

```text
manual\hc-011\
├─ fixtures\operations-note.json
└─ tools\mcp\training-notes-server.mjs
```

クライアント設定を試す場合は `starter\customization\mcp.json.template` を参照し、対象クライアントの公式手順と組織ポリシーに従って、使い捨て作業場所に設定してください。
クライアント経由で試す場合は、サーバーをターミナルから先に起動しません。設定されたMCPクライアントが `command` と `args` を使って
stdioのサブプロセスを起動し、その接続と終了を管理します。

二つのソースの抜粋は、公開upstreamテンプレート
`shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`
のソースから作成した固定入力です。テンプレートから作成したランタイムワークスペースのローカル `HEAD` が、upstream
リビジョンと一致する必要はありません。

## 試してみる

1. `starter\request.txt.template` と二つのソースの抜粋を読む。
2. `starter\fixtures\operations-note.json.template` を直接読み、コードに基づく事実、合成メモ、未確認事項を分けて要約する。
3. サーバー、フィクスチャ、MCP設定を使い捨て作業場所へ配置し、設定の `command` と `args` が作業用サーバーを指していることを確認する。
4. MCP対応クライアントで設定を読み込み、クライアントがstdioのサブプロセスを起動した後に `lookup_training_note` を呼び、`noteKey` に `order-import-replay` を渡す。サーバーを別のターミナルから手動で起動しない。
5. `Order/Import` を渡して `INVALID_ARGUMENT`、`missing-note` を渡して `NOT_FOUND` が返ることを確認する。
6. アシスタントの要約がエラーを成功に言い換えず、メモのトレーニング専用ラベルを保持しているか確認する。
7. クライアントの接続を解除または終了し、クライアントが所有していたサーバーのサブプロセスが残っていないことを確認する。

## 任意: 比較する

`starter\worksheets\comparison.md.template` を使い、同じ依頼とフィクスチャについて、手動での読み取りとMCPツールを簡潔に比較します。手動側だけに追加説明を与えたり、ツール側で別のメモを使ったりしません。

## 確認ポイント

- ツール入力として `order-import-replay` が明示されているか
- サーバーがローカルのフィクスチャ以外を読まず、ネットワークへ接続していないか
- コードに基づく事実と合成メモを混同していないか
- `INVALID_ARGUMENT` と `NOT_FOUND` を区別しているか
- ツールが返した推奨事項を、実際の社内方針や障害履歴として扱っていないか
- サーバープロセスを終了できたか

## 発展

- 空文字、余分なプロパティ、未知のツール名を送り、プロトコルエラーとツールエラーの境界を観察する。
- クライアントが表示するテキストと `structuredContent` の違いを確認する。
- スキーマを変更した場合は、固定キーでの成功とエラーの両方を再確認する。

## 制約・代替手段・安全

- フィクスチャはトレーニング専用であり、本番データ、顧客データ、個人データを含みません。
- ツールは、1件の読み取り専用検索だけを行います。書き込み、削除、ネットワーク処理を追加しません。
- `noteKey` は1〜80文字の小文字英数字とハイフンに限定し、パスやURLを受け付けません。
- MCP設定の形式や有効化方法はクライアントごとに異なります。権限やシステム設定を推測で変更しません。
- クライアントがMCPに対応していない場合も、次の**単独の直接テスト**として、JSON-RPCの各行をstdinへ送り、サーバーの契約を確認できます。この経路に限り、パイプラインがサーバープロセスを直接起動します。MCPクライアント経由の手順とは分けて扱ってください。

  ```powershell
  @(
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"manual-check","version":"1"}}}',
    '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"lookup_training_note","arguments":{"noteKey":"order-import-replay"}}}'
  ) | node .\manual\hc-011\tools\mcp\training-notes-server.mjs
  ```

- ローカルプロセスの実行が禁止されている場合は、フィクスチャとサーバーのソースを読み、スキーマとエラーの設計を確認します。実行結果は主張しません。
