# HC-007 調査役と検証役のAIチームを設計しよう

**Language:** **日本語** / [English](../../en/challenges/hc-007/README.md)

## Scenario

受注承認の調査を1つのAIに任せ、そのまま自己レビューも頼むと、最初の仮説を正当化したり、未確認事項を見落としたりすることがあります。

このシナリオでは、承認経路を追う **investigator** と、根拠の弱い主張を独立に疑う **reviewer** をCustom Agentとして分けます。investigatorの出力は自動転送せず、人が内容と機密情報を確認してからreviewerへ渡します。最後に進めるか、調べ直すか、止めるかを決めるのも人です。

題材は `OrderAction.perform` の `op=approve` 経路です。web actionのrole check、service側の再確認、versionとstate、self-approval、active reference、credit checkを混同せずに追います。

## この機能とは

Custom Agentは、特定の役割、使えるtool、禁止事項、期待する出力を定義したGitHub Copilotのカスタマイズです。このシナリオでは次の2役を使います。

- **investigator**: sourceからfact、hypothesis、counter-evidence、unknown、verificationを整理する
- **reviewer**: investigatorのpacketにある各claimを `supported / contradicted / not decidable` に分類する

役割名を分けるだけでは独立reviewになりません。同じ会話履歴で役割だけを切り替えたり、reviewerへ渡す前にpacketを修復したりすると、最初の結論へのanchoringを減らせません。fresh conversationと、人が確認した未修正packetを使います。

handoffを扱えるclientでは、Agent定義の `send: false` により候補を表示したまま止め、人が確認してから送れます。handoffがないclientでも、同じ内容を手動で受け渡せます。

## 向いていること / 向いていないこと

**向いていること**

- 調査と反証で評価軸が異なる作業
- sourceに根拠を戻せる複数段階の調査
- handoff前に人の確認が必要な安全重視のworkflow
- 不明点を無理に埋めず、最終判断を人が持つ作業

**向いていないこと**

- 単純な1問1答
- 同じ会話内で役割名だけを変えるself-review
- packetを人に見せず自動転送する処理
- AIへ承認、code change、本番操作を委ねること

## ゴール

- 2つのCustom Agentを作業用リポジトリで有効化する
- 固定packetを変えずに受注承認経路を調査する
- investigatorの未修正packetを人が確認してからreviewerへ渡す
- reviewerが根拠のないclaimと識別力の弱いverificationを指摘する
- 最終判断と残ったunknownを人が記録する

## 用意するもの

- Custom Agentを使えるGitHub Copilot client
- handoffを試す場合はhandoff対応client
- 題材のJava sourceを含む作業用リポジトリ
- このディレクトリの不活性な素材

| 素材 | 用途 |
|---|---|
| [`starter/inputs/fixed-packet.md.template`](starter/inputs/fixed-packet.md.template) | 全ての会話で変えない調査依頼 |
| [`starter/customization/order-investigator.agent.md.template`](starter/customization/order-investigator.agent.md.template) | investigatorの開始点 |
| [`starter/customization/order-reviewer.agent.md.template`](starter/customization/order-reviewer.agent.md.template) | reviewerの開始点 |
| [`OrderAction.java.excerpt.md.template`](starter/reference/OrderAction.java.excerpt.md.template) | web actionのrole checkとservice dispatchのread-only fallback資料 |
| [`OrderService.java.excerpt.md.template`](starter/reference/OrderService.java.excerpt.md.template) | service側のauthorizationと業務条件のread-only fallback資料 |
| [`Actor.java.excerpt.md.template`](starter/reference/Actor.java.excerpt.md.template) | ADMIN bypassとexact role membershipのread-only fallback資料 |
| [`BaseService.java.excerpt.md.template`](starter/reference/BaseService.java.excerpt.md.template) | null actorとservice authorizationのread-only fallback資料 |
| [`starter/worksheets/handoff.md.template`](starter/worksheets/handoff.md.template) | 人の確認と最終判断を残す簡易worksheet |

JDK、database、server起動は不要です。

## 準備

