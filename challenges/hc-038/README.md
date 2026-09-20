# HC-038 Cloud Hookの失敗を正しく分類しよう

**言語:** **日本語** / [English](../../en/challenges/hc-038/README.md)

## シナリオ

Cloud Agent の開始時とツールの使用前に、チェッカーを呼び出す設計を考えます。「Hook が宣言された」「イベントで呼び出された」「チェッカーが応答した」「ツールの使用が許可された」は、それぞれ別の観測です。さらに、deny、コマンドエラー、タイムアウト、HTTP エラーを一つの失敗として扱うと、停止すべき場面と通常の権限判断へ戻る場面を取り違えてしまいます。

同じチェッカー全文と E01〜E12 の合成パケットを使い、12行の診断表と、不活性な `sessionStart` / `preToolUse` の接続案を作ります。実際の Hook は有効化しません。

## この機能とは

Hook は、所定のイベントで外部チェッカーを呼び出すカスタマイズです。

- `sessionStart`: セッション開始時の準備確認です。成功しても、後続のすべてのツールが保護された証拠にはなりません。
- `preToolUse`: ツールを使用する直前の判断です。Cloud では、ローカルの対話型承認と同じ動作になると仮定しません。

`preToolUse` の代表的な入力は `sessionId`、`timestamp`、`cwd`、`toolName`、`toolArgs` です。出力には `permissionDecision` を使い、deny の場合は `permissionDecisionReason` も使います。フィクスチャの `reportedEvent` や `checkerExit` は教材用の観測フィールドであり、製品のフィールドではありません。

失敗境界は次のように分けます。

| 状況 | 扱い |
|---|---|
| 明示的なallow | 権限判断の候補。ツールの完了は別の観測 |
| 明示的なdeny + reason | deny |
| Cloudの `ask` | 対話待ちではなくdeny |
| コマンドのクラッシュ / 0以外の終了コード | 標準出力がallowを示すように見えてもdeny |
| コマンドのタイムアウト | 文書化されたfail-open。通常の権限判断へ戻る |
| HTTPのネットワークエラー / 2xx以外 / タイムアウト | fail-open。通信やツール完了の成功を意味しない |
| 空の標準出力 / 不正なJSON | 明示的なallowと同一視しない |

## 向いていること / 向いていないこと

**向いていること**

- 宣言、呼び出し、チェッカーの結果、権限判断、ツールの結果を分ける。
- コマンドと HTTP で異なる障害時の扱いを区別する。
- チェッカーが動作しないときの停止担当、再確認、復旧方法を決める。
- 有効化する前に、JSON の草稿と安全上の境界をレビューする。

**向いていないこと**

- 単純な語句照合を行うチェッカーを、完全な防壁と見なす。
- チェッカーを読んだだけで、イベントが発火したと判断する。
- タイムアウトや HTTP 503 を、コマンドが0以外で終了した場合と同じdenyとして扱う。
- 本編から default branch、ファイアウォール、エンドポイント、シークレットを変更する。

## ゴール

[`starter/diagnosis-design.md.template`](starter/diagnosis-design.md.template) のE01〜E12を埋め、次を説明できるようにします。

1. 宣言されたイベントと、観測された呼び出しの違い
2. チェッカーや通信の結果と、製品の出力の違い
3. `sessionStart` と `preToolUse` の責任分界
4. denyとfail-openの違い
5. 追加操作を止める人、再開を承認する人、必要な追加の観測

## 用意するもの

- テキストエディター
- bash の原稿と JSON を読める環境
- `starter/` 以下の固定資料
- CloudやHookの利用資格は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`diagnosis-design.md.template`](starter/diagnosis-design.md.template) | 12個のパケットの診断表 |
| [`fixtures/events.json.template`](starter/fixtures/events.json.template) | E01〜E12 |
| [`tools/checker.sh.template`](starter/tools/checker.sh.template) | 両イベントで共通して使う不活性なチェッカー |
| [`reference/hook-contract.md.template`](starter/reference/hook-contract.md.template) | フィールドと障害時の境界 |
| [`hooks-session-start.json.template`](starter/customization/hooks-session-start.json.template)、[`hooks-pre-tool.json.template`](starter/customization/hooks-pre-tool.json.template) | 不活性な Hook JSON の例 |

すべて `.template` のまま扱います。

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。最初に、チェッカー、パケット、判断規則、設計のリビジョンを固定します。

JSON例は `starter/tools/checker.sh.template` を参照する教材用原稿です。`.github/hooks/` やdefault branchへコピーしません。

## 試してみる

1. `reference/hook-contract.md.template` を読み、製品のフィールドとフィクスチャのフィールドを分けます。
2. `tools/checker.sh.template` を読み、手動で読んで分かることと、イベントの発火について分からないことを書きます。
3. E01〜E12 を順に確認します。

| パケット | 固定状況 |
|---|---|
| E01 | `sessionStart` を宣言、呼び出しの観測なし |
| E02 | `sessionStart` を呼び出し、終了コード0 |
| E03 | `sessionStart` を呼び出し、終了コードは0以外 |
| E04 | コマンドの終了コード0、allow |
| E05 | コマンドの終了コード0、deny + reason |
| E06 | コマンドの終了コード0、ask |
| E07 | コマンドの終了コード1 |
| E08 | コマンドの終了コード2、標準出力はallowを示すように見える |
| E09 | HTTP 503 |
| E10 | コマンドのタイムアウト |
| E11 | HTTPのタイムアウト |
| E12 | コマンドの終了コード0、標準出力は空 |

4. 各行に、宣言されたイベント、呼び出しの根拠、通信、チェッカーの結果、製品フィールドの妥当性、想定される扱い、停止条件と復旧方法を書きます。
5. `customization/` の2つの JSON を読み、チェッカーのバイト列を変えずに、イベントごとの責任範囲だけを比較します。
6. fail-open の後に通常の判断へ戻せる条件と、人が確認するまで停止する条件を分けます。

## 任意: 比較する

最初にチェッカーとパケットだけを使って手動で診断し、その後、Hook の接続案を読んで診断を見直します。追加されたのが「イベント接続の責任分界」なのか、「チェッカー自体の能力」なのかを分けてください。

## 確認ポイント

- E01〜E12が欠けていない。
- 宣言、呼び出し、終了コードや応答、権限判断、ツールの完了を分けている。
- `permissionDecision` とフィクスチャ独自のフィールドを混同していない。
- `ask`、コマンドの0以外の終了コード、コマンドのタイムアウト、HTTP エラー、空の標準出力を区別している。
- fail-open をツールの成功と見なしていない。
- 有効な Hook や実際の Cloud 観測を作ったことにしていない。

## 発展

- 不正な JSON またはイベント情報が欠けたパケットを1つ追加し、必要な観測と停止担当だけを設計する。
- 実環境で確認する場合は、[sessionStart の限定観測](optional/session-start-live.md) または [preToolUse の限定観測](optional/pre-tool-live.md) を参照する。

## 制約・代替手段・安全

- 本編では Hook、チェッカー、エンドポイント、ファイアウォール、シークレット、default branch を変更しない。
- チェッカー、パケット、製品フィールドの根拠を固定できない場合は停止する。
- Cloud や bash の実行環境がなくても、テキストだけで診断表と復旧設計を完成できる。
- JDK、Java アプリ、外部エンドポイントは不要です。実行していないものを成功扱いしない。
- プロンプト全文や秘密情報をログへ残す設計にしない。
