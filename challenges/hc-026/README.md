# HC-026 カスタマイズ資産を安全に段階導入する

**Language:** **日本語** / [English](../../en/challenges/hc-026/README.md)

## Scenario

チームで作った Instructions、Skill、Plugin の原稿を共有したくても、owner、review、現在版、前版、配布先、復元先のどれかが不明なままでは安全に範囲を広げられません。

このシナリオでは、2つの架空資産を5つの資料状態で監査します。良い内容かどうかだけではなく、責任、版、target、rollback の追跡可能性を確認し、「進める条件」と「止める条件」を設計します。

## この機能とは

ここで扱うのは GitHub の組織設定そのものではなく、Copilot カスタマイズ資産を安全に共有するための運用設計です。資産ごとに次を分けます。

- owner / reviewer / review status / update reason
- current / expected current / previous
- target / allowed target
- rollback candidate / digest

古い版であることと、復元に使える前版であることは同じではありません。`previousVersion: v1` が正しくても、現在版が期待する `v2` と一致しなければ current の問題です。owner が不明なら架空値で埋めず、`blocked` のまま止めます。

個別判定と集合判定は次の規則を使います。

1. 1件でも `fail` があれば集合は `fail`
2. `fail` がなく、1件でも `blocked` があれば集合は `blocked`
3. 全件が `pass` のときだけ集合は `pass`

台帳判定と、その後に「pilot だけ進める」「待つ」「共有しない」と決める運用判断は別です。

## 向いていること

- Instructions、Skill、Plugin 原稿を少人数から段階的に共有する計画
- owner、review、版、target、rollback を同じ台帳で追跡すること
- 一部の資産だけ良い場合にも集合全体の risk を隠さない判断
- 現状維持、対象縮小、review 待ち、追加資産不要を含む運用設計

## 向いていないこと

- 実在組織の owner や承認を架空値で埋めること
- Plugin、MCP、組織設定の権限を一括して保証すること
- 内容品質だけで配布可否を決めること
- 紙上の台帳を実配布・実復元の成功記録として扱うこと

## ゴール

- `2資産 × 5状態 = 10 record` を欠落なく監査する
- `pass` / `blocked` / `fail` の理由を項目単位で説明する
- previous、rollback candidate、digest を照合する
- 集合 rollup と、共有・待機・縮小の運用判断を分ける
- 安全な rollout 方針と restore 方針を作る

## 用意するもの

`starter/` の素材はすべて `SYNTHETIC_TRAINING_ONLY` です。

- `request.md.template`: 固定監査依頼
- `policy.md.template`: 固定判定規則
- `asset-register.json.template`: 2資産、v1 / v2、SHA-256
- `scenario-records.json.template`: 5状態 × 2資産の10 record
- `versions/`: 不活性な versioned asset
- `design.md.template` / `comparison.md.template`: 設計・比較ワークシート

固定資産は `reading-rules` と `analysis-package` です。5状態には、整合状態、owner 欠測、current 不一致、未許可 target、rollback digest 不一致が含まれます。file 名だけで結論を決めず、各 field と実際の bytes を確認します。

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/request.md.template` と `starter/policy.md.template` を読みます。
3. `asset-register.json.template`、`scenario-records.json.template`、`versions/` を確認します。
4. 結果を見る前に `design.md.template` の review 単位、責任分担、停止・撤回条件、restore 確認方法、unknown の扱いを自分のメモへ固定します。
5. `.template` を外したり、資産を active な `.github/` 配下へ配置したりしません。

## 試してみる

1. Copilot に固定依頼、固定 policy、asset register、scenario records を渡します。
2. 最初に、10 record の exact 集合と欠落・重複がないことを確認させます。
3. 各 record で owner、reviewer、review status、update reason、current、expected current、target、allowed target、previous、rollback、digest を別々に評価します。
4. `starter/versions/` の実ファイルへ SHA-256 を計算し、asset register と照合します。計算していない値は「未確認」とします。
5. 各 record を `pass` / `blocked` / `fail` に分類し、固定規則で集合 rollup を求めます。
6. 台帳判定を上書きせず、pilot へ進む、対象を縮小する、review を待つ、restore 確認まで停止する、共有しない、のいずれかを理由付きで提案させます。
7. `comparison.md.template` を使い、個別判定、集合 rollup、運用判断、未確認の実操作を分けてまとめます。

## 任意: 比較する

同じ10 record を新しい会話で2回監査できます。

- **Baseline**: 固定 policy だけを使う
- **Customized**: 結果を見る前に `design.md.template` へ固定した運用方針も使う

record の判定自体を書き換えず、方針追加によって停止条件、対象縮小、restore 手順が明確になったかだけを比べます。

## 確認ポイント

- 2資産 × 5状態の全10 record を残した
- unknown を推測で補完していない
- `previous = v1` と `current` の不一致を別問題として扱った
- fail 優先、次に blocked の集合 rollup を保った
- rollback candidate と実 bytes の digest を結び付けた
- 台帳判定と運用判断を分けた
- 紙上の方針を実承認・実配布・実復元の成功に昇格させていない

## 発展

- [実組織へ段階導入する前の確認](optional/organization-rollout.md)

owner、管理者、権限、配布元、復元先を確認し、追加承認を得られる場合だけ進めます。

## 制約・Fallback・安全

- 本編は合成資料の監査だけで完了し、実組織への書き込み、権限変更、配布、復元を行いません。
- SHA-256 を計算できない場合は asset register の値を fixture として利用できますが、独立検証済みとは書きません。
- owner、reviewer、対象管理者、配布元 bytes、復元先 bytes のどれかが不明なら停止します。
- Plugin と MCP の権限を一括した承認として扱いません。
- 入力不足は `blocked`、同じ bytes を維持できない比較は `incomparable` とします。
- 実配布へ進めない場合も、限定共有、現状維持、追加資産不要は有効な結論です。
