# HC-026 カスタマイズ資産を安全に段階導入しよう

**言語:** **日本語** / [English](../../en/challenges/hc-026/README.md)

## シナリオ

チームで作成したInstructions、Skill、Pluginの原稿を共有したくても、所有者、レビュー状況、現在のバージョン、前のバージョン、配布先、復元先のどれかが不明なままでは、安全に対象範囲を広げられません。

このシナリオでは、2つの架空の資産を5つの資料状態で監査します。内容の良し悪しだけでなく、責任、バージョン、対象、rollbackの追跡可能性を確認し、「進める条件」と「止める条件」を設計します。

## この機能とは

ここで扱うのは GitHub の組織設定そのものではなく、Copilot カスタマイズ資産を安全に共有するための運用設計です。資産ごとに次を分けます。

- owner / reviewer / review status / update reason
- current / expected current / previous
- target / allowed target
- rollback candidate / digest

古いバージョンであることと、復元に使える前のバージョンであることは同じではありません。`previousVersion: v1` が正しくても、現在のバージョンが期待する `v2` と一致しなければ、currentに問題があります。ownerが不明な場合は架空の値で埋めず、`blocked` のまま停止します。

個別判定と集合判定は次の規則を使います。

1. 1件でも `fail` があれば集合は `fail`
2. `fail` がなく、1件でも `blocked` があれば集合は `blocked`
3. 全件が `pass` のときだけ集合は `pass`

台帳による判定と、その後に「パイロットだけ進める」「待つ」「共有しない」と決める運用上の判断は別です。

## 向いていること

- Instructions、Skill、Plugin 原稿を少人数から段階的に共有する計画
- 所有者、レビュー、バージョン、対象、rollbackを同じ台帳で追跡すること
- 一部の資産だけに問題がない場合でも、集合全体のリスクを隠さない判断
- 現状維持、対象の縮小、レビュー待ち、追加資産不要を含む運用設計

## 向いていないこと

- 実在する組織のownerや承認を架空の値で埋めること
- Plugin、MCP、組織設定の権限を一括して保証すること
- 内容品質だけで配布可否を決めること
- 紙上の台帳を実配布・実復元の成功記録として扱うこと

## ゴール

- `2資産 × 5状態 = 10 record` を欠落なく監査する
- `pass` / `blocked` / `fail` の理由を項目単位で説明する
- previous、rollback candidate、digest を照合する
- 集合のrollupと、共有・待機・縮小の運用判断を分ける
- 安全なrollout方針と復元方針を作る

## 用意するもの

`starter/` の素材はすべて `SYNTHETIC_TRAINING_ONLY` です。

- `request.md.template`: 固定監査依頼
- `policy.md.template`: 固定判定規則
- `asset-register.json.template`: 2資産、v1 / v2、SHA-256
- `scenario-records.json.template`: 5状態 × 2資産の10レコード
- `versions/`: 不活性なバージョン別資産
- `design.md.template` / `comparison.md.template`: 設計・比較ワークシート

固定資産は `reading-rules` と `analysis-package` です。5つの状態には、整合状態、ownerの欠測、currentの不一致、許可されていないtarget、rollbackのダイジェスト不一致が含まれます。ファイル名だけで結論を決めず、各フィールドと実際のバイト列を確認します。

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/request.md.template` と `starter/policy.md.template` を読みます。
3. `asset-register.json.template`、`scenario-records.json.template`、`versions/` を確認します。
4. 結果を見る前に、`design.md.template` にあるレビュー単位、責任分担、停止・撤回条件、復元の確認方法、unknownの扱いを自分のメモに固定します。
5. `.template` を外したり、資産を有効な `.github/` 配下へ配置したりしません。

## 試してみる

1. Copilotに固定依頼、固定ポリシー、資産台帳、シナリオレコードを渡します。
2. 最初に、10レコードが正確にそろい、欠落や重複がないことを確認させます。
3. 各レコードで、owner、reviewer、review status、update reasonを別々に評価します。current、expected current、target、allowed target、previous、rollback、digestも個別に確認します。
4. `starter/versions/` の実ファイルについてSHA-256を計算し、資産台帳と照合します。計算していない値は「未確認」とします。
5. 各レコードを `pass` / `blocked` / `fail` に分類し、固定規則で集合のrollupを求めます。
6. 台帳の判定を上書きせず、パイロットへ進む、対象を縮小する、レビューを待つ、復元の確認まで停止する、共有しない、のいずれかを理由付きで提案させます。
7. `comparison.md.template` を使い、個別判定、集合のrollup、運用判断、未確認の実操作を分けてまとめます。

## 任意: 比較する

同じ10レコードを新しい会話で2回監査できます。

- **Baseline**: 固定ポリシーだけを使う
- **Customized**: 結果を見る前に `design.md.template` へ固定した運用方針も使う

レコードの判定自体は書き換えず、方針を追加したことで停止条件、対象の縮小、復元手順が明確になったかだけを比較します。

## 確認ポイント

- 2資産 × 5状態の全10レコードを残した
- unknown を推測で補完していない
- `previous = v1` と `current` の不一致を別問題として扱った
- failを優先し、次にblockedとする集合のrollupを保った
- rollback candidateと実際のバイト列のダイジェストを結び付けた
- 台帳判定と運用判断を分けた
- 紙上の方針を実承認・実配布・実復元の成功に昇格させていない

## 発展

- [実組織へ段階導入する前の確認](optional/organization-rollout.md)

owner、管理者、権限、配布元、復元先を確認し、追加承認を得られる場合だけ進めます。

## 制約・代替手段・安全

- 本編は合成資料の監査だけで完了し、実組織への書き込み、権限変更、配布、復元を行いません。
- SHA-256を計算できない場合は、資産台帳の値をフィクスチャとして利用できますが、独立して検証済みとは書きません。
- owner、reviewer、対象管理者、配布元のバイト列、復元先のバイト列のどれかが不明な場合は停止します。
- Plugin と MCP の権限を一括した承認として扱いません。
- 入力不足は `blocked`、同じバイト列を維持できない比較は `incomparable` とします。
- 実配布へ進めない場合も、限定共有、現状維持、追加資産不要は有効な結論です。
