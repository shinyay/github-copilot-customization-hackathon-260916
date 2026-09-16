# HC-040 一つのSkillをPluginとして届けよう

**Language:** **日本語** / [English](../../en/challenges/hc-040/README.md)

## Scenario

受注CSVの再送調査に使う一つのSkillを複数の担当者へ届ける方法を考えます。手動コピーとPlugin packageでSkill本文が同じなら、比較すべきなのは知識量ではなく、版、配布先、更新、旧版復元、drift確認の負担です。

Skill v1とv2を作り、各revisionでmanual copyとpackage copyのraw bytesを一致させます。Pluginのinstall、enable、marketplace接続、Cloud実行は行いません。

## この機能とは

Skillは特定作業の手順書です。PluginはSkill等のcomponentをまとめて配るpackageです。一つのSkillをpackageに入れても、本文の意味が自動的に改善するわけではありません。

Agent Plugins 1.0の基本構成は、package rootの `plugin.json` と `skills/<name>/SKILL.md` です。このシナリオは一つのSkillだけを扱い、MCP、Hook、Custom Agent、command、LSP、二つ目のSkillを追加しません。

Cloud向け設定には `enabledPlugins` や `extraKnownMarketplaces` が関係しますが、同梱するのは `.template` の不活性sampleだけです。架空のmarketplaceを実在・信頼済みの接続先として扱いません。

Skillの題材は受注再送調査です。

- `OrderImportService.importDraft` から既存claimの検索へ進む。
- `findClaim` と `replay` の境界を分ける。
- `OrderGroup.canonicalHash` でpayload canonicalizationの根拠を確認する。
- source読解と、DB mutation、CSV import、replay実行を分ける。

## 向いていること / 向いていないこと

**向いていること**

- Skillの正本、version、hash、配布先を管理する。
- manualとpackageの本文差を比較から除く。
- v2更新とv1復元の手順・責任を設計する。
- packageを採用しない判断も含めて保守負担を比較する。

**向いていないこと**

- package側へ追加componentを入れて能力比較へ変える。
- schema適合だけでinstall、enable、発見、利用成功とする。
- 片方だけSkill本文を改善する。
- floating refや架空marketplaceを信頼済みと表示する。

## ゴール

次を満たす配布・更新・復元計画を作ります。

1. v1とv2の正本を決める。
2. 同じrevisionのmanual/package copyをbyte-identicalにする。
3. `same-key-check` と `changed-payload-check` を両revisionへ適用する。
4. `prepare-v1`、`update-v2`、`restore-v1` を別状態で記録する。
5. planned copy数とobserved active copy数を分ける。
6. 一Skillのcomponent inventoryを維持する。

## 用意するもの

- テキストエディター
- SHA-256を計算できる環境。PowerShellの `Get-FileHash` などで十分
- `starter/` 以下の固定資料
- PluginやCloudの利用資格は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`distribution-design.md.template`](starter/distribution-design.md.template) | 正本、版、配布、復元の設計 |
| [`reference/lifecycle.md.template`](starter/reference/lifecycle.md.template) | 4内容点検行と6 lifecycle行 |
| [`reference/source-map.md.template`](starter/reference/source-map.md.template) | 調査対象symbolと実行境界 |
| [`customization/SKILL.md.template`](starter/customization/SKILL.md.template) | 不活性なSkill開始点 |
| [`customization/plugin.json.template`](starter/customization/plugin.json.template) | 一Skill package manifestの開始点 |
| [`customization/plugin-settings.json.template`](starter/customization/plugin-settings.json.template) | 不活性なCloud設定sample |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。作業用コピーを作る場合も `.template` を残し、`.github/`、user plugin directory、marketplace設定へ置かないでください。

比較前に固定するもの:

- `same-key-check` と `changed-payload-check`
- Skill v1全文とraw bytes
- v2で変更する一点
- 各revisionのmanual/package path
- plugin name/versionと一Skill inventory
- lifecycle revision

## 試してみる

1. `source-map.md.template` と `SKILL.md.template` を読み、既存claim、canonical hash、replay前の停止境界を確認する。
2. Skill v1を作り、UTF-8、改行、BOM、byte length、SHA-256を記録する。
3. v1をmanual用とpackage用へbyte-copyし、両hashを比較する。
4. 調査順またはunknownの説明を一つだけ改善してSkill v2を作る。
5. v2もmanual/packageで同じbytesにする。
6. package側は `plugin.json` と `skills/training-order-evidence/SKILL.md` の一Skill構成だけにする。
7. `lifecycle.md.template` へ4つの内容点検行を記入する。
   - v1 × 2 tasks
   - v2 × 2 tasks
8. manual/packageそれぞれについて `prepare-v1`、`update-v2`、`restore-v1` を記入する。
9. hash一致をinstall、active version、discovery、callの証拠へ昇格させない。

PowerShellでの静的確認例:

```powershell
Get-FileHash -Algorithm SHA256 <manual-skill-path>
Get-FileHash -Algorithm SHA256 <package-skill-path>
```

## 任意: 比較する

manual deliveryとPlugin packageについて、次だけを比較します。

- 正本から配布先までのcopy手順
- versionとcomponent inventoryの見通し
- v2更新時のdrift検出
- v1復元時の確認項目
- 一Skillのために増える保守負担

Skill本文の効果は同じbytesに固定します。

## 確認ポイント

- v1とv2の各revisionでmanual/packageがbyte-identical。
- 2 task × 2 revisionの4行がある。
- 2 delivery × 3 lifecycle stateの6行がある。
- packageが一Skillだけで、追加componentがない。
- manifest metadata、planned copies、active copies、fetched version、discovery、callを分けている。
- packageが過剰ならmanual継続や追加不要を選べる。

## 発展

- 配布先が二つへ増えた場合のdrift検出、確認担当、更新停止条件を設計する。
- 実install/update/restoreを観察する場合は [Plugin lifecycleの限定観測](optional/plugin-lifecycle-live.md) を参照する。

## 制約・Fallback・安全

- 本編ではPluginをinstall/enableせず、marketplaceやCloud設定を変更しない。
- 架空の `training-marketplace` を実接続先として使わない。
- `.template` を外さず、active Skillやsettingsを作らない。
- hash一致は保存bytesの一致だけを示す。発見、利用、知識効果は未観測。
- Pluginを利用できなくても、package原稿、byte identity、lifecycle台帳だけで完了できる。
- sourceを実行できなくても、同梱されたsymbol説明から静的なSkillを作れる。DBやreplay結果は推測しない。

`manifest` という語は、このシナリオではPlugin packageの `plugin.json` とcomponent inventoryを指します。旧式の配布契約や提出物を意味しません。
