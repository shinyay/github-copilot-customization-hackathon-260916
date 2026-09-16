# HC-035 指示と実行環境を混同せず準備しよう

**Language:** **日本語** / [English](../../en/challenges/hc-035/README.md)

## Scenario

古い Java アプリの調査で「JDK 8 を使う」「Maven 3.9 系を使う」「Java 7 API を越えない」と Instructions に書いても、その tool が環境に存在する証拠にはなりません。setup で tool を用意しても、source/API 制約を守ったことや test 成功までは保証しません。

このシナリオでは、Instructions、事前 setup、version check、tests、DB、agent start の責任を分けて設計します。実 workflow、Java、Maven、DB、Cloud Agent は起動しません。

## この機能とは

**Instructions** はモデルへ制約、確認順、停止条件を伝えます。**Copilot setup steps** は Cloud Agent の作業前に ephemeral environment を準備する GitHub Actions 形式の設定です。

最低でも次を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| instructions | JDK/Maven/API 制約、停止指示 | tool が install 済み |
| setup definition | job、steps、runner、permissions | setup が採用された |
| setup step | 各 step の結果 | version が要件に適合した |
| version check | `java` / `mvn` の版 | dependency や test が成功した |
| tests | command と終了結果 | DB test も実行された |
| DB | opt-in、engine、専用 DB、接続 | unit test 全体が成功した |
| agent start | setup 後の開始 | setup が成功した |

Cloud Agent 用 setup の file は `.github/workflows/copilot-setup-steps.yml`、job 名は `copilot-setup-steps` です。許可される job fields は `steps`、`permissions`、`runs-on`、`services`、`snapshot`、`timeout-minutes` で、timeout は 59 以下にします。setup step が失敗すると残りが skip されても Agent が開始する場合があるため、開始を setup success と解釈しません。

## 向いていること / 向いていないこと

**向いていること**

- Instructions と environment preparation の責任分離
- JDK、Maven、compiler、API 制約の個別確認
- setup 失敗後の skip、残状態、agent start の記録
- agent 自身の準備案と事前準備案の比較

**向いていないこと**

- 「JDK 8 を使う」と書くだけで install 済みとする
- `mvn --version` の表示だけで `[3.9,4.0)` 適合とする
- `dependency:go-offline` を test success とする
- setup 失敗後の agent start を success とする
- Animal Sniffer の `java17` を JDK 17 指定と読む
- secret、runner、firewall、proxy、TLS を無許可で変更する

## ゴール

root `pom.xml` の制約を読み、次を分担した inactive な原稿を作ります。

1. JDK `[1.8,1.9)`
2. Maven `[3.9,4.0)`
3. compiler source/target `1.7`
4. Animal Sniffer による Java 7 API check
5. Instructions、setup、version check、dependency preparation、tests、DB、agent start
6. setup failure 後の handoff

## 用意するもの

固定 source は root `pom.xml` です。

`starter/` には固定依頼、設計票、inactive な Instructions/setup 草稿、責任分担表、failure handoff、合成 packet、任意比較票があります。

注意点:

- compiler `1.7` は JDK 7 を使う指定ではありません。
- Animal Sniffer の signature `java17:1.0` は Java 7 API 用 artifact 名であり、JDK 17 指定ではありません。
- secrets/variables は repository または organization の管理事項です。本編では値を登録、表示、移動、要求しません。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.txt.template` と `pom.xml` を読みます。
2. `starter/customization/*.template` は active `.github/**` へ移しません。
3. 承認済み Ubuntu を想定し、runner、network、secret は未確認のまま設計します。

## 試してみる

1. `starter/design.md.template` に JDK/Maven/compiler/API の分類を書きます。
2. `customization/instructions.md.template` に、制約、確認順、変更禁止、未確認の報告方法を書きます。
3. `customization/copilot-setup-steps.yml.template` で次を静的に確認します。
   - job 名 `copilot-setup-steps`
   - 最小 permissions
   - JDK 8 の準備案
   - Maven version 表示と range 判定の分離
   - dependency preparation と tests の分離
   - timeout 59 以下
   - failure 後の skip と残状態
4. `responsibility.md.template` で各段階の owner、observer、stop decision を分けます。
5. `failure-handoff.md.template` に failed step、終了結果、残り skip、観測できた版、未完了 step、agent start を記録します。
6. `fixtures/packets.json.template` を診断し、packet 内の status を実環境の観測へ昇格させません。

## 任意: 比較する

`starter/worksheets/comparison.md.template` で次を手動比較できます。

- **Baseline**: Agent 自身が必要な tool を準備・確認する計画
- **Customized**: 同じ制約を事前 setup で準備し、残状態を Agent へ渡す計画

同じ task、pom、runner/OS/network 想定を使い、どちらも実行済み環境とは呼びません。

## 確認ポイント

- JDK、Maven、compiler、API 制約を分けたか
- `java17` を JDK 17 と誤読していないか
- version 表示と range 適合を分けたか
- setup、tests、DB、agent start を別欄にしたか
- dependency preparation を test success としていないか
- required step の失敗後も setup outcome を failure のままにしたか
- secret や runner を設定済み・利用可能と推測していないか

## 発展

- Maven が range 外だった場合に、承認済み version を準備する案と、人へ handoff して止める案を比較する
- Cloud setup の実観測準備は [Cloud setup の補足ガイド](optional/cloud-setup.md) を使う
- code review setup の実観測準備は [Review setup の補足ガイド](optional/review-setup.md) を使う
- 専用 PostgreSQL の確認項目は [PostgreSQL readiness の補足ガイド](optional/postgres-readiness.md) を使う

## 制約・Fallback・安全

- active workflow、pom、Java、test、DB 設定、secret、repository/organization settings は変更しません。
- Cloud Agent、Actions、JDK、Maven、DB を利用できなくても、pom 読解と inactive な設計原稿で完了できます。
- setup の保存・採用・実行、runner、tests、DB、agent start を確認できない場合は `not-observed` とします。
- self-hosted runner、Windows 切替、firewall 無効化、TLS 緩和、proxy 変更を fallback にしません。
