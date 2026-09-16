# Event triggerを限定観測する

[HC-043本編へ戻る](../README.md)

## 目的

承認済みのprivate/internal repositoryで、一つの限定eventからread-only Cloud Agent sessionが起動するまでを観察します。actor、creator、session visibility、billing、stop/resumeを分けて記録します。

## 前提

- 対象repository、creator、event、headを特定できる。
- Cloud/automation policyと利用資格を確認できる。
- 読取task、出力先、session閲覧範囲を限定できる。
- Actions minutes、AI credits、回数、時間の上限が決まっている。
- 停止依頼と復元の担当者が決まっている。

## 権限と安全

- automation登録、event発火、読取operation、費用、停止、復元について個別の許可を得る。
- non-write actorの受理範囲を広げない。
- label、review投稿、repository更新、commit、pushを追加しない。
- privateな設定に機密情報を入れず、session outputの閲覧範囲を確認する。

## 手順

1. creator、eligible actor、repository visibility、policy、billing ownerを記録する。
2. trigger kind、head identity、read-only operation、output boundary、上限を固定する。
3. 承認後にautomationを登録し、一つのeventだけを発生させる。
4. event受理、session起動、operation利用、output、billingを別々に観察する。
5. duplicate eventまたはnew headが発生した場合は、事前のdedup/staleness ruleに従う。
6. stop requestを出した場合は、将来のtriggerが止まったことを確認してから再開を判断する。
7. 終了後、自分のautomationだけを承認済み手順で整理する。

## 観察すること

- creator、actor、write access
- event ID/kind/head
- accepted/ignored/held
- read/write/session-output効果
- configuration/session visibility
- Actions minutes、AI credits
- stop request、stop confirmation、resume

## 停止条件

- 費用主体、上限、停止責任者が不明。
- repository visibility、creator権限、policy、session visibilityが不明。
- non-write actorの受理拡大やwrite operationが必要。
- duplicate event、新head、停止依頼を識別できない。

## 本編へ戻る

結果は [HC-043の確認ポイント](../README.md#確認ポイント) に戻し、自動化率ではなく権限、visibility、費用、停止責任を評価します。
