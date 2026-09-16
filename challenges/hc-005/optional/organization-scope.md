# Organization instructions の承認と対応範囲を確認する

**Language:** **日本語** / [English](../../../en/challenges/hc-005/optional/organization-scope.md)

[HC-005 本編へ戻る](../README.md)

## 目的

チーム向けの草稿を organization scope へ広げる前に、対象製品、承認者、影響範囲、復元責任を確認する
補足ガイドです。草稿が完成したことや settings 画面へアクセスできることは、organization 全体を変更する
承認にはなりません。

参考:

- [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [GitHub Organization instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-organization-instructions)

公式資料が説明する対象 client や配信方法は同じとは限りません。対象 organization と client について、
現在の両資料を確認し、差があれば未解決のまま記録します。

## 前提

- 対象 organization、利用する製品・client、指示の保存元を特定できる
- organization instructions を利用できる契約と policy を確認できる
- organization owner と影響を受ける利用者を特定できる
- 既存 instruction、対象範囲、元へ戻す方法を owner が確認できる

## 権限・安全

- organization owner から、対象、本文、期間、pilot 参加者、復元責任を限定した明示承認を得ます。
- owner であっても、既存 instruction を無断で上書き・削除しません。
- 個人向け草稿や未合意の提案を、そのまま organization 全体へ広げません。
- secret、個人情報、customer data、内部の既存 instruction を教材や共有メモへ転載しません。
- 本編の完了に organization 操作は不要です。承認がなければ実施しません。

## 手順

1. 対象 client ごとに、現在の公式資料が示す対応範囲と有効化方法を確認します。
2. 資料間の説明差、client ごとの未確認事項、一般化できない点を一覧にします。
3. 本編のチーム向け草稿について、対象者、対象外、所有者、合意、期限、撤去条件を見直します。
4. owner と、既存設定を上書きしない追加方法、pilot 範囲、開始・停止条件を合意します。
5. 承認済みの場合だけ、非機密の短い instruction を限定した pilot へ追加します。
6. pilot 参加者が同じ合成 task を fresh conversation で試し、client が示す source と最初の出力を記録します。
7. 期限または停止条件に達したら、今回の追加分だけを owner の手順で取り除きます。

## 観察すること

- owner の承認範囲、対象 organization、pilot 対象者、期間
- 対象 client と、現在の公式資料が説明する対応範囲
- 保存した本文と、既存 instruction との区別
- client がどの source を発見したと表示したか
- 本文投入を直接確認できる情報と、出力からの推測
- 対象外の利用者や client へ影響した兆候
- 競合時にどの owner へ確認したか
- 今回の追加分だけを取り除けたか

repository を分けても、account や organization から供給される instruction が消えるとは限りません。

## 中止条件

- owner の承認、利用資格、対象 client、元の状態、復元責任のいずれかが不明
- 公式資料の説明差を解決したことにしなければ進められない
- 既存の organization instruction を上書き・削除する必要がある
- 対象外の利用者へ影響する範囲を限定できない
- 個人向け草稿や未合意の提案をそのまま配布する必要がある

中止しても HC-005 本編は完了できます。未確認の対応範囲は未確認のままで構いません。

## 本編へ戻る

organization の pilot を行った場合も、本編の合成カード設計とは別の記録にします。
organization 名、利用者情報、既存 instruction の本文は共有しません。
[HC-005 の手順と安全境界へ戻る](../README.md)。
