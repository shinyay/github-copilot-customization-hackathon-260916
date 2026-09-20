# HC-018 承認と隔離の境界を可視化しよう

**言語:** **日本語** / [English](../../en/challenges/hc-018/README.md)

## シナリオ

「コマンドが動かなかったので安全でした」という報告だけでは、何が起きたか分かりません。ツールの候補がなかった、承認待ちだった、人が拒否した、OSが拒否した、プログラム自体が失敗した、という状態は、それぞれ意味が異なります。

この演習では、無害な `node --version` と7件の合成イベントパケットを使い、**誰がどの境界を確認したか**を説明できる運用票を作ります。承認を減らすことや、sandboxを有効にすること自体は目標ではありません。

## この機能とは

ツールを使う処理は、少なくとも次の段階に分けて考えます。

| 段階 | 確認する問い |
|---|---|
| ツール選択 | その操作を提案できるツールが候補にあるか |
| `proposal` | 実行前に、何を行う提案が作られたか |
| `approval` | 人または既存の規則が、その操作を許可したか |
| `execution` | 許可後にプログラムの起動が始まったか |
| sandbox / OS境界 | 実行ホストのOSが操作を許可したか |
| プログラムの結果 | 起動したプログラム自体が成功したか、失敗したか |

Instructions の「実行しないでください」は自然言語の依頼で、OS による強制拒否とは別です。次の設定値 `false` も、この演習では **ask に戻す案であり deny ではありません**。

```json
{
  "chat.tools.terminal.enableAutoApprove": false
}
```

設定例は `.template` の不活性なサンプルとして読むだけで、`.vscode/settings.json` やUser settingsには適用しません。

