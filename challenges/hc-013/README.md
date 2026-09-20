# HC-013 チームの知識をCopilot Space向けに整理しよう

**言語:** **日本語** / [English](../../en/challenges/hc-013/README.md)

## シナリオ

受注 CSV の再送処理について、次の保守担当へ資料を渡します。コード、テスト定義、合成の運用メモ、
版だけが異なる参照が混在しているため、「読めた内容」「参照だけある内容」「まだ確認できない内容」を
同一視せずに整理する必要があります。

このシナリオでは、実際の Copilot Space を作成せず、Space に載せる準備として
**ローカルなコンテキストカード**を設計します。固定ソースから安全な表示用全文を作り、
出典・版・閲覧範囲・未確認事項を保ったまま、読み手に合う順序へ整理してください。

## この機能とは

Copilot Spaceは、用途を伝える `instructions` と、根拠となるソースをまとめて再利用する場所です。
`instructions`、Spaceの `description`、各ソースの本文、版、閲覧権は、それぞれ別の情報です。

このシナリオの `context-card.json.template` は、Space API の応答ではありません。
通常のファイル添付でも扱える材料を、Space へ整理する前に点検するための不活性なサンプルです。
Spaceを閲覧できても、参照先のソースを閲覧できるとは限りません。また、ブランチ名が分かっても、
解決済みのコミットや本文を取得していなければ、固定版と同一だとは断定できません。

参考:

