# HC-018 承認と隔離の境界を可視化しよう

## Scenario

「コマンドが動かなかったので安全でした」という報告だけでは、何が起きたか分かりません。tool 候補がなかった、承認待ちだった、人が拒否した、OS が拒否した、プログラム自身が失敗した、という状態はそれぞれ意味が異なります。

この演習では、無害な `node --version` と 7 件の合成 event packet を使い、**誰がどの境界を確認したか**を説明できる運用票を作ります。承認を減らすことや sandbox を有効化すること自体は目標ではありません。

## この機能とは

tool を使う処理は、少なくとも次の段階に分けて考えます。

| 段階 | 確認する問い |
|---|---|
| tool 選択 | その操作を提案できる tool が候補にあるか |
| proposal | 実行前に、何を行う提案が作られたか |
| approval | 人または既存規則が、その操作を許可したか |
| execution | 許可後にプログラムの起動が始まったか |
| sandbox / OS 境界 | 実行 host の OS が操作を許したか |
| program result | 起動したプログラム自身が成功・失敗したか |

Instructions の「実行しないでください」は自然言語の依頼で、OS による強制拒否とは別です。次の設定値 `false` も、この演習では **ask に戻す案であり deny ではありません**。

```json
{
  "chat.tools.terminal.enableAutoApprove": false
}
```

設定例は `.template` の不活性な sample として読むだけで、`.vscode/settings.json` や User settings へ適用しません。

参考: [Use tools with agents](https://code.visualstudio.com/docs/agents/run/tools)

## 向いていること / 向いていないこと

**向いていること**

- proposal、approval、execution、result、停止理由を別欄で記録する
- 人が判断する位置と、承認前に見る情報を設計する
- packet にない情報を unknown のまま残す
- live 実行や追加設定なしで境界を学ぶ

**向いていないこと**

- prompt を出すため既存 approval rules を reset する
- Allow all、global auto approve、Autopilot、Assisted permissions を有効にする
- 人の拒否後に別 tool、別 shell、CLI 直実行で迂回する
- 正常出力や一件の EACCES から、すべての tool や OS の隔離を証明する

## ゴール

次を説明できる境界図と観察記録を作ります。

1. tool 選択から program result までの各段階
2. 人が承認前に確認する command、cwd、変更範囲、network、期待出力
3. pending、deny、OS error、program error、情報不足の違い
4. 合成 packet、通常の manual 観察、実 sandbox 観察の違い
5. unknown で停止する条件と、追加設定を作らない判断

## 用意するもの

- Markdown と JSON を読めるエディター
- この directory の `starter/`
- 任意: Node.js と、通常の承認を表示できる terminal tool

`starter/` にはすべて不活性な `.template` として次を用意しています。

- [固定依頼](starter/request.txt.template)
- [固定 command](starter/materials/command.txt.template)
- [7 件の合成 packet](starter/materials/synthetic-events.md.template)
- [未適用の設定例](starter/materials/auto-approve-setting.json.template)
- [設計用紙](starter/worksheets/design.md.template)
- [境界 map](starter/worksheets/boundary-map.md.template)
- [観察 log](starter/worksheets/observation-log.md.template)

## 準備

1. Repository 全体の共通準備は [#始め方](../../README.md#始め方) を参照します。
2. `starter/` の `.template` はそのまま残し、記入用のコピーを任意の作業場所へ作ります。
3. 合成 packet は VS Code の正式 event schema でも実ログでもないことを確認します。
4. live 観察を行う場合は、Node.js、terminal tool、通常承認、現在の approval rules の見える範囲を確認します。
5. prompt を発生させるための設定変更や approval reset は行いません。

固定 command:

```text
node --version
```

固定依頼:

> このコマンドだけを提案し、必要な通常承認を待ち、許可された場合だけ出力を示してください。設定・ファイル・ネットワーク・別toolは変更しないでください。

7 件の合成 case:

| case | 固定された境界 |
|---|---|
| 候補なし | tool 未選択、event なし |
| 承認 pending | proposal 後、decision は pending、execution なし |
| 人の deny | proposal 後、人が deny、execution なし |
| OS 側 EACCES | allow-once 後に execution、OS layer の EACCES、nonzero exit |
| 正常出力 | allow-once 後に execution、program layer の合成出力 `v22.16.0\n`、exit 0 |
| program error | allow-once 後に execution、program 自身の error |
| 情報不足 | 必要な event または exit status が欠け、原因を確定できない |

`v22.16.0` は packet 内の合成値であり、手元の Node.js version ではありません。

## 試してみる

1. **境界を設計する**
   tool candidate、proposal、approval、execution、OS / sandbox result、program result、cleanup を設計用紙へ分けて書きます。
2. **人の確認項目を決める**
   allow-once / deny の前に見る command、cwd、変更範囲、network 使用、期待出力を境界 map に記録します。
3. **7 packet を分類する**
   各 packet が示す事実だけを観察 log へ転記し、欠けている情報を補いません。
4. **停止条件を適用する**
   pending と deny では execution なし、原因不明では unknown、EACCES だけでは実 sandbox 成功を証明しない、と整理します。
5. **設定例をレビューする**
   `false` が ask と deny のどちらを意味するか説明し、設定適用が不要ならその理由を書きます。
6. **Copilot にレビューを依頼する**
   固定依頼と記入済み用紙を渡し、別 command、設定変更、network、file 書込みを提案しないよう明示します。

## 任意: 比較する

同じ 7 packet を、最初は自由形式、次は境界 map を使って手動分類し、次だけを比較できます。

- proposal と approval を混同しなかったか
- execution の開始を確認できたか
- OS result と program result を分けたか
- 情報不足を unknown のまま止めたか

live 観察が事前に許可されている場合は、この演習全体で固定 command を最大 1 回だけ提案できます。prompt が出なくても再試行や設定変更をせず、人が deny したら停止します。CLI 直実行を approval 観察の代わりにしません。

## 確認ポイント

- tool 選択、proposal、approval、execution、OS / sandbox、program result を区別している
- fixed command と固定依頼を変えていない
- 7 件の合成 packet と live 観察を無標識で混ぜていない
- `false` を deny として扱っていない
- deny 後の迂回や approval reset をしていない
- exit status 欠測や原因不明を unknown のままにしている
- 同等、追加不要、未観測、比較不能を有効な結論としている

## 発展

- [terminal sandbox を評価する探索ガイド](optional/terminal-sandbox.md)
- [stdio MCP sandbox を評価する探索ガイド](optional/mcp-sandbox.md)
- 合成 packet の一つへ event 順序の不整合を一つだけ追加し、どの境界で検出して停止するか説明する

## 制約・Fallback・安全

- `.vscode/settings.json`、User settings、既存 approval rules を作成・変更しません。
- Allow all、global auto approve、Autopilot、Assisted permissions を有効にしません。
- 固定 command 以外の shell command、file 書込み、network 確認、別 tool を追加しません。
- terminal tool や Node.js を利用できなくても、7 件の合成 packet だけで完了できます。
- CLI で実行した結果を、agent の proposal / approval を観察した結果へ読み替えません。
- EACCES packet、正常出力、設定例だけで実 sandbox の有効性を主張しません。
- 整理するのは自分で作った作業コピーだけです。既存設定、approval rules、他人の workspace は変更しません。
