# HC-006 繰り返すJava調査をワンコマンド化しよう

## Challenge Story

同じ注文処理を調査するたびに、「3ファイルを追う」「factと推測を分ける」「最小確認を出す」と説明し直しています。依頼文の一部を忘れると結果の形式も変わり、比較や引き継ぎが難しくなります。繰り返す調査手順をPrompt Fileへまとめ、明示的な1回の呼び出しで再現できるか検証します。

このページが参加者向けの完全な手順です。別のLABや既存回答を参照しません。

## この機能とは

Prompt Fileは、繰り返し使うpromptをrepository内のファイルとして保存し、対応するclientから明示的に呼び出すためのCustomizationです。対象、入力、出力形式、禁止事項を1か所で保守できます。

このChallengeでいう「ワンコマンド」は、Prompt Fileを明示的に選択・呼び出して同じ調査packetを要求することです。OS commandを無制限に実行する意味ではありません。また、Prompt Fileが自動的に正しい調査を保証するわけではありません。

## 向いていること / 向いていないこと

**向いていること**

- 毎週・毎PRで繰り返す同型の調査
- 入力と出力sectionを揃えたい作業
- 人が明示的に開始し、結果を確認するworkflow

**向いていないこと**

- repository全体へ常時適用する短い規則
- 状況ごとに目的が大きく変わる会話
- 自動実行、承認、外部副作用をPromptだけで保証すること
- secretや個人環境pathの保存

## Starter Kit

[Pack manifest](pack/manifest.json) は次を提供します。

- `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`
- `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `order-investigation.prompt.md.template` — 不活性なPrompt File案
- `comparison.md.template` — repeated manualとexplicit invocationの比較表

Java sourceはRuntimeのpinned 515-file baselineにすでに存在し、Packは複製しません。Prompt FileとEvidence templateだけが `.hackathon/challenge/hc-006/**` へ不活性に配置されます。

調査対象の中心は `OrderAction.perform` です。`OrderForm` からoperationと入力を読み、該当branchから `OrderService` のdirect callへ渡します。source外のframework lifecycleや実行時stateは、追加candidateまたはunknownとして分けます。

## Open Question

あなたが「再現性が上がった」と判断するのは何が揃ったときですか。

- 必須sectionの欠落数
- source citationの正確さ
- 競合仮説の数と質
- irrelevantな変更提案
- 調査依頼を組み立てる時間
- 同じ条件を2回繰り返したときのdrift

2回とも同じ文章になる必要はありません。目的に必要な構造とEvidenceが安定するかを見ます。

## Design Time

1. 固定taskを使います。

   > 新しいmaintainer向けに、`OrderAction.perform` が `OrderForm` の入力を読み、`OrderService` のどのoperationへ直接dispatchするかを、指定3ファイルだけで説明してください。entry point、form data、direct service call、追加で確認すべきcandidate、sourceだけでは未検証のruntime behaviorを分けてください。

2. manual requestに必ず含めたい要素を5つ以内にします。
3. Prompt Fileのrequired inputsとrequired output sectionsを設計します。
4. Promptがやってはいけないことを決めます。このStarter Kitでは、依頼されるまでeditしない、存在しないframework behaviorを作らない、が重要です。
5. 時間測定の開始点と終了点を決めます。

## Build

1. **Hub checkout** の `plan-run.mjs --dry-run` で `baseline` と `prompt-file` の計画を確認します。このscriptはRuntime checkoutにはありません。
2. **Runtime checkout** のREADMEに従い、conditionを指定してPackを適用します。Starterは `.hackathon/challenge/hc-006/**` にだけ配置されます。
3. Prompt Fileを作る前に、固定symptomを自分で組み立てたmanual requestで2回調査します。毎回fresh conversationを使います。
4. Starter templateを読み、`.github/prompts/order-investigation.prompt.md` を参加者が新規作成し、自分の評価項目へ合わせて短く編集します。
5. 対応clientでPrompt Fileを**明示的に**呼び出し、同じsymptomを2回調査します。
6. 呼び出し方法、client表示、引数の渡し方をそのまま記録します。Prompt Fileが見つからなければ推測で成功扱いにしません。

## Compare

| 条件 | 回数 | 開始方法 | 固定するもの |
|---|---:|---|---|
| repeated manual | 2 | 毎回requestを手で組み立てる | symptom、source scope、評価表 |
| explicit invocation | 2 | Prompt Fileを明示的に呼ぶ | 同じsymptom、source scope、評価表 |

この比較ではrepeated manualを **Baseline**、explicit invocationを **Customized** と呼びます。

同じ会話で4回続けると前の回答が影響するため、各runをfresh conversationにします。manual側だけ説明を省略したり、Prompt側だけ追加sourceを与えたりしません。

差が小さければ `equal`、Promptが不要な調査を増やせば `worse`、client差で条件を揃えられなければ `incomparable`、実行不能なら `blocked`、機能がなければ `unsupported` が正当です。

## Evidence

`.hackathon/evidence/hc-006/comparison.md` に以下を記録します。

- 4回すべてのexact requestまたはinvocation
- required sectionの有無
- source citation
- competing explanation
- verification proposalまたは実行結果
- irrelevant work
- elapsed time
- run間drift
- client / host / OS / channel、model / effort / tools

`improved` を選ぶ場合も、どの測定値が改善したかを示します。

## Submit

Runtime PRへPrompt File、comparison、再現手順を含めます。Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
には、4runの要約、outcome、Prompt Fileの適用範囲、保守上の注意を記入します。

private Runtimeのsourceやlogをそのまま公開Issueへ転載せず、必要なEvidenceだけをredactして要約します。

## Judging

- repeated workを具体的に分解したか
- Prompt Fileのinputs / outputs / stop conditionが明確か
- explicit invocationを実際に記録したか
- 2回ずつの比較でdriftを見たか
- Promptが調査範囲を過剰に広げないか
- manualより悪い結果や欠落を隠していないか
- 別の注文調査へ再利用できる粒度か

## Bonus Mission

固定symptomだけを別のorder stateへ差し替え、Prompt Fileを編集せずに再利用します。再利用できなかった文言を特定し、「固定すべき手順」と「毎回渡す入力」を分離してください。

## Support / Fallback

Prompt Fileが利用できない場合は、template本文を固定requestへ貼るmanual-equivalentを追加します。これはexplicit invocationの代替Evidenceであり、Prompt discoveryやinvocation UXの評価はできません。その制約を明記して `unsupported` または `incomparable` を選びます。

Java toolchainがない場合もsource traceは可能ですが、実行していないharnessを成功扱いにしません。
[Support and Fallbacks](../../docs/support-and-fallbacks.md) に沿ってblockを報告してください。
