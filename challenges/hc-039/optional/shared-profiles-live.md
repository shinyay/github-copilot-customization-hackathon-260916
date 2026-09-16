# 共有profileを限定観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-039/optional/shared-profiles-live.md)

[HC-039本編へ戻る](../README.md)

## 目的

承認済みのorganizationまたはenterpriseで、共有profileの保存、発見、同名profileの選択、利用範囲を限定的に観察します。保存repositoryのACLとprofileを利用できる人の範囲を別々に確認します。

## 前提

- 対象scope、governance repository、固定branch/refを確認できる。
- profile名、owner、reviewer、保存ACL、利用scopeを確認できる。
- 共有profile機能のrelease stateと利用資格を確認できる。
- 他利用者への影響、停止、復元担当が決まっている。

## 権限と安全

- profileの保存・更新、限定利用、他利用者への影響について個別の許可を得る。
- 実人名や未知ownerを補わず、追加toolsや権限をprofileへ混ぜない。
- 同名profileがある場合は、選択規則と各revisionを先に確認する。
- 既存profileを削除せず、自分の追加分だけを識別して復元する。

## 手順

1. repository、organization、enterpriseに同名profileがないか確認する。
2. 保存path、branch/ref、content hash、owner、reviewer、ACL、利用scopeを記録する。
3. 承認後に不活性sampleを基に最小profileを保存する。
4. 対応surfaceで発見されたprofile名、selected scope/revision、利用結果を観察する。
5. 保存、発見、選択、本文利用を別々に記録する。
6. 観察後、自分の追加分だけを復元する。

## 観察すること

| 項目 | 記録 |
|---|---|
| storage | repository/path、branch/ref、ACL |
| governance | owner、author、reviewer、hash |
| selection | 同名profile、selected scope/revision |
| use | 利用資格、対応surface、発見、実利用 |
| cleanup | 他利用者影響、復元 |

## 停止条件

- governance repository、selected revision、owner、利用資格が不明。
- 保存ACLと利用scopeを同じ値として扱う必要がある。
- 同名profileの選択結果を確認できない。
- 自分の追加分だけを復元できない。

## 本編へ戻る

観察結果は [HC-039の仕組みの境界](../README.md#この機能とは) と照合し、Instructionsの優先規則をprofile選択へ流用していないか確認します。
