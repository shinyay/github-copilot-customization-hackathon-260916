# HC-045 レビュー指摘を安全なCloud修正へ引き継ごう

**Language:** **日本語** / [English](../../en/challenges/hc-045/README.md)

## Scenario

税計算コードへのreviewで「税率ごとの集計方法が変わるかもしれない」という指摘候補が届きました。そのままCloud修正へ渡すと、変更先、branch/head、許可scope、期待するpost-image、変更してはいけないtest、独立した検証方法が失われることがあります。

二つのcandidate、finding、handoff eventを照合し、未送信の依頼草稿と独立したvalidation planを作ります。実Cloud修正、source変更、commit、push、mergeは行いません。

## この機能とは

reviewからCloud修正へのhandoffは、指摘文を転送するだけではありません。人がsourceへ戻って採否を判断し、変更対象、変更不可範囲、branch/head、期待値、検証方法、停止条件を依頼へ保持する作業です。

状態を分けます。

| 状態 | 必要な意味 |
|---|---|
| finding received | review指摘を受け取った |
| human assessed | 人がsourceと期待値へ戻って採否を判断した |
| draft | 依頼本文を書いた。許可や送信を意味しない |
| prepared | 対象、scope、branch/head、検証、停止を確認した |
| sent | 承認済み経路で実際に送信した直接Evidenceがある |
| accepted | 受信側が依頼を受理した |
| applied | 対象headへ変更が適用された |
| independently validated | 自己申告以外の期待値で確認した |

packet内のtrueは教材上のclaimです。現実の許可、送信、受理、適用の証拠へ変換しません。

題材の固定境界:

- 変更候補の対象は `TaxAmounts.java` のみ。
- `Money.java` と `CommonRulesTest.java` は読取根拠であり変更対象外。
- `TaxAmounts` は税率bucketへ金額を集約する。
- `Money.tax` は税率別baseから税額を丸める。
- 既存test定義は `6.00@0.10`、`6.00@0.1000`、`10.00@0.0800` に対し、net `22.00`、tax `1.00`、bucket数 `2` を期待する。
- source/testを読んだことと、Java/testを実行したことは別。

## 向いていること / 向いていないこと

**向いていること**

- review findingをsourceと照合してから限定依頼へ変える。
- branch/head/scopeの混線を防ぐ。
- 修正側の自己申告から独立したvalidationを計画する。
- 変更不要、情報不足、未送信を理由付きで残す。

**向いていないこと**

- candidate名やfindingの断定だけで採否を決める。
- packetのclaimを現実の許可・送信・適用にする。
- `Money.java` や既存testを変更対象へ広げる。
- before/after candidateを実sourceへ適用する。
- scopeを保てないhandoffを強行する。

## ゴール

次の三つを完成させます。

- [`handoff-policy.md.template`](starter/handoff-policy.md.template): state、owner、scope、最終人手確認
- [`request-draft.txt.template`](starter/request-draft.txt.template): `TaxAmounts.java` だけを対象にした未送信依頼
- [`validation-plan.md.template`](starter/validation-plan.md.template): H01〜H06の独立検証

送らない判断でもrequest draftを空にせず、未送信理由、必要な追加根拠、想定scopeを書きます。

## 用意するもの

- テキストエディター
- `starter/` 以下の固定資料
- Java/Maven、Copilot code review、Cloud Agentの利用資格は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fixtures/candidate-diffs.json.template`](starter/fixtures/candidate-diffs.json.template) | before、after、anchor、branch/head/scope、hash |
| [`fixtures/finding-packet.json.template`](starter/fixtures/finding-packet.json.template) | 合成・改作findingと独立期待値 |
| [`fixtures/handoff-events.json.template`](starter/fixtures/handoff-events.json.template) | H01〜H06のstate/claim/return material |
| [`reference/reference-notes.md.template`](starter/reference/reference-notes.md.template) | handoff境界の要点 |
| [`handoff-policy.md.template`](starter/handoff-policy.md.template) | 方針worksheet |
| [`request-draft.txt.template`](starter/request-draft.txt.template) | 未送信草稿 |
| [`validation-plan.md.template`](starter/validation-plan.md.template) | task判断表 |

candidate、finding、eventは `SYNTHETIC_ADAPTED_TRAINING_ONLY` です。正解ラベルはありません。

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。H01〜H06を読む前に、state Evidence、branch/head/scope、変更不可path、独立期待値、停止担当を固定します。

| task | candidate | 状況 |
|---|---|---|
| H01 | candidate-01 | draft |
| H02 | candidate-01 | sent claim、直接Evidenceなし |
| H03 | candidate-01 | return materialあり |
| H04 | candidate-02 | draft |
| H05 | candidate-02 | sent claim、直接Evidenceなし |
| H06 | candidate-02 | return materialあり |

## 試してみる

1. `candidate-diffs` でbefore、source anchor、after、requested branch、target head、requested pathsを確認する。
2. `finding-packet` のfindingをsource boundaryと独立期待値へ戻して採用、棄却、保留を判断する。
3. `handoff-policy.md.template` に各stateで必要なEvidence、owner、stop/rollbackを書く。
4. `request-draft.txt.template` を一候補について埋める。
   - statusはdraft/not sent
   - 変更対象は `TaxAmounts.java` のみ
   - `Money.java` と`CommonRulesTest.java` はread-only
   - branch/head、anchor、post-image、期待値、stop条件を含める
5. H01〜H06について、packet claimと現実に確認できたEvidenceを別欄にする。
6. return materialのbranch/head/changed pathsが依頼scopeと一致するか確認する。
7. self-reported testを独立validationへ変換せず、既存業務規則とtest定義で確認する計画を書く。
8. unexpected branch/head、scope逸脱、変更不可pathの編集、Evidence不足があれば停止する。

## 任意: 比較する

同じcandidateについて、「変更を依頼する草稿」と「変更不要または情報不足として人へ戻す草稿」を作ります。どの追加Evidenceが判断を変えるか、scopeと独立期待値を同じにして比較してください。

## 確認ポイント

- candidate/finding/eventの合成・改作ラベルを保持している。
- before、anchor、after、branch、head、scopeを照合している。
- draft、prepared、sent、accepted、appliedを分けている。
- packet claimを実送信や適用の証拠にしていない。
- 変更対象を `TaxAmounts.java` だけに限定している。
- `Money.java` とtestをread-only Evidenceとして扱っている。
- 自己申告だけでなく、bucket、scale、rounding、既存test定義を使うvalidation planがある。
- 変更不要、未送信、保留、停止を有効な結果にしている。

## 発展

- 依頼草稿を短くする案と、branch/head/scope/期待値を完全に残す案のtrade-offを比較する。
- 実Cloud handoffを検討する場合は [Cloud handoffの限定観測](optional/cloud-handoff.md) を参照する。

## 制約・Fallback・安全

- 本編ではrequest送信、Cloud session、source変更、test実行、commit、push、mergeを行わない。
- `.template` を外さず、activeなcustomizationやrequestを作らない。
- scopeを保てない、対象branch/headを確認できない、独立期待値が不足する場合は停止する。
- Java/Maven環境がなくても、固定fixtureとtest定義からstatic validation planを作れる。
- hash一致は固定bytesの確認であり、候補の正しさやtest passを保証しない。
- `evidence` はclaimを支える直接観測やsource/test根拠を意味し、提出bundleではありません。
