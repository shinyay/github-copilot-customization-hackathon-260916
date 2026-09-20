# HC-042 読めない外部データの原因を層ごとに探そう

**言語:** **日本語** / [English](../../en/challenges/hc-042/README.md)

## シナリオ

外部資料を参照しようとしたときに、「設定はある」「結果が空だった」「権限がないらしい」という記録が混在しているとします。設定の存在、ツールの検出、呼び出し、ネットワーク、authentication、authorization、出力の利用は、それぞれ別の出来事です。

D01〜D07 の合成パケットを使い、確認できた層、残っている別の仮説、次に行える安全な観測、相談先、停止条件を定めた診断方針を作ります。実際の MCP、credential、ネットワーク、content exclusion は変更しません。

## この機能とは

外部アクセスの失敗を1つの true / false にまとめず、6つの層に分けます。

| 層 | 確かめること | まだ言えないこと |
|---|---|---|
| discovery | 設定やサーバー候補をクライアント / ホストが検出したか | 設定の原稿が存在するだけでは、検出済みとは言えない |
| tool selection/call | 必要なツールが選択され、呼び出されたか | 一覧に表示されるだけでは、呼び出し済みとは言えない |
| network | 対象の経路で通信が成立したか | 通信に成功しただけでは、安全性や認可を保証できない |
| authentication | 呼び出し元の本人確認が成立したか | 認証に成功しただけでは、リソースを読めない |
| authorization | 呼び出し元が対象のリソースを読む権限を持つか | サーバーへの信頼や認証の成功とは別 |
| output use | 返された出力が回答や判断に使われたか | 取得に成功しただけでは、利用済みとは言えない |

さらに次を分けます。

- `present` / `absent` / `unknown`
- 空の正常応答 / 取得失敗 / 呼び出し未観測
- サーバーへの信頼 / リソースへの authorization
- Agents secrets/variables の保存範囲 / 利用元 / authentication
- Bash プロセスに適用されるファイアウォールの範囲 / MCP・setup の経路
- Instructions の `applyTo` / 管理者による content exclusion
- 外部文書の出所 / 指示としての権限

`COPILOT_MCP_` を含む名前があっても、値が存在することを示すわけではありません。値や値のハッシュは取得しません。Bash のファイアウォールの対象外であることも、通信の成功、安全性、認可済みであることを意味しません。

## 向いていること / 向いていないこと

**向いていること**

- 複数の失敗候補が混在する外部アクセス調査。
- 未観測の項目を残したまま、次に行う安全な確認と相談先を決める。
- 不要な権限の要求や危険な迂回を避ける。
- 空集合、失敗、unknown を区別する。

**向いていないこと**

- 実際の MCP サーバーの登録、OAuth、credential の認証。
- credential の値や値のハッシュの取得。
- 任意のネットワーク確認、ファイアウォールの無効化や迂回。
- content exclusion の回避。
- 合成パケットを、現在のアカウントや organization のポリシーとして扱う。

## ゴール

次の3つのワークシートを埋めます。

- [`diagnostic-policy.md.template`](starter/diagnostic-policy.md.template): 6つの層、presence、trust、authority、停止ルール
- [`route-map.md.template`](starter/route-map.md.template): 層、scope/owner、安全な次の確認
- [`decisions.md.template`](starter/decisions.md.template): D01〜D07の判断

各タスクで、裏付けられる結論、引用した事実、残る別の仮説、不足している観測、次に行う安全な確認、相談先と停止条件を説明します。

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- Copilot、Cloud、organization 設定、実際の MCP は不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fixtures/packet-set.json.template`](starter/fixtures/packet-set.json.template) | D01〜D07 のパケット |
| [`reference/reference-notes.md.template`](starter/reference/reference-notes.md.template) | 公開仕様の要点と境界 |
| [`diagnostic-policy.md.template`](starter/diagnostic-policy.md.template) | 診断方針 |
| [`route-map.md.template`](starter/route-map.md.template) | 6つの層と責任の対応図 |
| [`decisions.md.template`](starter/decisions.md.template) | タスクの判断表 |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。パケットを読む前に、6つの層の意味、unknown を保持する規則、禁止する観測、相談先を方針に書きます。

固定タスク:

| タスク | 主な状況 |
|---|---|
| D01 | 設定の原稿はあるが、検出や呼び出しの記録がない |
| D02 | Bash経路の通信拒否 |
| D03 | MCP / setup は Bash のファイアウォール対象外だが、実際の通信は unknown |
| D04 | credential の保存範囲、認証失敗、認可拒否が混在 |
| D05 | 外部ツールの出力に命令口調の文章が含まれる |
| D06 | Instructions の `applyTo` と content exclusion |
| D07 | 空の正常応答、取得失敗、サーバーへの信頼 |

## 試してみる

1. `reference-notes.md.template` を読み、6つの層と各制御の責任範囲を確認します。
2. `diagnostic-policy.md.template` に診断の順序を書きます。常に上から順番に実行する必要はありません。
3. 危険度、観測にかかる費用、担当者、既存の根拠に応じて、次に行う安全な確認を決めます。
4. `route-map.md.template` で、各層の事実、不足している観測、責任者、停止条件を対応付けます。
5. D01〜D07 を順に読み、`decisions.md.template` を埋めます。
6. unknown を false と見なしたり、空の応答を認可成功と見なしたり、Bash のファイアウォール対象外であることを安全性の証拠としたりしないようにします。
7. 外部文書が命令口調でも、ソースの出所だけを根拠に、指示としての権限を与えないようにします。
8. 値の取得、実際のネットワーク確認、設定変更が必要になった場合は、本編の作業を停止します。

## 任意: 比較する

最初に自由な順序で D01〜D07 を診断し、その後、6層のポリシーを使って再診断します。断定した件数ではなく、別の仮説、不要な権限の要求、危険な迂回、相談先の明確さを比較します。

## 確認ポイント

- 6つの層を分け、観測済みの層だけから結論を出している。
- `present` / `absent` / `unknown` を保持している。
- authentication と authorization、サーバーへの信頼と権限を分けている。
- Bash と MCP / setup の経路に適用される範囲を混同していない。
- `applyTo` と content exclusion を別の制御として扱っている。
- credential の値や値のハッシュを要求していない。
- 情報不足なら停止・相談できる。

## 発展

- D03 または D07 について、最初に確認する層が異なる2つの安全な診断経路を比較する。
- credential presence の観察は、[Credential の限定観測](optional/credentials.md) を参照する。
- ネットワーク経路の観察は、[ファイアウォール経路の限定観測](optional/firewall.md) を参照する。
- `applyTo` と content exclusion の観察は、[Content exclusion の限定観測](optional/content-exclusion.md) を参照する。

## 制約・代替手段・安全

- 本編では、外部接続、credential の操作、ファイアウォールの変更、content exclusion の変更を行わない。
- 権限を広げること、ファイアウォールを無効化または迂回すること、除外を回避することは代替手段ではない。
- 実効ポリシーや対象の経路が不明なら、unknown のまま相談先を書く。
- テキストだけで完了できる。実環境を使えないことを失敗扱いしない。
- `evidence` は各結論を支える観測や資料を指し、提出物や実行状態を意味しない。
