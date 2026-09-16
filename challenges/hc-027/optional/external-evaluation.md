# 外部評価 tool / service を検討する

**Language:** **日本語** / [English](../../../en/challenges/hc-027/optional/external-evaluation.md)

[メインシナリオへ戻る](../README.md)

## 目的

合成18 rowの演習とは別に、外部の評価 tool や service を使う場合の確認手順を整理します。名称から command、対応 model、料金、送信範囲を推測せず、一次資料で確認できた最小構成だけを試します。

## 前提

- publisher、公式配布元、対応 version、利用条件を確認できる
- 認証方法、対象 model、service の利用資格を確認できる
- 送信される prompt、response、source、metadata を説明できる
- 独立した検証環境と費用上限を用意できる

## 権限・安全

- download、install、login、model 利用、外部送信、課金を個別に承認します。
- private prompt、source、token、個人情報を無承認で送りません。
- 公式に確認できない command や非公式 binary を試しません。
- 合成結果を実 model 性能や教育効果の測定値へ置き換えません。

## 手順

1. publisher、version、binary / service の公式 URL と checksum 提供有無を記録します。
2. data flow、保持期間、学習利用、region、削除方法を確認します。
3. メインシナリオと同様に、rubric、分母、順序、停止条件、欠測、費用上限を結果前に固定します。
4. private data を含まない最小の合成 sample を用意します。
5. 承認済みの方法で1回だけ実行し、tool version、model、入力範囲、error、duration、cost を記録します。
6. 想定外の送信、権限要求、費用、結果形式があれば追加実行を止めます。
7. 外部評価の記録を、メインシナリオの合成18 rowとは別に保存します。

## 観察すること

- publisher / tool or service / version
- authentication / permissions
- model / region / data sent / retention
- rubric / sample identity / execution result
- duration / cost / error
- cleanup / deletion confirmation

## 停止条件

- publisher、version、公式取得元を確認できない
- install、login、外部送信、model、課金の承認がない
- private data を送信対象から除外できない
- data retention、region、削除方法を確認できない
- 対応 command や料金条件を一次資料で確認できない

停止理由を記録し、[メインシナリオ](../README.md)の local 合成評価へ戻ります。
