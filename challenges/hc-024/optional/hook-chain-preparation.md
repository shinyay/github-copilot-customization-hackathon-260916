# Stop通知chainの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-024本編](../README.md)の四セルとは別に、同じ限定checkerを未接続・手動・Stop event通知の三経路へ接続する準備ガイドです。

Stopはnonblocking通知であり、品質gate、PreToolUse deny、自動修正、会話window終了と同義ではありません。

## Prerequisites

environment:

- 対応するWindows-native Local / Preview event、限定checker、独立workspace、同じ事前草稿を確認できること。

entitlements:

- 対象Preview / Hook機能、Local Agent、教材workspaceの利用条件と組織policyを確認できること。

additionalApprovals:

- checker script、Hook配置、event試行、通知観測、終了時解除を対象限定で別途承認すること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- checker script、Hook配置、event試行、通知観測、終了時解除を対象限定で別途承認すること。

三経路で同じcheckerを使い、event側だけ別の検査器を追加しません。事前配布草稿の形式検査と、実Chat回答の意味評価を分けます。

通知は `continue: true` を維持し、deny、permissionDecision、retry loop、自動修正へ変更しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| preview-stop-hook-chain | not-checked | このガイドはHook用Pack、checker/adapterのRuntime接続、実Stop eventを提供・検証しません。 |

合成stdinやNode checkerの成功は、実Hook discovery、event、通知UIのEvidenceではありません。

## Stop / Block

- event、cwd、再入fieldが欠ける場合は停止します。
- unknownをfalseや既定値で補う必要がある場合は停止します。
- script/Hook配置やevent試行の承認がない場合は停止します。
- 通知をdenyまたは品質gateへ変える必要がある場合は停止します。
- 再入skipを実hostで確認できない場合は未検査のまま残します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

未接続、手動、eventの来歴、checker起動、形式結果、通知、再入、cleanupを別に記録します。通知成功をsource意味、実回答の品質、tool deny、教育効果へ昇格しません。
