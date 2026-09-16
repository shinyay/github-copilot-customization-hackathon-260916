# HC-036 Draft・Open・更新時のレビュー発火を設計しよう

## Scenario

Pull Request の自動 review では、新規 Open、Draft から初めて Ready になった時点、Draft 中の更新、新しい push、人による再要求を区別する必要があります。request と完了の時間差や、reviewed head と現在 head の違いも無視できません。

このシナリオでは、4 つの合成設定案と 5 つの合成 event を使って review の発火方針と時系列相関を設計します。すべて `SYNTHETIC_TRAINING_ONLY` で、実 PR、review、ruleset、個人/organization/enterprise 設定は操作しません。

## この機能とは

Copilot code review の自動設定は、どの event で review を**要求するか**を決めます。要求後の queue、start、complete は別の状態です。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| request | request ID、event、actor、ruleset | queue へ入った |
| queue | queue 状態、attempt との対応 | 実行が始まった |
| start | attempt ID、開始時刻、対象 head | review が完了した |
| complete | 完了時刻、reviewed head | 現在 head も review 済み |

設定案は次の 4 つです。

- `no-automatic-request`: 自動要求なし
- `basic-request`: 基本の自動要求
- `draft-request`: basic に Draft review だけ追加
- `push-request`: basic に new pushes review だけ追加

`draft-request` と `push-request` は、それぞれ basic との差分です。両者を直接の一因子比較とは呼びません。

## 向いていること / 向いていないこと

**向いていること**

- 新規 Open、初回 Ready、Draft 中、新 push、手動再要求の分離
- 設定差分を一つずつ比較する
- request / queue / start / complete の相関
- base / head / reviewed head から古い結果を見分ける

**向いていないこと**

- 実 repository の ruleset や自動 review 設定を教材のために変更する
- request を即時完了として扱う
- 古い head の review を現在 head へ流用する
- manual rereview を第五の設定案にする
- queue 時間、重複抑制、review success を資料なしに発明する

## ゴール

4 設定案 × 5 event の exact 20 セルを作り、各セルで発火判断と必要な観測情報を記録します。

固定 event:

- `new-open`
- `first-ready`
- `still-draft`
- `new-push`
- `manual-rereview`

さらに、event、actor、PR、base/head、setting source、request、queue、attempt、reviewed head を一行で相関付けます。

## 用意するもの

`starter/` にすべての合成入力があります。

- `request.txt.template`: 固定依頼
- `fixtures/packets.json.template`: request/queue/attempt/head の合成記録
- `policy.md.template`: 発火方針
- `event-matrix.md.template`: 20 セル
- `correlation.md.template`: 時系列と head の相関表
- `design.md.template`: 設計票
- `worksheets/comparison.md.template`: 任意比較票

source code は固定入力に含めません。題材が Java PR に見えても、Java file を参照集合へ追加しないでください。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. すべての `.template` と記録で `SYNTHETIC_TRAINING_ONLY` を保持します。
2. `starter/fixtures/packets.json.template` の ID や順番を正解ラベルとして使いません。
3. event matrix を埋める前に `starter/design.md.template` で設定差分、scope、manual responsibility、unknown、停止条件を決めます。

## 試してみる

1. `policy.md.template` に 4 設定案の差分と対象 branch/scope を記入します。
2. `event-matrix.md.template` の 20 セルを欠落・重複なく埋めます。
3. `manual-rereview` は actor の異なる共通 event とし、追加設定にしません。
4. `fixtures/packets.json.template` を読み、request、queue、start、complete を分けて診断します。
5. `correlation.md.template` に event ID/type、actor、synthetic PR、base/head、setting source/scope/ref、request ID、attempt、reviewed head を対応付けます。
6. completed でも reviewed head が古ければ、現在 head の完了とは扱いません。
7. actor、ruleset、設定 source が不足する場合は原因を一つに決めず `unknown` とします。

## 任意: 比較する

`starter/worksheets/comparison.md.template` で、**Baseline** を `no-automatic-request`、**Customized** を各自動設定案として短く比較できます。隣接する一因子差だけを比較し、全セルの「発火」を良い結果とはみなしません。

## 確認ポイント

- 4 設定案 × 5 event の 20 セルが一意にあるか
- basic の対象から新規 Open を落としていないか
- draft/push をそれぞれ basic との差分として扱ったか
- manual rereview を設定案にしていないか
- request / queue / start / complete を分けたか
- actor、ruleset、base/head/reviewed head を対応付けたか
- 古い head の review を現在 head へ流用していないか
- 合成値を実 GitHub の設定や利用者として説明していないか

## 発展

- Draft review と new pushes review を両方有効にする場合の、重複、費用、停止、manual responsibility を紙上で設計する
- 実 event を限定観測する準備は [Review trigger の補足ガイド](optional/review-triggers.md) を使う

## 制約・Fallback・安全

- 実 settings、ruleset、PR、review request、workflow、Java、test は作成・変更しません。
- 実利用者情報や PR URL を合成資料へ混ぜません。
- Copilot code review を利用できなくても、合成 policy、20 セル、correlation の設計で完了できます。
- actor、ruleset、head、request/attempt の情報が不足する場合は `unknown` または `incomparable` とします。
