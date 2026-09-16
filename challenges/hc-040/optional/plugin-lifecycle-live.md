# Plugin lifecycleを限定観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-040/optional/plugin-lifecycle-live.md)

[HC-040本編へ戻る](../README.md)

## 目的

信頼済みの固定取得先を使い、Pluginの取得、install、enable、selected version、Skill発見、update、restoreを限定的に観察します。本編のbyte identity計画を実環境で確認する補足です。

## 前提

- 承認済みの取得先と固定ref/versionがある。
- 対応clientまたはCloud surfaceを確認できる。
- 既存Skill/Plugin copyと自分の追加分を識別できる。
- v1/v2 package hashとv1復元元を固定できる。
- install、enable、updateに必要な資格と組織policyを確認できる。

## 権限と安全

- 取得、install、enable、update、restore、Cloud試行、費用について個別の許可を得る。
- 架空marketplace、floating ref、未知版を使わない。
- user設定へ黙って迂回せず、既存copyを一括削除しない。
- 本編のpackageへ追加componentを入れない。

## 手順

1. 取得先、ref/version、package hash、component inventoryを記録する。
2. 既存copy、selected version、復元元を確認する。
3. 承認後にv1をinstall/enableし、発見されたversionとSkillを観察する。
4. v2へupdateし、selected version、Skill hash、発見、callの各観測を分けて記録する。
5. v1へrestoreし、取得元とSkill hashが凍結したv1へ戻ったか確認する。
6. 終了後、自分の追加分だけを承認済み手順で整理する。

## 観察すること

| 層 | 記録 |
|---|---|
| package | source/ref、package hash、component inventory |
| lifecycle | install、enable、update、restore |
| selection | active copy数、selected/fetched version |
| use | discovery、本文投入、call |
| safety | client/Cloud対応、費用、復元 |

形式適合やhash一致だけで、発見やcallを成功扱いしません。

## 停止条件

- 取得先、ref/version、対応surfaceを確認できない。
- 既存copyと自分の追加分を識別できない。
- v1復元元またはhashを固定できない。
- install、enable、update、restoreの個別許可がない。
- 一Skill比較へ追加componentが必要になる。

## 本編へ戻る

観察結果は [HC-040の確認ポイント](../README.md#確認ポイント) へ戻し、planned copyとobserved active copy、manifestとselected versionを混同していないか確認します。
