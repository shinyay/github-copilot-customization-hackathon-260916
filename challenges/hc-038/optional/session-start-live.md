# `sessionStart` Hookを限定観測する

[HC-038本編へ戻る](../README.md)

## 目的

承認済みの専用環境で、`sessionStart` の宣言、実際の呼出し、checker exit、取得したログの範囲を分けて観察します。後続toolのpermission enforcementを検証する手順ではありません。

## 前提

- 対象repositoryとdefault branchを確認できる。
- Cloud Linux/bashで実行できる固定checkerがある。
- Copilot coding agentと必要な実行資源を利用できる。
- ログ範囲、費用上限、停止担当、復元方法が決まっている。

## 権限と安全

- active Hookとcheckerの保存、session開始、費用発生について個別の許可を得る。
- 既存Hookを上書きせず、自分の変更だけを識別できるようにする。
- secret、prompt全文、顧客データをログへ残さない。
- 本編の `.template` をそのままactive pathへ移さない。内容をレビューした別の実験用コピーを使う。

## 手順

1. checker revision、hash、実行command、timeout、対象branchを記録する。
2. 既存Hookと競合しない実験用設定をレビューする。
3. 承認後に設定を反映し、一回だけCloud sessionを開始する。
4. Hook宣言、呼出し記録、checker exit、stdout/stderr、session開始結果を別項目で記録する。
5. `sessionStart` の成功から後続toolのpermissionを推定しない。
6. 観察後、自分の変更だけを承認済み手順で復元する。

## 観察すること

- 宣言したeventと対象revision
- checkerの同一性
- 呼出しの有無
- exit、出力、timeout
- ログに含めなかった機密情報
- 復元結果

## 停止条件

- default branch、checker版、実行環境、ログ範囲が不明。
- 設定変更、session開始、費用、復元の許可がない。
- 既存Hookを安全に分離できない。
- `sessionStart` 成功を後続toolの保護証明として扱う必要がある。

## 本編へ戻る

結果は [HC-038の確認ポイント](../README.md#確認ポイント) に照らし、宣言・呼出し・checker結果を混同していないか確認します。
