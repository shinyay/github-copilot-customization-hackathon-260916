# Memory reuseを限定観測する

[HC-041本編へ戻る](../README.md)

## 目的

専用repositoryで、自分が追加した識別可能なrepository factについて、保存候補、eligible、Cloudでの利用、standard reviewでの利用、残留を限定的に観察します。全Memory削除や「空の対照」を作る手順ではありません。

## 前提

- 対象account、専用repository、current branchを特定できる。
- GitHub Copilot Memory、Cloud、標準reviewの利用資格を確認できる。
- user単位設定の影響範囲を理解している。
- 自分の追加記録と既存記録を区別できる。
- Cloudとreviewを独立して観察する計画がある。

## 権限と安全

- Memory設定、限定記録、Cloud/review試行、終了時の整理について個別の許可を得る。
- 実秘密、個人情報、private内容をfactへ入れない。
- 全Memory削除、識別不能な記録の削除、他製品のMemory操作を行わない。
- 新sessionや設定解除を削除・空状態の証拠にしない。

## 手順

1. 対象repository/branch、fact本文、citation path/revision、識別子を記録する。
2. current citationがfactを支持することと、対象surfaceでeligibleであることを別々に確認する。
3. 承認後に限定記録を作り、保存を示す直接Evidenceの有無を記録する。
4. Cloudで一回、standard reviewで一回、同じrepository factが使われた直接Evidenceを独立して確認する。
5. response本文の自己申告だけでusedと判断しない。
6. 残留、retention、整理の各観測を分け、自分の追加分だけを承認済み手順で扱う。

## 観察すること

- repository、branch、fact、citation
- 設定scopeと保存を示すEvidence
- Cloud/reviewそれぞれのeligibleとused
- current source support
- 残留、retention、整理
- unknownと確認不能の理由

## 停止条件

- 自分の追加記録を識別できない。
- user全体への設定影響を確認できない。
- Cloudとreviewを独立して観察できない。
- 既存Memoryの全削除や識別不能な記録の削除が必要。
- 別製品のMemory操作を同じ検証へ混ぜる必要がある。

## 本編へ戻る

観察結果は [HC-041の確認ポイント](../README.md#確認ポイント) へ戻し、supported、eligible、used、stored、retained、deletedを分けて記録します。
