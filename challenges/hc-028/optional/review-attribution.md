# 標準 review attribution を観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-028/optional/review-attribution.md)

[← HC-028 のメインシナリオ](../README.md)

## 目的

標準の Copilot code review が、対象 PR のどの head と Instructions 版を直接示すかを限定的に観測します。合成資料の結果を実観測へ置き換えるための手順ではありません。

## 前提

- Copilot code review を利用できる
- 対象 repository、PR、現在の head、要求者を特定できる
- review の再要求方法と、表示される session / log の範囲を確認できる
- 使用する Instructions の raw bytes を事前に保存できる

## 権限と安全

- review 要求、再要求、head 更新は、それぞれ repository 所有者の承認を得てから行います。
- private log、actor、repository 名は必要最小限だけ記録し、共有時は redact します。
- 別 PR や古い head の記録を現在の観測へ流用しません。

## 手順

1. 対象 PR の head SHA、要求時刻、要求者、Instructions 候補の ref と hash を記録します。
2. 承認された 1 回の review を要求します。
3. 表示された attribution から、対象 head、Instructions file、revision を直接確認できる範囲だけ転記します。
4. head を更新して再観測する場合は、別の記録として扱います。
5. 保存版、文書化規則、観測版を HC-028 の監査票へ分けて戻します。

## 観測すること

- request 時点の head と review 対象 head が一致するか
- Instructions の path または revision が直接表示されるか
- attribution が存在するだけでなく、版まで特定できるか
- old head の結果が現在 head に誤って結び付いていないか

## 停止条件

- 資格、repository 設定、要求者、対象 PR/head のいずれかが不明
- review または再 review の承認がない
- attribution が対象 file や revision を直接示さない
- 自己申告、回答言語、別 PR の記録で不足を補う必要がある

版を特定できない場合は `not-observed` として終了します。

[← HC-028 のメインシナリオへ戻る](../README.md)
