# User 指示の保存元と隔離を確認する

**Language:** **日本語** / [English](../../../en/challenges/hc-005/optional/user-scope.md)

[HC-005 本編へ戻る](../README.md)

## 目的

個人向けに設計した短い instruction を User scope で試す前に、保存元、対象 host、既存設定との分離、
解除方法を確認する補足ガイドです。本編の草稿を作っただけでは、User 指示として保存・発見・再利用された
ことにはなりません。

参考: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## 前提

- 利用する VS Code と Agent Host の版・種類を特定できる
- 使い捨て可能な profile、test workspace、fresh conversation を用意できる
- User 指示を試せる契約・製品設定を本人が確認できる
- 今回の追加分を既存の個人設定から識別できる

現在の資料では User 向けの保存元として `~\.copilot\instructions` や `~\.claude\rules` が説明されています。
対象 host が読む場所は現在の公式資料で確認してください。新しい repository や VS Code profile を作っただけで、
HOME 配下の保存元まで分離されたとは限りません。

## 権限・安全

- 端末と account の所有者から、今回追加する一つの非機密 instruction の保存・確認・解除について承認を得ます。
- 既存の User instructions、Settings Sync、ほかの profile、organization instructions を削除・退避しません。
- secret、個人情報、customer data、実在の業務判断を書きません。
- この教材 repository に active な User instruction を作りません。
- 元の状態や解除方法が分からない場合は、実機試行を始めません。

## 手順

1. 対象 host と、現在の公式資料が示す保存元を確認します。
2. 既存内容を転載せず、今回の追加分を識別できる file 名、短い本文、所有者、削除予定時点を決めます。
3. 本編の合成カードから、業務上の答えを含まない個人の表示上の好みを一つ選びます。
4. 承認済みの使い捨て環境でだけ、その一文を対象の User 保存元へ追加します。既存 file は上書きしません。
5. fresh conversation で、同じ合成 task を二つの workspace から一度ずつ試します。
6. client が参照元を表示する場合はその表示を、送信した request と最初の出力から分けて記録します。
7. 試行後は今回追加した file だけを削除し、既存設定が残っていることを確認します。

## 観察すること

- 保存した source、file 名、本文、追加・削除時点
- client / host / version と、どの source を発見したと表示したか
- 本文が会話へ渡ったと直接確認できる情報
- 二つの workspace で同じ本文が再利用されたか
- 手動で貼った request と、自動的に参照された instruction の違い
- HOME、User、organization、workspace 由来のほかの instruction が混ざった可能性
- 保存、発見、本文投入、出力、解除のうち未確認の段階

回答が似ているだけでは、User instruction の発見や本文投入を断定しません。

## 中止条件

- 対象 host、利用資格、所有者の承認、保存元のいずれかが不明
- 既存設定と今回の追加分を区別できない
- 今回の追加分だけを解除できない
- 既存の User instructions や Settings Sync を一括 reset する必要がある
- workspace 内の file を User scope の代替として扱う必要がある

中止しても HC-005 本編の分類と草稿は完了できます。

## 本編へ戻る

この試行の観察は、合成カードの設計比較とは別に保ちます。HOME の実 path や既存 instruction の本文は
共有せず、安全な要約だけを残してください。
[HC-005 の手順と安全境界へ戻る](../README.md)。
