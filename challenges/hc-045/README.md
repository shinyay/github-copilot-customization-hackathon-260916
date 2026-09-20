# HC-045 レビュー指摘を安全なCloud修正へ引き継ごう

**言語:** **日本語** / [English](../../en/challenges/hc-045/README.md)

## シナリオ

税計算コードのレビューで、「税率ごとの集計方法が変わるかもしれない」という指摘候補を受け取ったとします。そのまま Cloud での修正へ渡すと、変更先、branch/head、許可する scope、期待する post-image、変更してはいけないテスト、独立した検証方法が失われることがあります。

2つの candidate、finding、handoff event を照合し、未送信の依頼草稿と独立した検証計画を作ります。実際の Cloud での修正、ソースの変更、commit、push、merge は行いません。

## この機能とは

レビューから Cloud での修正への handoff は、指摘文を転送するだけではありません。人がソースへ戻って採否を判断し、変更対象、変更してはいけない範囲、branch/head、期待値、検証方法、停止条件を依頼に残す作業です。

状態を分けます。

| 状態 | 必要な意味 |
|---|---|
| finding received | レビュー指摘を受け取った |
| human assessed | 人がソースと期待値を確認し、採否を判断した |
| draft | 依頼本文を書いた。許可や送信を意味しない |
| prepared | 対象、scope、branch/head、検証、停止条件を確認した |
| sent | 承認済みの経路で実際に送信したことを示す直接的な記録がある |
| accepted | 受信側が依頼を受理した |
| applied | 対象の head に変更が適用された |
| independently validated | 自己申告とは別の期待値を使って確認した |

パケット内の true は、教材上の claim です。実際の許可、送信、受理、適用を示す証拠として扱いません。

題材の固定境界:

- 変更候補の対象は `TaxAmounts.java` だけです。
- `Money.java` と `CommonRulesTest.java` は読み取り専用の根拠であり、変更対象ではありません。
- `TaxAmounts` は、税率 bucket ごとに金額を集約します。
- `Money.tax` は、税率ごとの base から税額を丸めます。
- 既存のテスト定義では、`6.00@0.10`、`6.00@0.1000`、`10.00@0.0800` に対して、net `22.00`、tax `1.00`、bucket 数 `2` を期待します。
- ソースやテストを読んだことと、Java やテストを実行したことは別です。

## 向いていること / 向いていないこと

**向いていること**

- review finding をソースと照合してから、対象を限定した依頼へ変える。
- branch/head/scope の混同を防ぐ。
- 修正側の自己申告とは独立した検証を計画する。
- 変更不要、情報不足、未送信を理由付きで残す。

**向いていないこと**

- candidate 名や finding の断定だけで採否を決める。
- パケットの claim を、実際の許可、送信、適用の証拠として扱う。
- `Money.java` や既存のテストまで変更対象を広げる。
- before / after candidate を実際のソースへ適用する。
- scope を維持できない handoff を強行する。

## ゴール

次の三つを完成させます。

- [`handoff-policy.md.template`](starter/handoff-policy.md.template): state、責任者、scope、最後に人が確認する内容
- [`request-draft.txt.template`](starter/request-draft.txt.template): `TaxAmounts.java` だけを対象にした未送信依頼
- [`validation-plan.md.template`](starter/validation-plan.md.template): H01〜H06 の独立した検証

送らないと判断した場合も request draft は空にせず、未送信の理由、必要な追加の根拠、想定する scope を書きます。

## 用意するもの

