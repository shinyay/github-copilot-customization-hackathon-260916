# ProfileでTool Setを安全に確認する

**Language:** **日本語** / [English](../../../en/challenges/hc-012/optional/profile-tool-sets.md)

このガイドは[HC-012本編](../README.md)の任意の発展です。本編はProfileを変更せず完了できます。

## 目的

不活性なTool Set原稿を、専用Profileで発見・選択・解除できるか確認します。宣言したメンバー、UIで選んだメンバー、有効なtools、実際のcallを別々に観察します。

## 前提

- Tool Setsに対応するVS CodeとCopilotを利用できる
- `Chat: Configure Tool Sets` と固定四参照を本人が確認できる
- 既存設定と分離できる専用Profileを用意できる
- 組織ポリシーと環境所有者がProfile設定の追加を許可している

## 権限と安全

- Tool Setは権限を追加せず、元toolの承認や利用資格を変更しません。
- `starter\customization\reader.toolsets.jsonc.template` は不活性な原稿です。このrepository内でsuffixを外しません。
- 既定Profile、同期設定、既存Tool Setを削除・上書きしません。
- 実path、アカウント名、認証値、生の業務データを共有記録へ残しません。

## 手順

1. 本編で固定四参照と集合原稿を確認する。
2. 専用Profileへ切り替え、`Chat: Configure Tool Sets` から新しいTool Sets fileを作成する。
3. UIが開いた場所がcurrent Profileのprompts folderで、ファイルsuffixが `.toolsets.jsonc` であることを確認する。`.vscode` や推測したHOME pathへ手作業で置かない。
4. starter sampleの内容を、新しく作成したファイルへコピーする。固定四参照以外を追加しない。
5. editorの補完と診断を確認し、pickerで集合を展開して四参照を照合する。
6. 集合を選択し、他の選択経路から余分なtoolが有効になっていないか、製品が表示できる範囲で確認する。
7. 所有者が許可したread-onlyの固定依頼を一度だけ実行する。実際に呼ばれたtool、入力、返却、承認を記録し、全メンバーのcallを強制しない。
8. 今回作成した集合の選択を解除し、今回作成したファイルだけを削除する。元の選択状態を確認する。

## 観察すること

- 原稿に宣言した四参照
- pickerで展開・選択した四参照
- 他の選択経路を含む有効なtools
- Agentが実際に呼んだtools
- 初回作成と再設定で迷った箇所
- 集合を使わない方が明確な場面

原稿が保存できたことだけで、発見・選択・callまで成功したとは判断しません。

## 停止条件

- 対応UI、固定四参照、利用資格、所有者承認のいずれかを確認できない
- current Profileの保存先や既存設定との分離を確認できない
- 固定四参照とpickerのメンバーが一致しない
- 追加tool、権限変更、既存設定の削除が必要になる
- 今回追加した集合だけを安全に解除できない

停止した場合は、本編の不活性原稿と紙上の再構成へ戻ります。

[HC-012本編へ戻る](../README.md)
