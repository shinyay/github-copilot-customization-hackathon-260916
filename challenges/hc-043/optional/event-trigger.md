# Event trigger を限定的に観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-043/optional/event-trigger.md)

[HC-043本編へ戻る](../README.md)

## 目的

承認済みの private / internal リポジトリで、1つの限定されたイベントから read-only の Cloud Agent セッションが起動するまでを観察します。actor、creator、session visibility、billing、stop/resume を分けて記録します。

## 前提

- 対象のリポジトリ、creator、イベント、head を特定できる。
- Cloud / automation のポリシーと利用資格を確認できる。
- 読み取りタスク、出力先、セッションの閲覧範囲を限定できる。
- Actions minutes、AI credits、回数、時間の上限が決まっている。
- 停止依頼と復元の担当者が決まっている。

## 権限と安全

- automation の登録、イベントの発火、読み取り operation、費用、停止、復元について、個別の許可を得る。
- non-write actor の受理範囲を広げない。
- ラベルの更新、review の投稿、リポジトリの更新、commit、push を追加しない。
- private の設定に機密情報を入れず、セッション出力の閲覧範囲を確認する。

## 手順

1. creator、eligible actor、repository visibility、ポリシー、費用負担者を記録します。
2. trigger kind、head identity、read-only operation、出力範囲、上限を固定します。
3. 承認後に automation を登録し、1つのイベントだけを発生させます。
4. イベントの受理、セッションの起動、operation の利用、出力、billing を別々に観察します。
5. 重複イベントまたは新しい head が発生した場合は、事前に定めた重複排除と古さの判定規則に従います。
6. 停止を依頼した場合は、今後の trigger が停止したことを確認してから再開を判断します。
7. 終了後、自分の automation だけを承認済みの手順で整理します。

## 観察すること

- creator、actor、write access
- event ID / kind / head
- accepted / ignored / held
- 読み取り / 書き込み / セッション出力の効果
- configuration / session visibility
- Actions minutes、AI credits
- 停止依頼、停止の確認、再開

## 停止条件

- 費用負担者、上限、停止の責任者が不明。
- repository visibility、creator の権限、ポリシー、session visibility が不明。
- non-write actor の受理範囲の拡大や、書き込み operation が必要。
- 重複イベント、新しい head、停止依頼を識別できない。

## 本編へ戻る

結果を [HC-043の確認ポイント](../README.md#確認ポイント) に対応付け、自動化率ではなく、権限、visibility、費用、停止責任を評価します。
