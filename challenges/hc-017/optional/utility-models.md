# utility model経路の観測準備

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-017本編](../README.md)のChat model比較とは別に、commit message等の一つのutility経路を将来観測する準備ガイドです。本編のM/E groupへ合算しません。

Chat modelを選んだことはutility modelの実効routeを証明しません。手動全文や別Chat応答をutilityの等価conditionにしません。

## Prerequisites

environment:

- 同じ固定utility入力、同じ対象操作、同じworkspace状態を用意し、対象をcommit message等の一つへ限定できること。

entitlements:

- 対応Stable、GitHub Copilot、対象utility機能、実modelの表示または観測手段の利用資格を確認できること。

utility入力と通常Chat入力を混ぜず、生成前後の設定と表示を記録できる必要があります。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- utility生成の実行、実model観測、必要な設定変更を対象限定で別途承認すること。

commit、push、provider登録、credential設定は不要です。生成物をrepositoryへ保存する場合はさらに別の変更承認が必要です。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| utility-route-observation | not-checked | Runtime v1ではutility入力経路、実効model表示、生成結果を確認していません。 |
| tracked-vscode-settings | blocked | Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings. |

Chat pickerの表示や設定JSONのparseだけではutility routeを確認できません。

## Stop / Block

- utility入力経路または実効modelを確認できない場合は停止します。
- 追跡できないworkspace設定、User/Profileへの黙った変更、force-addが必要なら停止します。
- provider登録、credential変更、commit / pushが必要なら本ガイドでは停止します。

未観測をdefault modelやChat model名で補いません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

readiness、設定、入力、観測表示、生成、cleanupを分けます。utility結果をM/Eの品質比較、Chat modelの実効route、教育効果へ外挿しません。
