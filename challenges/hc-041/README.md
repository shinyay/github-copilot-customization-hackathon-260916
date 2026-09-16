# HC-041 repo factsと古い記憶を見分けよう

## Scenario

引継ぎ資料に「検査commandは `check-a`」というfactがあり、引用pathも付いています。しかし現在の同じpathには `npm run verify` と書かれているかもしれません。別repositoryの事実、user preference、「今回使った」という自己申告も同じ束へ混ざっています。

F01〜F06の合成fact cardをCloudと標準code reviewの二つのsurfaceで監査し、保持、保留、更新提案、再検証の方針を作ります。実Memoryの保存、再利用、削除は行いません。

## この機能とは

GitHub Copilot Memoryのrepository factsは、repositoryについて再利用され得る事実です。引用があっても、次を別々に確認します。

- 同じrepositoryを対象にしているか。
- 現在branch/revisionで引用pathを読めるか。
- 現在の本文が主張の範囲を支持するか。
- 対象surfaceで利用候補になれるか (`eligible`)。
- 今回実際に使われた直接Evidenceがあるか (`used`)。

`eligible`、`used`、`supported` は別です。標準code reviewで扱うrepository factと、user preferenceも分けます。

GitHub Copilot Memory、VS CodeのLocal Memory tool、Copilot Appで扱う記憶は、名前が似ていても保存範囲や操作が同じとは限りません。また、retention期間の説明はfactの正しさ、新sessionの空状態、削除完了を保証しません。

## 向いていること / 向いていないこと

**向いていること**

- source/target repository、scope、citation path/revisionを照合する。
- 現在本文が支持する主張の範囲を記録する。
- eligibleとusedを分ける。
- branch更新、path変更、surface変更などの再検証triggerを決める。

**向いていないこと**

- 引用pathの存在だけで主張を正しいとする。
- 別repositoryのfactを同repoのfactとして使う。
- user preferenceを標準reviewのrepository factとして扱う。
- 「覚えました」という返答を保存・再利用の証拠にする。
- 新session、設定解除、経過日数を空Memoryや削除完了の証拠にする。

## ゴール

[`starter/fact-audit-design.md.template`](starter/fact-audit-design.md.template) の12行を埋めます。

- 6 cards × Cloud
- 6 cards × standard code review

各行でcurrent citation check、supported scope、eligible理由、usedの直接Evidence、retain/hold/revalidate triggerを説明します。

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- Memory、Cloud、標準reviewの利用資格は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fact-audit-design.md.template`](starter/fact-audit-design.md.template) | 12行の監査worksheet |
| [`fixtures/fact-cards.json.template`](starter/fixtures/fact-cards.json.template) | F01〜F06 |
| [`reference/current-policy.md.template`](starter/reference/current-policy.md.template) | 十分な一般監査手順 |
| [`reference/memory-scope.md.template`](starter/reference/memory-scope.md.template) | product/surface/scope境界 |
| [`reference/repo-a-current.md.template`](starter/reference/repo-a-current.md.template) | repo-a current snapshot |
| [`reference/repo-a-previous.md.template`](starter/reference/repo-a-previous.md.template) | repo-a previous snapshot |
| [`reference/repo-b-current.md.template`](starter/reference/repo-b-current.md.template) | 別repo snapshot |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。card、snapshot、surface、判断列、方針revisionを固定します。

固定card:

| card | 材料 |
|---|---|
| F01 | 同repoのcurrent資料を引用 |
| F02 | 同repoのprevious資料を引用 |
| F03 | 別repoの資料を引用 |
| F04 | user preference |
| F05 | current資料でpath/revisionを確認できない |
| F06 | 「利用した」という自己申告だけがある |

cardに正解ラベルはありません。

## 試してみる

1. `current-policy.md.template` と三つのsnapshotを読む。
2. sourceRepo、targetRepo、scope、citation path/revision、current本文を照合する。
3. 本文が支持する範囲だけを書く。古い引用や別repoを自動的に廃棄せず、理由を残す。
4. `eligible / not-eligible / unknown` と、`used evidence present / absent / unknown` を別々に記録する。
5. Cloudとstandard reviewを別行にし、reviewへuser preferenceの継承を要求しない。
6. 保持、保留、更新提案、廃止を分ける。
7. branch更新、引用path変更、task surface変更など、次回の再検証triggerを決める。
8. 実Memoryのstore、reuse、retention、deleteを観測済みにしない。

## 任意: 比較する

最初に一般監査手順だけで12行を埋め、その後、自分の再検証triggerとholdルールを追加して見直します。保持数ではなく、current factと提案の混同、unknownの消失、過剰な再検証負担を比較します。

## 確認ポイント

- F01〜F06をCloud/reviewの両surfaceで扱っている。
- 同repo、current branch/revision、citation path、本文の意味を確認している。
- `eligible` と `used` を分けている。
- repository factとuser preferenceをsurfaceごとに分けている。
- missing pathや取得不能をfalseへ変換していない。
- 実Memory操作、retention、空Memoryを観測済みにしていない。

## 発展

- 各cardについて「どのrepository変更が起きたら再検証するか」を一つ追加する。
- 実Memory reuseを観察する場合は [Memory reuseの限定観測](optional/memory-reuse-live.md) を参照する。

## 制約・Fallback・安全

- 本編ではMemory設定、store、reuse、delete、全消去を行わない。
- 実user情報やprivate repository本文を合成資料へ追加しない。
- citationを取得できない場合はnot-eligibleと断定せずunknown/holdにする。
- 新sessionや設定解除で無記憶対照を作らない。
- 利用資格がなくても、同梱snapshotとfact cardだけで監査を完了できる。
- `evidence` はこのシナリオでは引用本文や実利用を支える根拠を意味し、提出用ファイルではありません。
