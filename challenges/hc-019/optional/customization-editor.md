# Customizations editorで自己所有copyを観察する

**Language:** **日本語** / [English](../../../en/challenges/hc-019/optional/customization-editor.md)

## 目的

管理UIに表示される候補、scope、enabled状態と、実requestへのapplicationを分けて観察します。[メインシナリオ](../README.md)の合成inventoryを実UIの結果として扱わないための補足です。

## 前提

- Customizations editorに対応するVS Code / GitHub Copilot環境
- 組織policyで利用が認められたworkspaceとharness
- 自分が所有する無害な既存customization
- clientの版、channel、対象harnessを記録できること

## 権限・安全

- このリポジトリの `starter/**/*.template` は有効化しません。
- 通常profile、他人のcustomization、User / home、原本を変更しません。
- 画面やlogを保存する場合は、秘密、個人情報、private codeを除きます。
- active化やテストrequestが必要なら、対象とcleanupを限定して事前に承認を得ます。

## 手順

1. client、channel、workspace、選択harness、開始前状態を記録します。
2. 現在の製品ドキュメントに従ってCustomizations editorを開きます。
3. 自己所有の安全な項目について、表示名、scope、source、listed、enabledを記録します。
4. 許可されていればharnessを切り替え、候補表示が変わるかを確認します。
5. application確認まで承認されている場合だけ、無害な固定requestを一度実行し、UIが示す参照元などの直接情報を記録します。
6. 自分が加えた一時変更だけを戻し、元の状態と比較します。

## 観察すること

- listedとenabledは別の状態か
- harnessごとに候補が変わるか
- applicationを示す直接情報があるか、単なる出力推測か
- 出力が従ったとしてもusefulnessを別に評価できているか

## 停止条件

- 対応UIがない、対象harnessが不明、自己所有項目を分離できない
- active化の承認がないのに、それが必要になる
- profile、User / home、原本、他人の項目を変更する必要がある
- applicationを出力だけから推測するしかない

[メインシナリオの発展へ戻る](../README.md#発展)
