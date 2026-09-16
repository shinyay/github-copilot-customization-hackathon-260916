# HC-001 根拠を大切にする Java チームメイトを育てよう

## Scenario

Java の調査や変更を Copilot に頼むと、もっともらしい説明は返ってきても、実際にどのファイルを読んだのか、何を実行したのか、どこからが推測なのか分からないことがあります。

このシナリオでは、毎回同じ注意をプロンプトへ足す代わりに、リポジトリ全体で守る「根拠のある働き方」を Repository Instructions として設計します。題材は `Money.tax` の不正な丸め指定です。production behavior と既存 test を保ちながら、境界 test を追加する依頼で試します。

## この機能とは

Repository Instructions は、リポジトリ内で Copilot に継続して伝えたい作業規則を Markdown で置く仕組みです。GitHub Copilot が対応する環境では、通常 `.github/copilot-instructions.md` を使います。

ここで指示するのはコードの答えではなく、再利用できる行動です。

- 指定された source と test を先に読む
- 事実・推論・未確認を分ける
- 重要な主張を file と symbol に結び付ける
- 利用できるなら、対象を絞った compile/test を実行する
- 実行していない検証を成功と書かない

Instructions は test、レビュー、人の判断を置き換えません。client、model、利用可能な tool によって反映や出力が変わるため、最終的には source と terminal の結果を人が確認します。

## 向いていること / 向いていないこと

**向いていること**

- 多くの Java 調査で繰り返す品質ルール
- リポジトリ全体で共通にしたい根拠の示し方
- 「実行したこと／していないこと」を明確にする習慣

**向いていないこと**

- 一度だけ使う長い手順
- 特定の bug の正解や test code の丸暗記
- secret、個人名、環境固有 URL の保存
- unit test、review、承認、アクセス制御の代替

## ゴール

1. Java 作業へ再利用できる短い Repository Instructions を作る。
2. 次の固定依頼に対して、source/test の根拠、実行結果、未確認事項が分かる回答を得る。
3. `validation.rounding` という入力検証と、金額計算に使う rounding mode を混同していないか確認する。

固定依頼:

> `Money.tax` の `UNKNOWN` / invalid rounding 境界について、production code と既存 expectation を保った test を `CommonRulesTest.java` に追加してください。`validation.rounding` と金額計算の rounding を区別し、根拠、実行結果、未確認事項を報告してください。

## 用意するもの

- Repository Instructions に対応した GitHub Copilot 環境
- 変更してよい Java リポジトリの作業用 branch または worktree
- 次の対象ファイル
  - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
  - `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`
- test を実行する場合は、そのリポジトリが指定する Java/JDK と build tool

このディレクトリの `starter\` には、次の不活性な素材があります。

- [Repository Instructions の編集例](starter/customization/copilot-instructions.md.template)
- [Money.java の固定抜粋](starter/reference/Money.java.excerpt.md.template)
- [CommonRulesTest.java の固定抜粋](starter/reference/CommonRulesTest.java.excerpt.md.template)
- [任意比較メモ](starter/worksheet/comparison.md.template)

すべて `.template` のままなので、このリポジトリでは active customization になりません。

## 準備

1. まず [リポジトリ全体の始め方](../../README.md#始め方) を確認します。
2. 対象リポジトリの `Money.java` と `CommonRulesTest.java` を読みます。対象リポジトリを用意できない場合は、`starter\reference\` の固定抜粋を静的な設計練習に使えます。
3. 回答を見る前に、確認したい行動を 2〜4 個決めます。例:
   - source/test の引用が主張を支えている
   - 事実と推論が分かれている
   - 実行した command と結果が書かれている
   - 実行できない場合に未確認を残している
4. `starter\customization\copilot-instructions.md.template` を読み、対象リポジトリ用に必要な規則だけを選びます。challenge 側の `.template` はそのまま残し、対象リポジトリでだけ `.github/copilot-instructions.md` として配置します。
5. 特定の test の答え、例外 assertion の形、今回だけの file 名は Instructions へ埋め込まないでください。

## 試してみる

1. 対象リポジトリを GitHub Copilot で開き、新しい会話を開始します。
2. 上の固定依頼をそのまま送ります。
3. Copilot が提案または編集した差分を確認します。
4. 次を source と照合します。
   - `Money.tax` が受け付ける丸め指定と、不正値で進む分岐
   - 既存 test が守っている有効な丸め境界
   - production code を変えず、境界 test だけを追加しているか
   - `validation.rounding` と計算結果の丸めを別の論点として説明しているか
5. 対象リポジトリに公式の test 手順があり、実行環境も利用できる場合だけ、最小の関連 test を実行します。Copilot の自己申告ではなく、terminal の command、終了結果、失敗内容を自分で確認します。

## 任意: 比較する

効果を見たい場合は、短い手動 self-check にします。

1. Instructions を置かない状態で固定依頼を一度試す（Baseline）。
2. 同じ source、依頼、model、tool 条件を保ち、新しい会話で Instructions を有効にして試す（Customized）。
3. [比較メモ](starter/worksheet/comparison.md.template) に、引用、事実／推論／未確認、test の扱い、回答の長さや不要な作業を記録する。

完全に同じ条件を作れない場合は、優劣を断定せず差分を明記します。差がない、長くなった、余計な command が増えた、という結果も有用です。

## 確認ポイント

- Instructions は今回の正解ではなく、別の Java 作業にも使える規則か
- 重要な主張に file と symbol の根拠があるか
- code reading と実行確認を分けているか
- 実行していない test を成功と表現していないか
- 既存 expectation と production behavior を不用意に変えていないか
- 不正な入力の検証と金額計算の rounding を区別しているか

## 発展

- 同じ Instructions を別の小さな Java 調査へ使い、過剰な引用や回答の長文化が起きないか確かめる
- 規則を一つ削り、失われる品質と保守しやすさを比べる
- test を実行できる作業と、静的読解だけの作業で、報告形式をどう変えるか考える

## 制約・Fallback・安全

- Repository Instructions が利用できない場合は、選んだ本文を依頼の前に手動で貼れます。これは手動 fallback であり、自動発見を確認したことにはなりません。
- Java を実行できない場合は、compile/test 未実行と明記し、source と test から確認できる範囲だけを報告します。
- 固定抜粋は設計練習用です。対象リポジトリを利用できる場合は、実ファイルを正とします。
- 未承認 software の導入、権限回避、secret や private data の貼り付けは行いません。
- Copilot の提案は必ず差分と test でレビューし、実在する金額や業務判断へそのまま適用しません。
