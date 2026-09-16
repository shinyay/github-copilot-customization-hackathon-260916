# HC-013 チームの知識を Copilot Space 向けに整理しよう

**Language:** **日本語** / [English](../../en/challenges/hc-013/README.md)

## Scenario

受注 CSV の再送処理について、次の保守担当へ資料を渡します。コード、テスト定義、合成の運用メモ、
版だけが異なる参照が混在しているため、「読めた内容」「参照だけある内容」「まだ確認できない内容」を
同じものとして説明しない整理が必要です。

このシナリオでは、実際の Copilot Space を作成せず、Space に載せる前段階の
**ローカルなコンテキストカード**を設計します。固定ソースから安全な表示用全文を作り、
出典・版・閲覧範囲・未確認事項を保ったまま、読み手に合う順序へ整理してください。

## この機能とは

Copilot Space は、用途を伝える instructions と、根拠となる sources をまとめて再利用する場所です。
instructions、Space の description、各 source の本文・版・閲覧権は別々の情報です。

このシナリオの `context-card.json.template` は、Space API の応答ではありません。
通常のファイル添付でも扱える材料を、Space へ整理する前に点検するための不活性なサンプルです。
Space を閲覧できても、参照先の source を閲覧できるとは限りません。また、branch 名が分かっても
解決 commit や本文を取得していなければ、固定版と同一だとは断定できません。

参考:

