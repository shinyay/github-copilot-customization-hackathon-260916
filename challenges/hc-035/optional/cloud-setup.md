# Cloud Agent setup を観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-035/optional/cloud-setup.md)

[← HC-035 のメインシナリオ](../README.md)

## 目的

承認済みの専用 repository と Ubuntu runner で、Cloud Agent setup の保存、採用、各 step、失敗後の agent start を限定的に観測します。

## 前提

- Cloud Agent、GitHub Actions、対象 repository、runner を利用できる
- default branch と setup file の revision を特定できる
- JDK 8、Maven 3.9 系、network 要件を確認できる
- runner/Actions/model の費用上限を決められる

## 権限と安全

- active workflow 保存、検査 trigger、runner 利用、Cloud task、終了時の解除について事前承認を得ます。
- secret 値を読み、表示、移動、要求しません。
- firewall、TLS、proxy、共有 runner 設定を緩和しません。

## 手順

1. setup file の revision、job、steps、permissions、runner、timeout を記録します。
2. workflow syntax と version check の設計を確認します。
3. 承認された最小の検査で setup の採用と各 step を観測します。
4. required step が失敗した場合は、残り skip、残状態、agent start を分けて記録します。
5. test を実行した場合だけ command と結果を記録します。
6. 実験後は自分が追加した workflow だけを解除します。

## 観測すること

- default branch 上の setup revision
- JDK/Maven の実際の版と range 適合
- dependency preparation と tests の差
- failed step、skip、agent start
- workflow 検査と Cloud Agent 採用の違い

## 停止条件

- 資格、承認、Ubuntu runner、default branch/ref、setup bytes のいずれかが不明
- Actions/runner/model の費用上限がない
- secret や network policy の緩和が必要
- setup failure 後の agent start を success と扱う必要がある

[← HC-035 のメインシナリオへ戻る](../README.md)
