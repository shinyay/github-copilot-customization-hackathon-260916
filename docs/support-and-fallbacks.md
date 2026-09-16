# Support and Fallbacks

[Support Matrix](generated/support-matrix.md) で各Challengeの通常経路とFallbackを確認できます。

## First checks

1. Challengeが「公開中」か確認する。
2. Runtime template versionがPackのminimumを満たすか確認する。
3. 新しいrepository / workspace / conversation / profileを使ったか確認する。
4. Overlay destinationが既に存在しないか確認する。
5. client、host、OS、channel、model、effort、toolsを記録する。
6. 機能名やUIが見つからない場合、推測で別機能へ置き換えない。

## Fallback policy

Fallbackは機能を偽装するためではなく、同じ設計判断を手作業で比較できるようにするものです。たとえば、Prompt Fileが使えない場合は内容を明示的に貼る、Agentが使えない場合は固定packetを人が役割ごとに渡す、MCPが使えない場合は合成noteを手動で読む、といった方法を使います。

Fallbackを使った結果は通常経路と同一とは限りません。何を代替し、何を比較できなくなったかを書き、必要なら `incomparable` または `unsupported` を選びます。

## Optional guides are not execution support

本編のFallbackと、登録済みの任意ガイドは別です。任意ガイドは追加の環境・entitlement・承認と停止理由を説明しますが、
Packのcondition、許可path、Evidenceや合否を追加しません。未実施のままで問題ありません。

`live-unobserved` は実機未確認、`not-checked` は準備完了と判定できない状態です。
環境・資格の未確認と、Runtime v1で既知のcapability不足による `blocked` を区別します。
dry-runが終了code `2` と `OPTIONAL_ROUTE_BLOCKED` を返した場合、JSONが出ていても成功として進めません。
任意の記録は共通Issue FormのOPTIONAL欄に分離し、本編のOutcomeやRuntime verifier成功へ足し合わせないでください。
具体的なv1制約は [Runtime repository guide](runtime-repository-guide.md) を参照してください。

## Reporting a block

Hub Issueに次を残します。

- どの手順まで進んだか
- 実際のエラーまたは見つからなかったUI
- client / host / OS / channel
- 試した安全なFallback
- 残ったunknown
- secretや内部情報を除いた最小Evidence

権限回避、警告の無視、実データへの接続、未承認softwareの導入はFallbackではありません。