参考: [Use tools with agents](https://code.visualstudio.com/docs/agents/run/tools)

## 向いていること / 向いていないこと

**向いていること**

- `proposal`、`approval`、`execution`、結果、停止理由を別々の欄に記録する
- 人が判断する位置と、承認前に見る情報を設計する
- パケットにない情報を `unknown` のまま残す
- 実際の実行や追加設定なしで境界を学ぶ

**向いていないこと**

- プロンプトを表示させるために既存の承認規則をリセットする
- Allow all、global auto approve、Autopilot、Assisted permissions を有効にする
- 人が拒否した後に、別のツール、別のシェル、CLIからの直接実行で迂回する
- 正常な出力や1件のEACCESから、すべてのツールやOSの隔離を証明する

## ゴール

次を説明できる境界図と観察記録を作ります。

1. ツールの選択からプログラムの結果までの各段階
2. 人が承認前に確認するコマンド、cwd、変更範囲、ネットワーク、期待する出力
3. `pending`、`deny`、OSエラー、プログラムエラー、情報不足の違い
4. 合成パケット、通常のManualによる観察、実際のsandboxの観察の違い
5. `unknown` で停止する条件と、追加設定を作らないという判断

## 用意するもの

- Markdown と JSON を読めるエディター
- このディレクトリの `starter/`
- 補足: Node.jsと、通常の承認を表示できるターミナルツール

`starter/` にはすべて不活性な `.template` として次を用意しています。

- [固定依頼](starter/request.txt.template)
- [固定コマンド](starter/materials/command.txt.template)
- [7件の合成パケット](starter/materials/synthetic-events.md.template)
- [未適用の設定例](starter/materials/auto-approve-setting.json.template)
- [設計用紙](starter/worksheets/design.md.template)
- [境界マップ](starter/worksheets/boundary-map.md.template)
- [観察ログ](starter/worksheets/observation-log.md.template)

## 準備

1. リポジトリ全体の共通準備は [#始め方](../../README.md#始め方) を参照します。
2. `starter/` の `.template` はそのまま残し、記入用のコピーを任意の作業場所へ作ります。
3. 合成パケットは、VS Codeの正式なイベントスキーマでも実際のログでもないことを確認します。
4. 実際に観察する場合は、Node.js、terminalツール、通常の承認、現在の承認規則を確認できる範囲を調べます。
5. プロンプトを表示させるための設定変更や承認規則のリセットは行いません。

固定コマンド:

```text
node --version
```

固定依頼:

> このコマンドだけを提案し、必要な通常承認を待ち、許可された場合だけ出力を示してください。設定・ファイル・ネットワーク・別toolは変更しないでください。

7件の合成ケース:

| ケース | 固定された境界 |
|---|---|
| 候補なし | ツールが未選択、イベントなし |
| 承認待ち | `proposal` 後、`decision` は `pending`、`execution` なし |
| 人による拒否 | `proposal` 後、人が `deny`、`execution` なし |
| OS側のEACCES | `allow-once` 後に `execution`、OSレイヤーのEACCES、0以外の終了値 |
| 正常出力 | `allow-once` 後に `execution`、プログラムレイヤーの合成出力 `v22.16.0\n`、終了値0 |
| プログラムエラー | `allow-once` 後に `execution`、プログラム自体のエラー |
| 情報不足 | 必要なイベントまたは終了ステータスが欠け、原因を確定できない |

`v22.16.0` はパケット内の合成値であり、手元のNode.jsのバージョンではありません。

## 試してみる

1. **境界を設計する**
   ツールの候補、`proposal`、`approval`、`execution`、OS / sandboxの結果、プログラムの結果、後片付けを設計用紙に分けて書きます。
2. **人の確認項目を決める**
   `allow-once` / `deny` の前に確認するコマンド、cwd、変更範囲、ネットワークの使用、期待する出力を境界マップに記録します。
3. **7件のパケットを分類する**
   各パケットが示す事実だけを観察ログに転記し、欠けている情報は補いません。
4. **停止条件を適用する**
   `pending` と `deny` では `execution` なし、原因不明では `unknown`、EACCESだけでは実際のsandboxの成功を証明しない、と整理します。
5. **設定例をレビューする**
   `false` が `ask` と `deny` のどちらを意味するか説明し、設定の適用が不要であれば、その理由を書きます。
6. **Copilot にレビューを依頼する**
   固定依頼と記入済みの用紙を渡し、別のコマンド、設定変更、ネットワーク、ファイルへの書き込みを提案しないよう明示します。

## 任意: 比較する

同じ7件のパケットを、最初は自由形式で、次は境界マップを使って手動で分類し、次の項目だけを比較できます。

- proposal と approval を混同しなかったか
- execution の開始を確認できたか
- OS result と program result を分けたか
- 情報不足を unknown のまま止めたか

実際の観察が事前に許可されている場合は、この演習全体で固定コマンドを最大1回だけ提案できます。プロンプトが表示されなくても再試行や設定変更は行わず、人が `deny` したら停止します。CLIからの直接実行を、`approval` の観察の代わりにしません。

## 確認ポイント

- ツールの選択、`proposal`、`approval`、`execution`、OS / sandbox、プログラムの結果を区別している
- 固定コマンドと固定依頼を変えていない
- 7件の合成パケットと実際の観察を、区別せずに混ぜていない
- `false` を `deny` として扱っていない
- `deny` 後の迂回や承認規則のリセットをしていない
- 終了ステータスの欠測や原因不明を `unknown` のままにしている
- 同等、追加不要、未観測、比較不能を有効な結論としている

## 発展

- [terminal sandbox を評価する探索ガイド](optional/terminal-sandbox.md)
- [stdio MCP sandbox を評価する探索ガイド](optional/mcp-sandbox.md)
- 合成パケットの一つにイベント順序の不整合を一つだけ追加し、どの境界で検出して停止するか説明する

## 制約・代替手段・安全

- `.vscode/settings.json`、User settings、既存の承認規則は作成も変更もしません。
- Allow all、global auto approve、Autopilot、Assisted permissions を有効にしません。
- 固定コマンド以外のシェルコマンド、ファイルへの書き込み、ネットワークの確認、別のツールは追加しません。
- terminalツールやNode.jsを利用できなくても、7件の合成パケットだけで完了できます。
- CLIで実行した結果を、Agentの `proposal` / `approval` を観察した結果として扱いません。
- EACCESのパケット、正常な出力、設定例だけを根拠に、実際のsandboxが有効であると主張しません。
- 整理するのは自分で作った作業用コピーだけです。既存設定、承認規則、他人のワークスペースは変更しません。
