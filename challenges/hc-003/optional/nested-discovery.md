# 入れ子の AGENTS.md を別環境で探索する

[HC-003 本編へ戻る](../README.md)

## 目的

root と subdirectory に置いた `AGENTS.md` が、利用中の client でどのように発見・参照されるかを、本編とは別の安全な環境で観察します。

nested AGENTS は Experimental な機能です。対応状況や挙動は client/version によって変わり得ます。path が表示されたこと、本文が利用されたこと、回答へ影響したことを同じものとして扱いません。また、親と子の厳密な継承順や「常に子が優先される」という規則を仮定しません。

参考: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## 前提

- 本編の比較を終えているか、本編とは完全に分けて記録できる
- 破棄または元に戻せる、自分が管理する repository/worktree を用意できる
- 利用中の VS Code と GitHub Copilot が nested AGENTS を扱えるか確認できる
- `chat.useNestedAgentsMdFiles` が現在の client に存在する場合、その意味と現在値を公式説明または settings UI で確認できる
- 新しい会話を file ごとに用意できる

## 権限と安全

- Experimental 機能を有効にする必要がある場合は、環境所有者の許可を得ます。
- 既存の `AGENTS.md`、User/organization settings、Memory を変更・削除しません。
- 本編の worktree や結果を使い回さず、使い捨て環境だけで試します。
- secret、private data、実在する利用者や受注を prompt へ入れません。
- trust や policy を迂回せず、許可されない設定変更は行いません。

## 手順

1. 使い捨て repository の root と、調べる subdirectory を一つ選びます。
2. 現在の client/version、workspace root、nested 機能の対応状況と設定値を記録します。設定を変更する場合は、許可と元の値も記録します。
3. root と subdirectory に、内容を区別できる短い `AGENTS.md` を新規作成します。既存 file がある場合は上書きせず中止します。業務の答えではなく、出力形式など無害な観察用規則を使います。
4. subdirectory 内の file と、その外の file を一つずつ対象にし、同じ短い読み取り依頼を別々の新しい会話で送ります。
5. client が示す参照元、明示添付の有無、回答を記録します。明示添付した試行は自動発見の観察と分けます。
6. 作成した file と変更した設定を一覧で確認し、自分が追加したものだけを元に戻します。

## 観察すること

- root/subdirectory の各 file を保存した場所
- client が表示した発見または参照元
- 本文が利用されたと確認できる UI 上の情報
- 対象 file により回答が変わったか
- 親子の指示が矛盾した場合ではなく、矛盾しない指示でも過剰適用や対象漏れが起きたか
- 表示がない、または本文利用を確認できない箇所

回答に観察用の言葉が現れただけで、自動発見や投入を確定しません。

## 停止条件

- client の対応状況、環境所有者の許可、元へ戻す方法のいずれかが不明
- 既存 file や共有 settings を変更しないと試せない
- 本編と同じ workspace または会話を使わないと進められない
- trust や organization policy の回避が必要
- どの指示が使われたか分離できず、追加試行しても安全に観測できない

停止した場合は「未確認」として終え、本編の root 比較へ結果を加算しません。

[HC-003 本編へ戻る](../README.md)
