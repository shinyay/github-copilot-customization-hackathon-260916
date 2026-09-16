# terminal sandbox を評価する探索ガイド

## 目的

[HC-018 の本編](../README.md)とは別に、Preview の terminal sandbox を限定的に評価できる条件を整理する補足ガイドです。本編の合成 packet や `node --version` の正常出力を、実 sandbox の観察として扱いません。

## 前提

- 対応する client と Preview 機能を公式資料で確認できる
- 実行 host が macOS、Linux、または対応が明記された WSL2 である
- 分離した workspace と、自分が所有する dummy path を用意できる
- 開始前状態と復元方法を確認できる
- 追加の依存導入なしで、限定操作を行える

Windows native しか使えない場合は、対応を推測せず文書確認までにします。

## 権限と安全

- sandbox の有効化、通常承認、dummy path への限定操作、復元は事前に許可を得ます。
- elevation、保護解除、home directory、network、既存 approval rules の reset は対象にしません。
- この repository に active な設定や probe program を追加しません。
- 自分が所有する dummy path 以外へ書き込みません。

## 手順

1. client の公式資料で、対応 OS、対象 tool、制限事項、設定場所を確認します。
2. 分離 workspace と owned dummy path を決め、開始前状態を記録します。
3. 操作内容、cwd、変更範囲、期待する OS result と program result を事前にレビューします。
4. 許可が揃う場合だけ、公式 UI で sandbox を有効化し、通常承認を経て限定操作を一度行います。
5. proposal、approval、execution、OS result、program result を別々に記録します。
6. 自分の変更と設定だけを元へ戻し、開始前状態と比較します。

## 観察すること

- client、host OS、対象 terminal tool
- sandbox 設定の見える範囲
- proposal と人の判断
- execution が始まったか
- OS と program がそれぞれ返した結果
- dummy path の変更と復元
- 確認できなかった境界

正常実行は拒否境界の証明ではなく、一つの拒否はすべての filesystem、tool、network を保護する証明ではありません。

## 停止条件

- Windows native、未対応 OS、未確認 Preview しか使えない
- 依存導入、elevation、保護解除、home / network 操作が必要
- owned dummy path と復元方法を確認できない
- User / Profile 設定への追跡不能な変更が必要
- approval を迂回または reset しなければ観察できない

[HC-018 の本編へ戻る](../README.md)
