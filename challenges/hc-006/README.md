# HC-006 繰り返す Java 調査を Prompt File にしよう

## Scenario

同じ注文処理を調べるたびに、「三ファイルを追う」「fact と推測を分ける」「最小の次の確認を出す」と
説明し直しています。一部を忘れると、回答の section や調査範囲が変わり、引継ぎもしにくくなります。

このシナリオでは、繰り返す調査手順を Prompt File へまとめ、`approve` operation の source trace を
明示的な一回の呼出しで依頼します。

## この機能とは

Prompt File は、繰り返し使う prompt を repository 内の file として保存し、対応する client から
明示的に呼び出す GitHub Copilot customization です。対象、入力、出力 section、禁止事項を一か所で
保守できます。

ここでいう「ワンコマンド」は、Prompt File を prompt picker や対応する slash command から明示的に
選ぶことです。OS command を無制限に実行する意味ではありません。また、Prompt File は source の正確な
読解や tool の安全性を自動保証しません。

参考: [VS Code Prompt files](https://code.visualstudio.com/docs/copilot/customization/prompt-files)

## 向いていること / 向いていないこと

**向いていること**

- 毎週、毎 pull request などで繰り返す同型の調査
- 必須入力と出力 section をそろえたい作業
- 人が明示的に開始し、結果を確認する workflow
- 調査の範囲と stop condition を一か所で保守したい場合

**向いていないこと**

- repository 全体へ常時適用する短い規則
- 毎回目的や source scope が大きく変わる会話
- 自動実行、承認、外部への投稿を prompt だけで保証すること
- secret、個人情報、個人環境の絶対 path の保存

## ゴール

1. 固定 operation `approve` と三ファイルの scope を Prompt File の入力として使う。
2. entry point、form data、direct service call、fact / inference / unknown、追加候補、
   runtime boundary、next action を毎回要求する。
3. Prompt File を明示的に呼び出し、source citation と不要な範囲拡大を確認する。
4. manual request より再利用しやすいかを、必要なら短い手動比較で確かめる。

## 用意するもの

- Git
- Prompt Files に対応する VS Code / GitHub Copilot
- [始め方](../../README.md#始め方) で用意した runtime workspace
- upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

GitHub template から作られた runtime workspace は独自の commit history を持つため、local `HEAD` が
`8f0b3aa25c4f33facdea691642c2f1cb3901391c` と一致することは確認条件ではありません。
upstream template revision は教材 source の由来を示す参照です。revision へ checkout/reset せず、
runtime workspace にすでにあるファイルを使います。

`starter/` の素材はすべて不活性な `.template` です。

| 素材 | 用途 |
| --- | --- |
| [order-investigation.prompt.md.template](starter/customization/order-investigation.prompt.md.template) | Prompt File の原稿 |
| [OrderAction excerpt](starter/reference/OrderAction.java.excerpt.md.template) | entry point と dispatch の fallback 資料 |
| [OrderForm excerpt](starter/reference/OrderForm.java.excerpt.md.template) | form data の fallback 資料 |
| [OrderService excerpt](starter/reference/OrderService.java.excerpt.md.template) | service 側の境界の fallback 資料 |
| [comparison.md.template](starter/comparison.md.template) | 任意比較のワークシート |

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. runtime workspace の root を開き、次の三ファイルを読めることを確認します。local `HEAD` と
   upstream template revision の一致は求めません。
   - `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`
   - `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java`
   - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
3. full source を取得できない場合は `starter/reference/` の excerpt を使えます。ただし部分資料であり、
   実行時 behavior や省略された分岐を確認したことにはしません。
4. runtime workspace に既存の同名 Prompt File がある場合は上書きせず、手動供給の fallback で進めます。
5. client、model、tools、開始から回答保存までの時間測定方法を決めます。

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

1. `starter/customization/order-investigation.prompt.md.template` を読み、required inputs、
   required sections、禁止事項が固定入力に合うか確認します。
2. runtime workspace でだけ、原稿を新しい
   `.github/prompts/order-investigation.prompt.md` へコピーします。
   この教材 repository には active な Prompt File を追加しません。
3. repository root を開き、fresh conversation を開始します。
4. client の prompt picker または表示された `/order-investigation` を明示的に選び、
   operation に `approve` を渡します。表示されない呼出し方を推測で成功扱いにしません。
5. 最初の回答を修正せず保存し、次を確認します。
   - `OrderAction.perform` の `approve` branch を entry point として示したか
   - `OrderForm` から direct path で読む data だけを挙げたか
   - `OrderService.approve(id, version, actor(request))` を正しく示したか
   - fact、inference、unknown を分けたか
   - scope 外を追加候補として分け、勝手に編集や実行を始めなかったか
   - static reading では分からない framework lifecycle や runtime state を残したか
6. 終了後は、自分が作成した Prompt File だけを runtime workspace から取り除きます。

## 任意: 比較する

`starter/comparison.md.template` を使い、manual request と明示的な Prompt File 呼出しを
二回ずつ比べられます。

- 四回とも fresh conversation を使う
- operation、runtime workspace の三ファイル、upstream template revision、client、model、tools、評価表を固定する
- local `HEAD` と upstream template revision の一致は比較条件にしない
- manual 側だけ説明を省略したり、Prompt 側だけ追加 source を与えたりしない
- 必須 section の欠落、citation、不要な作業、所要時間、二回の drift を比べる

文章が完全一致する必要はありません。目的に必要な構造と根拠が安定するかを見ます。

## 確認ポイント

- 固定手順と毎回渡す operation を分けられているか
- `OrderAction` の role check と `OrderService` の業務条件を混同していないか
- excerpt ではなく full source を読んだ場合、その file と symbol を引用しているか
- required sections がそろっても、内容の正確さを別に確認しているか
- explicit invocation を実際に行ったことと、template を保存しただけの状態を分けているか
- Prompt File が不要な調査や edit を増やしていないか

## 発展

- operation を `submit` など別の値へ替え、Prompt File 本文を変更せず再利用できるか確認する
- required input に期待する order state を追加し、固定手順と可変 input の境界を見直す
- output section を減らし、maintainer が確認に必要な最小 packet を探す

## 制約・Fallback・安全

- 指定三ファイルの静的読解だけを行い、DB、Web、batch、アプリ、test を起動しません。
- 依頼されるまで source を編集しません。commit、push、pull request 作成、外部投稿も行いません。
- scope 外の file は追加候補として挙げるだけにし、読んでいない behavior を作りません。
- Prompt Files が非対応なら、template の本文を固定入力の直前に手動で貼れます。この方法では
  discovery や explicit invocation の使い勝手は確認できません。
- full source を取得できず excerpt だけで進める場合は「部分資料」と明記し、省略箇所と runtime behavior を
  未確認のまま残します。
- active な Prompt File、secret、個人情報、絶対 path をこの教材へ保存しません。
