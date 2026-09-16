# Stop 通知経路を比べる

## 目的

[HC-024 のメインシナリオ](../README.md)で使う「一要因だけを変える」考え方を、同じ限定 checker の呼出し経路へ応用します。checker を未接続、手動実行、Stop 通知へ接続した3経路で観察します。

Stop 通知は nonblocking な通知として扱います。品質 gate、tool deny、自動修正、会話の終了保証とはみなしません。

## 前提

- 対応する Local / Preview 環境と Stop event を利用できる。
- 許可済みの使い捨て検証用 workspace がある。
- 同じ入力だけを検査する、小さな read-only checker を用意できる。
- checker 実行、Hook 設定、event 試行、通知観察、終了後の解除を個別に承認できる。

## 権限と安全

- このガイド自体は Hook や script の実行権限を付与しません。
- checker は固定入力の形式確認だけを行い、source や回答を変更しません。
- 通知は処理継続を前提とし、deny、permission 変更、retry loop、自動修正へ拡張しません。
- 3経路で同じ checker と同じ入力を使います。
- この教材 repository には active な Hook や checker を追加しません。

## 手順

1. checker の入力、確認項目、出力、最大実行時間を固定します。
2. 未接続の状態で、checker が自動実行されていないことを確認します。
3. 同じ入力で checker を手動実行し、形式結果を記録します。
4. 許可済みの別 workspace でのみ、同じ checker を Stop 通知へ接続します。
5. Stop event、checker 起動、通知表示、再入防止を別々に観察します。
6. 検証後に設定を解除し、残った process や変更がないことを確認します。

## 観察すること

- event が発生したか。
- checker が同じ入力で起動したか。
- 形式結果と通知内容が一致したか。
- 通知が回答の意味評価や tool deny に変化していないか。
- checker 自身が再度 Stop event を生む場合に、再入を避けられたか。
- cleanup 後に Hook や process が残っていないか。

手動実行の成功だけで、Hook discovery、event、通知 UI の成功を主張しません。通知成功も回答品質や教育効果の証明にはなりません。

## 停止条件

- event、作業 directory、再入判定に必要な情報が得られない。
- 未観測値を既定値で補う必要がある。
- script / Hook の配置や event 試行が承認されていない。
- nonblocking 通知を deny や品質 gate に変える必要がある。
- checker が書込み、外部送信、長時間実行を要求する。

[HC-024 のメインシナリオへ戻る](../README.md#発展)
