# CLI / App / Cloud等の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-025本編](../README.md)のLocal Agent / Agent Host比較とは別に、CLI、Copilot App、Cloud等をそれぞれ別clientとして記録する準備ガイドです。

Agent HostをCloudの別名にせず、同じファイル名だけで全clientが同じように動くと仮定しません。

## Prerequisites

environment:

- 対象CLI / App / Cloud、version、channel、実行場所、各clientの独立環境を確認できること。

entitlements:

- 各client、model、Plugin/component、Cloud実行の利用資格と組織policyを確認できること。

additionalApprovals:

- 必要なinstall、login、sync、Cloud操作、model利用、外部送信、費用を操作ごとに別途承認すること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 必要なinstall、login、sync、Cloud操作、model利用、外部送信、費用を操作ごとに別途承認すること。

credential、token、通常profile、同期設定、Cloud branchを無断で作成・変更しません。client不明を別clientのversionや現在日付で補いません。

標準Plugin component、client固有namespace、Prompt/Agent/toolの対応を別々に確認します。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| client-specific-portability | not-checked | CLI / App / Cloudごとの発見、本文投入、tools、approval、versionは本編とRuntime v1で未観測です。 |
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

Cloud別branchへの正式なrun binding移行がないため、その経路はblockedです。CLI/Appの全機能まで非対応と決めつけません。

## Stop / Block

- 対象clientまたはversionが不明な場合は停止します。
- install/login/sync/Cloud操作の承認がない場合は停止します。
- Cloudが別branchを作り、Runtime v1 run bindingを移せない場合は停止します。
- mainや別clientの実機結果を流用する場合は停止します。
- 全client GAへ外挿する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

client、harness、version、実行場所、format、discovery、loading、tools、approval、blocked理由を別に記録します。ガイド読了や準備表示exit 0を、login、install、Cloud実行、可搬性成功へ読み替えません。
