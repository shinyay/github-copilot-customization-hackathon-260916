# HC-030 税額の意味を守るコードレビューを設計しよう

**言語:** **日本語** / [English](../../en/challenges/hc-030/README.md)

## シナリオ

税計算のパッチには、見た目は小さくても意味を変えるものと、意味を保つものがあります。公開されているソースとテスト、2 つの候補パッチを使い、Path-specific Instructions が意味上のリスクの検出と false-positive の抑制に役立つかを確認します。

非公開の正解表は使いません。候補名ではなく、変更行と根拠に基づいて判断します。

## この機能とは

Path-specific Instructions は、frontmatter の `applyTo` で対象パスを指定し、そのパスを扱う場合にだけレビュー観点を与える customization です。

このシナリオでは、次を同時に評価します。

- 意味上のリスクに対する、根拠に結び付いた指摘
- 根拠のない false-positive
- 見逃したリスク
- 変更行との対応
- ソース/テストとの対応
- 実施した検証と未実施の検証の区別
- 問題がない場合に no-finding を選べるか

## 向いていること / 向いていないこと

**向いていること**

- ドメイン固有の不変条件をレビュー観点にする
- 特定のパスだけに必要な規則を与える
- 変更行とソース/テストを結び付ける
- true-positive だけでなく、false-positive と miss も測る

**向いていないこと**

- フォーマッターやコンパイラの代替
- 候補ごとの正解を Instructions に書く
- すべての変更を同じ重大度で警告する
- テストを実行せず、成功したと主張する

## ゴール

2 つの候補を Instructions なし/ありでレビューし、合計 4 件の結果を公開されている分類で整理します。

- **true-positive**: 実際の意味上のリスクを、追跡可能な根拠とともに報告する
- **false-positive**: 契約を保つ候補を不具合と誤認する
- **miss**: ソースまたは再現可能な確認で示せるリスクを見逃す
- **rooted evidence**: 変更行と `TaxAmounts`、`Money`、`CommonRulesTest`、または実行結果に結び付く根拠

## 用意するもの

`starter/` に固定入力があります。

- `candidates/`: 2 つのパッチと固定ハッシュ情報
- `reference/`: `TaxAmounts`、`Money`、`CommonRulesTest` の抜粋
- `customization/tax-review.instructions.md.template`: 不活性なレビュー規則案
- `worksheets/classification.md.template`: 4 件のレビューの分類票

`TaxAmounts` は rate ごとに net を集約し、bucket ごとに `Money.tax` を呼び出します。`BigDecimal` の数値比較と `equals` では、scale が異なる値を同じように扱うとは限らない点も確認します。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/reference/` と `starter/candidates/` を読みます。
2. 候補パッチは適用せず、読み取り専用の入力として扱います。
3. `starter/customization/tax-review.instructions.md.template` は `.template` のまま保持し、有効なパスへ移しません。

固定レビュー依頼:

> この candidate patch を review し、税額の意味を壊す変更だけを、changed line と rooted evidence 付きで報告してください。問題がなければ問題なしと答えてください。

## 試してみる

1. Candidate A と B を、Instructions を追加せず別々にレビューします。
2. finding または no-finding、変更行、影響、rooted evidence、検証内容を記録します。
3. `tax-review.instructions.md.template` の規則を読み、候補固有の答えが含まれていないことを確認します。
4. 同じ依頼で Candidate A と B をもう一度レビューします。可能であれば、新しい会話を使います。
5. `worksheets/classification.md.template` に 4 件を記録し、公開されている分類で整理します。
6. テストを実行した場合だけコマンドと結果を書き、実行していなければ `not-run` とします。

## 任意: 比較する

- **Baseline**: Instructions なし
- **Customized**: `tax-review.instructions.md.template` の本文を追加

候補、依頼、ソース、モデル、effort、ツールをできるだけそろえます。Customized だけに候補の意図や期待する分類を伝えないでください。

## 確認ポイント

- 算術上の結果と意味上の同一性の両方を確認したか
- 指摘が変更行とソース/テストに結び付いているか
- true-positive、false-positive、miss をすべて扱ったか
- 根拠がない場合に no-finding を選べるようにしたか
- Instructions に候補固有の答えがないか
- テストを実行したかどうかを正確に記録したか

## 発展

元の 2 つの候補を評価した後で、通貨チェックを弱める 3 つ目の合成パッチを作り、同じレビュー規則を一般化できるかを別の実験として確認します。期待する分類は Instructions に追記しないでください。

## 制約・代替手段・安全

- 候補パッチ、ソース、テスト、有効な `.github/instructions/**` は変更しません。
- 非公開の税務規則や顧客データは追加しません。
- Path-specific Instructions を利用できない場合は、同じ本文を固定依頼に添える manual-equivalent を使い、内容だけを比較します。
- Java の実行環境がない場合は、静的な根拠だけを記録し、テスト結果を推測しません。
