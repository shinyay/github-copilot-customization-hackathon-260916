# HC-041 リポジトリの事実と古い記憶を見分けよう

**言語:** **日本語** / [English](../../en/challenges/hc-041/README.md)

## シナリオ

引き継ぎ資料に「検査コマンドは `check-a`」という事実があり、引用元のパスも付いています。しかし、現在の同じパスには `npm run verify` と書かれているかもしれません。さらに、別のリポジトリの事実、user preference、「今回使った」という自己申告も同じ資料に混ざっています。

F01〜F06 の合成 fact card を、Cloud と標準 code review の2つの surface で監査し、保持、保留、更新の提案、再検証の方針を作ります。実際の Memory への保存、再利用、削除は行いません。

## この機能とは

GitHub Copilot Memory の repository facts は、リポジトリについて再利用される可能性がある事実です。引用があっても、次の項目を別々に確認します。

- 同じリポジトリを対象にしているか。
- 現在のブランチとリビジョンで、引用元のパスを読めるか。
- 現在の本文が、主張する範囲を裏付けているか。
- 対象の surface で利用候補になれるか (`eligible`)。
- 今回、実際に使われたことを示す直接的な根拠があるか (`used`)。

`eligible`、`used`、`supported` は、それぞれ別の状態です。標準 code review で扱う repository fact と user preference も分けます。

GitHub Copilot Memory、VS Code の Local Memory tool、Copilot App で扱う記憶は、名前が似ていても保存範囲や操作が同じとは限りません。また、保持期間の説明があっても、事実の正しさ、新しいセッションが空の状態であること、削除が完了したことは保証されません。

## 向いていること / 向いていないこと

**向いていること**

- 参照元と対象のリポジトリ、scope、引用元のパスとリビジョンを照合する。
- 現在の本文が裏付ける主張の範囲を記録する。
- eligible と used を分ける。
- ブランチの更新、パスの変更、surface の変更など、再検証する条件を決める。

**向いていないこと**

- 引用元のパスが存在するだけで、主張を正しいと判断する。
- 別のリポジトリの事実を、同じリポジトリの事実として使う。
- user preference を、標準レビューの repository fact として扱う。
- 「覚えました」という返答を、保存や再利用の証拠にする。
- 新しいセッション、設定の解除、経過日数を、Memory が空であることや削除完了の証拠にする。

## ゴール

[`starter/fact-audit-design.md.template`](starter/fact-audit-design.md.template) の12行を埋めます。

- 6 cards × Cloud
- 6 cards × standard code review

各行で、現在の引用元の確認結果、裏付けられる範囲、eligible と判断する理由、used を示す直接的な根拠、保持・保留・再検証の条件を説明します。

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- Memory、Cloud、標準レビューの利用資格は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fact-audit-design.md.template`](starter/fact-audit-design.md.template) | 12行の監査ワークシート |
| [`fixtures/fact-cards.json.template`](starter/fixtures/fact-cards.json.template) | F01〜F06 |
| [`reference/current-policy.md.template`](starter/reference/current-policy.md.template) | 十分な一般監査手順 |
| [`reference/memory-scope.md.template`](starter/reference/memory-scope.md.template) | 製品、surface、scope の境界 |
| [`reference/repo-a-current.md.template`](starter/reference/repo-a-current.md.template) | repo-a の現在のスナップショット |
| [`reference/repo-a-previous.md.template`](starter/reference/repo-a-previous.md.template) | repo-a の以前のスナップショット |
| [`reference/repo-b-current.md.template`](starter/reference/repo-b-current.md.template) | 別リポジトリのスナップショット |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。fact card、スナップショット、surface、判断列、方針のリビジョンを固定します。

固定card:

| card | 材料 |
|---|---|
| F01 | 同じリポジトリの現在の資料を引用 |
| F02 | 同じリポジトリの以前の資料を引用 |
| F03 | 別のリポジトリの資料を引用 |
| F04 | user preference |
| F05 | 現在の資料でパスとリビジョンを確認できない |
| F06 | 「利用した」という自己申告だけがある |

card に正解ラベルはありません。

## 試してみる

1. `current-policy.md.template` と3つのスナップショットを読みます。
2. sourceRepo、targetRepo、scope、引用元のパスとリビジョン、現在の本文を照合します。
3. 本文が裏付ける範囲だけを書きます。古い引用や別のリポジトリの資料を自動的に廃棄せず、理由を残します。
4. `eligible / not-eligible / unknown` と、`used evidence present / absent / unknown` を別々に記録します。
5. Cloud と standard review を別の行にし、review に user preference の継承を求めません。
6. 保持、保留、更新の提案、廃止を分けます。
7. ブランチの更新、引用元のパスの変更、タスクの surface の変更など、次回に再検証する条件を決めます。
8. 実際の Memory への保存、再利用、保持、削除を、観測済みとして扱わないようにします。

## 任意: 比較する

最初に一般的な監査手順だけで12行を埋め、その後、再検証の条件と保留ルールを追加して見直します。保持した件数ではなく、現在の事実と提案の混同、unknown の消失、過剰な再検証の負担を比較します。

## 確認ポイント

- F01〜F06 を Cloud と review の両方の surface で扱っている。
- 同じリポジトリ、現在のブランチとリビジョン、引用元のパス、本文の意味を確認している。
- `eligible` と `used` を分けている。
- repository fact と user preference を surface ごとに分けている。
- パスが見つからない状態や取得不能な状態を false と見なしていない。
- 実際の Memory 操作、保持、空の Memory を観測済みとして扱っていない。

## 発展

- 各 card について、「リポジトリにどのような変更が起きたら再検証するか」を1つ追加する。
- 実際の Memory reuse を観察する場合は、[Memory reuse の限定観測](optional/memory-reuse-live.md) を参照する。

## 制約・代替手段・安全

- 本編では Memory の設定、保存、再利用、削除、全消去を行わない。
- 実際のユーザー情報や非公開リポジトリの本文を、合成資料へ追加しない。
- 引用元を取得できない場合は not-eligible と断定せず、unknown / hold とする。
- 新しいセッションや設定の解除によって、記憶がない対照状態を作らない。
- 利用資格がなくても、同梱されたスナップショットと fact card だけで監査を完了できる。
- `evidence` は、このシナリオでは引用本文や実際の利用を支える根拠を意味し、提出用のファイルではありません。