1. 共通の準備は [始め方](../../README.md#始め方) に従い、作業用リポジトリで行います。
2. `fixed-packet.md.template` を読み、質問、対象source、評価するclaimを変更しないことを確認します。
3. 次の2ファイルを作業用リポジトリへコピーし、そこでだけ `.template` を外します。

   | コピー元 | 作業用リポジトリの配置先 |
   |---|---|
   | `starter/customization/order-investigator.agent.md.template` | `.github/agents/order-investigator.agent.md` |
   | `starter/customization/order-reviewer.agent.md.template` | `.github/agents/order-reviewer.agent.md` |

4. `starter/worksheets/handoff.md.template` は、必要なら `notes/hc-007-handoff.md` など自分だけが管理できる場所へコピーします。
5. 固定packetにある4つのsource pathを開けることを確認します。sourceを用意できない場合は `starter/reference/` のexcerptだけを使い、全体を確認できていないことをunknownに残します。
6. investigator用とreviewer用にfresh conversationを作れるようにします。

## 試してみる

1. investigatorのfresh conversationを開き、`fixed-packet.md.template` の全文をそのまま渡します。
2. investigatorのpacketで、次が別々のclaimとして扱われているか確認します。
   - `OrderAction.perform` のMANAGER check
   - `OrderService.approve` の再authorization
   - null actorと `Actor.require` のADMIN bypass / exact role membership
   - lock、expected version、`SUBMITTED` state
   - self-approval restriction
   - active reference validation
   - credit check
3. investigatorの出力を修正せず保存します。`HUMAN HANDOFF REQUIRED` で止まり、handoff対応clientでは候補が未送信のまま表示されることを確認します。
4. 人が次を確認します。
   - 対象外sourceや推測がfactへ混ざっていない
   - 引用やpathがclaimを支えている
   - secret、顧客情報、実注文情報が入っていない
   - unresolvedな点がpacketに残っている
5. 確認結果をhandoff worksheetへ書き、問題がなければ `Confirmed for review: yes` とします。redactionが必要ならreviewを止め、修正版を新しい入力として扱います。
6. reviewerのfresh conversationへ、固定packetと人が確認したinvestigator packetだけを渡します。handoff候補を使う場合も、人の確認後に送ります。
7. reviewerの `ACCEPT / REVISE / INSUFFICIENT ENVIRONMENT` と、各claimの分類を読みます。
8. 人が `proceed / revise / stop` を選び、理由とunknownを記録します。AIの判断だけでcode changeや承認処理へ進みません。

sourceから直接分かるのはcode上の分岐です。特定の注文が承認可能か、databaseのversionやstateが何か、active referenceやcredit checkが通るかは、static readingだけでは決まりません。

## 任意: 比較する

同じ固定packet、source、model、toolsをできるだけそろえ、次の2通りを手動で1回ずつ試します。

1. 一般的なassistantへ「調査してから自分でレビューして」と依頼する
2. investigatorとfresh reviewerへ分け、人がpacketを確認して受け渡す

文章量ではなく、unsupported claim、competing hypothesis、unknownの保持、verificationの識別力、人が止められる判断材料を比べます。入力や環境をそろえられない場合は、優劣を決めません。

## 確認ポイント

- 2役の責任と禁止事項が重複していない
- fixed packetが途中で書き換えられていない
- investigator packetを後から修復していない
- handoff前に人がscope、引用、機密情報を確認した
- reviewerがpacket外のfactを補っていない
- verificationが複数の仮説を区別できる
- sourceだけで決められないruntime factがunknownのまま残っている
- 最終判断を人が行っている

## 発展

investigatorの結論文を外し、evidence table、unknown、verification案だけをreviewerへ渡すvariantを試します。通常のhandoffと比べ、結論へのanchoringが減るか、必要なcontextまで失われるかを観察してください。元のpacketは変更せず、別の試行として扱います。

## 制約・Fallback・安全

- Custom Agentを使えない場合は、2つのtemplate本文をそれぞれfresh conversationの役割promptとして貼ります。Agent discoveryやtool制限を試したことにはなりません。
- handoff機能がない場合は、人が確認したpacketを手動でコピーします。自動転送よりも安全確認を優先します。
- fresh conversationを作れない場合は、独立reviewの効果を主張せず、役割設計の確認だけに留めます。
- full sourceを読めない場合はexcerptで分かる範囲だけを答え、欠けた経路をunknownにします。
- 実注文、database、server、外部接続を調べたり、approvalやcode changeを実行したりしません。
- secret、顧客情報、private logをpacketへ入れません。
- Agent間の自動送信や無人の最終判断は追加しません。
