# HC-013 / space-read — 許可済みSpaceの読取条件を確認する

## Guide scope

`OPTIONAL_GUIDE_ONLY` / `live-unobserved`。
[HC-013本編](../README.md) とは別の、任意の準備確認ガイドです。ガイドを読んだだけで実機試行を始めません。
本編はローカル資料設計だけで提出でき、実Space、認証、source ACL、同期は本教材作成時には未観測です。
新しいSpaceを作って教材を揃える手順ではありません。

## Prerequisites

- 本編とは別の使い捨てworkspace・新規会話で、IDEの版、Agentモード、remote GitHub MCPの既存構成を確認できること。
- 所有者が既に承認した専用教材Spaceのexact owner/nameと、凍結したinstructions・カードJSON全文を照合できること。
- 本人のCopilot利用資格、既存の正規認証、組織のMCP policy、対象Spaceと各sourceの既存閲覧権を個別に確認できること。

上記は条件であり、確認済みの資格ではありません。
[Using Spaces](https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/use-copilot-spaces)
のIDE説明（参照日2026-09-15）ではAgentモードとremote MCPが必要です。
IDEで利用できるのはAdd text content、GitHubの個別ファイル、issues、pull requests、Space instructionsです。
**repository contextとuploadしたファイルはIDE非対応**です。Webで見えることからIDE対応を推測しません。
同じ文章でもAdd text contentとUpload a fileはsource typeが違います。

[About Spaces](https://docs.github.com/en/copilot/concepts/context/spaces) はFreeを含むCopilot licenseと、
利用者にseatを与える組織に基づく資格を説明します。組織名だけで利用可否を決めません。
[GitHub MCPのIDE利用](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/use-the-github-mcp-server?tool=vscode)
の一般資格・policyと、Spaces固有の利用条件は別に確認します。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

- 環境と教材の所有者から、既知のexact owner/nameに対するget_copilot_spaceの読み取りだけを行う独立試行の承認を別途得ること。
- 承認は既存の認証・閲覧権の範囲に限り、新規共有、source追加、upload、PAT発行、OAuth・ACL・組織policy変更を含めないこと。

条件が揃った将来の実機計画でも、対象は既知owner/nameの `get_copilot_space` だけです。
実引数は**その場で発見したtool schemaを読む**ことが必要で、推測した引数JSONは送りません。
`list_copilot_spaces` で候補を探しません。曖昧な名前での自動list探索も許可しません。
既存設定を削除・追加して接続条件を作ることや、通常アカウントの認証解除はこのガイドの対象外です。

本編の `github-spaces.mcp.json.template` は不活性な参照で、有効化手順ではありません。
[公式remote-server資料](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md)
にある `copilot_spaces` はremote-onlyのserver側toolsetで、VS Code Tool Setsとは別です。
local serverへ同名flagを付けても代用できません。`X-MCP-Readonly: "true"` はread toolへの絞込みで、
Space/source閲覧権の付与ではありません。本編Packは `.vscode/mcp.json` を許可しません。
Runtime v1でpathを追跡できることも、今回のgrantや実call成功の根拠にはなりません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| remote-spaces-read | not-checked | Runtime v1はremote MCPの初期化・tool発見・認証・get_copilot_spaceの実callを観測しない。 |
| source-acl-observation | not-checked | Runtime v1はSpace閲覧権と個別source閲覧権、返却内容の版・範囲を実機検証しない。 |

どちらも対応済み・readyという表示ではありません。準備情報が空でも未確認であり、実行支援にはなりません。
準備表示だけならHubで次を使えます。exit 0でもnot-checkedで、条件・team・runは混ぜません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-013 --route space-read
```

別承認の将来計画では、通信/MCP初期化、tool discovery、enabled状態、正規認証、組織policy、
Space ACL、source ACL、source type、実callの返却内容・版・範囲、解釈を個別の観測欄にします。
接続成功、tool名の表示、Spaceが見えることのどれも、資料本文が読めたこととは違います。

## Stop / Block

- exact owner/nameが不明、対象が他人のSpace、または事前承認の対象と違う場合は停止する。
- instructions・JSON全文・source種別・版・範囲が一致しない、またはpartial/empty/error/missingで全文を確認できない場合は停止する。
- 新しい認証、権限拡大、新規共有、資料追加、upload、PAT発行、設定変更が必要なら実機試行は未実施にする。
- 組織policy、利用資格、Space ACL、source ACL、追加承認のどれかが未確認なら実機試行は未実施にする。

停止後は未実施でよく、本編へ戻れます。404、読取失敗、本文なしから不存在やdenyの原因を断定しません。
他人のSpaceを探索して穴埋めせず、未解決mainの本文を固定sourceから補充しません。
[Creating Spaces](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/copilot-spaces/create-copilot-spaces)
の最新mainへの追随という説明は、固定Runtimeとの版一致を保証しません。
[Collaborating](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/copilot-spaces/collaborate-with-others)
にあるSpaceのviewer/editor/admin/no accessと、元sourceの閲覧権は別です。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

既に許可された教材Spaceがある将来の実機試行では、Space instructionsを凍結instructions文字列と照合し、
Add text contentにある**カードJSON全文**をB/Cの全文と比較します。新たに追加する手順ではありません。
`textContent.text` だけを取り出す方法では、limitations、配列、revision、未提供の履歴、source ACL属性が欠けます。
MCPのenvelopeと教材JSONを分け、objectのkey順だけは正規化できますが、配列順・値・欠落を無視できません。
本編B/Cのraw bytes一致と、実取得の全field一致は別欄です。返却を観測できなければ一致はunknownであり、
手元原稿から欠けたfieldやhashを補って取得済みにしません。

本編のformatVersion 2カードは、原本の認証値を含む6行全体だけを明示markerへ置換した
sanitized全体displayを運びます。原本whole-source hashとdisplay whole-text hash、変換receiptを区別し、
原本byte-exactの取得とは呼びません。もし将来の許可済み教材Spaceがこの同じdisplay版を持たない場合は
比較不能で停止し、Spaceの更新やsource追加をして揃えることはしません。IDEのsource種別・ACL条件は変わりません。

実callの対象・source種別・版・範囲と本文投入の観測、保存hash、解釈を別々に記録します。
原稿の再hash、local source読取、合成の `aclVerified: false` を実Space取得・実ACL拒否へ昇格しません。
本編runへ実機設定や生ログを入れず、[Submission Guide](../../../docs/submission-guide.md) の任意欄に
未実施理由または別承認の独立runへの安全な参照だけを残します。secret、実アカウント名、実データは保存しません。
実機終了後の片付けも承認済み追加分だけを対象とし、同じ会話には取得済みcontextが残り得ることを記録します。
