# BYOK provider登録前の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-017本編](../README.md)とは別のreadinessガイドです。本編4 conditionsへprovider、credential、Custom Endpoint、実modelを追加しません。

初回通信候補は承認済みの架空短文だけに限定します。private code、固定7行、Runtime成果を未承認providerへ送る案ではありません。

## Prerequisites

environment:

- 許可済みprovider / API / 実model IDと、secure inputを使える分離環境を確認できること。

entitlements:

- provider利用資格、model利用資格、組織policy、データ取扱い条件、費用範囲を確認できること。

placeholderのprovider名やmodel IDは送信先ではありません。endpoint、API、modelの組合せを一次資料と実環境で確認します。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- provider登録、credentialのsecure input、架空短文の初回通信、費用発生をそれぞれ対象限定で別途承認すること。

秘密値をIssue、Evidence、設定原稿、shell履歴へ記録しません。既存providerや鍵を一括削除して比較条件を作りません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| provider-registration | blocked | Runtime v1はcredentialやUser-level provider登録を管理しないため、この経路はblockedです。 |

JSON parseや設定原稿の存在は、疎通、model能力、実model選択、品質を証明しません。

## Stop / Block

- provider登録または送信の承認がない場合は停止します。
- endpoint、API、実model ID、費用、データ取扱いのいずれかが不明なら停止します。
- private codeや固定分析を送らなければ成立しない場合は停止します。

blockedを平文credential、User設定への黙った変更、別providerへの切替で回避しません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

readiness、登録、初回通信、応答、費用、cleanupを別に記録します。実施した場合も承認済み架空短文の限定観測であり、HC-017固定taskの品質、controlled comparison、provider全体の安全性を示しません。
