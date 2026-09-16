# 用途別生成の入口を小さく試す

[HC-005 本編へ戻る](../README.md)

## 目的

選択範囲の review、commit message、pull request description のうち一つについて、
用途別 instruction の保存と生成入口での利用を小さく観察する補足ガイドです。
通常の Chat と用途別生成は別の入口なので、同じものとして扱いません。

参考: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

| 用途 | 設定 key | 固定する入力 |
| --- | --- | --- |
| 選択範囲の review | `github.copilot.chat.reviewSelection.instructions` | 同じ file の同じ選択範囲 |
| commit message 生成 | `github.copilot.chat.commitMessageGeneration.instructions` | 同じ staged diff |
| pull request description 生成 | `github.copilot.chat.pullRequestDescriptionGeneration.instructions` | 同じ差分と pull request の前提 |

値は `text` または `file` を持つ object の配列です。本編は `text` の不活性な草稿だけを扱います。

## 前提

- 対象 VS Code と拡張の版、選んだ生成入口を特定できる
- その入口を利用できる契約・権限を確認できる
- 合成 input だけを持つ、使い捨て可能な workspace を用意できる
- 既存設定と今回の追加分を区別し、元へ戻せる

## 権限・安全

- workspace 所有者から、選んだ設定一つと合成 input だけを扱う承認を得ます。
- 三つの key を同時に有効化しません。
- 既存設定を全文置換せず、元値と今回の追加分を記録します。
- commit、push、pull request 作成、投稿は生成とは別の副作用です。このガイドでは実行しません。
- この教材 repository の
  [`generation-settings.json.template`](../starter/generation-settings.json.template) は不活性なまま保ちます。
- `.vscode/settings.json` が repository 方針で無視される場合、ignore の変更や force-add をしません。

## 手順

1. 三つの用途から一つだけ選ぶか、「追加なし」を選びます。
2. [`generation-settings.json.template`](../starter/generation-settings.json.template) の作業用コピーへ、選んだ key と
   `{"text": "自分で設計した本文"}` だけを残します。
3. instruction なしと instruction ありで共通に使う合成 input を決めます。
   - review: 同じ file と同じ選択範囲
   - commit message: 同じ staged diff。作業用 repository 以外の stage は変更しない
   - pull request description: 公開や投稿を伴わない test 用の同じ差分と前提
4. 承認済みの使い捨て環境で、既存値を上書きしない方法が確認できた場合だけ設定を追加します。
5. fresh context で instruction なしとありを一度ずつ呼び出し、生成 button や command をそのまま記録します。
6. 出力を保存した後、今回の設定だけを取り除き、stage や外部項目を変更していないことを確認します。

通常 Chat に同じ本文を貼る試行は参考にはなりますが、同じ用途別入口へ同じ追加本文が渡ったと
確認できない限り、等価な比較とは呼びません。

## 観察すること

- 選んだ key、保存場所、追加した `text`
- 固定した選択範囲または差分
- 実際に使った生成入口
- client / extension / version と、利用された設定 source の表示
- 出力の構造、事実誤認、不要な長文化
- 保存、発見、本文投入、入口の呼出し、出力、外部投稿の有無
- utility model など、通常 Chat と同じだと確認できない要因

構文が正しいことや見出しがそろったことだけで、内容の正確性や instruction の効果を証明しません。

## 中止条件

- 対象入口、権限、固定 input、元へ戻す方法のいずれかが不明
- 既存設定の上書きや、ignore 規則の変更、force-add が必要
- 既存の stage、pull request、remote item を変更する必要がある
- commit、push、投稿、追加拡張の導入が必要
- instruction なしとありで同じ input を用意できない

中止した場合は、不活性な構文草稿または「追加なし」の理由までで十分です。

## 本編へ戻る

この補足の出力を、S1・S2 の手作業の短文案や本編の設計比較へ混ぜません。
[HC-005 の手順と安全境界へ戻る](../README.md)。
