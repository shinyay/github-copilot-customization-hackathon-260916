# HC-038 Cloud Hookの失敗を正しく分類しよう

## Scenario

Cloud Agentの開始時とtool使用前にcheckerを呼び出す設計を考えます。「Hookが宣言された」「eventで呼ばれた」「checkerが返した」「toolが許可された」は別の観測です。さらに、deny、command error、timeout、HTTP failureを一つの失敗へまとめると、停止すべき場面と通常のpermission flowへ戻る場面を取り違えます。

同じchecker全文とE01〜E12の合成packetを使い、12行の診断表と不活性な `sessionStart` / `preToolUse` 接続案を作ります。実Hookは有効化しません。

## この機能とは

Hookは、定めたeventで外部checkerを呼び出すカスタマイズです。

- `sessionStart`: session開始時の準備確認。成功しても後続toolすべてを保護した証拠にはならない。
- `preToolUse`: tool使用直前の判断。Cloudではローカルの対話承認と同じ動作を仮定しない。

`preToolUse` の代表的な入力は `sessionId`、`timestamp`、`cwd`、`toolName`、`toolArgs` です。出力は `permissionDecision`、deny時は `permissionDecisionReason` を使います。fixtureの `reportedEvent` や `checkerExit` は教材の観測fieldであり、製品fieldではありません。

失敗境界は次のように分けます。

| 状況 | 扱い |
|---|---|
| 明示的なallow | permission判断の候補。tool完了は別観測 |
| 明示的なdeny + reason | deny |
| Cloudの `ask` | 対話待ちではなくdeny |
| command crash / nonzero | stdoutがallow風でもdeny |
| command timeout | 文書化されたfail-open。通常のpermission flowへ戻る |
| HTTP network error / non-2xx / timeout | fail-open。通信やtool完了の成功ではない |
| 空stdout / 不正JSON | 明示的allowと同一視しない |

## 向いていること / 向いていないこと

**向いていること**

- 宣言、呼出し、checker結果、permission、tool結果を分ける。
- commandとHTTPのfailure handlingを区別する。
- checkerが壊れたときの停止担当、再確認、復旧を決める。
- active化前にJSON草稿と安全境界をレビューする。

**向いていないこと**

- 単純な語句照合checkerを完全な防壁と呼ぶ。
- checkerを読んだだけでevent発火を認定する。
- timeoutやHTTP 503をcommand nonzeroと同じdenyにする。
- 本編からdefault branch、firewall、endpoint、secretを変更する。

## ゴール

[`starter/diagnosis-design.md.template`](starter/diagnosis-design.md.template) のE01〜E12を埋め、次を説明できるようにします。

1. declared eventとobserved invocationの違い
2. checker/transport結果とproduct outputの違い
3. `sessionStart` と `preToolUse` の責任分界
4. denyとfail-openの違い
5. 追加操作を止める人、再開を承認する人、必要な追加観測

## 用意するもの

- テキストエディター
- bash原稿とJSONを読める環境
- `starter/` 以下の固定資料
- CloudやHookの利用資格は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`diagnosis-design.md.template`](starter/diagnosis-design.md.template) | 12 packetの診断表 |
| [`fixtures/events.json.template`](starter/fixtures/events.json.template) | E01〜E12 |
| [`tools/checker.sh.template`](starter/tools/checker.sh.template) | 両eventで共通の不活性checker |
| [`reference/hook-contract.md.template`](starter/reference/hook-contract.md.template) | fieldとfailure境界 |
| [`customization/`](starter/customization/) | 不活性なHook JSON例 |

すべて `.template` のまま扱います。

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。最初にchecker、packet、判断規則、設計revisionを固定します。

JSON例は `starter/tools/checker.sh.template` を参照する教材用原稿です。`.github/hooks/` やdefault branchへコピーしません。

## 試してみる

1. `reference/hook-contract.md.template` を読み、product fieldとfixture fieldを分ける。
2. `tools/checker.sh.template` を読み、手動読解で分かることとevent発火について分からないことを書く。
3. E01〜E12を順に確認する。

| packet | 固定状況 |
|---|---|
| E01 | `sessionStart` 宣言、呼出し観測なし |
| E02 | `sessionStart` 呼出し、exit 0 |
| E03 | `sessionStart` 呼出し、nonzero |
| E04 | command exit 0、allow |
| E05 | command exit 0、deny + reason |
| E06 | command exit 0、ask |
| E07 | command exit 1 |
| E08 | command exit 2、stdoutはallow風 |
| E09 | HTTP 503 |
| E10 | command timeout |
| E11 | HTTP timeout |
| E12 | command exit 0、空stdout |

4. 各行へdeclared event、invocation evidence、transport、checker result、product field validity、expected handling、stop/recoveryを書く。
5. `customization/` の二つのJSONを読み、checker bytesを変えずにevent責任だけを比較する。
6. fail-open後に通常判断へ戻せる条件と、人の確認まで停止する条件を分ける。

## 任意: 比較する

最初にcheckerとpacketだけで手動診断し、その後Hook接続案を読んで診断を見直します。追加されたのが「event接続の責任分界」なのか、「checker自体の能力」なのかを分けてください。

## 確認ポイント

- E01〜E12が欠けていない。
- 宣言、呼出し、exit/response、permission、tool完了を別々にしている。
- `permissionDecision` とfixture独自fieldを混同していない。
- `ask`、command nonzero、command timeout、HTTP failure、空stdoutを区別している。
- fail-openをtool成功と呼んでいない。
- active Hookや実Cloud観測を作ったことにしていない。

## 発展

- 不正JSONまたはevent情報欠落のpacketを一つ追加し、必要な観測と停止担当だけを設計する。
- 実環境で確認する場合は、[sessionStartの限定観測](optional/session-start-live.md) または [preToolUseの限定観測](optional/pre-tool-live.md) を参照する。

## 制約・Fallback・安全

- 本編ではHook、checker、endpoint、firewall、secret、default branchを変更しない。
- checker、packet、製品fieldの根拠を固定できない場合は停止する。
- Cloudやbash実行環境がなくても、テキストだけで診断表と復旧設計を完成できる。
- JDK、Javaアプリ、外部endpointは不要。実行していないものを成功扱いしない。
- prompt全文や秘密をログへ残す設計にしない。
