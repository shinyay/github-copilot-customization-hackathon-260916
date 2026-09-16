# HC-033 Cloud Agent に再送調査 Skill を渡そう

**Language:** **日本語** / [English](../../en/challenges/hc-033/README.md)

## Scenario

CSV 再送の調査では、同じ `external_key` でも内容が同じ場合と違う場合があり、元受注、claim、journal の関係も確認する必要があります。毎回長い手順を貼る代わりに Skill としてまとめられますが、Skill 名が見えたこと、本文が使われたこと、resource が読まれたこと、script が動いたことは別々に扱う必要があります。

このシナリオでは、短い調査手順と詳細 checklist を分け、同じ本文・resource を手動供給する案と比較できる inactive な Skill 原稿を作ります。

## この機能とは

Agent Skill は、特定 task で使う手順を `SKILL.md` と関連 resource にまとめる仕組みです。このシナリオでは次の 4 段階を分けます。

| 段階 | 確認するもの | 次を自動で意味しない |
|---|---|---|
| description | どの task で使うか | body が読み込まれた |
| body | 調査順、停止、記録形式 | resource が読まれた |
| resources | checklist などの内容 | script が実行された |
| script | command、入力、結果 | 結果の意味が正しい |

本編では script を作成・実行せず、Skill も active directory へ配置しません。

## 向いていること / 向いていないこと

**向いていること**

- 繰り返す調査順、停止条件、evidence 形式の再利用
- 短い body と詳しい checklist の分離
- source で分かることと DB 確認が必要なことの分離
- description / body / resources / script の個別観測

**向いていないこと**

- 実 CSV、顧客情報、production の注文 ID や DB 出力を保存する
- source 読解だけで claim や journal の実 DB 状態を断定する
- link や filename だけで body/resource/script 利用を成功扱いする
- import、replay、DB 接続を無人で実行する

## ゴール

次の 2 task を支援する Skill 原稿を設計します。

- `replay-plan`: 同じ `external_key` の matching / different content / new claim を調べる
- `journal-boundary`: claim、元受注、journal の調査境界を整理する

完成物は Skill body、詳細 checklist、同内容の manual bundle、resource ledger、合成 packet の診断です。

## 用意するもの

固定 source:

- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRowService.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRunService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`

`starter/` には固定依頼、設計票、inactive な `SKILL.md.template`、resource checklist、manual bundle、resource ledger、合成 input/observation packets、任意比較票があります。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.txt.template` と `starter/fixtures/packets.json.template` を読みます。
2. `starter/customization/SKILL.md.template` は `.github/skills`、`.agents/skills`、`.claude/skills` へ移しません。
3. 実 DB、import、replay、script 実行を行わない停止境界を先に決めます。

## 試してみる

1. `starter/design.md.template` で、対象 task、body/checklist の分割、unknown、停止条件を決めます。
2. `SKILL.md.template` に、raw input、canonicalization、claim、元受注、journal を分ける短い手順を書きます。
3. `resources/checklist.md.template` に、詳しい確認項目を記入します。
4. `manual-bundle.md.template` に同じ Skill body と checklist 全文を、区画を分けて収録します。
5. `resource-ledger.md.template` で file、frontmatter、body、checklist、manual sections の hash を個別に記録します。
6. `fixtures/packets.json.template` の description/body/resources/script 状態を診断します。
7. `canonicalHash` と raw file hash を混同せず、計算していない digest は書きません。

## 任意: 比較する

`starter/worksheets/comparison.md.template` で次を手動比較できます。

- **Baseline**: 十分な固定依頼と通常資料
- **Customized**: Skill body と checklist を package として供給する設計
- **Manual-equivalent**: 同じ body と checklist 全文を手動供給

source、合成 cards、本文 bytes、resource bytes をそろえ、Skill の発見や優先度まで同じとは主張しません。

## 確認ポイント

- 再送と新規作成、matching と different content を分けたか
- canonicalization と raw bytes を分けたか
- claim、元受注、journal の根拠を source へ戻せるか
- DB、transaction、execution を unknown のまま残したか
- description / body / resources / script を別 stage にしたか
- manual bundle の対応 section が全文一致しているか
- script を作成・実行したことにしていないか

## 発展

- script を追加するなら、何を形式検査し、何を意味検査しないかだけを設計する
- Cloud Agent で Skill 利用を観測する準備は [Cloud Skill の補足ガイド](optional/cloud-skill.md) を使う
- review-focused task で試す準備は [Review Skill の補足ガイド](optional/review-skill.md) を使う

## 制約・Fallback・安全

- active Skill directory、script、workflow、Java、DB、Cloud task、review を作成・実行しません。
- 実 CSV、注文 ID、顧客情報、DB 出力、secret を使いません。
- Skill 対応 client がなくても、inactive な原稿と manual bundle で内容を検討できます。
- discovery、body injection、resource read、script execution を確認できない場合は、それぞれ `not-observed` とします。
