# HC-014 SkillをPluginとして配布・更新しよう

**言語:** **日本語** / [English](../../en/challenges/hc-014/README.md)

## シナリオ

受注 CSV を調べる担当者へ、短い読解手順を渡します。一人へ一度だけ渡すなら Skill ファイルのコピーで
十分かもしれません。一方、複数人へ更新版を渡す場合は、配布名、版、含まれるファイル、古いコピー、
元の版へ戻せたかを追跡しやすい単位が必要です。

このシナリオでは、**同じ一つのSkillを手動で配る方法と、Agent Pluginのパッケージにまとめる方法**を設計します。
手順の本文は同一に保ち、配布メタデータと版管理の違いだけを観察します。
サンプルは最後まで `.template` の不活性ファイルで、Plugin や Skill を導入・有効化しません。

## この機能とは

Skillは、Agentが特定の作業で参照できる手順です。front matterの `name` と `description` が用途を示し、
本文が実際の進め方を記述します。

Agent Pluginは、Skillなどのカスタマイズをまとめて配布・更新する単位です。
このシナリオでは **Agent Plugins 1.0** の次の最小構成だけを扱います。

```text
plugin.json.template
skills\
  order-import-evidence\
    SKILL.md.template
```

`plugin.json` に相当するマニフェストの例:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "wholesale-evidence",
  "version": "1.0.0",
  "description": "受注取込の読解手順を一つの Skill として配る原稿。"
}
```

パッケージの `name` / `description` / `version`、Skillのfront matterにある `name` / `description`、
Skill本文は別々に扱います。パッケージ名を変えても本文の知識は増えず、パッケージにまとめただけで、
自動選択、読み込み、権限、回答の正しさ、速度が保証されるわけではありません。

この教材では次を固定します。

- `$schema` はAgent Plugins 1.0の正規スキーマ。
- パッケージ名は小文字英数字、ハイフン、ピリオドを使い、64文字以内とする。先頭と末尾は英数字にする。
- Skill名と親ディレクトリは `order-import-evidence`。
- コンポーネントは一つのSkillだけ。Hook、MCP、Agent、rules、promptsは追加しない。
- `skills` ディレクトリを使った標準の検出構造とし、コンポーネントのパスをマニフェストに列挙しない。

参考:

- [Agent Plugins manifest](https://agent-plugins.org/plugin-authors/manifest)
- [Agent Plugins canonical schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)
- [VS Code Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)

## 向いていること / 向いていないこと

**向いていること**

- 同じ手順を複数人へ配り、配布名と版を明示したい。
- マニフェストとSkillの組をまとめてレビューしたい。
- 更新漏れ、古いコピー、部分的な復元を見つけたい。
- 手動配布で十分か、パッケージ化の管理コストが妥当かを判断したい。

**向いていないこと**

- 一人の短期作業で、単一ファイルと短いメモだけで十分な場合。
- パッケージ化だけで、Skillの選択、本文の読み込み、認証、ACL、業務知識を保証したい場合。
- marketplaceへの公開や、実環境でのインストール / 更新 / ロールバックを試す場合。
- 静的なコード・テスト定義から、実 DB 動作や過去の設計理由を証明する場合。

## ゴール

1. 固定ソースを読み、根拠と未確認事項を分ける一つのSkill原稿を作る。
2. front matterを含むv1の全文を、UTF-8、BOMなし、LFで固定する。
3. v2 は `教材版: training-v1` を `教材版: training-v2` にする一行だけを変更する。
4. 手動配布とパッケージ配布で、同じ版のSkillの生のバイト列を一致させる。
5. パッケージのv2では、マニフェストの `version` だけを `2.0.0` に変更する。
6. `current` を v1 → v2 → v1 と移し、全ファイルを初回 v1 へ戻せることを確認する。
7. 同名の候補や古いコピーをすべての出所について検討し、実際には確認していない検出結果と区別する。

## 用意するもの

- まずリポジトリ共通の [始め方](../../README.md#始め方) を完了してください。
- Git
- Node.js 22 以降
- PowerShell
- UTF-8・LF で保存できるエディター
- 公開Runtimeテンプレートから作成したランタイムワークスペース

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

upstreamリビジョンはソースの出所を示します。テンプレートから作成したランタイムワークスペースは新しいGit履歴を持つため、
ローカルの `HEAD` がこの値と一致する必要はありません。

`starter\` の内容:

| パス | 用途 |
|---|---|
| `starter\request.txt.template` | Skill を設計するときの固定依頼 |
| `starter\worksheets\design.md.template` | 読み手、三つの制御、凍結、復元の設計票 |
| `starter\worksheets\version-ledger.md.template` | v1 / v2 / restored-v1の版とハッシュを記録する表 |
| `starter\worksheets\rollback-checklist.md.template` | 一要因の不一致と完全復元を確認する用紙 |
| `starter\examples\v1\...` | Agent Plugins 1.0 の不活性な v1 サンプル |
| `starter\examples\v2\...` | バージョンと教材マーカーだけが異なる不活性なv2サンプル |
| `starter\fixtures\lifecycle-origins.json.template` | 重複・旧版候補を考える合成資料 |
| `starter\tools\validate-plugin.mjs.template` | この教材の最小構成だけを検査するヘルパー |

`.template` は外さず、`.github\skills`、`.agents\skills`、`.vscode`、ユーザーのホームディレクトリなど、
実際に発見される場所へ移動しないでください。

## 準備

この README がある `challenges\hc-014` を作業ディレクトリにします。

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

ローカルの `HEAD` はupstreamリビジョンと比較しません。ソースに予期しない変更がある場合は、既存のワークスペースを
リセットせず、変更内容を確認するか、新しいランタイムワークスペースを用意してください。

読むソース:

| ID | ソースのチェックアウトからの相対パス | 目的 |
|---|---|---|
| B1 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | `importDraft` / `replay` を入口にする |
| B2 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | `canonicalHash` と追加で必要な根拠を確認する |
| B3 | `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | 関連するテスト定義と未実行の境界を確認する |