- [About Copilot Spaces](https://docs.github.com/en/copilot/concepts/context/spaces)
- [Using Copilot Spaces](https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/use-copilot-spaces)
- [Creating Copilot Spaces](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/copilot-spaces/create-copilot-spaces)

## 向いていること / 向いていないこと

**向いていること**

- 複数人が同じ資料を再利用する前に、出典・版・用途・閲覧範囲を点検する。
- コード、テスト定義、運用メモ、未解決の参照を混同せずに引き継ぐ。
- 読み手に合わせて資料の順序やグループを設計する。
- 取得不能、空、部分取得、読取エラーを別々に扱う。

**向いていないこと**

- カードだけで認証、ACL、同期、実際の DB 動作を証明する。
- source にない設計理由や障害履歴を推測で補う。
- アクセスできない資料を、別経路のローカルコピーで取得済みに見せる。
- 認証情報を含むテスト行を、そのまま共有資料へ複製する。

資料が少なく、個別ファイルと短い引継ぎ票で十分なら、カードを増やさない判断も妥当です。

## ゴール

1. 固定された三つの Java ファイルを、変更せずに照合する。
2. B3 の認証情報を含む六つの行だけを、行全体の説明マーカーへ置き換える。
3. B1/B2/B3 と三つの JSON 資料を、同じ情報量のままローカルカードへ整理する。
4. 読む順序、グループ、未確認事項の見せ方を自分で説明する。
5. ローカルカードと実際の Space、source のローカル読取と remote の閲覧権を区別する。

## 用意するもの

- まずリポジトリ共通の [始め方](../../README.md#始め方) を完了してください。
- Git
- Node.js 22 以降
- UTF-8・LF で保存できるエディター
- 公開Runtime templateから作成したruntime workspace

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

- Copilot Chat は任意です。使えない場合も、人による資料設計として完了できます。

upstream revisionはsourceの出所を示します。**Use this template** で作成したruntime workspaceは
新しいGit履歴を持つため、local `HEAD` がこの値と一致することは要求しません。

`starter\` には次の不活性な教材があります。

| パス | 用途 |
|---|---|
| `starter\request.txt.template` | Copilot または人へ渡す固定依頼 |
| `starter\worksheets\design.md.template` | instructions、読み手、順序、停止条件の設計票 |
| `starter\worksheets\handoff.md.template` | 個別資料で渡す場合の引継ぎ票 |
| `starter\examples\context-card.json.template` | ローカルカードの空ひな型 |
| `starter\examples\github-spaces.mcp.json.template` | remote GitHub MCP の読み取り専用構成例。適用しない |
| `starter\fixtures\source-packet.json.template` | B1/B2/B3 の固定 metadata と合成運用メモ |
| `starter\fixtures\snapshot.json.template` | B1 の固定版 identity |
| `starter\fixtures\provenance-packets.json.template` | 取得状態や版の違いを考える合成候補 |
| `starter\tools\prepare-display.mjs.template` | 固定 source の照合、限定置換、カード生成を行う helper |

`.template` は外さず、リポジトリの有効な MCP 設定や customization として配置しないでください。

## 準備

この README がある `challenges\hc-013` を作業ディレクトリにします。
読むsourceには、templateから作成したruntime workspaceに既にあるファイルを使います。

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

local `HEAD` は検査しません。helperが各sourceのbyte数とSHA-256をupstream template revisionの固定値へ
照合します。一致しない場合はruntime workspaceをresetせず、変更内容を確認するか新しいruntime workspaceを用意してください。

固定 source は次の三つです。

| ID | source checkout からの相対パス | 読む目的 |
|---|---|---|
| B1 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | 現在の再送処理を読む入口 |
| B2 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | B1 が受け取るまとまりと `canonicalHash` を読む |
| B3 | `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | テストが確認しようとする内容と実行前提を読む。実行はしない |

B3 は原本の 86、87、237、242、431、437 行を共有しません。helper は固定 hash と行形を先に確認し、
その六行全体だけを `HC013_DISPLAY_REDACTED` マーカーへ置き換えます。ほかの行と行数は保持します。
原本の値や個々の値の hash は記録しません。

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

helper は `.template` のまま、内容を標準入力へ渡して明示実行します。

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-display.mjs.template |
  node --input-type=module - prepare --runtime-root $RuntimeRoot --work-root .\work

Get-Content -Raw -Encoding UTF8 .\starter\tools\prepare-display.mjs.template |
  node --input-type=module - verify --runtime-root $RuntimeRoot --work-root .\work
```

生成されるもの:

- `work\context-card.json.template`: 六資料をまとめた不活性なローカルカード
- `work\handoff.md`: 同じ六資料を個別に引き継ぐ表示
- `work\manual-input.txt`: 同じ instructions とカード全文を手動で渡すためのテキスト

helper は既存宛先を上書きしません。source の hash、行形、設計票、生成済み内容が一致しない場合は停止します。

### 3. 整理した資料を読む

Copilot Chat を使う場合は新しい会話を開き、次を明示的に添付します。

1. `starter\request.txt.template`
2. `work\context-card.json.template`

回答では、現行コード、合成メモ、提供されていない履歴を分け、根拠となる path・版・範囲と
未確認事項を示すよう求めます。添付表示が見えない、内容が切り詰められた可能性がある、
または source へ戻れない場合は、その状態を記録して断定を止めてください。

## 任意: 比較する

同じ依頼と同じ六資料を使い、新しい会話を分けて次を手動比較できます。

- `work\handoff.md` を渡す。
- `work\context-card.json.template` を渡す。
- `work\manual-input.txt` を本文として渡す。

変えるのは資料の束ね方だけです。片方だけ要約する、metadata を削る、原本 B3 を追加する、
前の回答を次の入力へ混ぜる、といった変更は行いません。比較できるのはローカルな整理方法であり、
Space 固有の共有・取得・同期効果ではありません。

## 確認ポイント

- 読み手と用途に合う順序・グループを説明できるか。
- B1/B2/B3 と P1/P2/P3 が欠けず、metadata と limitations が残っているか。
- original hash と表示用 hash、原本と限定置換後の全文を区別しているか。
- `missing`、`error`、`empty`、`partial`、未解決 branch を別々に扱っているか。
- ローカル source の読取、Space の閲覧権、各 source の閲覧権を混同していないか。
- テスト定義の静的読解を、Java・DB の実行結果として説明していないか。

## 発展

- [許可済み Space を読み取る前の確認ガイド](optional/space-read.md)

任意ガイドは、既に承認された専用 Space を読む前の安全確認です。本シナリオの完了条件ではありません。

## 制約・Fallback・安全

- source、Java、テスト、DB、既存設定は変更・実行しません。
- 実 Space の作成、一覧探索、共有、source 追加、upload、PAT 発行、OAuth・ACL・組織 policy の変更は行いません。
- `github-spaces.mcp.json.template` は説明用です。このリポジトリの `.vscode\mcp.json` へコピーしません。
- B3 の除去対象行や認証値を、回答、カード、ログ、比較用の負例へ戻しません。
- 取得不能を不存在やアクセス拒否と断定せず、確認できない理由を残します。
- Copilot を使えない場合は、`design.md`、生成カード、引継ぎ票を人がレビューすれば完了できます。
- helper を実行できない場合は、原本を共有せず、fixtures と空ひな型だけで整理方針を設計してください。
- 実際の Space を試す場合は、任意ガイドの前提と別承認を満たし、本シナリオとは別の作業として扱います。
