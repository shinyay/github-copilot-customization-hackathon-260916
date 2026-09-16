# HC-031 Java・XML・製品別に Instructions を出し分けよう

**Language:** **日本語** / [English](../../en/challenges/hc-031/README.md)

## Scenario

注文処理の調査では、Java の制御フローと XML の配線を行き来します。Java 向け規則を XML へ広く配ると noise になり、XML 向け規則をすべての Java へ配ると保守範囲が曖昧になります。さらに、Cloud Agent と code review のどちらへ同じ原稿を届けるかは、file scope とは別の設計問題です。

## この機能とは

Path-specific Instructions は frontmatter の `applyTo` で供給対象の path を表します。`applyTo` は Instructions の供給 scope であり、file の read/write 権限を制御する ACL ではありません。

製品別に原稿を除外する場合は `excludeAgent` を使います。有効な値は次の 2 つです。

- `code-review`
- `cloud-agent`

製品除外は原稿をその製品へ供給しない設計であり、対象 source への access 拒否ではありません。

## 向いていること / 向いていないこと

**向いていること**

- Java と XML で異なる読解規則を保守する
- core 限定 scope と範囲外 web source を区別する
- body を固定したまま製品 metadata だけを比較する
- mixed task で複数原稿を渡す順序を設計する

**向いていないこと**

- `applyTo` を権限や sandbox と説明する
- `excludeAgent` を source access の拒否と説明する
- すべての規則を広い glob へまとめることを唯一解にする
- 紙上の matrix を実製品での採用結果と呼ぶ

## ゴール

path 軸と product 軸を分けて、次を設計します。

1. core Java 用の Instructions
2. core XML 用の Instructions
3. Java / XML / mixed task への供給方法
4. 範囲外 web Java を除外できる scope
5. Cloud Agent / code review への供給または除外

## 用意するもの

固定する main source:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `wholesale-core/src/main/resources/application-context.xml`
- `wholesale-core/src/main/resources/spring/module-operations.xml`
- `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`

共通 guard を辿る補助 source:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`

`starter/` には固定依頼、source map、設計票、Java/XML の inactive な customization 原稿、scope/product matrix、delivery plan、任意比較票があります。

候補 pattern:

- `wholesale-core/src/main/java/**/*.java`
- `wholesale-core/src/main/resources/**/*.xml`

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.md.template` と `starter/source-map.md.template` を読みます。
2. `starter/customization/*.template` は active `.github/instructions/**` へ移しません。
3. Java と XML の body を書く前に `starter/design.md.template` で目的、対象外 path、製品方針を決めます。

## 試してみる

1. `OrderService` から `BaseService` と `Actor` へ辿る Java の読解規則を作ります。
2. 2 つの XML に対する配線確認の規則を作ります。
3. `starter/customization/java-rules.md.template` と `xml-rules.md.template` に、それぞれの body と `applyTo` を記入します。
4. `starter/scope-matrix.md.template` で次の 3 task と 4 main source の対象/非対象を確認します。
   - `java-reading`
   - `xml-reading`
   - `mixed-reading`
5. `starter/product-matrix.md.template` の 12 行を使い、2 原稿 × 2 製品 × 3 metadata 案を確認します。
6. `starter/delivery-plan.md.template` に mixed task での原稿順序と manual supply の方法を記録します。
7. scope の予測、製品での予測、実観測を別欄にします。

## 任意: 比較する

`starter/worksheets/comparison.md.template` を使い、次を短く手動比較できます。

- **Baseline**: 固定依頼だけ
- **Customized**: Java/XML body をそれぞれの scope へ供給する設計
- **Manual-equivalent**: 同じ body 全文を同じ順序で手動供給

body 変更と metadata 変更を同じ比較へ混ぜず、実製品で未確認の欄は `not-checked` のままにします。

## 確認ポイント

- Java/XML body と scope の理由を説明したか
- 4 main source を残し、web Java を core Java と区別したか
- `applyTo` を ACL と混同していないか
- `excludeAgent` と 2 つの正式値を正しく使ったか
- 9 行の task/source 表と 12 行の product 表を混同していないか
- manual supply の body が customization 原稿と一致しているか
- source を読めたことだけで Instructions 採用成功としていないか

## 発展

- Java または XML の一方だけ scope を狭め、4 source と product matrix への影響を再評価する
- Cloud Agent で scope を観測する準備は [Cloud scope の補足ガイド](optional/cloud-scope-observation.md) を使う
- code review で scope を観測する準備は [review scope の補足ガイド](optional/review-scope-observation.md) を使う

## 制約・Fallback・安全

- active `.github/instructions/**`、Java、XML、POM、repository 設定は変更しません。
- 実 Cloud Agent や code review を使わなくても、source reading と matrix の設計だけで完了できます。
- Path-specific Instructions が利用できない場合は manual-equivalent を使い、自動 scope 適用は `unsupported` または `not-observed` とします。
- 製品の availability、対応 version、資格を確認できない場合は実観測へ進みません。
