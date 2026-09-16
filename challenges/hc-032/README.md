# HC-032 Cloud Agent の調査役と tools を設計しよう

## Scenario

受注承認の調査を依頼するとき、「コードから根拠を集める担当」と「実際に変更する担当」を分けたいことがあります。ただし profile に「read-only」と書くだけでは、OS や repository の権限は変わりません。また、tool を宣言したこと、実行時に利用可能だったこと、実際に呼ばれたことも別の事実です。

このシナリオでは、変更しない調査役の責任、停止条件、変更担当への handoff を inactive な Custom Agent profile として設計します。

## この機能とは

Custom Agent profile は、名前、説明、tools、役割本文などを Markdown で定義します。GitHub.com 向けの repository profile は通常 `.github/agents/*.agent.md` に置きますが、このシナリオでは `starter/customization/*.template` のまま扱います。

次の段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| 保存 | repository、ref、filename、raw hash | 製品が profile を発見した |
| 表示 | 候補として見えた記録 | profile が選択された |
| 選択 | selection の直接記録 | 宣言 tool がすべて実効になった |
| 宣言 | profile の `tools` | 実行時の effective tools |
| 実効 | 利用可能と確認できた tools | tool が呼ばれた |
| 呼出し | call ID、tool、入力、結果 | 結果の意味が正しい |

役割本文の禁止事項は行動上の指示であり、ACL、network 制御、tool 実装の安全性ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 調査と変更で責任や停止条件が異なる作業
- 根拠を file・symbol へ戻せる形で集める
- 未確認事項を変更担当へ明示的に渡す
- declared / effective / called tools を分けて記録する

**向いていないこと**

- profile 本文だけで filesystem や GitHub 権限を制御する
- 調査役へ修正、commit、投稿、承認まで任せる
- tool 数や禁止文の長さを品質の代理にする
- 保存済み profile を発見・選択・実行済みとして報告する
- unsupported な handoff を自動遷移として扱う

## ゴール

`approval-trace` の固定 task に対し、次を作ります。

1. 調査役 profile の本文
2. 同じ declared tools を持つ control profile
3. profile 本文と同じ manual body
4. 変更担当への handoff
5. tools と selection の台帳
6. 合成 packet の診断

## 用意するもの

固定 source:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`

主な静的経路は `OrderService.approve` → `BaseService.require` → `Actor.require` です。これだけで特定利用者の認証状態、信用、在庫、永続化、承認可否は決めません。

`starter/` には固定依頼、設計票、inactive な 2 profile、manual body、handoff、tools ledger、合成 packet、任意比較票があります。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.txt.template` と 3 source を読みます。
2. `starter/customization/*.agent.md.template` は active `.github/agents/` へ移しません。
3. `starter/design.md.template` で、調査範囲、unknown、停止、handoff を先に決めます。

## 試してみる

1. control と investigation profile の `tools` を同じ `read` / `search` に保ちます。
2. `evidence.agent.md.template` の役割本文に、確認する source、根拠形式、unknown、停止、handoff を記入します。
3. 同じ役割本文を `manual-body.md.template` へ全文コピーし、比較する区画の bytes をそろえます。
4. `handoff.md.template` に確認済み事実、推論、unknown、次に読む候補、人の判断を分けて書きます。
5. `fixtures/packets.json.template` を読み、selected / declared / effective / called を混同せず診断します。
6. `tools-ledger.md.template` に保存元、selection、tools、call、観測方法、unknown を記録します。

## 任意: 比較する

`starter/worksheets/comparison.md.template` で次を手動比較できます。

- **Baseline**: 固定依頼 + control profile
- **Customized**: 同じ tools + 調査役本文
- **Manual-equivalent**: control profile + 同じ役割本文の全文

profile 名や供給位置の差まで消えたとは主張せず、回答の長さより source へ戻れる根拠と handoff の具体性を比べます。

## 確認ポイント

- 調査役と変更担当の責任が分かれているか
- control と investigation profile の declared tools が同じか
- 保存、表示、選択、宣言、実効、呼出しを分けたか
- `description` の read-only 表現を権限と説明していないか
- 3 source へ戻れる根拠と範囲外の unknown があるか
- manual body が役割本文と一致しているか
- 変更、投稿、実行、承認を行ったことにしていないか

## 発展

- declared tools を `read` / `search` から `read` だけに絞る案を別紙で検討する
- 実 Cloud Agent で profile の選択と tools を観測する準備は [Cloud profile の補足ガイド](optional/cloud-profile.md) を使う

## 制約・Fallback・安全

- active Custom Agent、Cloud task、変更担当、Java 実行、PR、投稿は作成・実行しません。
- 合成 packet の主張を実サービス履歴へ昇格させません。
- Custom Agent を利用できなくても、profile 原稿、manual body、handoff、tools ledger の静的設計で完了できます。
- effective tools や actual calls を確認できない場合は `not-observed` のままにします。
