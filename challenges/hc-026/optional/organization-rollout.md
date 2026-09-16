# 実組織へ段階導入する前の確認

**Language:** **日本語** / [English](../../../en/challenges/hc-026/optional/organization-rollout.md)

[メインシナリオへ戻る](../README.md)

## 目的

合成台帳で作った方針を実組織へ持ち込む前に、責任者、権限、配布元 bytes、pilot 範囲、監視、復元方法を確認します。このガイド自体は配布や権限変更を承認しません。

## 前提

- 実 owner、reviewer、対象管理者を特定できる
- 配布する exact version と復元先の bytes / digest を固定できる
- 対象 client、管理対象、組織 policy、検証環境を確認できる
- 変更前状態を保存し、自分の変更だけを戻せる

## 権限・安全

- 組織 write、権限変更、配布、Plugin、MCP、復元試行を操作ごとに承認します。
- owner や承認を架空値で補いません。
- Plugin と MCP の権限・通信先を別々に審査します。
- private code、credential、token、個人情報を承認なく外部へ送りません。

## 手順

1. asset ごとに owner、reviewer、現在版、前版、配布理由を確認します。
2. 配布元と rollback candidate の SHA-256 を再計算し、承認記録へ結び付けます。
3. repository / organization / Plugin / MCP の必要権限と通信先を分離して確認します。
4. 最小の pilot 対象、成功指標、観察期間、停止条件、撤回担当を決めます。
5. review と変更承認を得た後だけ pilot を実施します。
6. error、利用者影響、想定外の tool / network、設定 drift を監視します。
7. 停止条件に達したら拡大せず、固定した bytes へ復元して結果を記録します。

## 観察すること

- asset / owner / reviewer / approval
- source version / source digest
- pilot target / start / stop criteria
- effective permissions / network destinations
- observed behavior / issue
- rollback version / rollback digest / restore result

## 停止条件

- owner、reviewer、対象管理者のいずれかを確認できない
- 配布元または復元先の bytes を固定できない
- 必要な write、権限拡大、Plugin、MCP の承認がない
- pilot の監視・撤回担当がいない
- private data の送信範囲を制御できない

停止理由と未確認項目を残し、[メインシナリオ](../README.md)の合成監査へ戻ります。
