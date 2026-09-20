# HC-033 Cloud Agentに再送調査用のSkillを渡そう

**言語:** **日本語** / [English](../../en/challenges/hc-033/README.md)

## シナリオ

CSV の再送を調査するときは、同じ `external_key` でも内容が一致する場合と異なる場合があり、元の受注、claim、journal の関係も確認する必要があります。毎回長い手順を貼り付ける代わりに Skill としてまとめられますが、Skill 名が表示されたこと、本文が使われたこと、リソースが読まれたこと、スクリプトが実行されたことは、それぞれ別に扱う必要があります。

このシナリオでは、短い調査手順と詳細なチェックリストを分け、同じ本文とリソースを手動で供給する方法と比較できる、不活性な Skill 原稿を作ります。

## この機能とは

Agent Skill は、特定のタスクで使う手順を `SKILL.md` と関連リソースにまとめる仕組みです。このシナリオでは、次の 4 段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| description | どのタスクで使うか | body が読み込まれた |
| body | 調査の順序、停止条件、記録形式 | resource が読まれた |
| resources | チェックリストなどの内容 | script が実行された |
| script | コマンド、入力、結果 | 結果の意味が正しい |

本編ではスクリプトを作成・実行せず、Skill も有効なディレクトリへ配置しません。

## 向いていること / 向いていないこと

**向いていること**

- 繰り返し使う調査手順、停止条件、根拠の記録形式の再利用
- 短い本文と詳しいチェックリストの分離
- ソースから分かることと、DB の確認が必要なことの分離
- description / body / resources / script の個別観測

**向いていないこと**

- 実際の CSV、顧客情報、本番環境の注文 ID、DB の出力を保存する
- ソースの読解だけで、claim や journal の実際の DB 状態を断定する
- リンクやファイル名だけで、body/resource/script の利用に成功したと判断する
- import、replay、DB 接続を無人で実行する

## ゴール

次の 2 つのタスクを支援する Skill 原稿を設計します。

- `replay-plan`: 同じ `external_key` の matching / different content / new claim を調べる
- `journal-boundary`: claim、元受注、journal の調査境界を整理する

完成物は、Skill の本文、詳細なチェックリスト、同じ内容の手動供給用バンドル、リソース台帳、合成パケットの診断です。

## 用意するもの

固定ソース:

- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRowService.java`
- `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/BatchRunService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`

`starter/` には、固定依頼、設計票、不活性な `SKILL.md.template`、リソースのチェックリスト、手動供給用バンドル、リソース台帳、合成の入力/観測パケット、任意比較票があります。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.txt.template` と `starter/fixtures/packets.json.template` を読みます。
2. `starter/customization/SKILL.md.template` は、`.github/skills`、`.agents/skills`、`.claude/skills` へ移しません。
3. 実際の DB、import、replay、スクリプトを実行しないという停止条件を、先に決めます。

## 試してみる

1. `starter/design.md.template` で、対象タスク、本文とチェックリストの分け方、unknown、停止条件を決めます。
2. `SKILL.md.template` に、生の入力、正規化、claim、元の受注、journal を分けて扱う短い手順を書きます。
3. `resources/checklist.md.template` に、詳しい確認項目を記入します。
4. `manual-bundle.md.template` に、同じ Skill の本文とチェックリストの全文を、区画を分けて収録します。
5. `resource-ledger.md.template` で、ファイル、frontmatter、本文、チェックリスト、手動供給用の各区画のハッシュを個別に記録します。
6. `fixtures/packets.json.template` の description/body/resources/script 状態を診断します。
7. `canonicalHash` と生ファイルのハッシュを混同せず、計算していないダイジェストは書きません。

## 任意: 比較する

`starter/worksheets/comparison.md.template` を使って、次の条件を手動で比較できます。

- **Baseline**: 必要な情報を含む固定依頼と通常の資料
- **Customized**: Skill の本文とチェックリストをパッケージとして供給する設計
- **Manual-equivalent**: 同じ本文とチェックリストの全文を手動で供給

ソース、合成カード、本文のバイト列、リソースのバイト列をそろえます。ただし、Skill の発見や優先順位まで同じとはみなしません。

## 確認ポイント

- 再送と新規作成、matching と different content を分けたか
- 正規化と生のバイト列を分けたか
- claim、元の受注、journal の根拠をソースへ戻せるか
- DB、transaction、execution を unknown のまま残したか
- description / body / resources / script を別々の段階にしたか
- 手動供給用バンドルの対応する区画が全文一致しているか
- スクリプトを作成・実行したことにしていないか

## 発展

- スクリプトを追加する場合は、何を形式的に検査し、何を意味の面では検査しないかだけを設計する
- Cloud Agent で Skill の利用を観測する準備には、[Cloud Skill の補足ガイド](optional/cloud-skill.md) を使う
- review-focused タスクで試す準備には、[Review Skill の補足ガイド](optional/review-skill.md) を使う

## 制約・代替手段・安全

- 有効な Skill ディレクトリ、スクリプト、workflow、Java、DB、Cloud Agent のタスク、レビューは作成・実行しません。
- 実際の CSV、注文 ID、顧客情報、DB の出力、secret は使いません。
- Skill に対応するクライアントがなくても、不活性な原稿と手動供給用バンドルで内容を検討できます。
- discovery、body injection、resource read、script execution を確認できない場合は、それぞれ `not-observed` とします。
