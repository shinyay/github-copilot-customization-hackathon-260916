# HC-044 CopilotのApproveとマージ可能な状態を区別しよう

**言語:** **日本語** / [English](../../en/challenges/hc-044/README.md)

## シナリオ

保守 PR に positive assessment と formal Approve event があるとします。それでも、そのイベントを required approval に数えられる actor か、現在の head を対象としているかは、別途確認が必要です。さらに、必要な票数に達したか、すべての changed files が対象か、上位ポリシーや CI の条件を満たしたかも確認する必要があります。

A01〜A07 の合成 policy snapshot と review event を使い、どの根拠から何を判断でき、どの段階から保留またはエスカレーションが必要かを設計します。実際の Approve、レビュー依頼、ruleset の変更、merge は行いません。

## この機能とは

近い名前の状態を分けます。

| 概念 | 意味 |
|---|---|
| assessment | 変更に対する評価。positive でも正式な一票とは限らない |
| review event | Approve などとして記録された個別のイベント |
| approve permission | Copilot が Approve できる設定 |
| count eligibility | イベントを required approval に算入できる設定と条件 |
| target head | イベントが対象とした commit / head |
| eligible actor | 実効ポリシー上、その actor を数えられるか |
| stale / duplicate | 古い head を対象としたイベント、または重複したイベント |
| all changed files | changed files の集合全体が対象 pattern を満たすか |
| required count | distinct eligible approval の必要数 |
| effective policy | enterprise、organization、リポジトリの実効制約 |
| other merge gates | CI、conversation resolution、deployment など |

個々のイベントを数えられるかという **per-event eligibility** と、distinct count、all-files、required count をまとめた **rollup** を分けます。approval requirement を満たしていても、other merge gates が不明なら、merge 可能とは断定できません。

## 向いていること / 向いていないこと

**向いていること**

- assessment、formal event、票数、mergeability を分ける。
- stale、duplicate、wrong-head を除外する。
- 上位ポリシーが不明な場合は保留する。
- 必要以上に止める負担と、誤って通す危険を整理する。

**向いていないこと**

- positive assessment を一票として扱う。
- 古い head や duplicate のイベントで必要な票数を満たす。
- 一部のファイルが一致するだけで all-files を満たすと判断する。
- approval だけで merge 可能と断定する。
- 成功する状態に合わせるため、設定や ruleset を変更する。

## ゴール

次の3つのワークシートを完成させます。

- [`approval-policy.md.template`](starter/approval-policy.md.template): 確認順序と、根拠に基づいて示せる内容
- [`decision-ledger.md.template`](starter/decision-ledger.md.template): A01〜A07 の per-event / rollup の判断
- [`escalation-plan.md.template`](starter/escalation-plan.md.template): 不足情報、責任者、安全な停止、再試行の上限

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- Copilot code review Approvals や管理権限は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fixtures/policy-snapshot.json.template`](starter/fixtures/policy-snapshot.json.template) | approval の設定、必要数、scope、ポリシー、other gates |
| [`fixtures/review-events.json.template`](starter/fixtures/review-events.json.template) | A01〜A07 の assessment / event |
| [`reference/reference-notes.md.template`](starter/reference/reference-notes.md.template) | 公開仕様の要点 |
| [`approval-policy.md.template`](starter/approval-policy.md.template) | 確認方針 |
| [`decision-ledger.md.template`](starter/decision-ledger.md.template) | 判断表 |
| [`escalation-plan.md.template`](starter/escalation-plan.md.template) | エスカレーション計画 |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。パケットを読む前に、assessment、event、head、actor、パスの対象範囲、count、effective policy、other gates の確認順を固定します。

固定タスク:

| タスク | 状況 |
|---|---|
| A01 | positive assessment のみで、Approve event はない |
| A02 | Approve は可能でイベントもあるが、required approval への算入は無効 |
| A03 | 一票は適格だが、required count は2 |
| A04 | 対象内と対象外の changed files が混在 |
| A05 | 古い head の Approve と duplicate event |
| A06 | organization / enterprise のポリシーが unknown |
| A07 | approval の根拠はあるが、CI などは unknown |

## 試してみる

1. `reference-notes.md.template` を読み、各概念の境界を確認します。
2. `approval-policy.md.template` に、確認順序、各境界で根拠に基づいて示せる内容、停止基準を書きます。
3. A01〜A07 について、review event を1件ずつ評価します。
4. event ID、actor、target head、stale、duplicate、count eligibility を記録します。
5. distinct eligible count を算出する前に重複を除き、current head のイベントだけを扱います。
6. changed files の集合に含まれるすべての要素が pattern の対象か確認します。空のリストと、リスト自体がない状態も分けます。
7. required count と effective policy を確認します。
8. CI などの other gates が unknown なら、approval requirement と mergeability を分けます。
9. 不足している情報を `escalation-plan.md.template` に対応付けます。

## 任意: 比較する

最初に「承認済みか」を一語で判断し、その後、ワークシートを使って per-event と rollup に分解します。止めた件数ではなく、誤った票、all-files の誤判定、上位ポリシーの根拠のない補完、mergeability の過剰な断定、確認の負担を比較します。

## 確認ポイント

- assessment、formal event、count eligibility、mergeability を分けている。
- イベントごとに actor、head、stale、duplicate を確認している。
- per-event eligibility と aggregate rollup を分けている。
- changed files の集合全体を評価している。
- enterprise / organization のポリシーが unknown なら保留している。
- approval の条件がそろっても、other gates が unknown なら merge 可能と断定していない。
- 追加不要、保留、停止も有効な結果にしている。

## 発展

- A03 と A04 を組み合わせ、「票数不足」と「all-files の条件不足」を別々に説明する。
- 実際の Approve と算入を観察する場合は、[Approval の限定観測](optional/approvals.md) を参照する。

## 制約・代替手段・安全

- 本編では、レビュー依頼、Approve、dismissal、設定、ruleset、CI、merge を変更しない。
- パケットの true や positive assessment を、実際のリポジトリの票として扱わない。
- 実効ポリシーが不明なら、リポジトリの設定だけを根拠に補完しない。
- stale / duplicate を再利用することや、ruleset を緩めることは代替手段ではない。
- 実機を利用する資格がなくても、合成パケットとワークシートだけで完了できる。
- `evidence` は個々の主張を支える資料や観測を意味し、提出用の一式ではありません。
