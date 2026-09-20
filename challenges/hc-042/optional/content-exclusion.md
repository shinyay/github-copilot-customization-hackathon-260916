# Content exclusion を限定的に観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-042/optional/content-exclusion.md)

[HC-042本編へ戻る](../README.md)

## 目的

標準 code review の content exclusion と Instructions の `applyTo` が、それぞれ異なる責任者と surface を持つ制御であることを限定的に観察します。除外の回避や別の surface への迂回は行いません。

## 前提

- 対象のリポジトリ、code review の surface、対象のパスを特定できる。
- Instructions のリビジョンと、content exclusion の管理範囲を確認できる。
- 対象機能の release state、利用資格、実効ポリシーを確認できる。
- 観察範囲、停止、復元担当が決まっている。

## 権限と安全

- 除外設定を変更しない観察、対象の surface とパス、ログの範囲について、個別の許可を得る。
- 除外の回避、別の surface への迂回、リポジトリ内容の持ち出しを行わない。
- Instructions で管理者のポリシーを上書きしようとしない。
- 設定変更が必要になった場合は、別の承認なしに進めない。

## 手順

1. Instructions の `applyTo` pattern、対象のリビジョン、責任者を記録します。
2. content exclusion の管理範囲、対象のパス、責任者、対応する surface を記録します。
3. 設定を変えず、対象の surface で確認できる適用範囲だけを観察します。
4. 指示が提供されたか、内容が除外されたか、回答に使われたかを別々に記録します。
5. 不明なポリシーを推測せず、管理者へ確認する項目を残します。

## 観察すること

- surface と release state
- Instructions の pattern / リビジョン
- content exclusion の範囲とパス
- 各制御の責任者
- 指示提供、content利用、除外の観測
- unknownと保留理由

## 停止条件

- 利用資格、実効ポリシー、管理範囲が不明。
- 除外の回避または別の surface への迂回が必要。
- 対象のパス、Instructions のリビジョン、復元範囲を固定できない。
- 2つの制御を1つの成功値にまとめる必要がある。

## 本編へ戻る

結果を [HC-042の確認ポイント](../README.md#確認ポイント) に対応付け、`applyTo` と content exclusion の責任範囲を維持します。
