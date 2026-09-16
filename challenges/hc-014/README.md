# HC-014 SkillをPluginとして配布・更新しよう

## Challenge Story

受注 CSV を調べる担当へ、短い読解手順を渡すことになりました。
一人ならファイルを送るだけでもよさそうです。しかし更新後に「手元の原稿は何版か」
「古いコピーが残っていないか」「前の版へ本当に戻せたか」を、別の人が確かめられるでしょうか。

このChallengeでは、**同じ一つの Skill を手で配る方式と、Plugin の package に包む方式**を比較します。
手順そのものを賢くする実験ではありません。自分で手順を設計して凍結し、配布・版管理・復元を点検します。
このページ、Pack、固定Runtimeだけで開始できます。先のLABやHCの回答・設定は不要です。
本編は最後まで不活性な **DRAFT** であり、Plugin や Skill を導入・起動しません。

## この機能とは

Skill は、Agent が必要な場面で参照する作業手順です。frontmatter には名前と用途、本文には手順を書きます。
Plugin は、そのようなカスタマイズを配布・更新する単位です。包んだだけで本文の知識、ツール、権限は増えず、
中の機能が毎ターン必ず動くわけでもありません。日常の会話への依頼や、常時使う Instructions とも役割が違います。

例えば、本文に「読んだパス・シンボル・行範囲と、未確認の問いを別に控える」と書いた Skill を渡すとします。
手動ではそのファイルと版のメモを渡し、package では同じファイルに配布名・版の manifest を添えます。
読解の指示は同じなので、ここで比較するのは**版と出所を追いやすいか**であって、説明の正答数ではありません。

採用する形式は **Agent Plugins 1.0** だけです。本編では次の二ファイルを `.template` のまま保持します。

```text
package\v1\
  plugin.json.template
  skills\order-import-evidence\SKILL.md.template
```

