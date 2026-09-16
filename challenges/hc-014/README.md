# HC-014 Skill を Plugin として配布・更新しよう

## Scenario

受注 CSV を調べる担当者へ、短い読解手順を渡します。一人へ一度だけ渡すなら Skill ファイルのコピーで
十分かもしれません。一方、複数人へ更新版を渡す場合は、配布名、版、含まれるファイル、古いコピー、
元の版へ戻せたかを追跡しやすい単位が必要です。

このシナリオでは、**同じ一つの Skill を手動で配る方法と、Agent Plugin の package に包む方法**を設計します。
手順の本文は同一に保ち、配布 metadata と版管理の違いだけを観察します。
サンプルは最後まで `.template` の不活性ファイルで、Plugin や Skill を導入・有効化しません。

## この機能とは

Skill は、Agent が特定の作業で参照できる手順です。frontmatter の `name` と `description` が用途を示し、
本文が実際の進め方を記述します。

Agent Plugin は、Skill などの customization をまとめて配布・更新する単位です。
このシナリオでは **Agent Plugins 1.0** の次の最小構成だけを扱います。

```text
plugin.json.template
skills\
  order-import-evidence\
    SKILL.md.template
```

`plugin.json` に相当する manifest の例:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "wholesale-evidence",
  "version": "1.0.0",
  "description": "受注取込の読解手順を一つの Skill として配る原稿。"
}
```

package の `name` / `description` / `version`、Skill frontmatter の `name` / `description`、
Skill 本文は別々の制御です。package 名を変えても本文の知識は増えず、package に包んだだけで
自動選択、読み込み、権限、正答、速度が保証されるわけではありません。

この教材では次を固定します。

- `$schema` は Agent Plugins 1.0 の canonical schema。
- package 名は小文字英数字・ハイフン・ピリオドで 64 文字以内。先頭末尾は英数字。
- Skill 名と親 directory は `order-import-evidence`。
- component は一つの Skill だけ。Hook、MCP、Agent、rules、prompts は追加しない。
- `skills` directory からの標準的な発見構造を使い、component path を manifest に列挙しない。

参考:

- [Agent Plugins manifest](https://agent-plugins.org/plugin-authors/manifest)
- [Agent Plugins canonical schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)
- [VS Code Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)

## 向いていること / 向いていないこと

**向いていること**

- 同じ手順を複数人へ配り、配布名と版を明示したい。
- manifest と Skill の組をまとめてレビューしたい。
- 更新漏れ、古いコピー、部分的な復元を見つけたい。
- 手動配布で十分か、package 化の管理コストが妥当かを判断したい。

**向いていないこと**

- 一人の短期作業で、単一ファイルと短いメモだけで十分な場合。
- package 化だけで Skill の選択、本文 loading、認証、ACL、業務知識を保証したい場合。
- marketplace への publish、実環境での install / update / rollback を試す場合。
- 静的なコード・テスト定義から、実 DB 動作や過去の設計理由を証明する場合。

## ゴール

1. 固定 source を読み、根拠と未確認を分ける一つの Skill 原稿を作る。
2. frontmatter を含む v1 全文を UTF-8・BOM なし・LF で固定する。
3. v2 は `教材版: training-v1` を `教材版: training-v2` にする一行だけを変更する。
4. 手動配布と package 配布で、同じ版の Skill raw bytes を一致させる。
5. package の v2 は manifest の `version` だけを `2.0.0` に変更する。
6. `current` を v1 → v2 → v1 と移し、全ファイルを初回 v1 へ戻せることを確認する。
7. 同名候補や古いコピーを全 origin で考え、実際に確認していない discovery と区別する。

## 用意するもの

- まずリポジトリ共通の [始め方](../../README.md#始め方) を完了してください。
- Git
- Node.js 22 以降
- PowerShell
- UTF-8・LF で保存できるエディター
- 公開Runtime templateから作成したruntime workspace

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

upstream revisionはsourceの出所です。templateから作ったruntime workspaceは新しいGit履歴を持つため、
local `HEAD` がこの値と一致することは要求しません。

`starter\` の内容:

| パス | 用途 |
|---|---|
| `starter\request.txt.template` | Skill を設計するときの固定依頼 |
| `starter\worksheets\design.md.template` | 読み手、三つの制御、凍結、復元の設計票 |
| `starter\worksheets\version-ledger.md.template` | v1 / v2 / restored-v1 の版と hash を記録する表 |
| `starter\worksheets\rollback-checklist.md.template` | 一要因の不一致と完全復元を確認する用紙 |
| `starter\examples\v1\...` | Agent Plugins 1.0 の不活性な v1 サンプル |
| `starter\examples\v2\...` | version と教材 marker だけが異なる不活性な v2 サンプル |
| `starter\fixtures\lifecycle-origins.json.template` | 重複・旧版候補を考える合成資料 |
| `starter\tools\validate-plugin.mjs.template` | この教材の最小構成だけを検査する helper |

`.template` は外さず、`.github\skills`、`.agents\skills`、`.vscode`、ユーザーの home など、
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

local `HEAD` はupstream revisionと比較しません。sourceに予期しない変更がある場合は既存workspaceを
resetせず、変更内容を確認するか新しいruntime workspaceを用意してください。

読む source:

| ID | source checkout からの相対パス | 目的 |
|---|---|---|
| B1 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | `importDraft` / `replay` を入口にする |
| B2 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | `canonicalHash` と追加で必要な根拠を確認する |
| B3 | `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | 関連するテスト定義と未実行の境界を確認する |

