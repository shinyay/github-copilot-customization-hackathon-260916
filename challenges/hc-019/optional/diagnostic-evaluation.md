# 外部diagnostic evaluationの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-019本編](../README.md)の有限toy checkとは別に、別配布Preview評価extensionを使う前の準備ガイドです。Analyzeや自動修正を本編へ追加しません。

外部modelの出力は業務上の真値や参加者repairのanswer keyではありません。

## Prerequisites

environment:

- 別配布Preview評価extensionの承認済み環境、publisher、固定対象copy、開始前状態を確認できること。

entitlements:

- extension、評価model、対象データ送信、費用、組織policyの利用資格と許可範囲を確認できること。

送信される本文、metadata、log、保存先、redaction、復元方法を事前にレビューします。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- extension導入、分析対象送信、model利用、費用、Analyze実行を個別に別途承認し、自動修正はさらに別承認とすること。

private code、秘密、第三者情報を未承認先へ送らず、Implement Suggestionsを自動実行しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| external-diagnostic-evaluation | blocked | 本編とRuntime v1は外部評価extensionの導入、送信、model実行、費用、自動修正を許可・検証しないためblockedです。 |

parser passや固定toy検査はAI diagnosticではなく、Analyze出力も真値ではありません。

## Stop / Block

- extension、publisher、送信対象、model、費用の承認が揃わない場合は停止します。
- private contentや秘密を送らなければ成立しない場合は停止します。
- 自動修正、原本変更、通常profileへの導入が必要なら停止します。

未実施のAnalyze結果やscoreを作りません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

install readiness、送信対象、model、Analyze出力、人の確認、修正の別承認、cleanupを分けます。一つの評価出力を意味の正しさ、application、usefulness、全customizationへ外挿しません。
