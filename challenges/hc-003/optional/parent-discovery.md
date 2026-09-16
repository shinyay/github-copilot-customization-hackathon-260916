# 親 repository からの customization 発見を探索する

**Language:** **日本語** / [English](../../../en/challenges/hc-003/optional/parent-discovery.md)

[HC-003 本編へ戻る](../README.md)

## 目的

repository の subdirectory だけを workspace として開いたとき、親 repository の customization を利用中の client がどのように発見するかを、本編とは別の安全な環境で観察します。

`chat.useCustomizationsInParentRepositories` は、対応する VS Code で親 repository からの発見を扱う設定です。既定値や前提は version によって公式説明を確認してください。設定名を知っていることは、未知の親 repository を信頼したり機能を有効化したりする許可ではありません。

参考:

- [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [Monorepo customization discovery](https://code.visualstudio.com/docs/agent-customization/overview#_use-customizations-in-a-monorepo)

## 前提

- 自分が管理する、破棄または元に戻せる親 repository を用意できる
- 親 repository と、workspace として開く subdirectory の境界を説明できる
- 現在の client/version で親 repository 発見の対応状況と設定を確認できる
- workspace、親 repository、対象 source の違いを本編とは別に記録できる
- 新しい会話を用意できる

`.git` の形や workspace 境界が公式説明の前提と異なる場合は、同じ挙動だと一般化せず停止します。

## 権限と安全

- 親 repository を trust してよいかは、その所有者が判断します。
- 内容を理解していない親 `AGENTS.md` や他の customization を読み込ませません。
- 既存の親 file、home/User/organization settings、Memory を変更・削除・退避しません。
- 他人の repository へ書き込まず、trust や policy を迂回しません。
- secret、private data、local の個人情報を記録へ含めません。

## 手順

1. 自分が管理する使い捨て親 repository と、その中で workspace として開く subdirectory を用意します。
2. 親 repository、subdirectory、`.git` の位置、workspace root を図または短いメモで区別します。
3. 現在の client/version、親 repository 発見の対応状況、設定値を記録します。設定変更が必要なら、所有者の許可と元の値を確認します。
4. 親 repository に、出力形式など無害な観察用規則だけを含む短い `AGENTS.md` を新規作成します。既存 file がある場合は上書きせず中止します。
5. subdirectory だけを workspace として開き、新しい会話で短い読み取り依頼を送ります。
6. 親 file の保存、client 上の発見、本文利用を示す情報、回答を分けて記録します。明示添付した試行は親からの自動発見と分けます。
7. workspace を repository root で開いた場合との比較が必要なら、入力条件が変わることを明記して別の新しい会話で行います。
8. 自分が作成した file と変更した設定だけを元に戻します。

## 観察すること

- 親 repository と開いた workspace の境界
- client が親の参照元を表示したか
- 親本文が利用されたと確認できる範囲
- workspace の開き方による source や参照可能範囲の差
- root へ手動配置した場合や明示添付した場合との違い
- trust、権限、設定について未確認の箇所

回答が観察用の形式になったことだけで、親からの自動発見を確定しません。

## 停止条件

- 親 repository の所有者、信頼性、workspace 境界のいずれかが不明
- 既存の親 file や共有 settings を変更しないと試せない
- client の対応状況や、変更した設定を元へ戻す方法が分からない
- trust や organization policy の回避が必要
- 本編と入力条件を分離できない

停止した場合は「未確認」として終え、親を利用できないことを本編の root `AGENTS.md` の失敗とは扱いません。

[HC-003 本編へ戻る](../README.md)
