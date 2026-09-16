# HC-042 読めない外部データの原因を層ごとに探そう

## Scenario

外部資料を参照しようとしたとき、「設定はある」「空の結果だった」「権限がないらしい」という記録が混在しています。設定の存在、tool発見、call、network、authentication、authorization、出力利用は別々の出来事です。

D01〜D07の合成packetを使い、確認できた層、残る代替仮説、次に行える安全な観測、相談先、停止条件を決める診断方針を作ります。実MCP、credential、network、content exclusionは変更しません。

## この機能とは

外部アクセスの失敗を一つのtrue/falseへ潰さず、六層へ分けます。

| 層 | 確かめること | まだ言えないこと |
|---|---|---|
| discovery | 設定やserver候補がclient/hostから発見されたか | 設定原稿の存在だけでは発見済みと言えない |
| tool selection/call | 必要なtoolが選択・callされたか | 一覧に見えるだけではcall済みと言えない |
| network | 対象経路で通信が成立したか | 通信成功だけでは安全性や認可を保証しない |
| authentication | 呼出し主体の本人確認が成立したか | 認証成功だけではresourceを読めない |
| authorization | 主体が対象resourceを読む権限を持つか | server trustや認証成功とは別 |
| output use | 返った出力が回答や判断へ使われたか | 取得成功だけでは利用済みと言えない |

さらに次を分けます。

- `present` / `absent` / `unknown`
- 空の正常応答 / 取得失敗 / call未観測
- server trust / resource authorization
- Agents secrets/variablesの保存scope / consumer / authentication
- Bash processのfirewall scope / MCP・setup経路
- Instructionsの `applyTo` / 管理者によるcontent exclusion
- 外部文章のprovenance / instruction authority

`COPILOT_MCP_` を含む名称があっても値の存在を示しません。値や値hashは取得しません。Bash firewallの対象外であることも、通信成功、安全、認可済みを意味しません。

## 向いていること / 向いていないこと

**向いていること**

- 複数の失敗候補が混在する外部アクセス調査。
- 未観測を残したまま、安全な次の確認と相談先を決める。
- 不要な権限要求や危険な迂回を避ける。
- 空集合、失敗、unknownを区別する。

**向いていないこと**

- 実MCP server登録、OAuth、credential認証。
- credential値や値hashの取得。
- 任意network probe、firewall無効化・迂回。
- content exclusion回避。
- 合成packetを現在のaccountやorganization policyとして扱う。

## ゴール

次の三つのworksheetを埋めます。

- [`diagnostic-policy.md.template`](starter/diagnostic-policy.md.template): 六層、presence、trust、authority、停止ルール
- [`route-map.md.template`](starter/route-map.md.template): 層、scope/owner、安全な次の確認
- [`decisions.md.template`](starter/decisions.md.template): D01〜D07の判断

各taskで、supported conclusion、cited facts、remaining alternatives、missing observation、next safe check、consultation/stopを説明します。

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- Copilot、Cloud、organization設定、実MCPは不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fixtures/packet-set.json.template`](starter/fixtures/packet-set.json.template) | D01〜D07 |
| [`reference/reference-notes.md.template`](starter/reference/reference-notes.md.template) | 公開仕様の要点と境界 |
| [`diagnostic-policy.md.template`](starter/diagnostic-policy.md.template) | 診断方針 |
| [`route-map.md.template`](starter/route-map.md.template) | 六層と責任の対応図 |
| [`decisions.md.template`](starter/decisions.md.template) | task判断表 |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。packetを読む前に、六層の意味、unknownを保持する規則、禁止する観測、相談先を方針へ書きます。

固定task:

| task | 主な状況 |
|---|---|
| D01 | 設定原稿はあるが、discovery/callの記録がない |
| D02 | Bash経路の通信拒否 |
| D03 | MCP/setupはBash firewall対象外、実通信はunknown |
| D04 | credential保存scope、認証失敗、認可拒否が混在 |
| D05 | 外部tool出力に命令口調の文章 |
| D06 | Instructions `applyTo` とcontent exclusion |
| D07 | 空の正常応答、取得失敗、server trust |

## 試してみる

1. `reference-notes.md.template` を読み、六層と各controlの責任境界を確認する。
2. `diagnostic-policy.md.template` に診断順序を書く。常に上から直線実行する必要はない。
3. 危険度、観測費用、担当者、既存Evidenceに応じてsafe next checkを決める。
4. `route-map.md.template` で、各層のfact、missing observation、owner、stop conditionを対応付ける。
5. D01〜D07を順に読み、`decisions.md.template` を埋める。
6. unknownをfalseへ、空応答を認可成功へ、Bash firewall対象外を安全へ変換しない。
7. 外部文章が命令口調でも、source provenanceだけでinstruction authorityを与えない。
8. 値取得、実network probe、設定変更が必要になったら本編を停止する。

## 任意: 比較する

最初に自由な順序でD01〜D07を診断し、その後六層policyを使って再診断します。断定数ではなく、代替仮説、不要な権限要求、危険な迂回、相談先の明確さを比較します。

## 確認ポイント

- 六層を分け、観測済みの層だけから結論を出している。
- `present` / `absent` / `unknown` を保持している。
- authenticationとauthorization、server trustとpermissionを分けている。
- BashとMCP/setup経路のscopeを混同していない。
- `applyTo` とcontent exclusionを別controlとして扱っている。
- credential値や値hashを要求していない。
- 情報不足なら停止・相談できる。

## 発展

- D03またはD07について、最初に確認する層が異なる二つの安全な診断経路を比較する。
- credential presenceの観察は [Credentialの限定観測](optional/credentials.md) を参照する。
- network経路の観察は [Firewall経路の限定観測](optional/firewall.md) を参照する。
- `applyTo` とcontent exclusionの観察は [Content exclusionの限定観測](optional/content-exclusion.md) を参照する。

## 制約・Fallback・安全

- 本編では外部接続、credential操作、firewall変更、content exclusion変更を行わない。
- 権限を広げる、firewallを無効化・迂回する、除外を回避することはfallbackではない。
- 実効policyや対象経路が不明ならunknownのまま相談先を書く。
- テキストだけで完了できる。実環境を使えないことを失敗扱いしない。
- `evidence` は各結論を支える観測・資料を指し、提出物や実行statusを意味しない。
