# HC-036 Draft・Open・更新時のレビュー実行条件を設計しよう

**言語:** **日本語** / [English](../../en/challenges/hc-036/README.md)

## シナリオ

Pull Request の自動レビューでは、新規 Open、Draft から初めて Ready になった時点、Draft 中の更新、新しい push、人による再要求を区別する必要があります。request から完了までの時間差や、reviewed head と現在の head の違いも無視できません。

このシナリオでは、4 つの合成設定案と 5 つの合成イベントを使って、review trigger の方針と時系列の対応関係を設計します。すべて `SYNTHETIC_TRAINING_ONLY` であり、実際の PR、review、ruleset、個人/organization/enterprise の設定は操作しません。

## この機能とは

Copilot code review の自動設定では、どのイベントで review を**要求するか**を決めます。要求後の queue、start、complete は、それぞれ別の状態です。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| request | request ID、イベント、actor、ruleset | queue に入った |
| queue | queue 状態、attempt との対応 | 実行が始まった |
| start | attempt ID、開始時刻、対象 head | review が完了した |
| complete | 完了時刻、reviewed head | 現在の head も review 済み |

設定案は次の 4 つです。

- `no-automatic-request`: 自動要求なし
- `basic-request`: 基本の自動要求
- `draft-request`: basic に Draft review だけを追加
- `push-request`: basic に new pushes review だけを追加

`draft-request` と `push-request` は、それぞれ basic との差分です。両者を直接比較して、一因子だけが異なるとはみなしません。

## 向いていること / 向いていないこと

**向いていること**

- 新規 Open、初回 Ready、Draft 中、新しい push、手動での再要求を分ける
- 設定差分を一つずつ比較する
- request / queue / start / complete の対応付け
- base / head / reviewed head から古い結果を見分ける

**向いていないこと**

- 実際のリポジトリの ruleset や自動 review 設定を、教材のために変更する
- request を即時完了として扱う
- 古い head の review を現在 head へ流用する
- manual rereview を 5 つ目の設定案にする
- queue の時間、重複抑制、review の成功を、資料なしで作り上げる

## ゴール

4 つの設定案 × 5 つのイベントについて、重複も欠落もない 20 セルを作り、各セルに発火の判断と必要な観測情報を記録します。

固定イベント:

- `new-open`
- `first-ready`
- `still-draft`
- `new-push`
- `manual-rereview`

さらに、イベント、actor、PR、base/head、設定の参照元、request、queue、attempt、reviewed head を 1 行で対応付けます。

## 用意するもの

`starter/` にすべての合成入力があります。

- `request.txt.template`: 固定依頼
- `fixtures/packets.json.template`: request/queue/attempt/head の合成記録
- `policy.md.template`: 発火方針
- `event-matrix.md.template`: 20 セル
- `correlation.md.template`: 時系列と head の対応表
- `design.md.template`: 設計票
- `worksheets/comparison.md.template`: 任意比較票

ソースコードは固定入力に含めません。題材が Java の PR に見えても、Java ファイルを参照対象へ追加しないでください。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. すべての `.template` ファイルと記録で、`SYNTHETIC_TRAINING_ONLY` を保持します。
2. `starter/fixtures/packets.json.template` の ID や順番を正解ラベルとして使いません。
3. イベントマトリクスを埋める前に、`starter/design.md.template` で設定差分、適用範囲、手動対応の責任、unknown、停止条件を決めます。

## 試してみる

1. `policy.md.template` に、4 つの設定案の差分と対象ブランチ/適用範囲を記入します。
2. `event-matrix.md.template` の 20 セルを欠落・重複なく埋めます。
3. `manual-rereview` は actor が異なる共通イベントとして扱い、追加の設定にはしません。
4. `fixtures/packets.json.template` を読み、request、queue、start、complete を分けて診断します。
5. `correlation.md.template` に、イベントの ID/type、actor、合成 PR、base/head、設定の参照元/scope/ref、request ID、attempt、reviewed head を対応付けます。
6. completed でも reviewed head が古い場合は、現在の head に対する review が完了したとは扱いません。
7. actor、ruleset、設定の参照元が不足している場合は、原因を一つに決めず `unknown` とします。

## 任意: 比較する

`starter/worksheets/comparison.md.template` で、**Baseline** を `no-automatic-request`、**Customized** を各自動設定案として、簡潔に比較できます。隣接する一因子だけが異なる条件を比較し、すべてのセルで「発火」することを良い結果とはみなしません。

## 確認ポイント

- 4 つの設定案 × 5 つのイベントの 20 セルが一意に存在するか
- basic の対象から新規 Open を落としていないか
- draft/push をそれぞれ basic との差分として扱ったか
- manual rereview を設定案にしていないか
- request / queue / start / complete を分けたか
- actor、ruleset、base/head/reviewed head を対応付けたか
- 古い head の review を現在の head へ流用していないか
- 合成値を実 GitHub の設定や利用者として説明していないか

## 発展

- Draft review と new pushes review を両方有効にする場合の、重複、費用、停止条件、手動対応の責任を机上で設計する
- 実際のイベントを限定的に観測する準備には、[Review trigger の補足ガイド](optional/review-triggers.md) を使う

## 制約・代替手段・安全

- 実際の設定、ruleset、PR、review の要求、workflow、Java、テストは作成・変更しません。
- 実際の利用者情報や PR の URL を合成資料へ混ぜません。
- Copilot code review を利用できなくても、合成ポリシー、20 セル、対応関係の設計で完了できます。
- actor、ruleset、head、request/attempt の情報が不足している場合は、`unknown` または `incomparable` とします。
