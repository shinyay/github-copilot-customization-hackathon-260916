# HC-015 最短経路で必要なコードへ到達しよう

## Scenario

「受注の在庫引当はどこから始まり、transaction はどこで決まりますか」と聞かれました。
`allocate` を検索すると Java の同じ単語が複数見つかります。しかし、検索ヒットだけでは、
定義を読めたか、XML の import を辿れたか、実際の transaction を確認できたかは分かりません。

このシナリオでは、通常の検索で source を探す方法、二つのファイルを最初から明示添付する方法、
同じ二つの raw 全文を手動で渡す方法を試します。「最短」は速さの保証ではありません。
準備の負担が大きい、自力検索で十分、全文が実際に投入されたか確認できない、という結果も重要です。

## この機能とは

**コンテキストの添付は情報を渡す操作、検索は情報を探す操作**です。
どちらも常設の repository customization を作る必要はありません。

- **Add Context**: Chat の依頼へファイルなどを明示する UI です。このシナリオでは
  `Files & Folders` からファイルそのものを選びます。候補名の入力、symbol、selection、folder 添付とは区別します。
- **text/file search**: ファイル名や文字列で候補を探します。`allocate` の一致は、
  定義、参照、呼出し回数、実行結果の確定ではありません。
- **言語機能 / LSP**: Java 拡張などが定義・参照の位置を解決します。
  人の Go to Definition / Find All References と、Agent が Usages を使った結果は別の観察です。
- **semantic index**: 意味的に関連する箇所を探すための索引です。
  repository 全文を毎回投入する機能でも、読取権限を付与する機能でもありません。

添付表示を確認できても、内部で全 bytes が使われたとは限りません。
index や言語機能が未準備の場合は、結果を「0 件」にせず、text/file search で確認できる範囲へ限定します。

参考:

