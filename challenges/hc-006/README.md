# HC-006 繰り返すJava調査をPrompt Fileにしよう

**言語:** **日本語** / [English](../../en/challenges/hc-006/README.md)

## シナリオ

同じ注文処理を調べるたびに、「三つのファイルを追う」「事実と推測を分ける」「次に必要な最小限の確認を示す」と
説明し直しています。一部を伝え忘れると、回答のセクションや調査範囲が変わり、引継ぎもしにくくなります。

このシナリオでは、繰り返し使う調査手順を Prompt File にまとめ、`approve` 操作のソース追跡を
一度の明示的な呼び出しで依頼します。

## この機能とは

Prompt File は、繰り返し使うプロンプトをリポジトリ内のファイルとして保存し、対応するクライアントから
明示的に呼び出す GitHub Copilot のカスタマイズです。対象、入力、出力セクション、禁止事項を一か所で
保守できます。

ここでいう「ワンコマンド」とは、Prompt File をプロンプトピッカーや対応するスラッシュコマンドから明示的に
選ぶことです。OS のコマンドを無制限に実行するという意味ではありません。また、Prompt File は、ソースを
正確に読めることやツールを安全に使えることを自動的に保証しません。

参考: [VS Code Prompt files](https://code.visualstudio.com/docs/copilot/customization/prompt-files)

## 向いていること / 向いていないこと

**向いていること**

- 毎週、または Pull Request ごとに繰り返す同型の調査
- 必須の入力と出力セクションをそろえたい作業
- 人が明示的に開始し、結果を確認するワークフロー
- 調査範囲と停止条件を一か所で保守したい場合

**向いていないこと**

- リポジトリ全体に常時適用する短い規則
- 目的やソースの範囲が毎回大きく変わる会話
- 自動実行、承認、外部への投稿を、プロンプトだけで保証すること
- シークレット、個人情報、個人環境の絶対パスを保存すること

## ゴール

1. 固定の操作 `approve` と、三つのファイルからなる範囲を Prompt File の入力として使う。
2. エントリーポイント、フォームデータ、サービスの直接呼び出し、事実 / 推論 / 不明点、追加の確認候補、
   実行時の境界、次の対応を毎回求める。
3. Prompt File を明示的に呼び出し、ソースの引用と不要な範囲拡大を確認する。
4. 手動で依頼するより再利用しやすいかを、必要に応じて簡単な手動比較で確かめる。

## 用意するもの

- Git
- Prompt Files に対応する VS Code / GitHub Copilot
- [始め方](../../README.md#始め方) で用意した実行用ワークスペース
- 上流テンプレートのリビジョン:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

GitHub template から作られた実行用ワークスペースは独自のコミット履歴を持つため、ローカルの `HEAD` が
`8f0b3aa25c4f33facdea691642c2f1cb3901391c` と一致することは確認条件ではありません。
上流テンプレートのリビジョンは、教材ソースの由来を示す参照です。そのリビジョンへの checkout や reset は行わず、
実行用ワークスペースにすでにあるファイルを使います。

`starter/` の素材は、すべて無効な状態の `.template` です。

| 素材 | 用途 |
| --- | --- |
| [order-investigation.prompt.md.template](starter/customization/order-investigation.prompt.md.template) | Prompt File の原稿 |
| [OrderAction の抜粋](starter/reference/OrderAction.java.excerpt.md.template) | エントリーポイントとディスパッチを確認するための代替資料 |
| [OrderForm の抜粋](starter/reference/OrderForm.java.excerpt.md.template) | フォームデータを確認するための代替資料 |
| [OrderService の抜粋](starter/reference/OrderService.java.excerpt.md.template) | サービス側の境界を確認するための代替資料 |
| [comparison.md.template](starter/comparison.md.template) | 任意比較のワークシート |

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. 実行用ワークスペースのルートを開き、次の三つのファイルを読めることを確認します。ローカルの `HEAD` と
   上流テンプレートのリビジョンが一致している必要はありません。
   - `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`
   - `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java`
   - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
3. 完全なソースを取得できない場合は、`starter/reference/` の抜粋を使えます。ただし、これは部分的な資料であり、
   実行時の挙動や省略された分岐を確認したことにはなりません。
4. 実行用ワークスペースに同名の Prompt File がすでにある場合は上書きせず、本文を手動で渡す代替手段で進めます。
5. クライアント、モデル、ツール、および開始から回答を保存するまでの時間を測る方法を決めます。

固定入力は次です。

```text
operation: approve

新しいmaintainer向けに、OrderAction.performがOrderFormの入力を読み、
OrderServiceのどのoperationへ直接dispatchするかを、指定した3ファイルだけで説明してください。
entry point、form data、direct service call、追加で確認すべきcandidate、
sourceだけでは未検証のruntime behaviorを分けてください。

静的な読解だけを行い、依頼されるまでfileを編集しないでください。
範囲外のfileは次の確認候補として名前を挙げるだけにしてください。
```

## 試してみる

1. `starter/customization/order-investigation.prompt.md.template` を読み、必須入力、
   必須セクション、禁止事項が固定入力に合っているか確認します。
2. 実行用ワークスペースでのみ、原稿を新しい
   `.github/prompts/order-investigation.prompt.md` へコピーします。
   この教材リポジトリには、有効な Prompt File を追加しません。
3. リポジトリのルートを開き、新しい会話を開始します。
4. クライアントのプロンプトピッカー、または表示された `/order-investigation` を明示的に選び、
   操作として `approve` を渡します。画面に表示されない呼び出し方を、推測で成功したことにはしません。
5. 最初の回答を修正せず保存し、次を確認します。
   - `OrderAction.perform` の `approve` 分岐をエントリーポイントとして示したか
   - `OrderForm` から直接の経路で読み取るデータだけを挙げたか
   - `OrderService.approve(id, version, actor(request))` を正しく示したか
   - 事実、推論、不明点を分けたか
   - 範囲外の項目を追加の確認候補として分け、勝手に編集や実行を始めなかったか
   - 静的な読解では分からない、フレームワークのライフサイクルや実行時の状態を未確認のまま残したか
6. 終了後は、自分が作成した Prompt File だけを実行用ワークスペースから取り除きます。

## 任意: 比較する

`starter/comparison.md.template` を使い、手動の依頼と明示的な Prompt File の呼び出しを
二回ずつ比べられます。

- 4 回とも新しい会話を使う
- 操作、実行用ワークスペースの三つのファイル、上流テンプレートのリビジョン、クライアント、モデル、ツール、評価表を固定する
- ローカルの `HEAD` と上流テンプレートのリビジョンの一致は、比較条件にしない
- 手動の依頼だけ説明を省いたり、Prompt File の側だけ追加のソースを与えたりしない
- 必須セクションの欠落、引用、不要な作業、所要時間、2 回の結果のずれを比べる

文章が完全一致する必要はありません。目的に必要な構造と根拠が安定するかを見ます。

## 確認ポイント

- 固定手順と、毎回渡す操作を分けられているか
- `OrderAction` のロール確認と `OrderService` の業務条件を混同していないか
- 抜粋ではなく完全なソースを読んだ場合、そのファイルとシンボルを引用しているか
- 必須セクションがそろっていても、内容の正確さを別に確認しているか
- 明示的に呼び出したことと、テンプレートを保存しただけの状態を分けているか
- Prompt File によって、不要な調査や編集が増えていないか

## 発展

- 操作を `submit` など別の値に替え、Prompt File の本文を変更せずに再利用できるか確認する
- 必須入力に期待する注文状態を追加し、固定手順と可変入力の境界を見直す
- 出力セクションを減らし、保守担当者が確認に必要な最小限の情報を探す

## 制約・代替手段・安全

- 指定された三つのファイルを静的に読むだけにとどめ、データベース、Web、バッチ、アプリ、テストは起動しません。
- 依頼されるまでソースは編集しません。コミット、プッシュ、Pull Request の作成、外部への投稿も行いません。
- 範囲外のファイルは追加の確認候補として挙げるだけにし、読んでいない挙動を作りません。
- Prompt Files が非対応なら、テンプレートの本文を固定入力の直前に手動で貼り付けられます。この方法では、
  検出や明示的な呼び出しの使い勝手は確認できません。
- 完全なソースを取得できず、抜粋だけで進める場合は「部分資料」と明記し、省略箇所と実行時の挙動を
  未確認のまま残します。
- 有効な Prompt File、シークレット、個人情報、絶対パスをこの教材に保存しません。