作業用のひな型を新しくコピーします。

```powershell
New-Item -ItemType Directory -Path .\work
Copy-Item .\starter\worksheets\design.md.template .\work\design.md
Copy-Item .\starter\worksheets\version-ledger.md.template .\work\version-ledger.md
Copy-Item .\starter\worksheets\rollback-checklist.md.template .\work\rollback-checklist.md
```

既存の `work` や宛先ファイルがある場合は上書きせず、内容と所有者を確認してください。

## 試してみる

### 1. Skill の設計を固定する

B1/B2/B3 を静的に読み、`work\design.md` に次を記録します。

- 読み手と用途
- 読む順序、パス、シンボル、行範囲の残し方
- 未確認の問いを推測で埋めない基準
- パッケージのメタデータ、Skillのfront matter、本文を分ける理由
- v1 と v2 を一要因だけで分ける方法
- 更新前の確認と、完全復元の方法

テストは定義を読むだけで、Java・DB・ネットワークは実行しません。

### 2. v1の手動原稿とパッケージ原稿を作る

```powershell
$SkillPath = 'skills\order-import-evidence\SKILL.md.template'

New-Item -ItemType Directory -Path .\work\manual\v1
Copy-Item .\starter\examples\v1\skills\order-import-evidence\SKILL.md.template `
  .\work\manual\v1\SKILL.md.template

New-Item -ItemType Directory -Path .\work\package\v1\skills\order-import-evidence
Copy-Item .\starter\examples\v1\plugin.json.template .\work\package\v1\plugin.json.template
Copy-Item .\work\manual\v1\SKILL.md.template ".\work\package\v1\$SkillPath"
```

`work\manual\v1\SKILL.md.template` と `work\package\v1\plugin.json.template` を自分の設計に合わせて編集します。
Skillを編集した場合は、同じ生のバイト列をパッケージ側へ再コピーします。両方を別々に編集しないでください。

```powershell
[IO.File]::Copy(
  (Resolve-Path .\work\manual\v1\SKILL.md.template),
  (Resolve-Path ".\work\package\v1\$SkillPath"),
  $true
)
```

### 3. v2 を一要因だけで作る

v1 を確定した後は変更しません。v2 は v1 から新規作成します。

```powershell
$Utf8NoBom = [Text.UTF8Encoding]::new($false)
$SkillV1 = [IO.File]::ReadAllText((Resolve-Path .\work\manual\v1\SKILL.md.template))
if ($SkillV1.Contains("`r") -or
    ([regex]::Matches($SkillV1, '(?m)^教材版: training-v1$').Count -ne 1)) {
  throw 'LF と一つの教材版 marker を確認してください'
}

New-Item -ItemType Directory -Path .\work\manual\v2
$SkillV2 = [regex]::Replace(
  $SkillV1,
  '(?m)^教材版: training-v1$',
  '教材版: training-v2'
)
[IO.File]::WriteAllText(
  (Join-Path (Resolve-Path .\work\manual\v2).Path 'SKILL.md.template'),
  $SkillV2,
  $Utf8NoBom
)

New-Item -ItemType Directory -Path .\work\package\v2\skills\order-import-evidence
[IO.File]::Copy(
  (Resolve-Path .\work\manual\v2\SKILL.md.template),
  (Join-Path (Resolve-Path .\work\package\v2).Path $SkillPath),
  $false
)

