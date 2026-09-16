# Cloud Agent で Skill を観測する

[← HC-033 のメインシナリオ](../README.md)

## 目的

承認済みの専用 repository で、Skill の discovery、body 利用、resource 読取りを限定的に観測します。最初の確認では script を実行しません。

## 前提

- Cloud Agent と対象 repository を利用できる
- 開始 branch と Skill の保存元/ref/file を特定できる
- Skill body と全 resource の raw bytes を保存できる
- resource の内容を安全 review 済み

## 権限と安全

- active Skill の保存、Cloud task、model、費用、終了時の解除について事前承認を得ます。
- 実 CSV、DB、import、replay、production data を使いません。
- script は初期 scope から除外し、link があっても実行しません。

## 手順

1. Skill と resource の保存元、revision、個別 hash を記録します。
2. `replay-plan` または `journal-boundary` の一方を固定 request で実行します。
3. description、body、resource の各段階を直接確認できる記録だけ残します。
4. source 根拠、DB unknown、停止条件を確認します。
5. 実験後は自分が追加した active Skill だけを解除します。

## 観測すること

- Skill が候補として見えたか
- body が使われたことを直接確認できるか
- checklist が読まれたことを直接確認できるか
- script が未実行のままか
- link や類似回答だけから利用を推測していないか

## 停止条件

- 資格、承認、開始 branch、Skill/resource bytes のいずれかが不明
- resource の安全 review が完了していない
- script、DB、import、replay を実行しないと確認できない
- model、費用、回数上限が決まっていない

[← HC-033 のメインシナリオへ戻る](../README.md)