作業用のひな型を新規コピーします。

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
- 読む順序、path・symbol・行範囲の残し方
- 未確認の問いを推測で埋めない基準
- package metadata、Skill frontmatter、本文を分ける理由
- v1 と v2 を一要因だけで分ける方法
- 更新前の確認と、完全復元の方法

テストは定義を読むだけで、Java・DB・ネットワークは実行しません。

### 2. v1 の手動原稿と package 原稿を作る

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
Skill を編集した場合は、同じ raw bytes を package 側へ再コピーします。両方を別々に編集しないでください。

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

helper は `.template` のまま標準入力へ渡します。

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\validate-plugin.mjs.template |
  node --input-type=module - .\work\package\v1

Get-Content -Raw -Encoding UTF8 .\starter\tools\validate-plugin.mjs.template |
  node --input-type=module - .\work\package\v2

Get-FileHash .\work\manual\v1\SKILL.md.template, ".\work\package\v1\$SkillPath" -Algorithm SHA256
Get-FileHash .\work\manual\v2\SKILL.md.template, ".\work\package\v2\$SkillPath" -Algorithm SHA256
```

同じ版の二つの Skill hash が一致することを確認します。helper はこの教材の狭い subset だけを検査し、
Agent Plugins 規格全体への適合や、実際の discovery / loading を認定しません。

### 5. 更新と完全復元を確認する

手動側は一ファイル、package 側は manifest と Skill の二ファイルを `current` として扱います。
最初に v1 を新規コピーし、v2 へ更新した後、初回 v1 の全ファイルへ戻します。

各段階で `Get-FileHash` を実行し、`work\version-ledger.md` に次を記録してください。

- 論理版または manifest version
- Skill の教材 marker
- 全ファイルの path と SHA-256
- コピー元とコピー先
- 重複・旧版候補
- 初回 v1 と restored-v1 の raw bytes 一致

package は manifest だけ、または Skill だけが戻っていても完全復元ではありません。
`starter\fixtures\lifecycle-origins.json.template` は紙上の候補です。
`enabled: false` を、実際の client から候補が消えた証拠として扱わないでください。

## 任意: 比較する

同じ固定依頼、source、設計、Skill 全文を使い、次を手動で比較できます。

| 方法 | 配布するもの | 観察すること |
|---|---|---|
| 手動 | Skill 原稿と version ledger | 一ファイルの版・出所・コピーを追えるか |
| package | root manifest、同じ Skill、version ledger | 二ファイルの構成と配布 metadata をまとめて追えるか |

同じ版同士だけを比較し、片方だけ本文を改善しないでください。実際の install、discovery、loading、
更新配信、Disable の効果はこの比較に含めません。「手動で十分」「package の方が複雑」も有効な結論です。

## 確認ポイント

- package metadata、Skill frontmatter、Skill 本文を別々に説明できるか。
- v1 の Skill 全文が手動側と package 側で byte 単位に一致するか。
- v2 の Skill 差分が教材 marker 一行だけか。
- v2 の manifest 差分が `version` だけか。
- `current` を v1 → v2 → v1 と移し、全ファイルが初回 v1 と一致したか。
- 同名候補、旧版、無効と記された候補を全 origin で確認する考え方があるか。
- 静的な構成検査と、実際の discovery / loading を混同していないか。

## 発展

- [Plugin を有効化する前の確認ガイド](optional/plugin-enable.md)

任意ガイドは、実環境での Plugin 利用を検討するときの安全確認です。本シナリオの完了条件ではありません。

## 制約・Fallback・安全

- `.template` を外さず、実際の customization 探索先へ置きません。
- Plugin の install、register、enable、publish、marketplace 操作を行いません。
- source、Java、テスト、DB、既存設定、既存 Plugin、ユーザーの home を変更しません。
- component は一つの Skill だけに保ち、Hook、MCP、Agent、rules、prompts を追加しません。
- source 外の根拠が必要なら未確認として止め、採用理由や障害履歴を推測しません。
- Node.js を使えない場合は、二ファイル構成、frontmatter、v1/v2 の差分を人がレビューできます。
- Plugin 対応 client がなくても、不活性な原稿、hash、版台帳、復元確認だけで完了できます。
- 所有者不明のファイルや予期しない差分がある場合は上書きせず、確認できる範囲で停止してください。