- [Add context to chat](https://code.visualstudio.com/docs/chat/copilot-chat-context)
- [Workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context)
- [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)

## 向いていること / 向いていないこと

**向いていること**

- Java と XML を行き来する調査で、根拠となる path・symbol・範囲を残したい。
- ファイル名は分かるが、毎回検索するか、先に全文を渡すか判断したい。
- 「見つからない」を、検索範囲、index、言語機能、アクセス、添付範囲へ切り分けたい。
- 全文準備のコストと、追加検索・追問の減り方を比較したい。

**向いていないこと**

- 添付すれば必ず速い、長い context ほど必ず正しい、という保証が必要な場面。
- source を隠して検索側を不利にする比較。
- 検索除外を ACL として扱うこと。
- 静的な Java/XML の読解だけで、Spring proxy、実 transaction、DB 動作を証明すること。

## ゴール

1. `OrderService.allocate` を入口に、Java の定義と XML の transaction 設定へ到達する。
2. A2 の import から A3 の bean 定義を辿り、path・範囲・未確認事項を示す。
3. text search、file read、LSP、semantic search、明示添付を混同しない。
4. A1/A2 を添付または手動供給するとき、固定版・byte 数・SHA-256 を確認する。
5. 原稿の同一性、UI の添付表示、実際の内部投入範囲を別々に扱う。
6. Java、XML、設定、index、拡張を変更せず、静的に確認できないことを残す。

## 用意するもの

- まずリポジトリ共通の [始め方](../../README.md#始め方) を完了してください。
- Git
- Node.js 22 以降
- PowerShell
- UTF-8・LF で保存できるエディター
- 通常の text/file search とファイル添付を使える Copilot Chat
- 公開Runtime templateから作成したruntime workspace

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

Java 拡張、JDK、Maven、DB、semantic index は必須ではありません。
upstream revisionはsourceの出所であり、templateから作ったruntime workspaceのlocal `HEAD` が
この値と一致することは要求しません。

`starter\` の内容:

| パス | 用途 |
|---|---|
| `starter\request.txt.template` | 全方法で使う固定依頼 |
| `starter\worksheets\design.md.template` | 検索順、添付、観察、停止条件の設計票 |
| `starter\worksheets\context-plan.md.template` | A1/A2 の全文供給計画 |
| `starter\worksheets\observations.md.template` | 検索・添付・追加読取を記録する用紙 |
| `starter\fixtures\source-targets.json.template` | A1/A2/A3 の固定 path、byte 数、SHA-256 |
| `starter\fixtures\query.json.template` | `allocate` と Java 言語機能を分ける合成データ |
| `starter\fixtures\search-plan.json.template` | 検索順・index 状態・除外状態を分ける合成データ |
| `starter\references\manual-input-layout.txt.template` | A1/A2 の手動全文レイアウト |
| `starter\tools\prepare-manual-input.mjs.template` | 固定 source を照合し、手動全文を新規作成する helper |

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

local `HEAD` は検査しません。helperが各sourceのbyte数とSHA-256をupstream template revisionの固定値へ
照合します。一致しない場合は既存workspaceをresetせず、変更内容を確認するか新しいruntime workspaceを用意してください。

固定 source:

| ID | runtime workspace root からの相対パス | byte 数 / SHA-256 | 調べること |
|---|---|---|---|
| A1 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | 29357 / `a9586d7b43c4577d548180f4ea883ae522f7d97c78927f6a53e1bd48a382b072` | `allocate` の定義。333–349 行を入口に前後と参照先を読む |
| A2 | `wholesale-core/src/main/resources/application-context.xml` | 5169 / `ff96dd85980eb533693bd8df6111eead091796f3192645c50944db599d7d081c` | transaction 設定と import。44–53、82–89 行を入口に全文を読む |
| A3 | `wholesale-core/src/main/resources/spring/module-operations.xml` | 1405 / `284d8e50c62a952aecfab1b3fab6877db5eebd9c5d674e2da40d1a6ef6359eb9` | A2 から辿る bean 定義。10–14 行を入口に読む |

A1 と A2 の本文は合計 34526 bytes、A3 まで含めると 35931 bytes です。
依頼、ファイル名、区切りの bytes と、実際の token 数は別です。
これらは読む候補であり ACL ではありません。必要な参照先は同じ source checkout から追加で読めます。

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
- 検索語、対象範囲、全文を開く時点、XML import を辿る基準。
- 検索、file read、添付、貼付、追問をどう数えるか。
- A1/A2 の全文準備と添付表示をどう確認するか。
- A3 などを追加で読む基準。
- 版違い、切り詰め、別タブ混入、言語機能・index 不明で止める条件。

### 2. 検索から始める

新しい会話で `starter\request.txt.template` の全文を送り、A1/A2 を事前添付せずに開始します。

1. `allocate` を text search する。
2. exact path と定義を確認し、A1 全文を読む。
3. A2 を探して全文を読む。
4. A2 の import を辿り、必要なら A3 を読む。
5. 検索した語、開いた path、要求範囲、返却範囲、実際に読んだ範囲を記録する。

文字列一致を定義・参照解決として扱わないでください。Java 言語機能を使った場合は、
text search とは別に何を実行し、どの位置が返ったか記録します。

### 3. A1/A2 を明示添付して始める

別の新しい会話で、Chat の **Add Context → Files & Folders** から A1 と A2 のファイルそのものを選びます。

- exact path が二つ表示されていることを確認する。
- symbol、selection、folder、同名別ファイルで代用しない。
- 同じ `starter\request.txt.template` の全文を送る。
- A3 は事前添付せず、必要になった追加読取として記録する。
- 添付表示と、内部で使われた全文の範囲を分ける。

内部投入範囲を確認できない場合は、その状態を `not-observed` として残してください。

### 4. 同じ raw 全文を手動で用意する

添付との同等性を考えるため、A1/A2 の raw bytes を filename delimiter 付きで一つのテキストへまとめます。
helper は `.template` のまま標準入力へ渡します。

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-manual-input.mjs.template |
  node --input-type=module - prepare --runtime-root $RuntimeRoot --output .\work\manual-input.txt

Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-manual-input.mjs.template |
  node --input-type=module - verify --runtime-root $RuntimeRoot --output .\work\manual-input.txt
```

helper は A1/A2/A3 を固定値へ照合し、A1/A2 の raw 全文だけを
`starter\references\manual-input-layout.txt.template` と同じ順序・delimiter で新規作成します。
既存宛先は上書きしません。

別の新しい会話で、`work\manual-input.txt` 全体と同じ固定依頼を渡します。
行の削除、trim、要約、改行変換、前の回答の追記をしないでください。

## 任意: 比較する

検索から始めた方法、A1/A2 を明示添付した方法、同じ raw 全文を手動供給した方法を比較します。
固定するのは依頼、source 版、アクセス、model、利用可能な read/search、A3 の追加読取条件です。

見る項目は、必要な根拠へ到達したか、不要な検索や追問、全文準備の負担、
添付・貼付の確認可能範囲です。時間や token は実測できた場合だけ記録します。
片方だけ要約したり、別の source 集合へ変えたりしないでください。

## 確認ポイント

- `OrderService.allocate` の path・symbol・支持範囲へ戻れるか。
- A2 の transaction 設定と import、A3 の bean 定義を対応付けられるか。
- text search、file read、LSP、semantic search、Add Context を区別したか。
- A1/A2 の byte 数・SHA-256・順序を確認したか。
- 準備した全文、添付表示、内部投入範囲、実際に読めた範囲を分けたか。
- A3 や追加 source を読んだ理由と範囲を記録したか。
- 静的読解で実 proxy、実 transaction、DB 動作、過去の設計意図を断定していないか。

## 発展

- [Java の文字列検索と定義・参照を分けるガイド](optional/language-tools.md)
- [index・検索除外・開いたファイルを分けるガイド](optional/index-exclusions.md)

どちらも補足の探索ガイドです。本シナリオの完了条件ではありません。

## 制約・Fallback・安全

- source、Java、XML、テスト、DB、workspace 設定、User/Profile 設定を変更しません。
- Java 拡張、JDK、index を自動で導入・構築しません。
- `search.exclude`、`files.exclude`、`.gitignore`、組織の content exclusion を変更・回避しません。
- 検索候補や除外を ACL として扱いません。
- A1/A2 の全文が収まらない、切り詰めが疑われる、版が違う場合は片方だけ短縮せず停止します。
- 言語機能が使えない場合は text/file search だけで続け、LSP の結果を作りません。
- semantic index が未確認なら semantic results を 0 件にせず、確認不能のまま残します。
- Copilot のファイル添付が使えない場合は、検索経路と手動全文経路、または設計票のレビューだけで完了できます。
- helper を使えない場合は A1/A2 を複製せず、固定 path・hash とレイアウトを使って供給計画だけをレビューしてください。
