# HC-035 Instructionsと実行環境を混同せずに準備しよう

**言語:** **日本語** / [English](../../en/challenges/hc-035/README.md)

## シナリオ

古い Java アプリを調査するときに、「JDK 8 を使う」「Maven 3.9 系を使う」「Java 7 API を越えない」と Instructions に書いても、それらのツールが環境に存在する根拠にはなりません。setup でツールを用意しても、ソース/API の制約を守ったことや、テストに成功したことまでは保証されません。

このシナリオでは、Instructions、事前 setup、バージョン確認、テスト、DB、Agent の開始について、それぞれの役割を分けて設計します。実際のワークフロー、Java、Maven、DB、Cloud Agent は起動しません。

## この機能とは

**Instructions** は、制約、確認順、停止条件をモデルへ伝えます。**Copilot setup steps** は、Cloud Agent が作業を始める前に一時的な環境を準備する GitHub Actions 形式の設定です。

最低でも次を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| instructions | JDK/Maven/API の制約、停止指示 | ツールがインストール済み |
| setup definition | job、steps、runner、permissions | setup が採用された |
| setup step | 各 step の結果 | バージョンが要件に適合した |
| version check | `java` / `mvn` のバージョン | 依存関係の準備やテストが成功した |
| tests | コマンドと終了結果 | DB テストも実行された |
| DB | opt-in、engine、専用 DB、接続 | unit test 全体が成功した |
| agent start | setup 後の開始 | setup が成功した |

Cloud Agent 用 setup のファイルは `.github/workflows/copilot-setup-steps.yml`、ジョブ名は `copilot-setup-steps` です。ジョブで使用できるフィールドは `steps`、`permissions`、`runs-on`、`services`、`snapshot`、`timeout-minutes` で、タイムアウトは 59 以下にします。setup のステップが失敗すると、残りのステップがスキップされても Agent が開始する場合があります。そのため、Agent の開始を setup の成功と解釈しません。

## 向いていること / 向いていないこと

**向いていること**

- Instructions と環境準備の役割を分ける
- JDK、Maven、コンパイラ、API 制約の個別確認
- setup 失敗後のスキップ、残っている状態、Agent の開始を記録する
- Agent 自身が準備する案と事前に準備する案を比較する

**向いていないこと**

- 「JDK 8 を使う」と書くだけで、インストール済みと判断する
- `mvn --version` の表示だけで、`[3.9,4.0)` に適合していると判断する
- `dependency:go-offline` をテスト成功とみなす
- setup 失敗後の Agent の開始を成功とみなす
- Animal Sniffer の `java17` を JDK 17 指定と読む
- シークレット、ランナー、ファイアウォール、プロキシ、TLS を無許可で変更する

## ゴール

ルートの `pom.xml` に記載された制約を読み、次の役割分担を示す不活性な原稿を作ります。

1. JDK `[1.8,1.9)`
2. Maven `[3.9,4.0)`
3. コンパイラの source/target `1.7`
4. Animal Sniffer による Java 7 API の確認
5. Instructions、setup、バージョン確認、依存関係の準備、テスト、DB、Agent の開始
6. setup 失敗後の引き継ぎ

## 用意するもの

固定ソースは、ルートの `pom.xml` です。

`starter/` には、固定依頼、設計票、不活性な Instructions/setup の草稿、責任分担表、失敗時の引き継ぎ、合成パケット、任意比較票があります。

注意点:

- コンパイラの `1.7` は、JDK 7 を使う指定ではありません。
- Animal Sniffer の signature `java17:1.0` は Java 7 API 用の artifact 名であり、JDK 17 の指定ではありません。
- secrets/variables は、リポジトリまたは organization で管理します。本編では値を登録、表示、移動、要求しません。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/request.txt.template` と `pom.xml` を読みます。
2. `starter/customization/*.template` は、有効な `.github/**` へ移しません。
3. 承認済みの Ubuntu を想定し、ランナー、ネットワーク、シークレットは未確認のまま設計します。

## 試してみる

1. `starter/design.md.template` に、JDK/Maven/コンパイラ/API の分類を書きます。
2. `customization/instructions.md.template` に、制約、確認順、変更禁止、未確認の報告方法を書きます。
3. `customization/copilot-setup-steps.yml.template` で次を静的に確認します。
   - ジョブ名 `copilot-setup-steps`
   - 最小限の permissions
   - JDK 8 の準備案
   - Maven のバージョン表示と範囲判定の分離
   - 依存関係の準備とテストの分離
   - タイムアウトが 59 以下
   - 失敗後のスキップと残っている状態
4. `responsibility.md.template` で、各段階の owner、observer、stop decision を分けます。
5. `failure-handoff.md.template` に、失敗したステップ、終了結果、残りのスキップ、観測できたバージョン、未完了のステップ、Agent の開始を記録します。
6. `fixtures/packets.json.template` を診断し、パケット内の status を実環境の観測結果へ昇格させません。

## 任意: 比較する

`starter/worksheets/comparison.md.template` を使って、次の条件を手動で比較できます。

- **Baseline**: Agent 自身が必要なツールを準備・確認する計画
- **Customized**: 同じ制約を事前 setup で準備し、残状態を Agent へ渡す計画

同じタスク、POM、ランナー/OS/ネットワークの想定を使います。どちらも、実行済みの環境とは呼びません。

## 確認ポイント

- JDK、Maven、コンパイラ、API 制約を分けたか
- `java17` を JDK 17 と誤読していないか
- バージョン表示と範囲への適合を分けたか
- setup、テスト、DB、Agent の開始を別々の欄に記録したか
- 依存関係の準備をテスト成功とみなしていないか
- 必須ステップの失敗後も、setup の結果を失敗のままにしたか
- シークレットやランナーが設定済みで利用できると推測していないか

## 発展

- Maven が範囲外だった場合に、承認済みのバージョンを準備する案と、人へ引き継いで停止する案を比較する
- Cloud setup を実際に観測する準備には、[Cloud setup の補足ガイド](optional/cloud-setup.md) を使う
- code review setup を実際に観測する準備には、[Review setup の補足ガイド](optional/review-setup.md) を使う
- 専用 PostgreSQL の確認項目には、[PostgreSQL の準備状況に関する補足ガイド](optional/postgres-readiness.md) を使う

## 制約・代替手段・安全

- 有効なワークフロー、POM、Java、テスト、DB 設定、シークレット、リポジトリ/organization の設定は変更しません。
- Cloud Agent、Actions、JDK、Maven、DB を利用できなくても、POM の読解と不活性な設計原稿で完了できます。
- setup の保存・採用・実行、ランナー、テスト、DB、Agent の開始を確認できない場合は、`not-observed` とします。
- self-hosted runner、Windows への切り替え、ファイアウォールの無効化、TLS の緩和、プロキシの変更を代替手段にしません。
