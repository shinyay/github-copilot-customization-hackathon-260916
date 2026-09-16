# HC-029 Cloud Agent に Java 互換条件を守らせよう

## Scenario

Java の変更依頼には、今回だけの目的と、repository 全体で繰り返し守りたい互換条件があります。このシナリオでは、十分な固定依頼を出発点に、どの条件を Repository Instructions として常設する価値があるかを設計します。

題材は `Money.tax` の unknown rounding 境界を確認する test の**提案**です。提案対象は `CommonRulesTest.java` だけで、source や test へ適用しません。

## この機能とは

Repository Instructions は、Cloud Agent などへ repository 固有の制約や確認順を継続的に伝える Markdown です。Instructions は JDK や Maven をインストールせず、test 実行、権限、変更の正しさ、人の review も保証しません。

このシナリオでは次を分けます。

- task 固有: unknown rounding 境界へどの test を提案するか
- 常設候補: Java version、変更可能範囲、既存期待値の保持
- environment: JDK 8 / Maven を実際に使えるか
- proposal: 適用していない diff
- verification: 実行した確認と未実施の確認

## 向いていること / 向いていないこと

**向いていること**

- 複数 task で繰り返す Java 互換条件の常設化
- production、POM、既存 test 期待値を守る変更範囲の明示
- task 依頼と Repository Instructions の責任分担
- Instructions を追加しない判断の記録

**向いていないこと**

- Instructions だけで JDK、Maven、dependency を準備する
- production code や `pom.xml` を変更して提案を成立させる
- 未実施の compile/test を pass と報告する
- 提案 diff をそのまま適用する

## ゴール

次の固定依頼を満たす test 提案と、再利用可能な repository rules の草稿を作ります。

> JDK 8 と Maven を前提に、Java 7 構文と Java 7 標準 API の範囲を守ってください。`Money.tax` の unknown rounding 境界を確認し、変更提案は `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java` だけに限定してください。production code、`pom.xml`、既存 test の期待値は変更せず、未実施の compile/test は `not-run` と報告してください。

## 用意するもの

固定 source path:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
- `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`
- `pom.xml`

必要に応じて確認する補助 path:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/BusinessException.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java`
- `README.md`

`starter/` には固定依頼、source map、設計票、互換性 checklist、提案 diff の書き方、inactive な Instructions 草稿、任意比較票があります。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.md.template` と `starter/source-map.md.template` を読みます。
2. 対象 source が手元にある場合は実ファイルを読み、ない場合は source map に示された確認項目だけを使い、未確認部分を明記します。
3. `starter/customization/repository-rules.md.template` は `.template` のまま扱い、`.github/**` へ配置しません。

## 試してみる

1. `Money.tax` の rounding 選択と unknown 値の扱いを確認します。
2. `CommonRulesTest.java` の既存 test と、`TaxAmounts` の責任を区別します。
3. `starter/design.md.template` に、常設化する条件と依頼へ残す条件を書きます。
4. `starter/customization/repository-rules.md.template` に、複数 task で再利用する価値がある規則だけを書きます。
5. `starter/proposal-guide.md.template` に従い、`proposed-change.diff.template` を自分で作成します。
6. `starter/compatibility-checklist.md.template` で次を確認します。
   - JDK 8 の実行環境と Java 7 構文/API 制約を分けた
   - proposal の対象は `CommonRulesTest.java` だけ
   - production code、`pom.xml`、既存 test 期待値は不変
   - compile/test を実行していなければ `not-run`
   - diff を適用していない

## 任意: 比較する

`starter/worksheets/comparison.md.template` を使い、次を手動で比較できます。

- **Baseline**: 固定依頼だけ
- **Customized**: 同じ依頼 + 凍結した repository rules
- **Manual-equivalent**: Customized と同じ本文を依頼へ全文添付

source、依頼、model、tools をそろえ、供給位置や優先度まで同じとは主張しません。

## 確認ポイント

- JDK 8 と Java 7 構文/API を区別したか
- unknown rounding の根拠を source へ戻せるか
- proposal の対象を 1 test file に限定したか
- production、POM、既存期待値を変更していないか
- Instructions に task 固有の完成答案を書いていないか
- 未実施 test を `not-run` としたか
- Instructions 追加不要という結論も許しているか

## 発展

- `tax-category` を別入力として、同じ rules が一般化するかを紙上で検討する
- 実 Cloud Agent で提案を試す前の準備は [Cloud test 提案の補足ガイド](optional/cloud-test-proposal.md) を使う

## 制約・Fallback・安全

- diff は保存して読むだけにし、`git apply` しません。
- production code、POM、既存 test、workflow、repository 設定を変更しません。
- JDK や Maven がなくても static な提案は作れます。その場合は compile/test を `not-run` とします。
- 実 Cloud Agent を利用できなくても、manual-equivalent で本文内容を比較できます。自動読込や path 適用は未確認として残します。