manifest の小さな例です。配布名・説明は自分で選べます。

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "team-sora.evidence",
  "version": "1.0.0",
  "description": "根拠と未確認を分ける一つの Skill の配布原稿。"
}
```

`$schema` は形式の識別子で、省略しません。root `plugin.json` でも schema marker を持たない Copilot 形式や、
`.claude-plugin/plugin.json` を使う Claude 形式と混ぜません。component のpathをmanifestに列挙せず、標準の `skills` directory から自動発見される構造を使います。
本編の `.template` は不活性な原稿で、自動発見を実施・観測するものではありません。
本編は一つの Skill だけです。追加の Hook、MCP、Agent、rules、prompts、二つ目の Skill は作りません。
これは比較を小さく保つ教材の制約で、標準全体が他の component を禁止するという意味ではありません。
標準のportable componentはskillsとMCPですが、本編にはMCPもclient固有のcomponentも追加しません。

package の `name`、Skill frontmatter の `name` / `description`、本文は**三つの別の制御**です。
package 名は小文字英数字・ハイフン・ピリオドで64文字以内、先頭末尾は英数字、連続する `--` / `..` は避けます。
Skill 名は小文字のkebab-caseで、親 directory と同じ `order-import-evidence` に固定し、`team-sora.evidence:order-import-evidence` と書きません。
実 client の呼出し表示に prefix が付くことと、frontmatter の値は別です。本編ではメニューも呼出しも試しません。

出典は [Agent Plugins manifest](https://agent-plugins.org/plugin-authors/manifest)、
[canonical schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)、
[VS Code Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)、
[Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) です。
VS Code Agent pluginsの形式・local設定・有効状態に関する節の確認日は **2026-09-15** です。
これは公式文書の確認日で、installやUI操作を実施した日ではありません。
形式の説明と個別環境での動作確認を区別し、本教材の live status は未観測です。

## 向いていること / 向いていないこと

同じ手順を複数人へ渡す、版の取り違えやコピー漏れを調べる、配布物の中身をレビューする、
戻すべき二ファイルを明確にするといった仕事に向いています。
一人の短期作業で手動コピーと ledger だけで十分なら、Plugin を増やさない方が簡単かもしれません。

package 化だけで正しい説明、認証、ACL、Skill の自動選択、本文 loading、速さを保証できません。
この課題は marketplace からの install / update、publish、実運用のロールバックの試験ではありません。
静的にテスト定義を読んでも、Java・DB の実行結果や過去の採用理由は分かりません。
「配布方式の差が小さい」「追加不要」も根拠を持って提出できます。

## Starter Kit

必要なのは Git、Node.js 22以降、PowerShell、UTF-8・LF で保存できる editor と、
Hubおよび自分の非公開Runtimeへの通常のアクセスです。設計補助の Agent は任意です。
JDK、Maven、DB、追加 extension、Plugin install、組織管理権限、PAT は不要です。

[Pack manifest](pack/manifest.json) は `baseline` と `package-design` の**二条件だけ**です。
全条件へ同じ14素材を `.hackathon/challenge/hc-014/` 以下に上書きなしで配ります。

| 相対素材（すべて上記directory配下） | 用途 |
|---|---|
| `brief.md.template`、`request.txt.template` | 固定する目的・依頼・安全境界。全文を使う |
| `source-materials.json.template` | 元repository、固定commit、実ファイルhash、改作内容、最終payloadのhash |
| `design.md.template`、`release-ledger.md.template` | 自分の設計と配布記録の用紙 |
| `drafts/v1/plugin.json.template`、`drafts/v1/skills/order-import-evidence/SKILL.md.template` | 最小の v1 DRAFT。本文の完成回答ではない |
| `drafts/v2/plugin.json.template`、`drafts/v2/skills/order-import-evidence/SKILL.md.template` | version と教材 marker だけを変えた例 |
| `lifecycle-origins.json.template` | `SYNTHETIC_LIFECYCLE_NOT_PLUGIN_DISCOVERY` の紙上の出所情報。実履歴ではない |
| `comparison.md.template`、`recovery.md.template`、`lifecycle.md.template` | 提出時に必要な三つの Evidence の用紙 |
| `tools/validate-plugin.mjs.template` | 原本の読み取り専用・狭いsubset検査器。Hubのテスト用で、本編では実行名へ変えない |

sourceKind は `baseline` です。Runtime root にある次の**実在する三ファイルを読む**ところから設計します。
例の本文が触れる箇所へ自分で戻り、読む順番と未確認の残し方を決めてください。

| ID | Runtimeからの相対path | 読む目的 |
|---|---|---|
| B1 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | `importDraft` / `replay` を読解の入口として選び、根拠の位置を記録する |
| B2 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | `canonicalHash` と関連する定義を読み、追加の根拠が必要な問いを残す |
| B3 | `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | 関連するテストの前提・定義を読む。実行しない |

Java原本は **`shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`** です。
教材の構造の参考は Labs `3474d21dd62bad2e594e84657dabe2eb9bb876c1` であり、Javaのsource repositoryではありません。
PackにJavaの複製treeや業務の答えを持ち込みません。三ファイル外が必要なら未確認へ残し、架空の履歴で補いません。
Runtimeの515-file baseline、provenance、二つの運用overrideは維持します。

条件ごとに別の非公開Runtime repository、名前付きbranch、新規workspace・会話・専用profileを用意します。
`branchSafe: false` なので一つのrepository内のbranch切替だけでは代用しません。
profileを分けてもhomeにある installed plugins、User/組織設定、Memoryが消えるわけではありません。
既存の外部設定を削除せず、残留・不明点を記録します。

## Open Question

同じSkillを別の人へ渡して更新するとき、何を版として識別し、どう重複や更新漏れを見つけ、元へ戻しますか。
手動コピーで十分な場合も含めて設計してください。

例えば、読み手に最初に見せるものは版の表でしょうか、それとも出所と本文hashでしょうか。
一人に渡す場合と複数人へ渡す場合で、二ファイルのpackageを管理する価値は変わるでしょうか。
読む順番、package名、説明、ledgerの見せ方、止める基準に唯一の正解はありません。

## Design Time

まずB1/B2/B3を静的に読み、自分が選んだ入口を `design.md` に記録します。
コードの完成した説明ではなく、読み手・手順・根拠の記録方法・未確認の扱いを設計します。
frontmatter は単一行の `name` と `description` の二項目、description は空でない1024文字以内に保ちます。
改行はLF、UTF-8・BOMなしです。本文の順番と表現は変えられますが、許可sourceと安全境界は広げません。

