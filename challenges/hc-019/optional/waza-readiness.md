# Waza実行前のreadiness確認

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-019本編](../README.md)やexternal diagnosticとは別に、Wazaを実行する前提だけを確認するガイドです。Download、scaffold、Runを本編で行いません。

未確認のYAML、CLI、schema、command、scoreを作りません。

## Prerequisites

environment:

- Skill / 資源の固定版、承認済みextension / binary、対応OS、実scaffold schema / commandを確認できること。

entitlements:

- extension、binary取得、model、対象データ送信、費用、教材workspaceの利用資格と組織policyを確認できること。

Download、scaffold、Runを別工程として、入手元、hash、実command、出力保存先、cleanupをレビューします。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- extension導入、binary取得 / 実行、model利用、データ送信、費用、scaffold / Runを工程ごとに別途承認すること。

未知のbinaryやcommandを実行せず、private code、秘密、第三者情報を未承認先へ送りません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| waza-evaluation | blocked | Runtime v1と本編はWaza extension / binary、scaffold、model、送信、費用、評価実行を許可・検証しないためblockedです。 |

README、架空YAML、Node fixture、外部diagnosticの結果をWaza scoreへ読み替えません。

## Stop / Block

- 実schema、command、入手元、hash、OS対応を確認できない場合は準備で停止します。
- extension / binary取得、model、送信、費用の承認がない場合は停止します。
- private data、原本変更、通常profile導入が必要なら停止します。

Download、scaffold、Runを一つの自動手順へまとめません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

readiness、download、hash、scaffold、model、run、score、人の確認、cleanupを別に記録します。未実施scoreを作らず、一つのWaza結果を意味の真値、application、usefulness、教育効果へ外挿しません。