- テキストエディター
- `starter/` 以下の固定資料
- Java / Maven、Copilot code review、Cloud Agent の利用資格は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fixtures/candidate-diffs.json.template`](starter/fixtures/candidate-diffs.json.template) | before、after、anchor、branch/head/scope、ハッシュ |
| [`fixtures/finding-packet.json.template`](starter/fixtures/finding-packet.json.template) | 合成・改作した finding と独立した期待値 |
| [`fixtures/handoff-events.json.template`](starter/fixtures/handoff-events.json.template) | H01〜H06 の state / claim / return material |
| [`reference/reference-notes.md.template`](starter/reference/reference-notes.md.template) | handoff の境界に関する要点 |
| [`handoff-policy.md.template`](starter/handoff-policy.md.template) | 方針を記入するワークシート |
| [`request-draft.txt.template`](starter/request-draft.txt.template) | 未送信草稿 |
| [`validation-plan.md.template`](starter/validation-plan.md.template) | タスクの判断表 |

candidate、finding、event は `SYNTHETIC_ADAPTED_TRAINING_ONLY` です。正解ラベルはありません。

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。H01〜H06 を読む前に、state を示す根拠、branch/head/scope、変更してはいけないパス、独立した期待値、停止担当を固定します。

| タスク | candidate | 状況 |
|---|---|---|
| H01 | candidate-01 | draft |
| H02 | candidate-01 | sent claim、直接的な根拠なし |
| H03 | candidate-01 | return material あり |
| H04 | candidate-02 | draft |
| H05 | candidate-02 | sent claim、直接的な根拠なし |
| H06 | candidate-02 | return material あり |

## 試してみる

1. `candidate-diffs` で before、ソースの anchor、after、requested branch、target head、requested paths を確認します。
2. `finding-packet` の finding をソースの境界と独立した期待値に照らし、採用、棄却、保留を判断します。
3. `handoff-policy.md.template` に、各 state で必要な根拠、責任者、停止と復元の方法を書きます。
4. `request-draft.txt.template` を1つの候補について埋めます。
   - status は draft / not sent
   - 変更対象は `TaxAmounts.java` のみ
   - `Money.java` と `CommonRulesTest.java` は read-only
   - branch/head、anchor、post-image、期待値、停止条件を含める
5. H01〜H06 について、パケットの claim と、実際に確認できた根拠を別の欄に書きます。
6. return material の branch/head/changed paths が、依頼した scope と一致するか確認します。
7. self-reported test を独立した検証結果として扱わず、既存の業務規則とテスト定義で確認する計画を書きます。
8. 想定外の branch/head、scope からの逸脱、変更してはいけないパスの編集、根拠不足があれば停止します。

## 任意: 比較する

同じ candidate について、「変更を依頼する草稿」と「変更不要または情報不足として人へ戻す草稿」を作ります。どの追加の根拠が判断を変えるか、scope と独立した期待値を同じにして比較してください。

## 確認ポイント

- candidate / finding / event の合成・改作ラベルを保持している。
- before、anchor、after、branch、head、scope を照合している。
- draft、prepared、sent、accepted、applied を分けている。
- パケットの claim を、実際の送信や適用の証拠にしていない。
- 変更対象を `TaxAmounts.java` だけに限定している。
- `Money.java` とテストを、read-only の根拠として扱っている。
- 自己申告だけでなく、bucket、scale、rounding、既存のテスト定義を使う検証計画がある。
- 変更不要、未送信、保留、停止を有効な結果にしている。

## 発展

- 依頼草稿を短くする案と、branch/head/scope/期待値を完全に残す案のトレードオフを比較する。
- 実際の Cloud handoff を検討する場合は、[Cloud handoff の限定観測](optional/cloud-handoff.md) を参照する。

## 制約・代替手段・安全

- 本編では、依頼の送信、Cloud セッション、ソースの変更、テストの実行、commit、push、merge を行わない。
- `.template` を外さず、有効なカスタマイズや依頼を作らない。
- scope を維持できない場合、対象の branch/head を確認できない場合、独立した期待値が不足する場合は停止する。
- Java / Maven の環境がなくても、固定されたフィクスチャとテスト定義から静的な検証計画を作れる。
- ハッシュの一致は、固定されたバイト列の確認にすぎず、候補が正しいことやテストが通ることを保証しない。
- `evidence` は claim を支える直接観測や、ソースとテストの根拠を意味し、提出用の一式ではありません。
