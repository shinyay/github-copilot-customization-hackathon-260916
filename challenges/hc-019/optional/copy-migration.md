# customization copy migrationの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-019本編](../README.md)とは別に、Insiders Experimentalのcopy migrationを検討する準備ガイドです。原本削除、通常profile移行、実home書込みを本編へ追加しません。

PromptからSkill、User data、location settingsは対象が異なります。保持した二つのcopyは自動同期せず、本文一致はmetadata継承を保証しません。

## Prerequisites

environment:

- Insiders Experimental、対象Hostとmigration種別、自己所有copy、原本保持、開始前状態を確認できること。

entitlements:

- 対応Insiders / Copilot、対象Host、migration UI / command、source / destinationへの通常利用資格と組織policyを確認できること。

source、destination、同名collision、metadata、location settings、rollback copyを事前に一覧化します。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 自己所有copyだけの変換、destination作成、原本保持、必要な設定変更を対象限定で別途承認すること。

deleteOriginal、clearLocationSettings、同名上書き、通常profile / home変更は別の破壊的判断であり、このガイドでは実行しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| profile-migration | blocked | Runtime v1はprofile / home間のmigration、metadata継承、原本保持、rollbackを管理しないためblockedです。 |
| tracked-vscode-settings | blocked | Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings. |

不活性copyの本文一致は、実migration、discovery、application、metadata継承のEvidenceではありません。

## Stop / Block

- deleteOriginal、clearLocationSettings、同名上書きが必要なら停止します。
- 原本保持、自己所有copy、source / destination、rollbackを確認できない場合は停止します。
- 通常profile、User / home、追跡不能settingsへの変更が必要なら停止します。

force-addや別Hostへの迂回でblockedを隠しません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

readiness、source copy、destination copy、metadata、settings、原本保持、cleanupを別に記録します。copy成功を自動同期、application、usefulness、全migration種別の成功へ外挿しません。
