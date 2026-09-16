# HC-011 運用メモを安全に取得するMCP Toolを作ろう

## Challenge Story

運用メモをAIへ渡すとき、毎回copy/pasteすると出典や取得失敗が曖昧になります。一方、いきなり本番のnote systemへ接続するのは危険です。そこで、合成したtraining noteを1件だけ返すdependency-free local MCP serverを作り、manual取得、tool取得、error処理を比較します。

このChallengeはlocal processとtraining-only fixtureだけを使います。production、customer、個人データには接続しません。

## この機能とは

MCP（Model Context Protocol）は、clientが外部のtoolやresourceを一定のinterfaceで利用するためのprotocolです。このStarter Kitはstdioで動くlocal serverと、`lookup_training_note` というread-only toolを提供します。

MCP Toolがあると、入力と返却値を記録しやすくなりますが、正しい権限、データ分類、error handling、process管理が自動で保証されるわけではありません。このChallengeでは最小権限と明示的なerrorを観測します。

## 向いていること / 向いていないこと

**向いていること**

- 明確なschemaを持つread-only lookup
- 合成fixtureでtool boundaryを学ぶこと
- 成功だけでなくunknown IDなどのerrorを比較すること

**向いていないこと**

- production systemへの無許可接続
- secretをconfigやsourceへ埋め込むこと
- write/delete操作を初回exerciseへ追加すること
- tool errorを自然文で隠して成功扱いすること

## Starter Kit

[Pack manifest](pack/manifest.json) は次を提供します。

- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`
  と
  `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
  のread-only excerpt
- `training-notes-server.mjs.template` — Node.js built-in moduleだけのstdio MCP server
- `operations-note.json.template` — `SYNTHETIC_TRAINING_ONLY` と明記した、key `order-import-replay` / revision `training-v1` のfixture
- `mcp.json.template` — Hubでは不活性なlocal server設定
- `comparison.md.template` — manual / MCP / error比較とprocess cleanup記録

serverのtool名は `lookup_training_note`、固定keyは `order-import-replay` です。revision `training-v1` はkeyとは別のnote fieldです。noteは既存の `OrderImportService.java` と `OrderGroup.java` を読むためのtraining contextであり、実際のincident historyを主張しません。

## Open Question

manual copy/pasteよりMCP Toolが安全・追跡可能になったと判断するEvidenceは何ですか。

- tool inputのnote keyが残る
- 返却元がlocal fixtureへ限定される
- invalid argumentとunknown keyが別の明示的errorになる
- assistantがerrorを成功に言い換えない
- processの開始と停止を確認できる
- 不要なfilesystemやnetwork権限がない

便利さだけでなく、failure boundaryを含めて設計してください。

## Design Time

1. 固定requestを決めます。

   > `OrderImportService.java` と `OrderGroup.java` を確認したうえで、`lookup_training_note` にkey `order-import-replay` を渡し、code-derived fact、synthetic note、unknownを分けて要約してください。

2. error requestを2つ決めます。invalid argumentは `Order/Import`、unknown lowercase keyは `missing-note` を使います。
3. manual条件では同じfixtureを直接読み、MCP条件ではtoolだけから取得します。
4. server processのstart / stop方法と、停止確認方法を決めます。
5. client / host / OS / channelでMCP設定形式が違う可能性を記録します。templateを無理に別形式へ見せかけません。
6. tool scopeをread-only 1件に保ちます。

## Build

1. **Hub checkout** の `plan-run.mjs --dry-run` で `baseline`、`mcp`、`mcp-error` を個別に確認します。
2. **Runtime checkout** のREADMEに従ってcondition付きでPackを適用します。Starterは `.hackathon/challenge/hc-011/**` にだけ配置されます。
3. Starterから合成noteを `fixtures/operations-note.json` へ参加者が新規作成し、`fixtureLabel`、`revision`、`codeDerivedSnapshot.label`、`actualHistoricalDecision` を確認します。実データへ置き換えません。
4. manual条件でfixtureを直接読み、固定requestへの回答を保存します。
5. MCP条件ではStarterから `tools/mcp/training-notes-server.mjs` と `.vscode/mcp.json` を参加者が新規作成します。Runtime v1の`.gitignore` overrideが `.vscode/mcp.json` を許可するため、force-addは不要です。
6. serverを直接起動できることを確認します。

   ```console
   node tools/mcp/training-notes-server.mjs
   ```

7. serverを停止し、対応clientで `.vscode/mcp.json` を確認してからlocal serverを開始します。
8. MCP条件で有効なnote keyをtool入力として取得します。
9. error条件でinvalid note keyを渡し、`isError` の内容をassistantが保持するか確認します。
10. 実験終了時にserverを停止し、processが残っていないことを記録します。

configの利用方法がclientと合わない場合は、勝手に権限やsystem設定を変更せずFallbackへ進みます。

## Compare

| 条件 | 取得方法 | 入力 | 期待する観測 |
|---|---|---|---|
| Baseline manual | participantがfixtureを読む | `order-import-replay` | codeとsynthetic noteを手で照合 |
| Customized MCP | `lookup_training_note` | `order-import-replay` | JSON text / structuredContentとcode-derived factを分離 |
| MCP error | `lookup_training_note` | `Order/Import` と `missing-note` | `INVALID_ARGUMENT` / `NOT_FOUND` を保持 |

同じ要約requestとnote内容を使います。manual条件へだけ追加説明を渡したり、MCP条件で別noteを使ったりしません。

MCPのtraceabilityが改善すれば `improved`、差がなければ `equal`、tool errorを隠せば `worse`、config差で比較不能なら `incomparable`、server起動不能なら `blocked`、clientがMCP非対応なら `unsupported` です。

## Evidence

`.hackathon/evidence/hc-011/comparison.md` に次を残します。

- environmentとNode version
- manual requestと情報源
- server start commandとprocess evidence
- MCP tool input/output
- invalid argumentとunknown keyのerror
- assistantが追加・欠落させた情報
- network接続を追加していないこと
- server stop commandと停止確認
- outcome、failure、unknown

toolがnoteを返したことは、推奨actionが正しいことの証明ではありません。内容の分類も人が確認します。

## Submit

Runtime PRへserver、MCP config、comparisonを含めます。合成note自体はtraining-only markerを保持します。Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
ではprocess、tool schema、manual/MCP/errorの差、cleanupを要約します。

logへlocal usernameやabsolute pathが出た場合はredactしてください。tokenはこのChallengeに不要です。

## Judging

- dependency-free、local、read-onlyの境界を保ったか
- synthetic noteがtraining-onlyと明示されているか
- tool input schemaとunknown ID errorが明確か
- manual / MCP / errorを同じrequestで比較したか
- errorを成功に見せていないか
- process start / stopを実測したか
- production接続やsecretを追加していないか

## Bonus Mission

serverへ空の`noteId`を渡す負のtestを追加し、unknown IDと同様に明示的なtool errorになるか確認します。server sourceを変更した場合は、正しいIDが引き続き成功する両方向のEvidenceも残してください。

## Support / Fallback

MCP非対応clientでは、serverへJSON-RPC lineを手動でstdinから送り、server contractだけを確認できます。ただしclient integrationは評価できないため `unsupported` または `incomparable` とします。Node.jsやlocal process実行が禁止なら `blocked` です。

MCP config変更やprocess起動に組織承認が必要な場合はその手順を優先し、回避しません。
[Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
