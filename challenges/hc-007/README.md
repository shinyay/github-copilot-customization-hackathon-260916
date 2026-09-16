# HC-007 調査役と検証役のAIチームを設計しよう

## Challenge Story

1つのAIに調査と自己レビューを同時に頼むと、最初の仮説をそのまま正当化することがあります。そこで、受注承認chainを追う**調査役**と、根拠の弱い主張を独立に疑う**検証役**を分けます。ただし、AI同士を自動で進めるのではなく、handoff packetを人が確認してから次へ渡します。

このChallengeは公開された役割定義と固定packetだけで実施します。隠れた採点用解答や事前教材はありません。

## この機能とは

Custom Agentは、特定の役割、境界、期待する出力を定義したCustomizationです。このChallengeでは2つを使います。

- **investigator** — sourceからfacts、hypotheses、unknowns、verificationをまとめる
- **reviewer** — 確認済みpacketのunsupported claimsや検証不足を指摘する

役割を分けても独立性が自動で保証されるわけではありません。同じ会話履歴、修正済みpacket、追加情報を渡すと条件が崩れます。handoffを人が確認し、何を渡したかをEvidenceにします。

## 向いていること / 向いていないこと

**向いていること**

- 調査と反証で評価軸が異なる作業
- handoff artifactを残せる複数段階workflow
- 最終判断を人が持つ安全な役割分担

**向いていないこと**

- 単純な1問1答
- AIへ最終承認や本番操作を委ねること
- 同じ会話内で役割名だけ変えて独立reviewと主張すること
- packetを人に見せず自動転送すること

## Starter Kit

[Pack manifest](pack/manifest.json) は次を提供します。

- `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`
- `order-investigator.agent.md.template`
- `order-reviewer.agent.md.template`
- `fixed-packet.md.template` — 全条件で使うsymptomと入力
- `handoff.md.template` — human confirmationとreview記録

Java sourceはRuntimeのpinned 515-file baselineにあり、Packは複製しません。Agent templateは `.hackathon/challenge/hc-007/**` へ不活性に配置され、参加者がactive fileを作るまで有効になりません。

公開された調査境界では、web actionのMANAGER check、service側の再check、lock/version、`SUBMITTED` state、`approval.self`、active reference、credit check、`Actor` のADMIN bypassとexact role membershipを別々のclaimとして扱います。特定orderが承認可能かはstatic readingだけでは決めません。

## Open Question

2役に分けることで、どのfailure modeを減らしたいですか。

- 最初の仮説への固執
- `OrderAction`、`OrderService`、`BaseService`、`Actor` に分散したauthorizationの取り落とし
- role、version、`SUBMITTED` state、self-approval、active reference、credit checkの混同
- sourceにないframework behaviorの発明
- verificationが仮説を区別できない
- 不明点を埋めてしまう

対象を1つ選び、BaselineとCustomizedで観測する指標を決めます。

## Design Time

1. `fixed-packet.md` を読み、全条件で変更しないことを確認します。
2. Baselineは1つの一般的なassistantへ「調査し、自分でレビューして」と依頼します。
3. investigatorはreviewやapprovalをしない役割にします。
4. reviewerはpacketにないfactを補わず、`ACCEPT / REVISE / INSUFFICIENT ENVIRONMENT` を返す役割にします。
5. handoff gateを決めます。推奨:
   - investigator出力をそのまま保存
   - 人がscope、引用、secret混入を確認
   - candidateを表示し、送信せず選択した状態を記録（`send: false`）
   - `Confirmed for review: yes` を書く
   - 人の確認後にだけ、そのpacketをfresh reviewer conversationへ送る
6. 最終decisionは人が記録します。

## Build

1. **Hub checkout** の `plan-run.mjs --dry-run` で `baseline` と `agent-team` を個別に確認します。
2. **Runtime checkout** のREADMEに従い、conditionを指定してPackを適用します。Starterは `.hackathon/challenge/hc-007/**` にだけ配置されます。
3. Agentを作る前に、fixed packetを一般assistantへ渡し、single-role Baselineを保存します。
4. Starterから `.github/agents/order-investigator.agent.md` と `.github/agents/order-reviewer.agent.md` を参加者が新規作成し、fresh conversationでfixed packetを渡します。
5. investigatorが `HUMAN HANDOFF REQUIRED` で止まり、`order-reviewer` へのhandoff候補が**未送信**で表示されることを確認します。
6. participantがpacketを読み、修正せず確認結果を `handoff.md` へ書きます。secretがあればreviewへ渡さずredactします。
7. `send: false` の候補をparticipantが確認してから送信し、human-confirmed packetだけをreviewerへ渡します。
8. reviewer結果を受け、participantが `proceed / revise / stop` を決めます。

Agent間の自動message送信や本番操作は追加しません。

## Compare

| 条件 | 役割 | 入力 | review |
|---|---|---|---|
| Baseline | 1つのassistant | fixed packet | 同じ役割へself-reviewを依頼 |
| Customized | investigator + reviewer | 同じfixed packet | human-confirmed handoffをfresh reviewerへ渡す |

比較するのは文章量ではなく、unsupported claim、competing hypothesis、検証の識別力、unknownの保持、人の判断材料です。BaselineへCustomizedより少ないsourceを渡してはいけません。

2役でも改善しなければ `equal`、handoffで事実が失われれば `worse`、packetを同一にできなければ `incomparable`、human gateまで進めなければ `blocked`、Agent機能がなければ `unsupported` と記録します。

## Evidence

`.hackathon/evidence/hc-007/handoff.md` へ次を残します。

- environment
- single-role Baseline
- investigatorの未修正packet
- candidate display、未送信selection、human-confirmed send
- reviewerのaccepted / rejected claims
- verificationが仮説を区別したか
- 新しいunknown
- 最終human decision
- outcome

`improved` の根拠は、たとえばunsupported claimの減少や、誤ったcode changeを人が止められたことです。単に2つの長い回答が得られたことではありません。

## Submit

Runtime PRへ2つのAgent定義、fixed packet、handoff evidenceを含めます。Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
では、human gateの実施、役割間で渡したartifact、最終decision、failure / unknownを要約します。

private情報はpacketから除きます。participant/team名も公開可能な表記だけを使ってください。

## Judging

- 2役の責任と禁止事項が重複せず明確か
- fixed packetを全条件で保ったか
- investigator出力を後から修復せず保存したか
- human-confirmed handoffがEvidenceにあるか
- reviewerがpacket外のfactを発明していないか
- 最終decisionをAIではなく人が行ったか
- self-reviewより悪い点やhandoff lossも報告したか

## Bonus Mission

reviewerへ、investigatorの結論を隠してEvidence tableだけを渡すvariantを追加します。元のhandoffと比べ、結論のanchoringが減るか、必要contextまで失うかを観測してください。条件が増えたため、元比較と混ぜず別表にします。

## Support / Fallback

Custom Agentが利用できない場合は、2つのtemplate本文をそれぞれfresh conversationのsystematic promptとして貼り、human-confirmed packetを手動で受け渡します。Agent discoveryやtool boundaryは評価できないため、同一機能の成功とは主張しません。

複数conversationを作れない場合は `blocked`、Custom Agent非対応なら `unsupported`、同じ履歴しか使えず独立性がない場合は `incomparable` が適切です。詳細は
[Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
