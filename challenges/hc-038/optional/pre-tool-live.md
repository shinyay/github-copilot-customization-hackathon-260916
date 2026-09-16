# `preToolUse` Hookを限定観測する

[HC-038本編へ戻る](../README.md)

## 目的

承認済みの専用環境で、無害な一つのtool操作に対する `preToolUse` の呼出しとpermission handlingを観察します。checker結果、fail-open、通常のpermission flow、tool完了を別々に記録します。

## 前提

- 対象repository、default branch、固定checker、Cloud Linux/bashを確認できる。
- 無害でscopeが明確なtool操作を選べる。
- Copilot coding agent、対象tool、必要な実行資源を利用できる。
- 回数、時間、費用、ログ、停止、復元の上限が決まっている。

## 権限と安全

- active Hook、checker、限定tool操作、費用、ログ取得について個別の許可を得る。
- endpointやfirewallを広げず、secretやprompt全文を記録しない。
- 破壊的tool、広い書込権限、allow-allを使わない。
- 既存Hookを上書きせず、自分の変更だけを復元できるようにする。

## 手順

1. checker revision、hash、event設定、対象tool、期待する安全scopeを記録する。
2. allow、deny、必要なら一つのfailure caseを事前に選ぶ。回数上限を超えて試さない。
3. 承認後に実験用Hookを反映し、限定tool操作を一回実行する。
4. 宣言、呼出し、transport、exit/HTTP response、`permissionDecision`、通常flow、tool結果を別々に記録する。
5. timeoutやHTTP failureをcommand denyへ読み替えず、fail-open後のtool結果を別途確認する。
6. 観察後、自分の変更だけを復元する。

## 観察すること

| 層 | 記録 |
|---|---|
| Hook | event、revision、呼出し |
| checker | command/HTTP、exit、response、timeout |
| permission | decisionとreason、通常flowへの復帰 |
| tool | 実行されたか、完了したか、結果 |
| safety | scope、上限、ログ、復元 |

## 停止条件

- checker、default branch、対象tool、permission観測範囲が不明。
- endpoint/firewall変更、秘密、prompt全文log、破壊操作が必要。
- timeoutやHTTP failureを実tool完了として扱う必要がある。
- 個別許可または復元方法がない。

## 本編へ戻る

結果は [HC-038のfailure境界](../README.md#この機能とは) と照合し、denyとfail-openを正しく分けます。
