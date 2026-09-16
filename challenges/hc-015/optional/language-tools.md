# Javaの文字列検索と定義・参照を分ける準備

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-015本編](../README.md)から任意で読む準備ガイドです。本編の三条件にLSPの利用を足すページではありません。実機未観測のまま、準備と停止境界を確認します。

`allocate`のliteral text検索と、JavaのGo to Definition / Find All Referencesは別の観測です。Usagesはreferences・implementations・definitionsを組み合わせて調べる経路です。人の一つのエディター操作と、AgentがUsagesを呼んだ記録も区別し、同じ位置集合が返ると決めません。手動で全文を渡しても言語サービスは再現されないため、「同等manual C」を発明しません。[index-exclusions](index-exclusions.md)のindex診断も別です。

## Prerequisites

environment:

- 対応するJava拡張が既に導入済みで、同じworkspaceの初期化状態を確認できること。
- 本編とは別の診断として、同じquery・source・tabs・selection・model・toolsを固定できること。

entitlements:

- 利用予定のVS Code Stable・GitHub Copilotと教材sourceへの通常の利用資格を確認できること。

拡張の名前・版、Java言語機能の初期化表示、extension hostとworkspaceを記録する準備をします。入っていない拡張の自動installや、JDKの導入を案内の副作用にしません。前提の文章は導入済みの証明ではありません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 人のエディター操作とAgentのUsages利用は区別し、実機操作・LLM利用の対象を環境所有者が別途承認すること。

source、既存拡張、User/Profile、workspace設定は変更しません。別承認の診断でも読み候補は本編と同じ固定sourceに限定して説明し、追加で必要な参照先の読取り権限を別に確認します。候補pathはACLの付与ではありません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| java-language-service | not-checked | Java言語サービスの初期化、定義・参照の返却範囲とAgentからの利用は未確認です。 |

Runtime readinessはnot-checkedです。guide出力や静的fixtureの検査成功は、language serviceのreadyではありません。

固定queryは`allocate`、symbolは`OrderService.allocate`、sourceは`wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`です。333–349行の要求、返却された位置、実際に読んだ範囲を分ける計画を立てます。XML側では`application-context.xml`のimportから`spring/module-operations.xml`のbean定義へ辿る読解と、言語サービスによるJavaの位置解決を混ぜません。

## Stop / Block

- Java拡張が未導入なら自動installせず、unsupportedまたは未実施として止めます。
- 初期化中、未対応、返却範囲不明なら未観測のまま止め、参照0件へ補完しません。
- 別の設定変更、index構築、source編集が必要なら本編へ混ぜず、別承認まで止めます。

`languageService: pending`に`resolvedLocations: []`を付けるのは、未知をゼロへ変える誤記です。未観測はnullと理由で残します。停止後は任意未実施でよく、言語機能が未対応でも本編の同じtext/file searchが使える範囲は別に扱えます。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

guideを読んだ記録、実エディターでの操作、実Agent tool callを別にします。観測前の値をfixtureから補いません。Nodeの`node-literal-scan`はLSP解決ではなく、文字列の位置は実呼出し回数でもありません。Go to Definitionが使えても、Spring実proxy・実transaction・Java/DB実行や教育効果を確認したことにはなりません。

一次資料: [Workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context)（取得確認日: **2026-09-15**）。補足: [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)。これは文書確認であり、実UX・LSP・Agent利用の観測ではありません。このページは実機の可用性を認定しません。別承認の観測を行った場合も本編の三条件やRuntime bundleと混同せず、版・時点・要求範囲・返却範囲・未観測を分けて記録します。
