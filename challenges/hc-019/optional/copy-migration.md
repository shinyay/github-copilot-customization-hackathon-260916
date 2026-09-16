# 自己所有copyのmigrationを観察する

**Language:** **日本語** / [English](../../../en/challenges/hc-019/optional/copy-migration.md)

## 目的

対応製品のcopy migrationを、自己所有の無害なcopyで観察します。sourceとdestination、metadata、原本保持を分けて確認し、copy成功をapplicationや自動同期と誤認しません。

## 前提

- migrationに対応する製品版と対象host
- 自分が所有する使い捨てcopy
- source、destination、同名collision、metadata、location設定を確認できること
- 原本を保持したまま戻せること

## 権限・安全

- destination作成や設定変更の対象を限定し、事前に承認します。
- `deleteOriginal`、同名上書き、通常profile / home変更は行いません。
- このリポジトリの `starter/**/*.template` はmigration対象にしません。
- private contentや他人のcopyを使いません。

## 手順

1. 現在の製品ドキュメントで、対象形式、source、destination、引き継がれるmetadataを確認します。
2. 自己所有copyの本文、metadata、location、開始前状態を記録します。
3. 原本を保持する設定で、許可されたmigration操作を一度行います。
4. destinationの本文とmetadataをsourceと比較します。
5. listed、enabled、discovery、applicationは別項目として観察し、本文一致から補いません。
6. rollbackが必要なら、原本を残したまま自分が作ったdestinationだけを整理します。

## 観察すること

- 本文とmetadataのどちらが引き継がれたか
- sourceとdestinationが自動同期するかは未確認のままか
- location設定や同名collisionがどう扱われたか
- migration後のdiscovery / applicationに直接情報があるか

## 停止条件

- 原本削除、同名上書き、通常profile / home変更が必須
- source、destination、metadata、rollbackを確認できない
- 自己所有copyを分離できない
- 製品ドキュメントと実画面が一致しない

[メインシナリオの発展へ戻る](../README.md#発展)