**配布方式を比べる前に、frontmatter を含む Skill v1 全文を凍結します。**
v2 は凍結v1の `教材版: training-v1` の一行だけを `教材版: training-v2` に替えます。
package名と説明も両版で同じにし、manifestは version だけを変えます。
制作時の会話を比較に流用せず、新しい会話を使って、固定requestと設計全文を双方へ渡します。
片方の回答、要約、講師の結論をもう片方の入力にしません。

## Build

### HubでPackを用意する

Hub checkoutで行います。`plan-run` は表示だけでrepositoryの作成も実機操作も行いません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-014 --condition baseline --team team-sora --run hc014-manual-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-014 --condition package-design --team team-sora --run hc014-package-01
node .\scripts\build-pack.mjs --challenge HC-014 --output .runtime/packs
```

`--output .runtime/packs` はCLIの固定引数です。物理directoryは `.runtime\packs\hc-014-v1` です。
Pack directoryや隣のhashが既に存在すれば停止します。上書き・削除で回避せず、既存の版/hashを照合するか未使用checkoutを使います。

### 二つのRuntimeを別々に準備する

[Getting Started](../../docs/getting-started.md) と
[Runtime onboarding](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md)
に従い、templateVersion 1 の新しい非公開repositoryを条件ごとに作成・checkoutします。
root READMEのアプリ起動手順は使いません。次は新しいbaseline用Runtime checkoutのrootで実行する例です。

```powershell
$Pack = 'C:\work\hackathon-hub\.runtime\packs\hc-014-v1'
git status --short --branch
git switch -c hc-014-baseline-manual-01
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition baseline --run-id hc014-manual-01
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

package側の**別checkout**ではbranchを `hc-014-package-design-package-01`、conditionを `package-design`、
run IDを `hc014-package-01` に替え、同じ検査・applyを行います。既存変更、run、名前の衝突、template不一致なら停止します。
`run.json` の手編集や別branchへの移動はしません。全条件で同じStarterのまま保ちます。

### 新規原稿を作り、Skillを凍結する

以下の関数はPowerShellの会話に定義するだけで、Runtimeにscriptファイルを追加しません。
既存ファイルへはコピーしません。両checkoutで必要なときに同じ定義を使えます。
保存先はPowerShellで現在開いているRuntimeの場所から解決します。
`Set-Location` と.NETのprocess cwdは別なので、未作成の保存先にも対応するprovider-awareな解決を使い、process cwd自体は変更しません。

```powershell
$Starter = '.\.hackathon\challenge\hc-014'
$Mine = '.\participant\hc-014'
function Copy-NewDraft([string]$Source, [string]$Destination) {
    $src = (Resolve-Path -LiteralPath $Source -ErrorAction Stop).Path
    $dst = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Destination)
    if (Test-Path -LiteralPath $dst) { throw "既存ファイルへはコピーしません: $dst" }
    New-Item -ItemType Directory -Path (Split-Path -Parent $dst) -Force | Out-Null
    [IO.File]::Copy($src, $dst, $false)
}
Copy-NewDraft "$Starter\design.md.template" "$Mine\design.md"
Copy-NewDraft "$Starter\release-ledger.md.template" "$Mine\release-ledger.md"
```

次はbaselineの自所有領域を**比較前の制作場所**にする例です。過去のbaseline回答を使うという意味ではありません。

```powershell
Copy-NewDraft "$Starter\drafts\v1\skills\order-import-evidence\SKILL.md.template" "$Mine\manual\v1\SKILL.md.template"
```

ここで `participant\hc-014\design.md` と `manual\v1\SKILL.md.template` を自分で編集します。
LF / UTF-8・BOMなしで保存し、設計が完成したらv1は以後変更しません。次のコマンドはv2を**一度だけ新規作成**します。

