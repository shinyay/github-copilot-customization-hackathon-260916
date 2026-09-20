# HC-015 最短経路で必要なコードへ到達しよう

**言語:** **日本語** / [English](../../en/challenges/hc-015/README.md)

## シナリオ

「受注の在庫引当はどこから始まり、transaction はどこで決まりますか」と聞かれました。
`allocate` を検索すると Java の同じ単語が複数見つかります。しかし、検索ヒットだけでは、
定義を読めたか、XML の import を辿れたか、実際の transaction を確認できたかは分かりません。

このシナリオでは、通常の検索でソースを探す方法、二つのファイルを最初から明示的に添付する方法、
同じ二つの未加工の全文を手動で渡す方法を試します。「最短」は速さを保証するものではありません。
準備の負担が大きい、自力検索で十分、全文が実際に投入されたか確認できない、という結果も重要です。

## この機能とは

**コンテキストの添付は情報を渡す操作、検索は情報を探す操作**です。
どちらも常設のリポジトリカスタマイズを作る必要はありません。

- **Add Context**: Chatの依頼にファイルなどを明示的に追加するUIです。このシナリオでは
  `Files & Folders` からファイルそのものを選びます。候補名の入力、シンボル、選択範囲、フォルダーの添付とは区別します。
- **text/file search**: ファイル名や文字列で候補を探します。`allocate` の一致は、
  定義、参照、呼び出し回数、実行結果の確定ではありません。
- **言語機能 / LSP**: Java 拡張などが定義・参照の位置を解決します。
  人の Go to Definition / Find All References と、Agent が Usages を使った結果は別の観察です。
- **semantic index**: 意味的に関連する箇所を探すための索引です。
  リポジトリの全文を毎回投入する機能でも、読み取り権限を付与する機能でもありません。

添付表示を確認できても、内部ですべてのバイトが使われたとは限りません。
インデックスや言語機能が未準備の場合は、結果を「0件」とせず、text/file searchで確認できる範囲に限定します。

参考:

