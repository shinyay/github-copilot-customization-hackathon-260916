# HC-029 Cloud AgentにJavaの互換性要件を守らせよう

**言語:** **日本語** / [English](../../en/challenges/hc-029/README.md)

## シナリオ

Java の変更依頼には、今回限りの目的と、リポジトリ全体で繰り返し守りたい互換性条件があります。このシナリオでは、必要な情報を含む固定依頼を出発点として、どの条件を Repository Instructions として常設する価値があるかを設計します。

題材は、`Money.tax` で `unknown` を指定した場合の丸め処理の境界を確認するテストの**提案**です。提案先は `CommonRulesTest.java` だけに限定し、ソースやテストには適用しません。

## この機能とは

Repository Instructions は、リポジトリ固有の制約や確認順を Cloud Agent などへ継続的に伝える Markdown です。Instructions は JDK や Maven をインストールするものではなく、テストの実行、権限、変更内容の正しさ、人によるレビューも保証しません。

このシナリオでは次を分けます。

- タスク固有: `unknown` の丸め処理の境界に対して、どのテストを提案するか
- 常設候補: Java のバージョン、変更可能な範囲、既存の期待値の保持
- 環境: JDK 8 / Maven を実際に利用できるか
- 提案: 適用していない差分
- 検証: 実行済みの確認と未実施の確認

## 向いていること / 向いていないこと

**向いていること**

- 複数のタスクで繰り返し使う Java の互換性要件を常設する
- プロダクションコード、POM、既存テストの期待値を保護するため、変更可能な範囲を明示する
- タスクの依頼と Repository Instructions の役割を分ける
- Instructions を追加しない判断の記録

**向いていないこと**

- Instructions だけで JDK、Maven、依存関係を準備する
- プロダクションコードや `pom.xml` を変更して提案を成立させる
- 実行していないコンパイル/テストを成功と報告する
- 提案した差分をそのまま適用する

## ゴール

次の固定依頼を満たすテスト案と、再利用可能なリポジトリルールの草稿を作ります。

> JDK 8 と Maven を前提に、Java 7 構文と Java 7 標準 API の範囲を守ってください。`Money.tax` の unknown rounding 境界を確認し、変更提案は `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java` だけに限定してください。production code、`pom.xml`、既存 test の期待値は変更せず、未実施の compile/test は `not-run` と報告してください。

## 用意するもの

固定ソースのパス:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
- `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`
- `pom.xml`

必要に応じて確認する補助パス:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/BusinessException.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java`
- `README.md`

`starter/` には、固定依頼、ソースマップ、設計票、互換性チェックリスト、提案する差分の書き方、不活性な Instructions の草稿、任意比較票があります。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.md.template` と `starter/source-map.md.template` を読みます。
2. 対象ソースが手元にある場合は実ファイルを読みます。ない場合は、ソースマップに示された確認項目だけを使い、未確認の部分を明記します。
3. `starter/customization/repository-rules.md.template` は `.template` のまま扱い、`.github/**` へ配置しません。

## 試してみる

1. `Money.tax` で選択される丸め方法と、`unknown` 値の扱いを確認します。
2. `CommonRulesTest.java` の既存テストと、`TaxAmounts` が担う処理を区別します。
3. `starter/design.md.template` に、常設化する条件と依頼へ残す条件を書きます。
4. `starter/customization/repository-rules.md.template` に、複数のタスクで再利用する価値がある規則だけを書きます。
5. `starter/proposal-guide.md.template` に従い、`proposed-change.diff.template` を自分で作成します。
6. `starter/compatibility-checklist.md.template` で次を確認します。
   - JDK 8 の実行環境と Java 7 構文/API 制約を分けた
   - 提案先は `CommonRulesTest.java` だけ
   - プロダクションコード、`pom.xml`、既存テストの期待値は不変
   - コンパイル/テストを実行していなければ `not-run`
   - 差分を適用していない

## 任意: 比較する

`starter/worksheets/comparison.md.template` を使って、次の条件を手動で比較できます。

- **Baseline**: 固定依頼だけ
- **Customized**: 同じ依頼 + 固定したリポジトリルール
- **Manual-equivalent**: Customized と同じ本文を依頼へ全文添付

ソース、依頼、モデル、ツールをそろえます。ただし、供給元や優先順位まで同じとはみなしません。

## 確認ポイント

- JDK 8 と Java 7 構文/API を区別したか
- `unknown` の丸め処理に関する根拠をソースへ戻せるか
- 提案先を 1 つのテストファイルに限定したか
- プロダクションコード、POM、既存の期待値を変更していないか
- Instructions にタスク固有の完成済みの答えを書いていないか
- 実行していないテストを `not-run` としたか
- Instructions 追加不要という結論も許しているか

## 発展

- `tax-category` を別の入力として、同じルールを一般化できるかを机上で検討する
- 実際の Cloud Agent で提案を試す前の準備には、[Cloud テスト提案の補足ガイド](optional/cloud-test-proposal.md) を使う

## 制約・代替手段・安全

- 差分は保存して読むだけにし、`git apply` は実行しません。
- プロダクションコード、POM、既存テスト、workflow、リポジトリ設定は変更しません。
- JDK や Maven がなくても、静的なテスト案は作成できます。その場合は、コンパイル/テストを `not-run` とします。
- 実際の Cloud Agent を利用できなくても、manual-equivalent で本文を比較できます。自動読み込みやパスへの適用は、未確認のまま残します。
