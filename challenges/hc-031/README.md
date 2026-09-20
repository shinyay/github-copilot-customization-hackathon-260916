# HC-031 Java・XML・製品ごとにInstructionsを出し分けよう

**言語:** **日本語** / [English](../../en/challenges/hc-031/README.md)

## シナリオ

注文処理を調査するときは、Java の制御フローと XML の配線を行き来します。Java 向けの規則を XML にも広く供給するとノイズになり、XML 向けの規則をすべての Java に供給すると保守範囲が曖昧になります。さらに、同じ原稿を Cloud Agent と code review のどちらに供給するかは、ファイルの適用範囲とは別の設計問題です。

## この機能とは

Path-specific Instructions は、frontmatter の `applyTo` で供給対象のパスを表します。`applyTo` は Instructions の供給範囲を示すものであり、ファイルの読み書き権限を制御する ACL ではありません。

製品別に原稿を除外する場合は `excludeAgent` を使います。有効な値は次の 2 つです。

- `code-review`
- `cloud-agent`

製品からの除外は、その製品に原稿を供給しないための設計であり、対象ソースへのアクセスを拒否するものではありません。

## 向いていること / 向いていないこと

**向いていること**

- Java と XML で異なる読解規則を保守する
- core に限定した適用範囲と、範囲外の web ソースを区別する
- 本文を固定したまま、製品ごとのメタデータだけを比較する
- mixed タスクで複数の原稿を渡す順序を設計する

**向いていないこと**

- `applyTo` を権限や sandbox と説明する
- `excludeAgent` をソースへのアクセス拒否と説明する
- すべての規則を広い glob にまとめることだけを正解とする
- 机上のマトリクスを実際の製品での採用結果と呼ぶ

## ゴール

パスの軸と製品の軸を分けて、次の内容を設計します。

1. core Java 用の Instructions
2. core XML 用の Instructions
3. Java / XML / mixed タスクへの供給方法
4. 範囲外の web Java を除外できる適用範囲
5. Cloud Agent / code review への供給または除外

## 用意するもの

固定する主なソース:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `wholesale-core/src/main/resources/application-context.xml`
- `wholesale-core/src/main/resources/spring/module-operations.xml`
- `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`

共通ガードをたどる補助ソース:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`

`starter/` には、固定依頼、ソースマップ、設計票、Java/XML の不活性な customization 原稿、適用範囲/製品マトリクス、供給計画、任意比較票があります。

候補パターン:

- `wholesale-core/src/main/java/**/*.java`
- `wholesale-core/src/main/resources/**/*.xml`

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.md.template` と `starter/source-map.md.template` を読みます。
2. `starter/customization/*.template` は、有効な `.github/instructions/**` へ移しません。
3. Java と XML の本文を書く前に、`starter/design.md.template` で目的、対象外のパス、製品ごとの方針を決めます。

## 試してみる

1. `OrderService` から `BaseService` と `Actor` へたどる Java の読解規則を作ります。
2. 2 つの XML に対する配線確認の規則を作ります。
3. `starter/customization/java-rules.md.template` と `xml-rules.md.template` に、それぞれの本文と `applyTo` を記入します。
4. `starter/scope-matrix.md.template` で、次の 3 つのタスクと 4 つの主なソースについて、対象か対象外かを確認します。
   - `java-reading`
   - `xml-reading`
   - `mixed-reading`
5. `starter/product-matrix.md.template` の 12 行を使い、2 原稿 × 2 製品 × 3 種類のメタデータ案を確認します。
6. `starter/delivery-plan.md.template` に、mixed タスクでの原稿の順序と手動で供給する方法を記録します。
7. 適用範囲の予測、製品ごとの予測、実際の観測結果を別々の欄に記録します。

## 任意: 比較する

`starter/worksheets/comparison.md.template` を使って、次の条件を簡潔に手動で比較できます。

- **Baseline**: 固定依頼だけ
- **Customized**: Java/XML の本文を、それぞれの適用範囲へ供給する設計
- **Manual-equivalent**: 同じ本文の全文を、同じ順序で手動供給

本文の変更とメタデータの変更を同じ比較に混ぜず、実際の製品で未確認の欄は `not-checked` のままにします。

## 確認ポイント

- Java/XML の本文と適用範囲を、その理由とともに説明したか
- 4 つの主なソースを残し、web Java を core Java と区別したか
- `applyTo` を ACL と混同していないか
- `excludeAgent` と 2 つの正式値を正しく使ったか
- 9 行のタスク/ソース表と 12 行の製品表を混同していないか
- 手動供給する本文が customization 原稿と一致しているか
- ソースを読めたことだけで、Instructions の採用に成功したと判断していないか

## 発展

- Java または XML の一方だけ適用範囲を狭め、4 つのソースと製品マトリクスへの影響を再評価する
- Cloud Agent で適用範囲を観測する準備には、[Cloud scope の補足ガイド](optional/cloud-scope-observation.md) を使う
- Copilot code review で適用範囲を観測する準備には、[code review の適用範囲に関する補足ガイド](optional/review-scope-observation.md) を使う

## 制約・代替手段・安全

- 有効な `.github/instructions/**`、Java、XML、POM、リポジトリ設定は変更しません。
- 実際の Cloud Agent や code review を使わなくても、ソースの読解とマトリクスの設計だけで完了できます。
- Path-specific Instructions を利用できない場合は manual-equivalent を使い、自動的な適用範囲の設定は `unsupported` または `not-observed` とします。
- 製品の利用可否、対応バージョン、利用資格を確認できない場合は、実際の観測へ進みません。