$ManifestV1 = [IO.File]::ReadAllText((Resolve-Path .\work\package\v1\plugin.json.template))
if ([regex]::Matches($ManifestV1, '"version": "1.0.0"').Count -ne 1) {
  throw 'manifest の version を確認してください'
}
[IO.File]::WriteAllText(
  (Join-Path (Resolve-Path .\work\package\v2).Path 'plugin.json.template'),
  $ManifestV1.Replace('"version": "1.0.0"', '"version": "2.0.0"'),
  $Utf8NoBom
)
```

### 4. 構成と同等性を確認する

ヘルパーは `.template` のまま標準入力へ渡します。

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\validate-plugin.mjs.template |
  node --input-type=module - .\work\package\v1

Get-Content -Raw -Encoding UTF8 .\starter\tools\validate-plugin.mjs.template |
  node --input-type=module - .\work\package\v2

Get-FileHash .\work\manual\v1\SKILL.md.template, ".\work\package\v1\$SkillPath" -Algorithm SHA256
Get-FileHash .\work\manual\v2\SKILL.md.template, ".\work\package\v2\$SkillPath" -Algorithm SHA256
```

同じ版の二つのSkillのハッシュが一致することを確認します。ヘルパーが検査するのは、この教材で扱う限定的な範囲だけです。
Agent Plugins規格全体への適合や、実際の検出 / 読み込みを認定するものではありません。

### 5. 更新と完全復元を確認する

手動側は一つのファイル、パッケージ側はマニフェストとSkillの二つのファイルを `current` として扱います。
最初にv1を新しくコピーし、v2へ更新した後、初回v1の全ファイルに戻します。

各段階で `Get-FileHash` を実行し、`work\version-ledger.md` に次を記録してください。

- 論理版またはマニフェストのバージョン
- Skillの教材マーカー
- 全ファイルのパスとSHA-256
- コピー元とコピー先
- 重複・旧版候補
- 初回v1とrestored-v1の生のバイト列の一致

パッケージは、マニフェストだけ、またはSkillだけが戻っていても完全に復元されたとはいえません。
`starter\fixtures\lifecycle-origins.json.template` は紙上の候補です。
`enabled: false` を、実際のクライアントから候補が消えた証拠として扱わないでください。

## 任意: 比較する

同じ固定依頼、ソース、設計、Skillの全文を使い、次の方法を手動で比較できます。

| 方法 | 配布するもの | 観察すること |
|---|---|---|
| 手動 | Skill原稿と版台帳 | 一つのファイルの版、出所、コピーを追跡できるか |
| パッケージ | ルートのマニフェスト、同じSkill、版台帳 | 二つのファイルの構成と配布メタデータをまとめて追跡できるか |

同じ版同士だけを比較し、片方だけ本文を改善しないでください。実際のインストール、検出、読み込み、
更新の配信、Disableの効果はこの比較に含めません。「手動で十分」「パッケージの方が複雑」という結論も有効です。

## 確認ポイント

- パッケージのメタデータ、Skillのfront matter、Skill本文をそれぞれ説明できるか。
- v1のSkill全文が、手動側とパッケージ側でバイト単位に一致するか。
- v2のSkillの差分が教材マーカーの一行だけか。
- v2のマニフェストの差分が `version` だけか。
- `current` を v1 → v2 → v1 と移し、全ファイルが初回 v1 と一致したか。
- 同名の候補、旧版、無効と記された候補を、すべての出所について確認する考え方があるか。
- 静的な構成検査と、実際の検出 / 読み込みを混同していないか。

## 発展

- [Plugin を有効化する前の確認ガイド](optional/plugin-enable.md)

任意ガイドは、実環境での Plugin 利用を検討するときの安全確認です。本シナリオの完了条件ではありません。

## 制約・代替手段・安全

- `.template` を外さず、実際のカスタマイズの探索先には置きません。
- Pluginのインストール、登録、有効化、公開、marketplaceの操作は行いません。
- ソース、Java、テスト、DB、既存設定、既存Plugin、ユーザーのホームディレクトリは変更しません。
- コンポーネントは一つのSkillだけに保ち、Hook、MCP、Agent、rules、promptsは追加しません。
- ソース外の根拠が必要な場合は未確認として作業を止め、採用理由や障害履歴を推測しません。
- Node.jsを使えない場合は、二つのファイルからなる構成、front matter、v1/v2の差分を人がレビューできます。
- Pluginに対応するクライアントがなくても、不活性な原稿、ハッシュ、版台帳、復元確認だけで完了できます。
- 所有者不明のファイルや予期しない差分がある場合は上書きせず、確認できる範囲で停止してください。
