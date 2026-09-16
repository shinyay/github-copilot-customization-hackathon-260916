# HC-030 税額の意味を守るコードレビューを設計しよう

**Language:** **日本語** / [English](../../en/challenges/hc-030/README.md)

## Scenario

税計算の patch には、見た目が小さくても意味を変えるものと、意味を保つものがあります。公開された source、test、2 つの candidate patch を使い、path-specific Instructions が semantic risk の検出と false-positive の抑制に役立つかを確認します。

隠れた正解表は使いません。candidate 名ではなく、変更行と根拠から判断します。

## この機能とは

Path-specific Instructions は、frontmatter の `applyTo` で対象 path を指定し、その path を扱うときだけ review 観点を供給する customization です。

このシナリオでは、次を同時に評価します。

- semantic risk への rooted finding
- 根拠のない false-positive
- missed risk
- changed line への結び付き
- source/test への結び付き
- 実行した verification と未実施の区別
- 問題がない場合に no-finding を選べるか

## 向いていること / 向いていないこと

**向いていること**

- domain 固有の invariant を review 観点にする
- 特定 path だけに必要な規則を与える
- changed line と source/test を結び付ける
- true-positive だけでなく false-positive と miss も測る

**向いていないこと**

- formatter や compiler の代替
- candidate ごとの正解を Instructions に書く
- すべての変更を同じ重大度で警告する
- test を実行せず pass と主張する

## ゴール

2 candidate を Instructions なし/ありで review し、合計 4 件の結果を public category で分類します。

- **true-positive**: 実際の semantic risk を rooted evidence 付きで報告
- **false-positive**: contract を保つ candidate を defect と誤認
- **miss**: source または再現可能な確認で示せる risk を見逃す
- **rooted evidence**: changed line と `TaxAmounts`、`Money`、`CommonRulesTest`、または実行結果へ結び付く根拠

## 用意するもの

`starter/` に固定入力があります。

- `candidates/`: 2 つの patch と固定 hash 情報
- `reference/`: `TaxAmounts`、`Money`、`CommonRulesTest` の抜粋
- `customization/tax-review.instructions.md.template`: inactive な review rule 案
- `worksheets/classification.md.template`: 4 review の分類票

`TaxAmounts` は rate ごとに net を集約し、bucket ごとに `Money.tax` を呼びます。`BigDecimal` の数値比較と `equals` が scale の異なる値を同じように扱うとは限らない点も確認します。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/reference/` と `starter/candidates/` を読みます。
2. candidate patch は適用せず、読み取り専用の入力として扱います。
3. `starter/customization/tax-review.instructions.md.template` は `.template` のまま保持し、active path へ移しません。

固定 review request:

> この candidate patch を review し、税額の意味を壊す変更だけを、changed line と rooted evidence 付きで報告してください。問題がなければ問題なしと答えてください。

## 試してみる

1. Candidate A と B を、Instructions を追加せず別々に review します。
2. finding または no-finding、changed line、impact、rooted evidence、verification を記録します。
3. `tax-review.instructions.md.template` の規則を読み、candidate 固有の答えが含まれていないことを確認します。
4. 同じ request で Candidate A と B をもう一度 review します。可能なら fresh conversation を使います。
5. `worksheets/classification.md.template` に 4 件を記録し、public category で分類します。
6. test を実行した場合だけ command と結果を書き、実行していなければ `not-run` とします。

## 任意: 比較する

- **Baseline**: Instructions なし
- **Customized**: `tax-review.instructions.md.template` の本文を追加

candidate、request、source、model、effort、tools をできるだけそろえます。Customized にだけ candidate の意図や期待分類を教えないでください。

## 確認ポイント

- arithmetic と semantic identity の両方を見たか
- finding が changed line と source/test に結び付いているか
- true-positive、false-positive、miss をすべて扱ったか
- 根拠がない場合に no-finding を許したか
- Instructions に candidate-specific な答えがないか
- test 実行の有無を正確に記録したか

## 発展

元の 2 candidate を評価した後で、currency check を弱める第三の合成 patch を作り、同じ review rules が一般化するかを別実験として確認します。期待分類を Instructions へ追記しないでください。

## 制約・Fallback・安全

- candidate patch、source、test、active `.github/instructions/**` は変更しません。
- private tax rule や顧客データを追加しません。
- Path-specific Instructions を利用できない場合は、同じ本文を固定 request に添える manual-equivalent で内容だけを比較します。
- Java 実行環境がない場合は static evidence だけを記録し、test 結果を推測しません。
