# Organization Instructionsを限定観測する

[HC-039本編へ戻る](../README.md)

## 目的

承認済みのorganizationで、organization Instructionsの保存、対象surfaceへの提供、repository Instructionsとの関係を限定的に観察します。文章が常にそのまま守られることや、組織policyとして強制されることを証明する手順ではありません。

## 前提

- 対象organization、repository、surfaceを特定できる。
- 現在のorganization/repository Instructions本文とrevisionを確認できる。
- organization owner権限と対象surfaceの利用資格がある。
- 他利用者への影響、観察範囲、停止、復元担当が決まっている。

## 権限と安全

- 保存・変更、限定観察、他利用者への影響について個別の許可を得る。
- 実ownerを推測せず、rulesetやprofile操作へ範囲を広げない。
- 既存本文を上書きする前に復元可能なsnapshotを保持する。
- 自分の変更だけを識別できない場合は操作しない。

## 手順

1. 対象surface、現行本文、repository Instructions、revision、owner、復元方法を記録する。
2. 最小の無害な指示変更案をレビューし、重複や優先関係を確認する。
3. 承認後に一度だけ変更し、対応surfaceで提供された指示と応答を観察する。
4. 保存成功、指示提供、応答への反映を別々に記録する。
5. 他利用者への影響がないか確認し、承認済み手順で元へ戻す。

## 観察すること

- organizationとrepositoryの各Instructions本文/revision
- 対応surface
- 保存操作の結果
- 提供された指示の範囲
- 応答で確認できたこと、確認できなかったこと
- 他利用者への影響と復元結果

## 停止条件

- owner、対象surface、現行本文、revision、復元範囲が不明。
- 他利用者へ影響する操作の承認がない。
- repository Instructionsとの重複・優先関係を確認できない。
- 自分の変更だけを安全に復元できない。

## 本編へ戻る

観察結果は [HC-039の確認ポイント](../README.md#確認ポイント) に戻し、保存、提供、応答、owner責任を混同していないか確認します。
