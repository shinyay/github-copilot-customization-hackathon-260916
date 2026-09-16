# 組織指示の承認と対応範囲を確認する

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved

このページは、組織の指示を検討する場合の任意の準備確認です。[HC-005本編](../README.md) は個人・チーム・タスクの設計比較だけで完了し、organization操作を必要としません。このページから保存、編集、有効化、配布、生成機能の呼出しを始めません。

組織全体への変更は、文書の整理より広い範囲に影響します。チーム向け草稿ができたことや、ガイドにアクセスできることを、組織の指示を変更する承認に読み替えないでください。

## Prerequisites

### environment

- 利用する製品・clientの版と、対象組織での指示の保存元を特定できること。
- VS CodeとGitHub Docsの適用範囲の説明差を未解決として確認すること。

### entitlements

- 対象製品でのCopilotと組織指示の利用資格を本人と組織管理者が確認すること。

すべてnot-checkedです。2026-09-15に確認した一次資料には、次の説明差があります。これは文書の確認であり、対象組織やVS Codeでの動作観測ではありません。

- [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions) は、`github.copilot.chat.organizationInstructions.enabled` という設定による組織指示の発見を説明しています。この設定を変更するよう案内しているのではありません。
- [GitHub Organization instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-organization-instructions) の注記は、対応先を **GitHub.comのChat、code review、cloud agentのみ**としています。また、組織指示を追加する主体はorganization ownersです。

この不一致を、どちらかの資料を省くことや、Userの案をコピーすることで解決済みとはしません。VS Codeで組織指示が使われた事実、全clientへの対応、一般的な結合順序も、このガイドでは確認していません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

- organization ownerから、対象範囲と復元責任を限定した別途の明示承認を得ること。

承認はnot-checkedです。組織のsettings画面へのアクセスや保存を、このガイドは一切許可しません。自分がownerである場合でも、将来の試行について対象範囲、既存の原稿、影響を受ける人、停止・復元の責任を別途明確にする必要があります。

既存の組織指示を上書き・削除して無設定にしたり、広いscopeだから優先されるはずだと競合を放置したりしません。実組織の原稿や利用者情報を本編の合成カードや提出Issueへ持ち込みません。独立した将来の試行を検討する場合も、所有者が承認した今回の追加分だけを扱う境界が必要です。

## Runtime capabilities

organization-delivery — not-checked

Runtime v1は組織指示の保存・発見・本文投入や実際の対象製品を検査しない。

product-scope-agreement — not-checked

VS Codeは設定による組織指示の発見を説明する一方、GitHub DocsはGitHub.comのChat・code review・cloud agentに限定しており、説明差は未解決である。

repositoryを分けても、アカウントや組織から供給される指示が消えるとは限りません。Runtimeの静的検査を組織設定の検証へ拡張解釈しないでください。未確認を対応済みと表示せず、ガイドのreadiness表示も実機実行サポートを意味しません。

## Stop / Block

- organization ownerの承認、利用資格、対象範囲、元の状態のいずれかが不明なら停止する。
- 公式資料の説明差や実際の投入元を確認できない場合は、組織の実機試行を未実施にする。
- 既存の組織設定を上書きする、または本編のUser案を組織へ広げる必要がある場合は、このガイドでは実施しない。

停止後は未実施で構いません。User共有が動いたという別の観測が将来あっても、組織指示の対応範囲やこの説明差を解決した証拠にはなりません。本編の設計結果はそのまま提出できます。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

任意欄へguide-onlyまたは未実施の理由を書き、本編のscope-designの結果と分けます。承認済みの実機試行を別途行っていなければ、run ID、対象組織、発見元、投入本文、出力を推測で補いません。組織や利用者の情報は提出せず、説明差と未確認事項だけでも十分な記録です。

公式文書の読解、草稿の保存、製品による発見、モデルへの本文投入、出力内容は別の事実です。VS Codeの組織動作を観測済みとせず、liveStatusはlive-unobserved、RuntimeのruntimeBehaviorとeducationalEffectはnot-observedのままです。
