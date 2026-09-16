# User指示の保存元と隔離を確認する

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved

このページは、User指示を将来別途承認された環境で検討するための、任意の準備確認です。[HC-005本編](../README.md) の分類・方針・草稿だけで提出できます。ここでは指示の作成、保存、移行、削除や、会話を使った確認は始めません。読むことと実機を試すことは別です。

本編の個人向け草稿は設計物です。Userの保存元へ置いたことも、別の作業で自動的に使われたことも意味しません。

## Prerequisites

### environment

- 別途承認された使い捨て環境で、HOMEとUser指示の保存元を分離できること。
- 利用するVS Codeの版とAgent Hostの有無を特定できること。

### entitlements

- 対象環境でのCopilotとUser指示の利用可否を本人が確認すること。

これらはすべてnot-checkedです。新しいrepositoryや専用profileを用意しただけで、HOME配下のUser指示も隔離されたとは判断できません。既存の個人設定を見せたり、一括削除して無設定にしたりする必要はありません。

[VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions) の文書確認日は2026-09-15です。現在のUser保存元には `~\.copilot\instructions`、`~\.claude\rules` があります。Agent Hostは旧VS Code profile内だけの指示を読む前提ではないため、profileの名前ではなく保存元と利用するhostを確認する必要があります。これは保存先の説明であり、その場所への書込みや移行を指示するものではありません。端末間の同期や既存会話への即時反映も、このガイドは確認していません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

- 環境の所有者から、今回追加するUser指示だけの保存・確認・解除について別途承認を得ること。

承認はnot-checkedです。以下は**将来の独立試行で検討する項目**であって、今行う操作手順ではありません。

| 将来区別したいこと | 準備として明確にする境界 |
|---|---|
| 保存 | 今回自分が追加する非機密の原稿と保存元。既存User指示とは別に識別する |
| sourceの確認 | 製品がどの保存元を発見したか。pathにファイルがあることだけで代用しない |
| 本文投入 | どの版の本文が使われたか。表示の似た回答だけから推定しない |
| 再利用 | 別の作業でも同じ本文が供給されたか。再度手で貼った場合と分ける |
| 整理・解除 | 今回の自分の追加分だけを識別し、元の状態を損なわず取り除けるか |

専用profileだけではHOME/User sourcesを隔離できない可能性を残し、環境所有者と分離方法を別途決めます。既存の個人指示、Settings Sync、他のprofileや組織の共通設定をまとめてリセットしません。元の状態が不明なら実機試行を始めないことが安全な選択です。

## Runtime capabilities

user-source-isolation — not-checked

Runtime v1はHOME・User指示の保存元や分離状態を検査しない。

user-instruction-delivery — not-checked

User指示の発見・本文投入・別の作業での再利用は実機未確認である。

Runtimeのrepository検査や本編の草稿exportは、これらの観測を行いません。readinessを表示できても利用資格や実行サポートが確認された意味にはなりません。ガイドを選んでもPack applyや会話は開始されません。

## Stop / Block

- 専用profileだけでHOME・User指示も隔離されたと判断してしまう場合は停止する。
- 既存設定と今回の追加分を区別できない、または追加分だけを解除できない場合は停止する。
- 利用資格・所有者承認・保存元のいずれかが未確認なら実機試行は未実施にする。

停止後は未実施のままで構いません。workspace内へコピーした代替を、User共有の成功として数えないでください。本編の合成カード設計は、そのまま完了・提出できます。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

読んだだけなら共通Issue Formの任意欄へguide-onlyと未確認事項を書き、架空の実run IDや観測receiptを作りません。記録しない場合はunperformedでも構いません。承認された将来の試行記録ができたとしても、本編の二条件のEvidenceとは別に保ちます。

保存元・発見・本文投入・再利用・追加分の解除は、それぞれ独立の証拠が必要です。HOMEの実pathや既存User指示の内容を提出せず、安全な要約だけを残します。liveStatusはlive-unobserved、RuntimeのruntimeBehaviorとeducationalEffectはnot-observedのままです。
