# CLI / App / Cloud を別 client として調べる

[メインシナリオへ戻る](../README.md)

## 目的

CLI、Copilot App、Cloud Agent などを別々の client として調べ、同名のカスタマイズがどこから発見され、どの本文・tool・approval で使われるかを整理します。Agent Host と Cloud Agent を同義語にはしません。

## 前提

- 調べる client、version、channel、実行場所を1つに特定できる
- その client、model、Plugin component、Cloud 実行の利用資格を確認できる
- 通常環境と分離した検証先と、終了後の復元方法がある

## 権限・安全

- install、login、同期、Cloud 操作、model 利用、外部送信、費用を個別に承認します。
- credential、token、通常 profile、同期設定、既存 branch を無断で変更しません。
- 標準 Plugin component と client 固有 namespace を分けて確認します。
- client が不明な値を、別 client の結果や現在の版から補いません。

## 手順

1. 対象 client を1つ選び、公式文書と version を記録します。
2. `../starter/customizations/` から確認する形式を1つ選びます。
3. その client が文書化している配置・install 方法と必要権限を確認します。
4. 承認済みの隔離環境で、固定依頼と固定 packet を使って1回だけ確認します。
5. discovery、loading、effective tools、approval、外部通信、費用、error を記録します。
6. 自分が追加した構成だけを戻してから、別 client を新しい記録として扱います。

## 観察すること

- client / version / execution location
- customization type / source / discovery
- body loading
- declared tools / effective tools
- approval / network / cost
- result / limitation / cleanup

## 停止条件

- client、version、公式の対応範囲を確認できない
- install、login、同期、Cloud 操作、外部送信、費用の承認がない
- private code や credential を送信対象から除外できない
- 別 client の結果を流用しなければ結論を作れない
- 変更を安全に戻せない

停止理由を記録し、[メインシナリオ](../README.md)の可搬性診断へ戻ります。
