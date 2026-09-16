# Plugin を有効化する前の確認ガイド

[HC-014 本編へ戻る](../README.md)

## 目的

HC-014 で作った不活性な Agent Plugin 原稿を、将来、承認済みの実験環境で試す前に確認する項目を整理します。
このページは install、register、enable の実行手順ではありません。本編の `.template` を有効なファイルへ変更しません。

観察したいことは、次のように分けます。

1. client が Agent Plugins 1.0 をサポートしているか。
2. package 全体をレビューできたか。
3. 設定上の登録・有効状態がどう保存されるか。
4. Plugin が発見されたか。
5. `order-import-evidence` の本文が必要な場面で読み込まれたか。
6. 更新・無効化後に、古いコピーや同名 Skill が残っていないか。

設定値、UI 表示、discovery、本文 loading は別々の観察です。

## 前提

- HC-014 本編の v1 / v2 原稿、version ledger、完全復元の確認が完了していること。
- Agent Plugins 1.0 に対応する client と、その時点の公式文書を確認できること。
- 本編とは別の専用 workspace と新しい会話を使えること。
- Copilot と対象 repository の利用資格、組織の Plugin policy を確認できること。
- package に含まれる全 component をレビューできること。

実施時点の仕様は次で確認してください。

- [VS Code Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- [Agent Plugins manifest](https://agent-plugins.org/plugin-authors/manifest)

ほかの client や古い UI の説明を、現在の環境での利用可否として扱わないでください。

## 権限と安全

- install、register、enable、設定変更には、環境所有者の別承認が必要です。
- 本編の `starter\` や `work\` にある `.template` は変更せず、実験は承認された使い捨て環境で行います。
- package 名だけで信頼せず、Skill 以外の component が含まれていないか全 tree を確認します。
- marketplace からの追加 download、publish、Profile 変更、home の削除を確認作業の副作用にしません。
- 既存 Plugin、手動 Skill、ユーザー設定、組織設定を削除して条件を作りません。
- Hook、MCP、Agent、rules、prompts が追加されていたら、本シナリオの package としては停止します。

## 手順

1. `work\package\v1` と `work\package\v2` の全ファイルを一覧し、manifest と一つの Skill だけか確認する。
2. helper の結果と raw hash を再確認し、同じ版の手動 Skill と package Skill が一致するか確認する。
3. client の公式文書から、local Plugin の場所、設定 scope、有効状態の保存方法を確認する。
4. `chat.plugins.enabled`、`chat.pluginLocations` など、利用中の client が実際に案内する設定名と意味を確認する。
5. workspace 設定として再現するのか、Profile または user scope に置くのかを決め、追跡可能性と実行権限を分けて考える。
6. 別承認が得られた場合だけ、使い捨て環境で対象 package 一つを登録する。
7. package の発見、Skill 候補、本文 loading、version 表示を別々に観察する。
8. v2 への更新後、古い v1 や同名 Skill がほかの origin に残っていないか確認する。
9. 無効化または実験終了後も、設定、候補、本文、会話 context の残留を別々に確認する。

本リポジトリでは手順 6 以降を実行しません。実験環境で行う場合も、公式文書と承認範囲を優先してください。

## 観察すること

- client、版、Plugin 対応状態
- package の exact path と raw hash
- 設定を保存した scope と出所
- Plugin の発見、Skill の候補表示、本文 loading
- package version と Skill marker の対応
- 同名候補、旧版、手動コピー、home にある別 origin
- 無効化後に残る設定、候補、会話 context

`starter\fixtures\lifecycle-origins.json.template` の `enabled` は合成値です。
実際の client の有効状態、候補消失、本文停止を証明しません。

## 停止条件

- 対応 client、利用資格、組織 policy、環境所有者の承認を確認できない。
- package 全体をレビューできない、または想定外の component がある。
- 本編の `.template` を外す、実際の探索先へ移す、既存設定を変更する必要がある。
- 既存 Plugin や他人の設定を削除しなければ同名候補を分離できない。
- package と手動 Skill の raw bytes、または v1/v2 の一要因差分が一致しない。
- 設定値、discovery、本文 loading のどれを観察したか区別できない。

停止した場合も、HC-014 本編の版・構成・復元の学習は完了できます。

## 終了時の扱い

実験で得られる結果は、特定の client、版、設定 scope、時点に限られます。
構造 helper の成功だけで install、discovery、loading、更新、無効化を成功としないでください。
片付けは自分が承認の下で追加したものだけに限定し、既存 Plugin、home、他人の設定へ触れません。

[HC-014 本編へ戻る](../README.md)
