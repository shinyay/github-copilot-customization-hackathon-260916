# HC-032 Cloud Agentの調査役とツールを設計しよう

**言語:** **日本語** / [English](../../en/challenges/hc-032/README.md)

## シナリオ

受注承認の調査を依頼するときは、「コードから根拠を集める担当」と「実際に変更する担当」を分けたい場合があります。ただし、profile に「read-only」と書くだけでは、OS やリポジトリの権限は変わりません。また、ツールを宣言したこと、実行時に利用できたこと、実際に呼び出されたことも、それぞれ別の事実です。

このシナリオでは、変更を行わない調査役の責任、停止条件、変更担当への引き継ぎを、不活性な Custom Agent profile として設計します。

## この機能とは

Custom Agent profile は、名前、説明、tools、役割本文などを Markdown で定義します。GitHub.com 向けのリポジトリ profile は通常 `.github/agents/*.agent.md` に置きますが、このシナリオでは `starter/customization/*.template` のまま扱います。

次の段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| 保存 | リポジトリ、ref、ファイル名、生のハッシュ | 製品が profile を発見した |
| 表示 | 候補として見えた記録 | profile が選択された |
| 選択 | selection の直接記録 | 宣言したツールがすべて実効になった |
| 宣言 | profile の `tools` | 実行時に有効なツール |
| 実効 | 利用可能と確認できたツール | ツールが呼び出された |
| 呼出し | call ID、ツール、入力、結果 | 結果の意味が正しい |

役割本文の禁止事項は行動上の指示であり、ACL、ネットワーク制御、ツール実装の安全性を保証するものではありません。

## 向いていること / 向いていないこと

**向いていること**

- 調査と変更で責任や停止条件が異なる作業
- 根拠をファイルやシンボルへ戻せる形で集める
- 未確認事項を変更担当へ明示的に渡す
- declared / effective / called の各ツールを分けて記録する

**向いていないこと**

- profile 本文だけでファイルシステムや GitHub の権限を制御する
- 調査役に修正、コミット、投稿、承認まで任せる
- ツールの数や禁止事項の長さを品質の代わりにする
- 保存済み profile を発見・選択・実行済みとして報告する
- unsupported な引き継ぎを自動遷移として扱う

## ゴール

`approval-trace` の固定タスクに対し、次のものを作ります。

1. 調査役 profile の本文
2. 同じツールを宣言する control profile
3. profile 本文と同じ手動供給用の本文
4. 変更担当への引き継ぎ
5. ツールと selection の台帳
6. 合成パケットの診断

## 用意するもの

固定ソース:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`

主な静的経路は `OrderService.approve` → `BaseService.require` → `Actor.require` です。この経路だけでは、特定の利用者の認証状態、信用、在庫、永続化、承認可否は判断できません。

`starter/` には、固定依頼、設計票、不活性な 2 つの profile、手動供給用の本文、引き継ぎ、ツール台帳、合成パケット、任意比較票があります。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.txt.template` と 3 つのソースを読みます。
2. `starter/customization/*.agent.md.template` は、有効な `.github/agents/` へ移しません。
3. `starter/design.md.template` で、調査範囲、unknown、停止条件、引き継ぎ方法を先に決めます。

## 試してみる

1. control と investigation profile の `tools` は、どちらも `read` / `search` にします。
2. `evidence.agent.md.template` の役割本文に、確認するソース、根拠の形式、unknown、停止条件、引き継ぎ方法を記入します。
3. 同じ役割本文を `manual-body.md.template` へ全文コピーし、比較する区画のバイト列をそろえます。
4. `handoff.md.template` に、確認済みの事実、推論、unknown、次に読む候補、人による判断を分けて書きます。
5. `fixtures/packets.json.template` を読み、selected / declared / effective / called を混同せず診断します。
6. `tools-ledger.md.template` に、保存元、selection、ツール、call、観測方法、unknown を記録します。

## 任意: 比較する

`starter/worksheets/comparison.md.template` を使って、次の条件を手動で比較できます。

- **Baseline**: 固定依頼 + control profile
- **Customized**: 同じツール + 調査役の本文
- **Manual-equivalent**: control profile + 同じ役割本文の全文

profile 名や供給元の違いまでなくなったとはみなさず、回答の長さではなく、ソースへ戻れる根拠と引き継ぎ内容の具体性を比較します。

## 確認ポイント

- 調査役と変更担当の責任が分かれているか
- control と investigation profile が宣言するツールは同じか
- 保存、表示、選択、宣言、実効、呼出しを分けたか
- `description` の read-only 表現を権限と説明していないか
- 3 つのソースへ戻れる根拠と、範囲外の unknown があるか
- 手動供給用の本文が役割本文と一致しているか
- 変更、投稿、実行、承認を行ったことにしていないか

## 発展

- 宣言するツールを `read` / `search` から `read` だけに絞る案を別紙で検討する
- 実際の Cloud Agent で profile の選択とツールを観測する準備には、[Cloud profile の補足ガイド](optional/cloud-profile.md) を使う

## 制約・代替手段・安全

- active Custom Agent、Cloud Agent のタスク、変更担当、Java の実行、PR、投稿は作成・実行しません。
- 合成パケットの主張を実際のサービス履歴へ昇格させません。
- Custom Agent を利用できなくても、profile 原稿、手動供給用の本文、引き継ぎ、ツール台帳の静的な設計で完了できます。
- 実効ツールや実際の呼び出しを確認できない場合は、`not-observed` のままにします。
