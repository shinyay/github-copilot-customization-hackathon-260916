# HC-011 運用メモを安全に取得するMCP Toolを作ろう

**Language:** **日本語** / [English](../../en/challenges/hc-011/README.md)

## Scenario

運用メモを毎回copy/pasteすると、どのキーで取得したか、取得に失敗したか、どこまでがコード由来かが曖昧になります。一方で、学習のために本番のnote systemへ接続する必要はありません。

このシナリオでは、合成したtraining noteを1件だけ返すdependency-freeなlocal MCP serverを使い、手動読取り、tool取得、明示的なerrorを比べます。

## この機能とは

MCP（Model Context Protocol）は、clientが外部toolやresourceを共通のinterfaceで利用するためのprotocolです。同梱serverはstdioで動き、read-only tool `lookup_training_note` を1つ公開します。

固定キーは `order-import-replay` です。成功時はJSON textと`structuredContent`を返し、次を区別します。

- 固定source excerptから読めるcode-derived fact
- `SYNTHETIC_TRAINING_ONLY` と明記した架空の運用メモ
- 実際の履歴や現在のproduction stateとしては確認できないこと

MCP Toolは入力と返却値を追いやすくしますが、権限、データ分類、process管理、回答の正しさを自動では保証しません。

## 向いていること / 向いていないこと

**向いていること**

- 明確なschemaを持つread-only lookup
- 合成fixtureでtool boundaryを学ぶ
- invalid argumentとunknown keyを別のerrorとして扱う
- 手動copy/pasteとtool入力の追跡性を比べる

**向いていないこと**

- 無許可でproductionやcustomer dataへ接続する
- secretをconfigやsourceへ埋め込む
- 初回exerciseへwrite/delete操作を追加する
- tool errorを自然文で隠して成功扱いする

## ゴール

1. source excerpt、合成note、unknownを分けて要約する。
2. `lookup_training_note` に固定キーを渡して同じ情報を取得する。
3. `Order/Import` と `missing-note` のerrorを保持する。
4. MCP clientが所有するstdio subprocessとしてserverを開始・終了し、不要なnetwork接続や権限を追加しない。

## 用意するもの

- Node.js 22以降
- MCP Toolに対応するclient（任意）
- terminalとテキストeditor

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

すべて配布原稿です。このrepositoryでは `.template` を外したMCP設定を作りません。serverを試す場合は、別の使い捨て作業場所へ次の形でコピーし、コピー側だけsuffixを外します。

```text
manual\hc-011\
├─ fixtures\operations-note.json
└─ tools\mcp\training-notes-server.mjs
```

client設定を試す場合は `starter\customization\mcp.json.template` を参照し、対象clientの公式手順と組織ポリシーに従って使い捨て作業場所へ設定してください。
client flowではserverをterminalから先に起動しません。設定されたMCP clientが `command` と `args` を使って
stdio subprocessを起動し、接続と終了を所有します。

二つのsource excerptは、公開upstream template
`shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`
のsourceから作った固定入力です。templateから作成したruntime workspaceのlocal `HEAD` がupstream
revisionと一致することは要求しません。

## 試してみる

1. `starter\request.txt.template` と二つのsource excerptを読む。
2. `starter\fixtures\operations-note.json.template` を直接読み、code-derived fact、synthetic note、unknownを分けて要約する。
3. server、fixture、MCP設定を使い捨て作業場所へ配置し、設定の `command` と `args` が作業用serverを指すことを確認する。
4. MCP対応clientで設定を読み込み、clientがstdio subprocessを起動した後に `lookup_training_note` を呼び、`noteKey` に `order-import-replay` を渡す。serverを別terminalから手動起動しない。
5. `Order/Import` を渡して `INVALID_ARGUMENT`、`missing-note` を渡して `NOT_FOUND` が返ることを確認する。
6. assistantの要約がerrorを成功に言い換えず、noteのtraining-only labelを保持しているか確認する。
7. clientの接続を解除または終了し、clientが所有したserver subprocessが残っていないことを確認する。

## 任意: 比較する

`starter\worksheets\comparison.md.template` を使い、同じrequestとfixtureについて手動読取りとMCP Toolを短く比較します。手動側だけ追加説明を与えたり、tool側で別noteを使ったりしません。

## 確認ポイント

- tool入力として `order-import-replay` が明示されているか
- serverがlocal fixture以外を読まず、networkへ接続していないか
- code-derived factとsynthetic noteを混ぜていないか
- `INVALID_ARGUMENT` と `NOT_FOUND` を区別しているか
- toolが返した推奨を実際の社内方針や障害履歴と呼んでいないか
- server processを終了できたか

## 発展

- 空文字、余分なproperty、unknown tool名を送り、protocol errorとtool errorの境界を観察する。
- clientが表示するtextと`structuredContent`の差を確認する。
- schemaを変えた場合は、固定キーの成功とerrorの両方を再確認する。

## 制約・Fallback・安全

- fixtureはtraining-onlyであり、production、customer、個人データを含みません。
- toolは1件のread-only lookupだけです。write/deleteやnetwork処理を追加しません。
- `noteKey` は1〜80文字の小文字英数字とhyphenに限定し、pathやURLを受け付けません。
- MCP config形式や有効化方法はclientごとに異なります。権限やsystem設定を推測で変更しません。
- clientがMCP非対応でも、次の**standalone direct test**としてJSON-RPC lineをstdinへ送りserver contractを確認できます。この経路だけはpipelineがserver processを直接起動し、MCP client flowとは分けて扱います。

  ```powershell
  @(
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"manual-check","version":"1"}}}',
    '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"lookup_training_note","arguments":{"noteKey":"order-import-replay"}}}'
  ) | node .\manual\hc-011\tools\mcp\training-notes-server.mjs
  ```

- local processの実行が禁止されている場合は、fixtureとserver sourceを読んでschema・error設計を確認し、実行結果は主張しません。
