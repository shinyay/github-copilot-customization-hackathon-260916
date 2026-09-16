# HC-037 LiteとBalancedのレビュー品質を比べよう

**Language:** **日本語** / [English](../../en/challenges/hc-037/README.md)

## Scenario

税額まわりの変更をCopilot code reviewへ依頼するとき、LiteとBalancedのどちらを選ぶべきかを検討します。指摘数や文章量だけで勝敗を決めず、根拠のある指摘、誤検知、見落とし、重複、確認負担、欠測を同じ基準で記録できる評価計画を作ります。

このシナリオでは実際のレビューを依頼しません。二つの候補差分について、LiteとBalancedの四つの計画セルをすべて `planned-not-requested` として設計します。

## この機能とは

Copilot code reviewのeffortは、標準レビューへ依頼する分析の深さです。LiteとBalancedは次のものとは別に扱います。

- Chatのmodel pickerやthinking effort
- Custom Agentの役割
- 手動promptの長さ
- 実際に表示されたeffective effort
- 内部model、費用、agentic fallback、CI上の表示

題材は税率ごとの集約と丸めです。

- `TaxAmounts` は税率ごとに金額を集約する。
- `Money.tax` は税率bucketごとに税額を丸める。
- 既存testは、同じ税率でも `0.10` と `0.1000` のようにscaleが異なる入力を含む。
- `candidate-01` は通常変更を含む候補、`candidate-02` は集約と丸めの順序を検討する候補。ただし正解ラベルは配布しない。

## 向いていること / 向いていないこと

**向いていること**

- 実レビュー前に公正な比較方法を決める。
- findingを変更行とsource/testへ結び付ける。
- 正常な変更への警告もfalse positive候補として扱う。
- 片側の欠測を0件へ変換せず、比較不能の条件を決める。

**向いていないこと**

- Balancedの文章量やfinding数だけで高品質と判断する。
- 一回の結果を統計的優位と呼ぶ。
- 手動promptや別modelを第三条件として混ぜる。
- 候補差分を実sourceへ適用し、Javaやtestを実行済みとする。

## ゴール

[`starter/evaluation-plan.md.template`](starter/evaluation-plan.md.template) の四行を埋め、次を説明できる状態にします。

1. findingを支持する最小単位
2. false positive、重複、見落としの扱い
3. 人が確認する時間と根拠確認の負担
4. requested effortと未観測項目の分離
5. 比較を中止または保留する条件

## 用意するもの

- テキストエディター
- `starter/` 以下の固定資料
- 任意でGit。Copilot code reviewの利用資格や課金枠は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 未送信の固定依頼 |
| [`evaluation-plan.md.template`](starter/evaluation-plan.md.template) | Lite × 2候補、Balanced × 2候補の評価計画 |
| [`candidate-01.diff.template`](starter/candidates/candidate-01.diff.template)、[`candidate-02.diff.template`](starter/candidates/candidate-02.diff.template) | 二つの合成候補差分 |
| [`reference/controls.json.template`](starter/reference/controls.json.template) | effort以外に固定する項目 |
| [`reference/rules.md.template`](starter/reference/rules.md.template) | 根拠、誤検知、負担、欠測の共通規約 |
| [`reference/source-map.md.template`](starter/reference/source-map.md.template) | 関連symbolと読取境界 |

すべて学習用の不活性資料です。`.template` を外さないでください。

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。比較前に次を固定します。

- task: `amount-review`
- `candidate-01` と `candidate-02` の内容
- 依頼全文と評価規約
- Lite / Balanced以外の評価項目
- 計画revision

実sourceを取得できない場合でも、README、候補差分、source map、規約に記載された集約・丸め境界だけで計画を作れます。

## 試してみる

1. `starter/request.txt.template` と `starter/reference/rules.md.template` を読む。
2. 二つのcandidateを、正解ラベルを仮定せずに読む。
3. finding候補ごとに、変更行、支持するsource/test、支持範囲を決める。
4. 通常変更への警告、unsupportedな指摘、重複をどう記録するか決める。
5. `evaluation-plan.md.template` の四行を同じ基準で埋める。
6. 次の値は実行しない限り `null` または `not-observed` のままにする。
   - effective effort
   - 内部model
   - 実finding
   - 費用
   - agentic fallback
   - CI visibility
7. 片側だけ実行できた場合や、candidate/sourceの固定が崩れた場合の停止条件を書く。

精度や優位性の比率は、妥当な分母がない限り作りません。

## 任意: 比較する

最初にテンプレートを見ず短い評価案を作り、その後テンプレートの観点で作り直します。両方で同じcandidateを使い、見落とした欠測、誤検知確認、負担の差だけを比較してください。

実レビューを行う場合は本編と分け、LiteとBalancedを同じPR、base/head、依頼、回数上限、費用上限で一回ずつ観測します。未実施側を0 findingsとして扱いません。

## 確認ポイント

- 四つの計画セルがすべてある。
- requested effort以外の入力と評価軸が同じ。
- finding数ではなく、支持、誤検知、重複、見落とし、負担を分けている。
- 通常変更への警告を検討できる。
- `planned-not-requested` を実レビュー結果へ読み替えていない。
- `same`、`worse`、`not-observed`、`incomparable` も有効な結論にしている。

## 発展

- 追加の金額例がどの欠測を解消するか、次の独立した検証案を一つ設計する。
- 実サービスで観測する前の安全確認は、[標準review effortの限定観測](optional/review-effort-live.md) を参照する。

## 制約・Fallback・安全

- 本編からreview request、PR変更、source変更、費用発生操作を行わない。
- 実effort、内部model、費用、review品質を推測しない。
- sourceへアクセスできない場合は、同梱資料だけで評価計画を作り、source実行結果を未観測として残す。
- candidateの内容、依頼、評価規約を固定できない場合は比較を停止する。
- 利用資格がない場合でも、テキストだけでゴールまで完了できる。
