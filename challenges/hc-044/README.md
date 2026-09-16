# HC-044 CopilotのApproveとmerge可能を区別しよう

**Language:** **日本語** / [English](../../en/challenges/hc-044/README.md)

## Scenario

保守PRにpositive assessmentとformal Approve eventがあります。それでも、そのeventをrequired approvalへ数えられるactorか、現在head向けか、必要票数へ届いたか、全changed filesが対象か、上位policyやCIが満たされたかは別に確認する必要があります。

A01〜A07の合成policy snapshotとreview eventを使い、どのEvidenceから何を言え、どこから先は保留・エスカレーションかを設計します。実Approve、review request、ruleset変更、mergeは行いません。

## この機能とは

近い名前の状態を分けます。

| 概念 | 意味 |
|---|---|
| assessment | 変更への評価。positiveでも正式な一票とは限らない |
| review event | Approve等として記録された個別event |
| approve permission | CopilotがApproveできる設定 |
| count eligibility | eventをrequired approvalへ算入できる設定・条件 |
| target head | eventが対象にしたcommit/head |
| eligible actor | 実効policy上、そのactorを数えられるか |
| stale / duplicate | 旧headまたは重複したevent |
| all changed files | changed file集合全体が対象patternを満たすか |
| required count | distinct eligible approvalの必要数 |
| effective policy | enterprise、organization、repositoryの実効制約 |
| other merge gates | CI、conversation resolution、deployment等 |

個々のeventを数えられるかという**per-event eligibility**と、distinct count、all-files、required countという**rollup**を分けます。approval requirementが満たされても、other merge gatesが不明ならmerge可能とは断定できません。

## 向いていること / 向いていないこと

**向いていること**

- assessment、formal event、票数、mergeabilityを分ける。
- stale、duplicate、wrong-headを除外する。
- 上位policy不明を保留する。
- 過度に止める負担と誤って通す危険を整理する。

**向いていないこと**

- positive assessmentを一票へ変換する。
- 旧headやduplicateで必要票数を埋める。
- 一部fileの一致だけでall-filesを満たすとする。
- approvalだけでmerge可能と断定する。
- 成功形へ合わせるため設定やrulesetを変更する。

## ゴール

次の三つのworksheetを完成させます。

- [`approval-policy.md.template`](starter/approval-policy.md.template): 確認順序と許可できる主張
- [`decision-ledger.md.template`](starter/decision-ledger.md.template): A01〜A07のper-event/rollup判断
- [`escalation-plan.md.template`](starter/escalation-plan.md.template): 不足情報、owner、safe stop、retry limit

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- Copilot code review Approvalsや管理権限は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fixtures/policy-snapshot.json.template`](starter/fixtures/policy-snapshot.json.template) | approval設定、必要数、scope、policy、other gates |
| [`fixtures/review-events.json.template`](starter/fixtures/review-events.json.template) | A01〜A07のassessment/event |
| [`reference/reference-notes.md.template`](starter/reference/reference-notes.md.template) | 公開仕様の要点 |
| [`approval-policy.md.template`](starter/approval-policy.md.template) | 確認方針 |
| [`decision-ledger.md.template`](starter/decision-ledger.md.template) | 判断表 |
| [`escalation-plan.md.template`](starter/escalation-plan.md.template) | エスカレーション計画 |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。packetを読む前に、assessment、event、head、actor、path coverage、count、effective policy、other gatesの確認順を固定します。

固定task:

| task | 状況 |
|---|---|
| A01 | positive assessmentのみ、Approve eventなし |
| A02 | Approve可能、eventあり、required approvalへの算入は無効 |
| A03 | 一票は適格だがrequired countは2 |
| A04 | 対象内/対象外のchanged fileが混在 |
| A05 | 旧headのApproveとduplicate event |
| A06 | organization/enterprise policyがunknown |
| A07 | approval EvidenceはあるがCI等がunknown |

## 試してみる

1. `reference-notes.md.template` を読み、各概念の境界を確認する。
2. `approval-policy.md.template` に確認順、各境界で許可する主張、停止基準を書く。
3. A01〜A07について、review eventを一件ずつ評価する。
4. event ID、actor、target head、stale、duplicate、count eligibilityを記録する。
5. distinct eligible countを出す前に重複を除き、current headだけを扱う。
6. changed file集合の全要素がpattern対象か確認する。空listとmissing listも分ける。
7. required countとeffective policyを確認する。
8. CI等のother gatesがunknownなら、approval requirementとmergeabilityを分ける。
9. 不足情報を `escalation-plan.md.template` へ対応付ける。

## 任意: 比較する

最初に「承認済みか」を一語で判断し、その後worksheetでper-eventとrollupへ分解します。止めた件数ではなく、誤った票、all-files誤判定、上位policyの補完、mergeabilityの過剰断定、確認負担を比較します。

## 確認ポイント

- assessment、formal event、count eligibility、mergeabilityを分けている。
- eventごとにactor、head、stale、duplicateを確認している。
- per-event eligibilityとaggregate rollupを分けている。
- changed file集合全体を評価している。
- enterprise/organization policyがunknownなら保留している。
- approval条件が揃ってもother gatesがunknownならmerge可能と断定していない。
- 追加不要、保留、停止も有効な結果にしている。

## 発展

- A03とA04を組み合わせ、「票数不足」と「all-files不足」を別々に説明する。
- 実Approveと算入を観察する場合は [Approvalの限定観測](optional/approvals.md) を参照する。

## 制約・Fallback・安全

- 本編ではreview request、Approve、dismissal、設定、ruleset、CI、mergeを変更しない。
- packetのtrueやpositive assessmentを実repositoryの票へ変換しない。
- 実効policyが不明ならrepository設定だけから補完しない。
- stale/duplicateを再利用したり、rulesetを緩めたりすることはfallbackではない。
- 実機資格がなくても、合成packetとworksheetだけで完了できる。
- `evidence` は個々の主張を支える資料・観測を意味し、提出bundleではありません。
