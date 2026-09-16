# Agent Host BYOKの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-017本編](../README.md)やLocal BYOKとは別のAgent Host経路を確認するための準備ガイドです。Local疎通をHost成功へ転記しません。

Experimental設定、provider、鍵、Hostの実行場所を本編へ導入しません。送信候補は承認済みの架空短文だけです。

## Prerequisites

environment:

- 対応Agent Host / 実行OS、Experimental設定、provider、実model ID、secure inputの可用性を確認できること。

entitlements:

- Host、Copilot、provider、modelの利用資格、組織policy、データ取扱い条件、費用範囲を確認できること。

Hostの実行OS、profile user data、対応user folder、Localとの違いを記録できる必要があります。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- Experimental設定、provider登録、credentialのsecure input、Hostからの架空短文送信、費用発生を個別に別途承認すること。

private code、固定分析、既存profile、通常User設定を送信・変更しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| agent-host-byok | not-checked | Runtime v1ではAgent HostのBYOK設定、provider接続、実model選択、応答を確認していません。 |
| provider-registration | blocked | Runtime v1はcredentialやUser-level provider登録を管理しないため、この経路はblockedです。 |
| tracked-vscode-settings | blocked | Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings. |

LocalでのJSON parseや疎通はHost経路のEvidenceではありません。

## Stop / Block

- 対応Host / OS、Experimental設定、provider、credential、費用の承認が揃わない場合は停止します。
- Localでしか疎通を確認できない場合はHostを未観測のまま停止します。
- private code、固定分析、通常profileの変更が必要なら停止します。

blockedをUser設定、別Host、未承認providerへの迂回で隠しません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

Host readiness、設定、provider、架空短文、応答、cleanupを別に記録します。観測できても本編のmodel / effort比較、Local route、private taskの品質、Agent Host全般を証明しません。
