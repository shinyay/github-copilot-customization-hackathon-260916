# HC-037 LiteとBalancedのレビュー品質を比べよう

**言語:** **日本語** / [English](../../en/challenges/hc-037/README.md)

## シナリオ

税額に関する変更を Copilot code review でレビューするとき、Lite と Balanced のどちらを選ぶべきかを検討します。指摘数や文章量だけで優劣を決めず、根拠のある指摘、誤検知、見落とし、重複、確認の負担、欠測を同じ基準で記録できる評価計画を作ります。

このシナリオでは、実際のレビューは依頼しません。2つの候補差分と Lite / Balanced を組み合わせた4つの計画セルを、すべて `planned-not-requested` として設計します。

## この機能とは

Copilot code review の effort は、標準レビューで依頼する分析の深さを表します。Lite と Balanced は、次の項目と分けて扱います。

- Chat の model picker や thinking effort
- Custom Agent の役割
- 手動プロンプトの長さ
- 実際に表示された effective effort
- 内部モデル、費用、エージェントによる代替手段、CI での表示

題材は税率ごとの集約と丸めです。

- `TaxAmounts` は、税率ごとに金額を集約します。
- `Money.tax` は、税率 bucket ごとに税額を丸めます。
- 既存のテストには、同じ税率でも `0.10` と `0.1000` のように scale が異なる入力が含まれます。
- `candidate-01` は通常の変更を含む候補、`candidate-02` は集約と丸めの順序を検討する候補です。ただし、正解ラベルは配布しません。

## 向いていること / 向いていないこと

**向いていること**

- 実際にレビューする前に、公正な比較方法を決める。
- 指摘を変更行とソースやテストに結び付ける。
- 正常な変更への警告も、誤検知の候補として扱う。
- 片側の欠測を0件と見なさず、比較不能とする条件を決める。

**向いていないこと**

- Balanced の文章量や指摘数だけで、品質が高いと判断する。
- 1回の結果を統計的に優位だと見なす。
- 手動プロンプトや別のモデルを、第3の条件として混ぜる。
- 候補差分を実際のソースへ適用し、Java やテストを実行済みと見なす。

## ゴール

[`starter/evaluation-plan.md.template`](starter/evaluation-plan.md.template) の四行を埋め、次を説明できる状態にします。

1. 指摘を裏付ける最小単位
2. false positive、重複、見落としの扱い
3. 人が確認する時間と、根拠を確かめる負担
4. requested effort と未観測項目の分離
5. 比較を中止または保留する条件

## 用意するもの

- テキストエディター
- `starter/` 以下の固定資料
- 任意で Git。Copilot code review の利用資格や課金枠は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 未送信の固定依頼 |
| [`evaluation-plan.md.template`](starter/evaluation-plan.md.template) | Lite × 2候補、Balanced × 2候補の評価計画 |
| [`candidate-01.diff.template`](starter/candidates/candidate-01.diff.template)、[`candidate-02.diff.template`](starter/candidates/candidate-02.diff.template) | 2つの合成候補差分 |
| [`reference/controls.json.template`](starter/reference/controls.json.template) | effort以外に固定する項目 |
| [`reference/rules.md.template`](starter/reference/rules.md.template) | 根拠、誤検知、負担、欠測の共通規約 |
| [`reference/source-map.md.template`](starter/reference/source-map.md.template) | 関連シンボルと読み取り範囲 |

すべて学習用の不活性資料です。`.template` を外さないでください。

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。比較前に次を固定します。

- タスク: `amount-review`
- `candidate-01` と `candidate-02` の内容
- 依頼全文と評価規約
- Lite / Balanced 以外の評価項目
- 計画のリビジョン

実際のソースを取得できない場合でも、README、候補差分、ソースマップ、規約に記載された集約と丸めの境界だけで計画を作れます。

## 試してみる

1. `starter/request.txt.template` と `starter/reference/rules.md.template` を読みます。
2. 2つの候補を、正解ラベルを仮定せずに読みます。
3. 指摘候補ごとに、変更行、裏付けとなるソースやテスト、裏付けられる範囲を決めます。
4. 通常の変更への警告、裏付けのない指摘、重複をどのように記録するか決めます。
5. `evaluation-plan.md.template` の四行を同じ基準で埋める。
6. 次の値は実行しない限り `null` または `not-observed` のままにする。
   - effective effort
   - 内部モデル
   - 実際の指摘
   - 費用
   - エージェントによる代替手段
   - CI での表示
7. 片側だけ実行できた場合や、候補またはソースの固定条件が崩れた場合の停止条件を書きます。

精度や優位性の比率は、妥当な分母がない限り作りません。

## 任意: 比較する

最初にテンプレートを見ずに短い評価案を作り、その後、テンプレートの観点に沿って作り直します。どちらにも同じ候補を使い、見落としていた欠測、誤検知の確認、負担の違いだけを比較してください。

実際にレビューする場合は本編と分け、Lite と Balanced を同じ PR、base/head、依頼内容、回数上限、費用上限で1回ずつ観測します。未実施側を指摘0件として扱いません。

## 確認ポイント

- 4つの計画セルがすべてある。
- requested effort以外の入力と評価軸が同じ。
- 指摘数ではなく、裏付け、誤検知、重複、見落とし、負担を分けている。
- 通常変更への警告を検討できる。
- `planned-not-requested` を実レビュー結果へ読み替えていない。
- `same`、`worse`、`not-observed`、`incomparable` も有効な結論にしている。

## 発展

- 追加の金額例がどの欠測を解消するか、次の独立した検証案を1つ設計する。
- 実サービスで観測する前の安全確認は、[標準 review effort の限定観測](optional/review-effort-live.md) を参照する。

## 制約・代替手段・安全

- 本編からレビュー依頼、PR変更、ソース変更、費用が発生する操作を行わない。
- 実際の effort、内部モデル、費用、レビュー品質を推測しない。
- ソースへアクセスできない場合は、同梱資料だけで評価計画を作り、ソースの実行結果は未観測のまま残す。
- 候補の内容、依頼、評価規約を固定できない場合は比較を停止する。
- 利用資格がない場合でも、テキストだけでゴールまで完了できる。