- [About Copilot Spaces](https://docs.github.com/en/copilot/concepts/context/spaces)
- [Using Copilot Spaces](https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/use-copilot-spaces)
- [Creating Copilot Spaces](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/copilot-spaces/create-copilot-spaces)

## 向いていること / 向いていないこと

**向いていること**

- 複数人が同じ資料を再利用する前に、出典・版・用途・閲覧範囲を点検する。
- コード、テスト定義、運用メモ、未解決の参照を混同せずに引き継ぐ。
- 読み手に合わせて資料の順序やグループを設計する。
- 取得不能、空、部分取得、読み取りエラーを別々に扱う。

**向いていないこと**

- カードだけで認証、ACL、同期、実際の DB 動作を証明する。
- ソースにない設計理由や障害履歴を推測で補う。
- アクセスできない資料を、別経路のローカルコピーで取得済みに見せる。
- 認証情報を含むテスト行を、そのまま共有資料へ複製する。

資料が少なく、個別ファイルと短い引き継ぎ票で十分なら、カードを増やさない判断も妥当です。

## ゴール

1. 固定された三つの Java ファイルを、変更せずに照合する。
2. B3 の認証情報を含む六つの行だけを、行全体の説明マーカーへ置き換える。
3. B1/B2/B3 と三つの JSON 資料を、情報量を変えずにローカルカードへ整理する。
4. 読む順序、グループ、未確認事項の見せ方を自分で説明する。
5. ローカルカードと実際のSpace、ローカルでのソースの読み取りとリモートでの閲覧権を区別する。

## 用意するもの

- まずリポジトリ共通の [始め方](../../README.md#始め方) を完了してください。
- Git
- Node.js 22 以降
- UTF-8・LF で保存できるエディター
- 公開Runtimeテンプレートから作成したランタイムワークスペース

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

- Copilot Chat は任意です。使えない場合も、人による資料設計として完了できます。

upstreamリビジョンはソースの出所を示します。**Use this template** で作成したランタイムワークスペースは
新しいGit履歴を持つため、ローカルの `HEAD` がこの値と一致する必要はありません。

`starter\` には次の不活性な教材があります。

| パス | 用途 |
|---|---|
| `starter\request.txt.template` | Copilot または人へ渡す固定依頼 |
| `starter\worksheets\design.md.template` | `instructions`、読み手、順序、停止条件の設計票 |
| `starter\worksheets\handoff.md.template` | 個別資料で渡す場合の引き継ぎ票 |
| `starter\examples\context-card.json.template` | ローカルカードの空ひな型 |
| `starter\examples\github-spaces.mcp.json.template` | リモートGitHub MCPの読み取り専用構成例。適用しない |
| `starter\fixtures\source-packet.json.template` | B1/B2/B3の固定メタデータと合成運用メモ |
| `starter\fixtures\snapshot.json.template` | B1の固定版の識別情報 |
| `starter\fixtures\provenance-packets.json.template` | 取得状態や版の違いを考える合成候補 |
| `starter\tools\prepare-display.mjs.template` | 固定ソースの照合、限定置換、カード生成を行うヘルパー |

`.template` は外さず、リポジトリの有効なMCP設定やカスタマイズとして配置しないでください。

## 準備

この README がある `challenges\hc-013` を作業ディレクトリにします。
読むソースには、テンプレートから作成したランタイムワークスペースにすでにあるファイルを使います。

```powershell
$RuntimeRoot = (Resolve-Path (Read-Host 'Runtime workspace root')).Path
$RequiredSource = @(
  'wholesale-batch\src\main\java\jp\co\tsubame\wholesale\batch\service\OrderImportService.java',
  'wholesale-batch\src\main\java\jp\co\tsubame\wholesale\batch\OrderGroup.java',
  'wholesale-batch\src\test\java\jp\co\tsubame\wholesale\batch\OrderImportPostgresTest.java'
)
$RequiredSource | ForEach-Object {
  if (-not (Test-Path -LiteralPath (Join-Path $RuntimeRoot $_) -PathType Leaf)) {
    throw "runtime workspaceにsourceがありません: $_"
  }
}
```

ローカルの `HEAD` は検査しません。ヘルパーが各ソースのバイト数とSHA-256を、upstreamテンプレートのリビジョンの固定値と
照合します。一致しない場合はランタイムワークスペースをリセットせず、変更内容を確認するか、新しいランタイムワークスペースを用意してください。

固定ソースは次の三つです。

| ID | ソースのチェックアウトからの相対パス | 読む目的 |
|---|---|---|
| B1 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | 現在の再送処理を読む入口 |
| B2 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | B1 が受け取るまとまりと `canonicalHash` を読む |
| B3 | `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | テストが確認しようとする内容と実行前提を読む。実行はしない |

B3 は原本の 86、87、237、242、431、437 行を共有しません。ヘルパーは固定ハッシュと行の形式を先に確認し、
その六行全体だけを `HC013_DISPLAY_REDACTED` マーカーへ置き換えます。ほかの行と行数は保持します。
原本の値や個々の値のハッシュは記録しません。

自分の作業用ファイルを新規作成します。

```powershell
New-Item -ItemType Directory -Path .\work
Copy-Item .\starter\worksheets\design.md.template .\work\design.md
```

既に `work` や宛先ファイルがある場合は上書きせず、内容と所有者を確認してください。

## 試してみる

### 1. 整理方針を書く

`work\design.md` の `hc013-design` ブロックを記入します。

- `instructions`: 読み手に用途と注意を伝える文章
- `reader`: 想定する読み手
- `readingOrder`: B1/B2/B3/P1/P2/P3 を一度ずつ含む順序
- `groups`: 六資料をすべて含む、自分で決めたグループ
- `omissionPolicy`: `preserve-full-display-and-metadata` のまま

認証値、除去した原文、提供されていない歴史的理由は書かないでください。

### 2. 安全な表示資料を生成する

ヘルパーは `.template` のまま、内容を標準入力へ渡して明示的に実行します。

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-display.mjs.template |
  node --input-type=module - prepare --runtime-root $RuntimeRoot --work-root .\work

Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-display.mjs.template |
  node --input-type=module - verify --runtime-root $RuntimeRoot --work-root .\work
```

生成されるもの:

- `work\context-card.json.template`: 六資料をまとめた不活性なローカルカード
- `work\handoff.md`: 同じ六資料を個別に引き継ぐ表示
- `work\manual-input.txt`: 同じ `instructions` とカード全文を手動で渡すためのテキスト

ヘルパーは既存の宛先を上書きしません。ソースのハッシュ、行の形式、設計票、生成済みの内容が一致しない場合は停止します。

### 3. 整理した資料を読む

Copilot Chat を使う場合は新しい会話を開き、次を明示的に添付します。

1. `starter\request.txt.template`
2. `work\context-card.json.template`

回答では、現行コード、合成メモ、提供されていない履歴を分け、根拠となるパス、版、範囲と
未確認事項を示すよう求めます。添付表示が見えない、内容が切り詰められた可能性がある、
またはソースへ戻れない場合は、その状態を記録し、断定を避けてください。

## 任意: 比較する

同じ依頼と同じ六資料を使い、それぞれ新しい会話で次の方法を手動比較できます。

- `work\handoff.md` を渡す。
- `work\context-card.json.template` を渡す。
- `work\manual-input.txt` を本文として渡す。

変えるのは資料のまとめ方だけです。片方だけを要約する、メタデータを削る、原本B3を追加する、
前の回答を次の入力へ混ぜる、といった変更は行いません。比較できるのはローカルな整理方法であり、
Space 固有の共有・取得・同期効果ではありません。

## 確認ポイント

- 読み手と用途に合う順序・グループを説明できるか。
- B1/B2/B3とP1/P2/P3が欠けず、メタデータと `limitations` が残っているか。
- 原本のハッシュと表示用のハッシュ、原本と限定置換後の全文を区別しているか。
- `missing`、`error`、`empty`、`partial`、未解決のブランチを別々に扱っているか。
- ローカルソースの読み取り、Spaceの閲覧権、各ソースの閲覧権を混同していないか。
- テスト定義の静的読解を、Java・DB の実行結果として説明していないか。

## 発展

- [許可済み Space を読み取る前の確認ガイド](optional/space-read.md)

任意ガイドは、既に承認された専用 Space を読む前の安全確認です。本シナリオの完了条件ではありません。

## 制約・代替手段・安全

- ソース、Java、テスト、DB、既存設定は変更も実行もしません。
- 実際のSpaceの作成、一覧の探索、共有、ソースの追加、アップロード、PATの発行、OAuth、ACL、組織ポリシーの変更は行いません。
- `github-spaces.mcp.json.template` は説明用です。このリポジトリの `.vscode\mcp.json` へコピーしません。
- B3 の除去対象行や認証値を、回答、カード、ログ、比較用の負例へ戻しません。
- 取得不能を不存在やアクセス拒否と断定せず、確認できない理由を残します。
- Copilot を使えない場合は、`design.md`、生成カード、引き継ぎ票を人がレビューすれば完了できます。
- ヘルパーを実行できない場合は、原本を共有せず、フィクスチャと空のひな型だけを使って整理方針を設計してください。
- 実際の Space を試す場合は、任意ガイドの前提と別承認を満たし、本シナリオとは別の作業として扱います。
