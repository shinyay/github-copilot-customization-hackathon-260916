# HC-040 1つのSkillをPluginとして届けよう

**言語:** **日本語** / [English](../../en/challenges/hc-040/README.md)

## シナリオ

受注 CSV の再送調査に使う1つの Skill を、複数の担当者へ届ける方法を考えます。手動コピーと Plugin パッケージで Skill の本文が同じなら、比較すべきなのは知識量ではありません。バージョン、配布先、更新、旧版への復元、差異を確認する負担を比較します。

Skill v1 と v2 を作り、各リビジョンで手動コピーとパッケージコピーのバイト列を一致させます。Plugin のインストール、有効化、marketplace への接続、Cloud での実行は行いません。

## この機能とは

Skill は特定の作業の手順書です。Plugin は、Skill などのコンポーネントをまとめて配布するパッケージです。1つの Skill をパッケージに入れても、本文の意味が自動的に改善されるわけではありません。

Agent Plugins 1.0 の基本構成は、パッケージのルートに置く `plugin.json` と `skills/<name>/SKILL.md` です。このシナリオでは1つの Skill だけを扱い、MCP、Hook、Custom Agent、コマンド、LSP、2つ目の Skill は追加しません。

Cloud 向けの設定には `enabledPlugins` や `extraKnownMarketplaces` が関係しますが、同梱するのは `.template` の不活性なサンプルだけです。架空の marketplace を、実在する信頼済みの接続先として扱いません。

Skillの題材は受注再送調査です。

- `OrderImportService.importDraft` から、既存の claim の検索へ進みます。
- `findClaim` と `replay` の境界を分けます。
- `OrderGroup.canonicalHash` で、payload canonicalization の根拠を確認します。
- ソースの読解と、DB の更新、CSV のインポート、replay の実行を分けます。

## 向いていること / 向いていないこと

**向いていること**

- Skill の正本、バージョン、ハッシュ、配布先を管理する。
- 手動コピーとパッケージコピーの本文差を比較条件から除く。
- v2 への更新と v1 への復元について、手順と責任を設計する。
- パッケージを採用しない判断も含めて、保守の負担を比較する。

**向いていないこと**

- パッケージ側へ追加のコンポーネントを入れ、能力の比較に変える。
- スキーマへの適合だけで、インストール、有効化、検出、利用が成功したと見なす。
- 片方の Skill 本文だけを改善する。
- floating ref や架空の marketplace を、信頼済みと表示する。

## ゴール

次を満たす配布・更新・復元計画を作ります。

1. v1 と v2 の正本を決める。
2. 同じリビジョンの手動コピーとパッケージコピーを、バイト単位で一致させる。
3. `same-key-check` と `changed-payload-check` を両方のリビジョンへ適用する。
4. `prepare-v1`、`update-v2`、`restore-v1` を別状態で記録する。
5. 計画上のコピー数と、観測された有効なコピー数を分ける。
6. 1つの Skill だけで構成されるコンポーネント一覧を維持する。

## 用意するもの

- テキストエディター
- SHA-256 を計算できる環境。PowerShell の `Get-FileHash` などで十分
- `starter/` 以下の固定資料
- PluginやCloudの利用資格は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`distribution-design.md.template`](starter/distribution-design.md.template) | 正本、バージョン、配布、復元の設計 |
| [`reference/lifecycle.md.template`](starter/reference/lifecycle.md.template) | 内容を確認する4行と lifecycle を記録する6行 |
| [`reference/source-map.md.template`](starter/reference/source-map.md.template) | 調査対象のシンボルと実行範囲 |
| [`customization/SKILL.md.template`](starter/customization/SKILL.md.template) | 不活性な Skill の開始点 |
| [`customization/plugin.json.template`](starter/customization/plugin.json.template) | 1つの Skill だけを含むパッケージ manifest の開始点 |
| [`customization/plugin-settings.json.template`](starter/customization/plugin-settings.json.template) | 不活性な Cloud 設定のサンプル |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。作業用のコピーを作る場合も `.template` を残し、`.github/`、ユーザーの Plugin ディレクトリ、marketplace 設定には置かないでください。

比較前に固定するもの:

- `same-key-check` と `changed-payload-check`
- Skill v1 の全文とバイト列
- v2 で変更する1点
- 各リビジョンの手動コピーとパッケージコピーのパス
- Plugin の名前とバージョン、および1つの Skill だけで構成される一覧
- lifecycle のリビジョン

## 試してみる

1. `source-map.md.template` と `SKILL.md.template` を読み、既存の claim、canonical ハッシュ、replay 前に停止する境界を確認します。
2. Skill v1 を作り、UTF-8、改行コード、BOM、バイト長、SHA-256 を記録します。
3. v1 を手動配布用とパッケージ配布用へバイト単位でコピーし、両方のハッシュを比較します。
4. 調査順序または unknown の説明を1点だけ改善し、Skill v2 を作ります。
5. v2 も、手動コピーとパッケージコピーで同じバイト列にします。
6. パッケージ側は、`plugin.json` と `skills/training-order-evidence/SKILL.md` からなる1つの Skill だけの構成にします。
7. `lifecycle.md.template` に、内容を確認する4行を記入します。
   - v1 × 2タスク
   - v2 × 2タスク
8. 手動配布とパッケージ配布のそれぞれについて、`prepare-v1`、`update-v2`、`restore-v1` を記入します。
9. ハッシュの一致を、インストール、有効なバージョン、検出、呼び出しの証拠として扱わないようにします。

PowerShellでの静的確認例:

```powershell
Get-FileHash -Algorithm SHA256 <manual-skill-path>
Get-FileHash -Algorithm SHA256 <package-skill-path>
```

## 任意: 比較する

手動配布と Plugin パッケージについて、次の項目だけを比較します。

- 正本から配布先までのコピー手順
- バージョンとコンポーネント一覧の見通し
- v2 へ更新するときに差異を検出する方法
- v1 へ復元するときの確認項目
- 1つの Skill のために増える保守負担

Skill 本文の効果は、同じバイト列に固定します。

## 確認ポイント

- v1 と v2 の各リビジョンで、手動コピーとパッケージコピーのバイト列が一致している。
- 2タスク × 2リビジョンの4行がある。
- 2つの配布方法 × 3つの lifecycle 状態の6行がある。
- パッケージに含まれる Skill が1つだけで、追加のコンポーネントがない。
- manifest のメタデータ、計画上のコピー、実際に有効なコピー、取得したバージョン、検出、呼び出しを分けている。
- パッケージが過剰なら、手動配布の継続や追加不要を選べる。

## 発展

- 配布先が2つに増えた場合に、差異を検出する方法、確認担当、更新の停止条件を設計する。
- 実際のインストール、更新、復元を観察する場合は、[Plugin lifecycle の限定観測](optional/plugin-lifecycle-live.md) を参照する。

## 制約・代替手段・安全

- 本編では Plugin をインストールまたは有効化せず、marketplace や Cloud の設定を変更しない。
- 架空の `training-marketplace` を実際の接続先として使わない。
- `.template` を外さず、有効な Skill や設定を作らない。
- ハッシュの一致が示すのは、保存されたバイト列の一致だけです。検出、利用、知識への効果は未観測です。
- Plugin を利用できなくても、パッケージの原稿、バイト単位の一致、lifecycle の台帳だけで完了できます。
- ソースを実行できなくても、同梱されたシンボルの説明から静的な Skill を作れます。DB や replay の結果は推測しません。

`manifest` という語は、このシナリオでは Plugin パッケージの `plugin.json` とコンポーネント一覧を指します。旧式の配布契約や提出物を意味しません。