- [Add context to chat](https://code.visualstudio.com/docs/chat/copilot-chat-context)
- [Workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context)
- [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)

## 向いていること / 向いていないこと

**向いていること**

- JavaとXMLを行き来する調査で、根拠となるパス、シンボル、範囲を残したい。
- ファイル名は分かるが、毎回検索するか、先に全文を渡すか判断したい。
- 「見つからない」という状態を、検索範囲、インデックス、言語機能、アクセス、添付範囲に切り分けたい。
- 全文準備のコストと、追加検索・追問の減り方を比較したい。

**向いていないこと**

- 添付すれば必ず速くなる、長いコンテキストほど必ず正しくなる、という保証が必要な場面。
- ソースを隠して検索側を不利にする比較。
- 検索除外を ACL として扱うこと。
- 静的なJava/XMLの読解だけで、Springのプロキシ、実際のトランザクション、DBの動作を証明すること。

## ゴール

1. `OrderService.allocate` を入口に、Java の定義と XML の transaction 設定へ到達する。
2. A2のimportからA3のbean定義をたどり、パス、範囲、未確認事項を示す。
3. text search、file read、LSP、semantic search、明示添付を混同しない。
4. A1/A2を添付または手動で提供するとき、固定版、バイト数、SHA-256を確認する。
5. 原稿の同一性、UI の添付表示、実際の内部投入範囲を別々に扱う。
6. Java、XML、設定、インデックス、拡張機能を変更せず、静的には確認できないことを残す。

## 用意するもの

- まずリポジトリ共通の [始め方](../../README.md#始め方) を完了してください。
- Git
- Node.js 22 以降
- PowerShell
- UTF-8・LF で保存できるエディター
- 通常の text/file search とファイル添付を使える Copilot Chat
- 公開Runtimeテンプレートから作成したランタイムワークスペース

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

Java拡張、JDK、Maven、DB、semantic indexは必須ではありません。
upstreamリビジョンはソースの出所を示す値であり、テンプレートから作成したランタイムワークスペースのローカル `HEAD` が
この値と一致する必要はありません。

`starter\` の内容:

| パス | 用途 |
|---|---|
| `starter\request.txt.template` | 全方法で使う固定依頼 |
| `starter\worksheets\design.md.template` | 検索順、添付、観察、停止条件の設計票 |
| `starter\worksheets\context-plan.md.template` | A1/A2 の全文供給計画 |
| `starter\worksheets\observations.md.template` | 検索、添付、追加の読み取りを記録する用紙 |
| `starter\fixtures\source-targets.json.template` | A1/A2/A3の固定パス、バイト数、SHA-256 |
| `starter\fixtures\query.json.template` | `allocate` とJava言語機能を分ける合成データ |
| `starter\fixtures\search-plan.json.template` | 検索順、インデックスの状態、除外状態を分ける合成データ |
| `starter\references\manual-input-layout.txt.template` | A1/A2 の手動全文レイアウト |
| `starter\tools\prepare-manual-input.mjs.template` | 固定ソースを照合し、手動全文を新規作成するヘルパー |

JSON は教材用の合成データで、VS Code 設定や言語サービスのイベント形式ではありません。

## 準備

この README がある `challenges\hc-015` を作業ディレクトリにします。

```powershell
$RuntimeRoot = (Resolve-Path (Read-Host 'Runtime workspace root')).Path
$RequiredSource = @(
  'wholesale-core\src\main\java\jp\co\tsubame\wholesale\service\OrderService.java',
  'wholesale-core\src\main\resources\application-context.xml',
  'wholesale-core\src\main\resources\spring\module-operations.xml'
)
$RequiredSource | ForEach-Object {
  if (-not (Test-Path -LiteralPath (Join-Path $RuntimeRoot $_) -PathType Leaf)) {
    throw "runtime workspaceにsourceがありません: $_"
  }
}
```

ローカルの `HEAD` は検査しません。ヘルパーが各ソースのバイト数とSHA-256を、upstreamテンプレートのリビジョンの固定値と
照合します。一致しない場合は既存のワークスペースをリセットせず、変更内容を確認するか、新しいランタイムワークスペースを用意してください。

固定ソース:

| ID | ランタイムワークスペースのルートからの相対パス | バイト数 / SHA-256 | 調べること |
|---|---|---|---|
| A1 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | 29357 / `a9586d7b43c4577d548180f4ea883ae522f7d97c78927f6a53e1bd48a382b072` | `allocate` の定義。333–349 行を入口に前後と参照先を読む |
| A2 | `wholesale-core/src/main/resources/application-context.xml` | 5169 / `ff96dd85980eb533693bd8df6111eead091796f3192645c50944db599d7d081c` | transaction 設定と import。44–53、82–89 行を入口に全文を読む |
| A3 | `wholesale-core/src/main/resources/spring/module-operations.xml` | 1405 / `284d8e50c62a952aecfab1b3fab6877db5eebd9c5d674e2da40d1a6ef6359eb9` | A2 から辿る bean 定義。10–14 行を入口に読む |

A1とA2の本文は合計34526バイト、A3まで含めると35931バイトです。
依頼、ファイル名、区切りのバイト数と、実際のトークン数は別です。
これらは読む候補であり、ACLではありません。必要な参照先は、同じソースのチェックアウトから追加で読めます。

作業用ひな型を新規コピーします。

```powershell
New-Item -ItemType Directory -Path .\work
Copy-Item .\starter\worksheets\design.md.template .\work\design.md
Copy-Item .\starter\worksheets\context-plan.md.template .\work\context-plan.md
Copy-Item .\starter\worksheets\observations.md.template .\work\observations.md
```

既存の `work` や宛先ファイルがある場合は上書きせず、内容と所有者を確認してください。

## 試してみる

### 1. 到達経路を設計する

回答を見る前に `work\design.md` を記入します。

- 何を「必要な根拠へ到達した」とするか。
- 検索語、対象範囲、全文を開く時点、XMLのimportをたどる基準。
- 検索、ファイルの読み取り、添付、貼り付け、追問をどのように数えるか。
- A1/A2 の全文準備と添付表示をどう確認するか。
- A3 などを追加で読む基準。
- 版の違い、切り詰め、別のタブの混入、言語機能やインデックスが不明な場合に停止する条件。

### 2. 検索から始める

新しい会話で `starter\request.txt.template` の全文を送り、A1/A2 を事前添付せずに開始します。

1. `allocate` をtext searchする。
2. 正確なパスと定義を確認し、A1の全文を読む。
3. A2 を探して全文を読む。
4. A2 の import を辿り、必要なら A3 を読む。
5. 検索した語、開いたパス、要求範囲、返却範囲、実際に読んだ範囲を記録する。

文字列一致を定義・参照解決として扱わないでください。Java 言語機能を使った場合は、
text searchとは別に、何を実行し、どの位置が返されたかを記録します。

### 3. A1/A2 を明示添付して始める

別の新しい会話で、Chat の **Add Context → Files & Folders** から A1 と A2 のファイルそのものを選びます。

- 正確なパスが二つ表示されていることを確認する。
- シンボル、選択範囲、フォルダー、同名の別ファイルで代用しない。
- 同じ `starter\request.txt.template` の全文を送る。
- A3は事前に添付せず、必要になった場合の追加の読み取りとして記録する。
- 添付表示と、内部で使われた全文の範囲を分ける。

内部投入範囲を確認できない場合は、その状態を `not-observed` として残してください。

### 4. 同じ未加工の全文を手動で用意する

添付との同等性を考えるため、A1/A2の未加工のバイト列を、ファイル名の区切り付きで一つのテキストにまとめます。
ヘルパーは `.template` のまま標準入力へ渡します。

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-manual-input.mjs.template |
  node --input-type=module - prepare --runtime-root $RuntimeRoot --output .\work\manual-input.txt

Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-manual-input.mjs.template |
  node --input-type=module - verify --runtime-root $RuntimeRoot --output .\work\manual-input.txt
```

ヘルパーはA1/A2/A3を固定値と照合し、A1/A2の未加工の全文だけを
`starter\references\manual-input-layout.txt.template` と同じ順序と区切りで新規作成します。
既存宛先は上書きしません。

別の新しい会話で、`work\manual-input.txt` 全体と同じ固定依頼を渡します。
行の削除、前後の空白除去、要約、改行変換、前の回答の追記は行わないでください。

## 任意: 比較する

検索から始めた方法、A1/A2を明示的に添付した方法、同じ未加工の全文を手動で提供した方法を比較します。
固定するのは、依頼、ソースの版、アクセス、モデル、利用可能な読み取り / 検索機能、A3の追加読み取り条件です。

見る項目は、必要な根拠へ到達したか、不要な検索や追問、全文準備の負担、
添付や貼り付けについて確認できる範囲です。時間やトークン数は、実測できた場合だけ記録します。
片方だけを要約したり、別のソース集合に変えたりしないでください。

## 確認ポイント

- `OrderService.allocate` のパス、シンボル、根拠として使える範囲に戻れるか。
- A2のトランザクション設定とimport、A3のbean定義を対応付けられるか。
- text search、ファイルの読み取り、LSP、semantic search、Add Contextを区別したか。
- A1/A2のバイト数、SHA-256、順序を確認したか。
- 準備した全文、添付表示、内部投入範囲、実際に読めた範囲を分けたか。
- A3や追加のソースを読んだ理由と範囲を記録したか。
- 静的な読解から、実際のプロキシ、トランザクション、DBの動作、過去の設計意図を断定していないか。

## 発展

- [Java の文字列検索と定義・参照を分けるガイド](optional/language-tools.md)
- [index・検索除外・開いたファイルを分けるガイド](optional/index-exclusions.md)

どちらも補足の探索ガイドです。本シナリオの完了条件ではありません。

## 制約・代替手段・安全

- ソース、Java、XML、テスト、DB、ワークスペース設定、User/Profile設定は変更しません。
- Java拡張、JDK、インデックスは自動で導入・構築しません。
- `search.exclude`、`files.exclude`、`.gitignore`、組織の content exclusion を変更・回避しません。
- 検索候補や除外を ACL として扱いません。
- A1/A2 の全文が収まらない、切り詰めが疑われる、版が違う場合は片方だけ短縮せず停止します。
- 言語機能が使えない場合はtext/file searchだけで続け、LSPの結果を作りません。
- semantic indexが未確認の場合は、semantic searchの結果を0件とせず、確認不能のまま残します。
- Copilot のファイル添付が使えない場合は、検索経路と手動全文経路、または設計票のレビューだけで完了できます。
- ヘルパーを使えない場合はA1/A2を複製せず、固定されたパス、ハッシュ、レイアウトを使って、提供計画だけをレビューしてください。
