# Content exclusionを限定観測する

[HC-042本編へ戻る](../README.md)

## 目的

標準code reviewのcontent exclusionとInstructionsの `applyTo` が、異なるownerとsurfaceを持つcontrolであることを限定的に観察します。除外回避や別surfaceへの迂回は行いません。

## 前提

- 対象repository、code review surface、対象pathを特定できる。
- Instructions revisionとcontent exclusionの管理scopeを確認できる。
- 対象機能のrelease state、利用資格、実効policyを確認できる。
- 観察範囲、停止、復元担当が決まっている。

## 権限と安全

- 除外設定を変更しない観察、対象surface/path、ログ範囲について個別の許可を得る。
- 除外回避、別surfaceへの迂回、repository内容の持出しを行わない。
- Instructionsで管理者policyを上書きしようとしない。
- 設定変更が必要になった場合は、別の承認なしに進めない。

## 手順

1. Instructions `applyTo` pattern、対象revision、ownerを記録する。
2. content exclusionの管理scope、対象path、owner、対応surfaceを記録する。
3. 設定を変えず、対象surfaceで確認できる適用範囲だけを観察する。
4. 指示が提供されたか、contentが除外されたか、回答へ使われたかを別々に記録する。
5. 不明なpolicyを推測せず、管理者へ確認する項目を残す。

## 観察すること

- surfaceとrelease state
- Instructions pattern/revision
- content exclusion scope/path
- 各controlのowner
- 指示提供、content利用、除外の観測
- unknownと保留理由

## 停止条件

- 利用資格、実効policy、管理scopeが不明。
- 除外回避または別surfaceへの迂回が必要。
- 対象path、Instructions revision、復元範囲を固定できない。
- 二つのcontrolを一つの成功値へまとめる必要がある。

## 本編へ戻る

結果は [HC-042の確認ポイント](../README.md#確認ポイント) へ戻し、`applyTo` とcontent exclusionの責任境界を保持します。