```powershell
$V1 = [IO.File]::ReadAllText((Resolve-Path "$Mine\manual\v1\SKILL.md.template"))
if ($V1.Contains("`r") -or ([regex]::Matches($V1, '(?m)^教材版: training-v1$').Count -ne 1)) {
    throw 'LFと一つの教材版markerを確認してください'
}
$V2Path = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath("$Mine\manual\v2\SKILL.md.template")
if (Test-Path -LiteralPath $V2Path) { throw '既存のv2は変更しません' }
New-Item -ItemType Directory -Path (Split-Path -Parent $V2Path) -Force | Out-Null
[IO.File]::WriteAllText($V2Path, [regex]::Replace($V1, '(?m)^教材版: training-v1$', '教材版: training-v2'), [Text.UTF8Encoding]::new($false))
Get-FileHash "$Mine\manual\v1\SKILL.md.template", "$Mine\manual\v2\SKILL.md.template" -Algorithm SHA256
Copy-NewDraft "$Mine\manual\v1\SKILL.md.template" "$Mine\manual\current\SKILL.md.template"
```

BOMはeditorでも確認してください。見た目が同じでも frontmatter、空白、LF/CRLF、末尾改行が違えば同じbytesではありません。
開始時のhashをledgerへ保存します。配布したv2の例をそのまま使うのではなく、**自分が凍結したv1**からv2を作ります。

package側の別checkoutでは、同じ設計決定を `design.md` に保存します。
`$FrozenManual` は先ほどの自所有baseline checkoutの絶対pathに置き換え、読み取り専用のコピー元として使います。

```powershell
$FrozenManual = 'C:\work\runtime-hc014-manual\participant\hc-014\manual'
foreach ($version in @('v1', 'v2')) {
    Copy-NewDraft "$FrozenManual\$version\SKILL.md.template" "$Mine\package\$version\skills\order-import-evidence\SKILL.md.template"
}
Copy-NewDraft "$Starter\drafts\v1\plugin.json.template" "$Mine\package\v1\plugin.json.template"
```

packageのv1 manifestだけを編集し、自分の配布名・説明を決めます。`$schema` と `version: "1.0.0"` を保ちます。
凍結後、manifest v2もversionだけを替えて新規作成します。これらはRuntime・Packの version とは別です。

```powershell
$ManifestV1 = [IO.File]::ReadAllText((Resolve-Path "$Mine\package\v1\plugin.json.template"))
if ($ManifestV1.Contains("`r") -or ([regex]::Matches($ManifestV1, '"version": "1.0.0"').Count -ne 1)) {
    throw '例と同じversion表記・LFで保存し、他fieldを確認してください'
}
$ManifestV2 = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath("$Mine\package\v2\plugin.json.template")
if (Test-Path -LiteralPath $ManifestV2) { throw '既存manifest v2は変更しません' }
[IO.File]::WriteAllText($ManifestV2, $ManifestV1.Replace('"version": "1.0.0"', '"version": "2.0.0"'), [Text.UTF8Encoding]::new($false))
Copy-NewDraft "$Mine\package\v1\plugin.json.template" "$Mine\package\current\plugin.json.template"
Copy-NewDraft "$Mine\package\v1\skills\order-import-evidence\SKILL.md.template" "$Mine\package\current\skills\order-import-evidence\SKILL.md.template"
```

同じ版の manual / package の二つの Skill に `Get-FileHash -Algorithm SHA256` を実行し、全文一致を確認します。
原本validatorはroot構成、schema、名前、一つのSkill、二項目frontmatter、LFとhashの**狭い教材subset**だけを調べます。
全Agent Plugins規格の適合認証ではありません。本編ではoverlayの `.mjs.template` を実行名にしたり、
helperをparticipantへ追加したりしません。二ファイル構成とhashはこのページに沿って点検します。

### 各条件のcurrentで更新し、完全に戻す

各自のcheckoutで、v1 / v2 は凍結したまま、currentだけを更新します。
baselineは `$Kind = 'manual'`、package側は `$Kind = 'package'` にします。

```powershell
$Kind = 'manual' # package-design の別checkoutでは 'package'
$Files = if ($Kind -eq 'manual') { @('SKILL.md.template') } else {
    @('plugin.json.template', 'skills\order-import-evidence\SKILL.md.template')
}
function Same-RawFile([string]$Left, [string]$Right) {
    $a = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Left))
    $b = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $Right))
    return [Convert]::ToBase64String($a) -ceq [Convert]::ToBase64String($b)
}
function Move-OwnedDraft([string]$Next) {
    if ($Next -notin @('v1', 'v2')) { throw 'v1かv2だけです' }
    $known = @('v1', 'v2') | Where-Object {
        $candidate = $_
        @($Files | Where-Object {
            -not (Same-RawFile "$Mine\$Kind\$candidate\$_" "$Mine\$Kind\current\$_")
        }).Count -eq 0
    }
    if (@($known).Count -ne 1) { throw 'currentが既知の完全な版ではありません。差分を記録して停止します' }
    foreach ($file in $Files) {
        [IO.File]::Copy((Resolve-Path "$Mine\$Kind\$Next\$file"), $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath("$Mine\$Kind\current\$file"), $true)
    }
    foreach ($file in $Files) { Get-FileHash "$Mine\$Kind\current\$file" -Algorithm SHA256 }
}
Move-OwnedDraft 'v2'
# ここでdraft-v2の全path・hashとコピーをledgerへ記録し、同じ版の相手側と比較する
Move-OwnedDraft 'v1'
foreach ($file in $Files) { Same-RawFile "$Mine\$Kind\v1\$file" "$Mine\$Kind\current\$file" }
```

最後の全結果が `True` であり、余分なファイルがないことも確認します。packageはmanifestとSkillの両方が必要です。
自所有currentに意図的な一要因の不一致を作る練習は、変更前のhashを控えてから行います。
拒否・差分をrecoveryへ記録した後だけ、凍結v1から**全ファイル**をcurrentへコピーし直して同じ照合を行います。
不明な変更を黙って上書きするために関数のguardを消しません。紙上の負例点検だけでも構いません。

## Compare

| 条件 | 比較する配布物 | 比べる点 |
|---|---|---|
| Baseline: `baseline` | 同じSkillの手動DRAFTとledger | 本文hash・論理版・出所・各コピーを手動で追えるか |
| Customized: `package-design` | root manifest + 同じ一つのSkillのpackage DRAFTとledger | 二ファイルの構成・配布metadata・一括確認のわかりやすさ |

両条件とも内部の状態は **draft-v1 → draft-v2 → restored-v1** です。conditionを三つ増やすものではありません。
manifest / 論理版は `1.0.0 → 2.0.0 → 1.0.0`、本文markerは `training-v1 → training-v2 → training-v1`。
同じ版のfrontmatter込み全文を比較します。manual v1 と package v2、同じversionでも違う本文は同等ではありません。

固定request・source・設計・Skill・必要な版情報を両方式へ等しく渡します。baselineはSkillなしの条件ではありません。
実測したコピーのファイル数・path・hashと、想定の手順数、未観測のUI操作時間を分けます。
`lifecycle-origins.json.template` は候補を**全originで集計**する練習です。
一件ずつ構成が妥当でも同名候補や古いコピーは残り得ます。disabledと書かれたものも残留確認から除きません。

本文や外部状態が揃わなければ `incomparable`、権限・準備で停止したら `blocked`、
利用機能がない場合は `unsupported` とします。`equal`、`worse`、手動方式で十分も有効です。
実登録・発見・loading・更新配信を観測していないので、install成功、知識増加、速度改善には結び付けません。

## Evidence

自分のRuntimeで、三つの用紙を新規作成し、全見出しを記入します。

```powershell
foreach ($name in @('comparison', 'recovery', 'lifecycle')) {
    Copy-NewDraft "$Starter\$name.md.template" ".\.hackathon\evidence\hc-014\$name.md"
}
```

| Evidence | 必要な観測 |
|---|---|
| `.hackathon/evidence/hc-014/comparison.md` | 自run、固定入力hash、環境、設計、同じ版の比較、結果と限界 |
| `.hackathon/evidence/hc-014/recovery.md` | 正常→一要因の不一致→完全復元、または紙上点検であること |
| `.hackathon/evidence/hc-014/lifecycle.md` | 各版の全hash、current遷移、全originの重複・旧版、非主張 |

manualにmanifestはないためmanifest hashは「非該当」と理由を記し、論理版とSkill hashは省略しません。
同じversionだけの確認、manifestだけの復元、本文だけの復元、name / descriptionだけ違う復元も区別します。
元helperの `installed` は合成コピーの内部用語で、UIの導入成功ではありません。
合成 `enabled:false` を実停止と読み替えず、実discoveryと本文loadingは未観測にします。

未測定の時間やクリック数は `null` と理由を記します。未実施の相手条件は未実施のまま、
条件横断の結論はそれぞれのRuntime PR / runへリンクします。秘密・個人情報・raw会話全量は提出しません。
Runtimeの見出し・hash検査は書式の確認であり、意味の正しさを採点しません。
`runtimeBehavior` / `educationalEffect` は静的検証では `not-observed` のままです。

## Submit

追加して提出できるファイルは次の**literal pathだけ**です。表の省略のないprefixは `participant/hc-014/` です。

| condition | participant配下の許可ファイル |
|---|---|
| baseline | `design.md`、`release-ledger.md`、`manual/v1/SKILL.md.template`、`manual/v2/SKILL.md.template`、`manual/current/SKILL.md.template` |
| package-design | `design.md`、`release-ledger.md`、`package/v1/plugin.json.template`、`package/v1/skills/order-import-evidence/SKILL.md.template`、`package/v2/plugin.json.template`、`package/v2/skills/order-import-evidence/SKILL.md.template`、`package/current/plugin.json.template`、`package/current/skills/order-import-evidence/SKILL.md.template` |

両条件で上記に加えて三つのEvidenceが必要です。Evidenceはrun-stateなのでparticipantの追加許可とは別です。
activeな `SKILL.md` や設定、作業用script、追加のメモ、Javaのコピーをbundleへ入れません。
現在のapply branchのまま、自分のrunだけを検証・exportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

用紙のまま、見出し欠落、宣言外変更で拒否されたら理由を直し、検査器を緩めません。
Runtime PRに当該conditionの成果とEvidenceを含め、
[共通Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) の `Challenge-specific design` に
配布名・本文の判断、同じ版の比較と復元の根拠、各Runtime URL / PR URLを記載します。
[Submission guide](../../docs/submission-guide.md) に従い、任意ガイドの未実施理由は本編と分けます。

## Judging

評価するのは、自分で設計した理由、baselineにも十分な情報を与えたこと、同じ全文を凍結したこと、
版・hash・構成・出所を切り分けた点検、コピー漏れや部分復元を見つけられる説明です。
package名や文章を見本と同じにする必要はありません。
Pluginの使用回数や「改善した」という結論だけでは加点しません。手動で十分、悪化、未観測も同じように評価します。
コードの意味を正しく理解したかは別に人が根拠へ戻って点検し、構成テストを正解判定器にはしません。

## Bonus Mission

配布先が一人の場合の「packageを作らない案」と、複数人の場合の「復元説明を先に見せる案」を紙上で比べ、
designの判断理由を改善してみてください。凍結済みの比較は書き換えず、次の設計候補として既存の記録欄へ分離します。
component追加、実install、新conditionを必要とする課題ではありません。

## Support / Fallback

Plugin対応のclientがなくても、二方式のDRAFT・hash・コピー・復元を比較して本編を完了できます。
Agentを使えなければ人が三ファイルを読んで設計し、実Skill loadingは未観測と記します。
ファイルの不一致や所有権不明、宣言外操作が必要になった時点で止めます。

唯一の任意ページは [Plugin有効化前の準備ガイド](optional/plugin-enable.md) です。
これは `OPTIONAL_GUIDE_ONLY` / `live-unobserved` で、本編に導入手順や許可を追加しません。
選択した**追跡可能なworkspace設定の経路**は、Runtime v1 が `.vscode/settings.json` を除外し
例外が `.vscode/mcp.json` だけなので `tracked-vscode-settings: blocked` です。
force-addやProfile限定への黙った切替で回避しません。`plugin-discovery: not-checked` も残します。

終了時は自分の成果をexportし、baselineが変わっていないことを確認します。
自分が作ったcurrent以外の設定・home・他人のPluginを削除せず、広範囲のclean/reset/stashを後片付けに使いません。
[Runtime repository guide](../../docs/runtime-repository-guide.md) と
[Support and Fallbacks](../../docs/support-and-fallbacks.md) が共通の境界です。
