# Code review で Instructions scope を観測する

[← HC-031 のメインシナリオ](../README.md)

## 目的

標準の Copilot code review で、Java、XML、mixed diff に対する Instructions の供給範囲を限定的に観測します。

## 前提

- Copilot code review と対象 repository を利用できる
- 対象 PR/head、Java/XML/mixed の diff を特定できる
- Instructions 原稿の revision と raw bytes を保存できる
- attribution の表示範囲を確認できる

## 権限と安全

- active Instructions の配置、review 要求、再要求、head 更新について事前承認を得ます。
- private review log、actor、source は共有時に redact します。
- review comment への reply を、新しい prompt や再 review の代わりにしません。

## 手順

1. Java、XML、mixed の各 diff と head SHA を記録します。
2. Instructions を置かない確認と、承認済みの原稿を置く確認を分けます。
3. 各 head へ 1 回ずつ review を要求します。
4. attribution から直接確認できる原稿、path、revision だけを記録します。
5. 設計上の予測と実観測を scope matrix に分けて戻します。

## 観測すること

- PR/head と task の対応
- 原稿の hash と attribution
- Java/XML/mixed での供給差
- `excludeAgent` が意図した製品除外
- 回答内容が似ているだけの推測をしていないか

## 停止条件

- review 資格、承認、対象 revision、原稿 bytes、attribution 範囲のいずれかが不明
- Java/XML/mixed の入力を同じ条件で用意できない
- reply、回答言語、source access だけで供給を推測する必要がある
- review 要求を無制限に繰り返す必要がある

[← HC-031 のメインシナリオへ戻る](../README.md)
