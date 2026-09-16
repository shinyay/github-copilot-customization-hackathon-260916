# review scope観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-031本編](../README.md)のscope/product設計とは別に、標準reviewでJava/XML/mixed taskへの規則供給を将来観測する前の準備だけを整理するガイドです。

review commentへのreplyを新しいprompt投入の代わりにしません。

## Prerequisites

environment:

- 対象repository、PR/head、Java/XML/mixedの各diff、Instructions原稿、attributionの表示範囲を確認できること。

entitlements:

- Copilot code review、対象repository、PR、repository Instructionsの利用資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- active Instructions配置、対象PRへのreview要求、再review、head更新、限定観測を操作ごとに別途承認すること。

private review log、actor、sourceを公開Evidenceへ無加工で貼らず、製品除外をsource access拒否として扱いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| review-scope-observation | not-checked | 本編とRuntime v1は標準reviewでのInstructions発見、対象path判定、本文投入、attributionを実行または観測しません。 |

local matrixのshapeだけでGitHub.com上の採用を保証しません。

## Stop / Block

- 資格、承認、対象revision、原稿bytes、attribution範囲のいずれかが不明な場合は停止します。
- review要求、再review、active配置の承認がない場合は停止します。
- Java/XML/mixedの入力を同じ条件で用意できない場合は停止します。
- reply、回答言語、source accessだけで規則供給を推測する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

PR/head、task、原稿hash、attribution、観測できた範囲、unknownを別に記録します。設計上の予測を実review採用成功へ書き換えません。
