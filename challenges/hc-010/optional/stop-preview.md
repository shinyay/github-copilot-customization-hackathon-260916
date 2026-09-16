# Stop Previewの準備と未確認の境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved

これは将来の独立したStop試行を検討するための**任意の準備確認**です。
[HC-010本編](../README.md) はsource読解、手動確認契約、不活性な通知設計だけで提出できます。
このガイドは実行計画ではなく、Hook作成、設定変更、checker起動、チャット送信を始めません。
読むだけならguide-only、実践を選ばなければ未実施で構いません。

## Prerequisites

### environment

- 対象のLocal AgentとHooks対応版を特定できること。
- extension hostのOSとNodeの版を確認できること。
- 今回専用の使い捨てworkspaceと既存Hookの分離方法を確認できること。

### entitlements

- 対象環境でCopilotとHooksを利用でき、組織ポリシーが許可していること。

これらはnot-checkedです。Windowsの画面でもextension hostがWSLやRemoteなら別環境です。
配布したWindows向けcommandをLinux/WSL用と表示しません。
新規repository・profile・会話だけでUser/HomeのHookやMemoryまで隔離されたとは判断しません。
既存設定の内容を公開する必要はなく、一括削除して対照を作ることもしません。

仕様の参照先は [Agent hooks](https://code.visualstudio.com/docs/agent-customization/hooks) と
[Hooks reference — Stop](https://code.visualstudio.com/docs/agents/reference/hooks-reference#_stop) です。
公式資料の確認日は**2026-09-15**（制作側で再取得）です。再確認した資料でもHooksはPreviewであり、
実際に使う版・組織ポリシー・extension host OSの確認は別に必要です。
Stopの時点は概要のイベント表の略記ではなく、詳細referenceの「current agent execution stops」を採用します。
セッションの停止や非アクティブ化を示すものではありません。文書確認や合成stdinテストは、当該clientでの発火・表示の観測ではありません。
Web表示からJSONの入れ子を推測せず、構文は同梱の原本テンプレートを参照します。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

- 対象script、使い捨てworkspace、Stopの有効化と今回の追加分の解除について所有者の別途明示承認を得ること。

承認はnot-checkedです。本編のcore Packはactive Hookと原本
`.runtime\independent-labs\lab-10` layoutを許可していません。
ガイドを選んでも許可pathやconditionは増えず、適用済みcore runへ追加する手順はありません。
実操作を検討する段階では、必要path・run binding・隔離・停止と解除の範囲を確定した別計画が必要です。

原本CLIの説明は `node <checker.mjsの実在パス>`、追加引数なしです。
`--run-id` は `uncheckable / UNEXPECTED_ARGUMENTS / exit 2` になります。
プロセスcwdのselector、選択されたdraft directory、依頼、記録を同じrunへ対応付けます。
Hook入力のcwdで切り替わるとは説明せず、草稿内run markerも発明しません。
ここにactive selectorやHookを作るコマンドは載せません。

## Runtime capabilities

live-stop-event — not-checked

実Stopの発火、checker呼出し、通知表示の相関をRuntime v1は観測していない。

isolated-hook-state — not-checked

User/HomeのHookと今回の追加分の分離・解除をRuntime v1は検証しない。

本編Packの検査やガイドのdry-run成功は、これらの実行サポートやreadinessの証明ではありません。
将来観測するなら、設定発見、実Stop、呼ばれた同一checker、checker result/code/exit、
adapter出力/exit、画面表示を別々に結び付けます。合成stdinは実イベントの代用になりません。
Stopは現在のAgentの応答停止であって、セッションやウィンドウを閉じる時ではありません。
`continue: true` のnonblocking通知を維持し、auto-fix、新しいAIターン、反復を要求しません。
`stop_hook_active: true` ならchecker起動前のskippedです。adapter exit 0をchecker passにしません。

共通出力の `continue` は既定でtrueで、falseはセッションを停止します。`systemMessage` は警告を伝える欄です。
Hookプロセスのexit 0はstdoutをJSONとして解釈し、exit 2はblockingです。内部checkerのexitとは別の層です。
Stopの `hookSpecificOutput` 内の `decision: "block"` は追加ターンにつながるため、
本教材の原本adapterはその出力を使わず、明示的な `continue: true` だけの通知方針を保ちます。

## Stop / Block

- 所有者の別承認またはHooksの利用許可が未確認なら停止する。
- extension hostのOSまたはNodeの版が不明なら停止する。
- 別のHookが混入し、今回の追加分だけを分離・解除できないなら停止する。
- selector、run directory、依頼のbindingが一致しないなら停止する。
- core Packの許可外pathを本編runへ追加する必要があるなら停止する。

停止後は未実施で構いません。回避のために既存設定を削除したり、別harnessへ黙って切り替えたりしません。
本編はそのまま提出できます。将来の試行で解除を扱う場合も、対象は今回自分が追加したものだけです。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

読解だけなら共通Issue Formの任意欄へguide-onlyと未確認の理由を書きます。
架空のrun ID、通知receipt、UI操作回数、実Stopログは作りません。
将来の別承認試行の記録があっても、本編の2条件と合成caseのEvidenceには混ぜません。
実アカウント名、HOMEの実path、資格情報、生transcriptを提出せず必要最小限の説明にします。
このガイドのliveStatusはlive-unobserved、実機挙動と教育効果はnot-observedです。
