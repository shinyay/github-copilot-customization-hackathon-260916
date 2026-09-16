# HC-008 大きな調査を二人のSubagentへ任せよう

## Scenario

受注機能の保守引継ぎで、「画面から入る注文」と「CSVから入る注文」を説明することになりました。1つのAgentが順に読む方法もありますが、入口ごとに独立して調べられるなら、2つのSubagentへ分けてから親が統合できます。

ただし、2人分の文章を並べるだけでは、読んだ範囲、引用、未確認事項が統合時に消えることがあります。このシナリオでは、調査の **分け方**、子へ渡す **完全な入力**、親へ戻す **根拠付きの形式** を設計します。速さや子の数を競う課題ではありません。

## この機能とは

Subagentは、親Agentから限定された仕事を受け、別のコンテキストで調べて結果を返す担当です。通常の回答に「画面担当」「バッチ担当」という見出しを出すだけでは、Subagentを呼び出したことにはなりません。clientが表示するtool callや実行表示で、実際の委任と返却を区別します。

VS Codeでの使い方は [Run subagents in Visual Studio Code](https://code.visualstudio.com/docs/agents/run/subagents) を参照してください。clientによって呼出し方法や表示は異なります。VS Codeでは子がstatelessであるため、同じ子への追質問を前提にせず、最初の依頼へ必要なscope、資料、安全条件、返却形式を全て含めます。親のmodelやtoolsを継承する場合でも、実効値を観測できなければ推測しません。

別コンテキストは、別worktreeやfile systemの隔離を意味しません。このシナリオでは親も子もsourceを読むだけにします。また、**最大2子、各1回、入れ子なし、再試行ループなし** を教材上の安全上限にします。これは製品全体の一律上限ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 先の担当の結論を待たずに読める複数の範囲
- 各範囲に明確なsource boundaryと返却形式がある調査
- 親が複数の返却を照合し、根拠を残して統合できる作業
- 子へ一度で完全な依頼を渡せる作業

**向いていないこと**

- 1つの短いcall chainを複数人で重複して追うだけの調査
- 頻繁な追質問や長い共同編集が必要な作業
- 子ごとに同じfileを変更させる作業
- DBの実状態、運用上の再送安全性、利用者の権限をstatic readingだけで証明すること

「この大きさならSubagentを使わない」という判断も有効です。委任は正解、速度、安さ、並列実行を保証しません。

## ゴール

- web入口とbatch入口を重ならないscopeへ分ける
- 各Subagentへ必要な入力を最初の1回で全て渡す
- 各返却を最大5項目の「観測 / path・symbol・line range / 限界」にそろえる
- 親が両入口、比較できる点、未確認事項へ統合する
- 人が各入口から最低1項目をsourceへ戻して確認する
- Subagentが使えない場合も、手動のfresh conversationで同じ設計を試せるようにする

## 用意するもの

- Subagentを利用できるGitHub Copilot client。利用できない場合はfresh conversationを3つ作れる環境
- 題材のJava sourceを含む作業用リポジトリ
- このディレクトリの不活性な素材

| 素材 | 用途 |
|---|---|
| [`starter/request.txt.template`](starter/request.txt.template) | 親へ渡す固定依頼 |
| [`starter/packets/web-entry.md.template`](starter/packets/web-entry.md.template) | web担当の固定scopeと安全条件 |
| [`starter/packets/batch-entry.md.template`](starter/packets/batch-entry.md.template) | batch担当の固定scopeと安全条件 |
| [`starter/worksheets/design.md.template`](starter/worksheets/design.md.template) | 分割と統合を先に決める |
| [`starter/worksheets/returns.md.template`](starter/worksheets/returns.md.template) | 2つの返却を改変せず記録する |
| [`starter/worksheets/synthesis.md.template`](starter/worksheets/synthesis.md.template) | 親の統合と人の点検を分ける |
| [`starter/worksheets/comparison.md.template`](starter/worksheets/comparison.md.template) | 任意の手動セルフチェック |

JDK、Maven、database、server、追加extensionは不要です。

## 準備

1. 共通の準備は [始め方](../../README.md#始め方) に従い、作業用リポジトリで行います。
2. 次の6ファイルを読めることを確認します。

   | 担当 | source |
   |---|---|
   | web | `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java` |
   | web | `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java` |
   | web | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` |
   | batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderCsv.java` |
   | batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` |
   | batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` |

3. `starter/worksheets/design.md.template` を自分のメモへコピーし、回答を見る前に分ける理由、返却順、統合方法、停止条件を記入します。固定source、各packet最大5項目、安全条件は変えません。
4. `request.txt.template`、2つのpacket、完成したdesignを親Agentへ渡せるようにします。file添付を子が自動で読めるとは仮定せず、子への依頼には該当packetとdesignの必要部分を明示します。
5. 親と子がsourceを読むだけで、fileを生成・変更しないことを確認します。worksheetへの記録は人が行います。

## 試してみる

1. 親Agentのfresh conversationへ、固定request、web packet、batch packet、完成したdesignを渡します。
2. 親へ、webとbatchを最大2つのSubagentへ1回ずつ委任するよう依頼します。各子には次を最初から含めます。
   - 担当するpacketの全文
   - 固定したdesignの返却形式と停止条件
   - 読めるsourceのexact path
   - 最大5項目という上限
   - read-only、入れ子なし、再試行なし、model上書きなしという安全条件
3. clientがSubagentの呼出しを表示する場合は、2つの実際の呼出しと返却を確認します。表示されない場合は「観測できない」とし、回答の見出しだけから起動を推測しません。
4. 各返却が「観測 / path・symbol・line range / 限界」を保っているか確認します。別担当の結果や親の過去の会話を知っている前提が混ざっていたら採用しません。
5. 親に次の4区分で統合させます。
   - 画面入口
   - CSV入口
   - 比較できる点
   - 未確認事項
6. `returns.md.template` と `synthesis.md.template` を使い、子の返却全文、親の統合、人の点検を分けて残します。
7. 人がwebとbatchから最低1項目ずつsourceを開き直し、path、symbol、line range、claim、限界が一致するか確認します。

追加sourceが必要になった場合、子は読まずにpathと理由をunknownへ返します。webとbatchが同じ業務経路だと推測したり、片方の根拠をもう片方へ流用したりしません。

## 任意: 比較する

同じrequest、2つのpacket、design、source、model、toolsをできるだけそろえ、次を1回ずつ手動で試します。

- 1つのAgentが両packetを順に直接調査して統合する
- 親がwebとbatchを2つのSubagentへ分けて統合する

`comparison.md.template` を使い、sourceへ戻れる項目数、unknownの保持、重複調査、誤引用、統合作業量を比べます。時間やcostを表示できない環境では推測しません。入力や機能をそろえられない場合は優劣を決めません。

## 確認ポイント

- 見出しだけでなく、実際のSubagent呼出しを観測できた
- 子へ該当packetと必要なdesignを最初の1回で全て渡した
- 子を2つより多く起動していない
- 入れ子、追質問、再試行ループ、model上書きを追加していない
- 各返却にpath、symbol、line range、限界がある
- 親の統合でunknownが断言へ変わっていない
- webとbatchの根拠が混ざっていない
- 人が両入口から最低1項目をsourceと照合した

## 発展

同じ2つの返却を再利用し、統合する順番だけを逆にした案を紙上で作ります。どのunknownや限界が先頭の返却へ引っ張られて消えやすいかを確認してください。新しいSubagentは起動せず、元の返却も変更しません。

## 制約・Fallback・安全

- Subagentを使えない場合は、人がwebとbatchを別々のfresh conversationへ渡し、2つの返却全文を第三のfresh conversationへ運んで統合します。これはSubagent実行ではなく手動handoffです。
- read toolを使えない場合は、人が許可sourceを読み、設計と統合の練習だけを行います。
- 指定した6ファイル以外が必要になった時点で、そのpathと理由をunknownにして止めます。
- 実データ、資格情報、private logを読みません。
- DB、server、build、test、shell、無許可networkを実行しません。
- source、設定、文書をAgentへ変更させません。
- 別コンテキストをfile systemの隔離とみなしません。
- Subagentのmodel、tools、並列性を表示から確認できない場合は、既定値を推測しません。
