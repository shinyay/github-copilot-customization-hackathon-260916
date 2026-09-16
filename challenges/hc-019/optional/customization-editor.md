# Customizations editorの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-019本編](../README.md)の合成inventoryとは別に、対応する管理UIで自己所有copyを観測する前の準備ガイドです。本編原稿をactive化しません。

listed、enabled、候補表示、実requestへのapplication、usefulnessを別に記録します。

## Prerequisites

environment:

- 対応版・harness、Preview留保、自己所有の安全なcopy、開始前状態を確認できること。

entitlements:

- 対応するVS Code / Copilot、Customizations editor、教材workspaceの通常利用資格と組織policyを確認できること。

実候補、選択harness、scope、source label、必要最小限ログの保存範囲を事前に固定します。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 管理UIを開くこと、自己所有copyの候補確認、必要最小限のredacted log、active化が必要な場合の別判断を個別に承認すること。

通常profile、他人のcustomization、User / home、原本を変更しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| customization-discovery | not-checked | Runtime v1では管理UIの候補表示、selected harness、discovery、applicationを確認していません。 |
| optional-active-customization | blocked | 本編は不活性copyだけを許可し、active customizationの配置や適用を許可しないためblockedです。 |

合成inventoryの`listed` / `enabled`は実UIの観測ではありません。

## Stop / Block

- 対応UIがない、対象harnessが違う、自己所有copyを分離できない場合は停止します。
- active化の承認がない場合は候補確認より先へ進みません。
- User/Profile、原本、他人のcustomizationを変更しなければ成立しない場合は停止します。

listed / enabledをapplicationへ読み替えません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

readiness、UI表示、candidate、enabled、applicationの直接Evidence、cleanupを分けます。候補表示を意味の一貫性、実投入、有用性、教育効果へ昇格しません。
