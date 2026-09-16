# HC-020 VS Code拡張から専用Toolを提供しよう

## Challenge Story

Evidence見出しと引用markerを数える小さな処理があります。普通のNodeで十分かもしれませんが、将来モデルから呼ぶToolにするなら、入力、説明、確認、error、cancel、解除まで契約が必要です。数えられたことを「文書の意味も正しい」と誤解させてはいけません。

このChallengeでは、同じ純粋なanalyzerを普通のNodeから実行し、Tool wrapper / manifestは不活性原稿として設計します。VS Code Extension Development Hostの起動、Tool登録、call、cancelのlive観測は任意ガイドへ分離します。

## この機能とは

近い機構を先に区別します。

| 機構 | このChallengeでの役割 |
|---|---|
| Language Model Tool | モデルが必要に応じて呼ぶ関数。manifest宣言と `vscode.lm.registerTool` が必要 |
| Chat Participant | `@`で選ぶ入口。request全体と応答を扱い、モデル呼出しは必須ではない |
| Custom Agent | 利用者が定義する役割、Instructions、tool構成。extension APIの関数登録とは別 |
| Subagent | 別コンテキストへ委任する実行。Participantの別名ではない |
| Agent Plugin | Skill等の配布・まとめ方。VS Code extension runtimeそのものではない |
| 普通のNode | 同じ純粋計算を確認する基準。Tool discovery、確認UI、cancel UI、lifecycleは再現しない |

例えばNodeとToolが同じ `[1,1,1]` を返しても、Toolが登録された、候補に出た、正しい引数で呼ばれた、確認された、cancelできたことまでは証明しません。また、literal countが合っても、引用先や文書の意味は検証していません。

公開資料は2026-09-15に [Language Model Tool API](https://code.visualstudio.com/api/extension-guides/ai/tools)、[Chat Participant API](https://code.visualstudio.com/api/extension-guides/ai/chat)、[AI extensibility in VS Code](https://code.visualstudio.com/api/extension-guides/ai/ai-extensibility-overview) を確認しています。API文書の存在と、利用中の版でのlive成功は別です。

## 向いていること / 向いていないこと

**向いていること**

- pure functionをNodeと将来のTool入口で共有する設計
- boundedな入力、明示的error、正直な出力説明を作る
- confirmation、cancel、Disposableをwrapper契約として点検する
- Nodeだけで十分、extension追加不要という判断を説明する

**向いていないこと**

- 同じ処理をNode版とTool版へコピーして別実装にする
- literal counterをMarkdown parser、source verifier、semantic evaluatorと呼ぶ
- stub成功をTool登録、発見、call、cancelのlive成功へ昇格する
- 通常profileへのinstall、Runtime rootのpackage上書き、Host起動を本編で行う

## Starter Kit

[Pack manifest](pack/manifest.json) の `sourceKind` は `synthetic`、sourcePathsは空配列、conditionsは `baseline` / `tool-contract` です。可視本文に **`SYNTHETIC_TRAINING_ONLY`** を置きます。

固定本文は次の4行と終端LFです。

| 行 | exact content |
|---:|---|
| 1 | `## Evidence` |
| 2 | `[[source:README.md#L1-L2]]` |
| 3 | `## Unknowns` |
| 4 | `実行時の挙動は確認していない。` |

各cellのinline codeの内容だけを1から4の順にLFで連結し、4行目の後にも終端LFを一つ付けます。backtickやtable記号は素材へ含めません。再構成した素材は97 bytes、SHA-256 `0dfd781d36e81e14011b9338a05039cb052c18f4d159eaa206aad2829152942b` です。

`[[source:README.md#L1-L2]]` はliteral計数用の合成文字列です。実Runtime READMEの存在、引用行、主張の正しさを検証しません。

Packは全conditionへ次を `.hackathon/challenge/hc-020/` に不活性配置します。

- `brief.md.template`、`request.txt.template`
- `starter/design.md.template`、`starter/comparison.md.template`
- `materials/analyzer.cjs.template`、`materials/counter-draft.txt.template`
- `reference/extension.cjs.template`、`reference/package.json.template`
- `starter/counts.md.template`、`starter/input-contract.md.template`

`analyzer.cjs.template` はfile / network I/Oや外部依存を持たないCommonJSのpure functionです。別のanalyzerや業務checkerを作らず、Node基準と将来wrapperから**同じ `analyze`** を呼びます。

入力契約は次のとおりです。

- JSON上、`text` というstring field一つだけのobject
- null、array、field欠落、空文字、空白だけ、非string、追加fieldはTypeError
- TypeError messageは `Provide exactly one nonempty string field named text.`
- 上限は **8,192 Unicode code points**。8,193以上はRangeError
- RangeError messageは `Draft text exceeds 8192 Unicode code points.`
- CRLFをLFへ正規化し、行全体がliteral `## Evidence` / `## Unknowns` の行を数える。末尾space / tabは許容
- fenced code block内も数えるためMarkdown parserではない
- `[[source:...]]` 形のmarkerを数えるだけで、path / URL / 引用内容を読まない

出力はexactに `evidenceSections`、`unknownSections`、`citationMarkers`、`semanticValidation` の4項目です。`semanticValidation` は常に `not-performed` です。

参考wrapperは入力検査と確認文を `prepareInvocation` に置き、`invoke` はtokenのcancelを確認してから同じanalyzerを呼びます。cancel時のmessageは `Evidence counting was cancelled.` です。同期counterの入口でcancelを確認することと、長時間処理を途中で強制停止できることは別です。

固定登録名はToolが `count_workshop_evidence`、prompt参照名が `workshopEvidence`。Participant IDは `workshop-local.evidence-counter.reader`、参照名は `workshop-evidence` です。宣言、登録、activationを一致させる設計にします。

必要なのはGit、Node.js 22以降、Markdown / JSON編集、Hubと自分の非公開Runtimeへの通常アクセスです。VS Code API、Development Host、extension install、LLMは本編に不要です。

## Open Question

**カウンターの結果を「文書は正しい」と誤解させない専用Toolにするには、入力、説明、出力、確認、cancel、解除をどう設計しますか。Nodeだけで十分なら、なぜextensionを追加しないのですか。**

Tool化する案と追加しない案の両方を認めます。実装量を増やすことではなく、入口を増やす価値と誤認・保守負担を説明する課題です。

## Design Time

全conditionでは `participant/hc-020/design.md` に共通設計を記録し、`tool-contract` だけは加えて `participant/hc-020/input-contract.md` に入力契約を記録します。Node実行前に次を設計します。

1. fixed 4 lines、終端LF、三状態、analyzer hashを凍結する。
2. input object、8,192 code points、TypeError / RangeError、追加field拒否を説明する。
3. 4 output fieldsと、`semanticValidation: "not-performed"` を利用者へどう見せるか。
4. Tool name、reference name、display / model description、confirmation message、cancel message、Disposable。
5. Participant、Custom Agent、Subagent、Agent Pluginとの違い。
6. Nodeだけで十分な条件、Tool入口が必要な条件、追加しない判断。
7. stubで点検できる契約と、Hostでしか観測できないdiscovery / call / cancel / disposeを分ける。

両conditionはfresh Runtime repository、named branch、新しいworkspace・run-idを使います。モデルは本編で使わず、「モデル不使用」と記録できます。

## Build

### Hub checkoutで2条件を確認する

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-020 --condition baseline --team team-sora --run hc020-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-020 --condition tool-contract --team team-sora --run hc020-tool-01
node .\scripts\build-pack.mjs --challenge HC-020 --output .runtime/packs
```

既存build出力は削除・上書きしません。

### conditionごとに新しいRuntime checkoutを使う

```powershell
$condition = 'baseline'
$runId = 'hc020-baseline-01'
$Pack = 'C:\work\hub\.runtime\packs\hc-020-v1'
git switch -c $runId
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $condition --run-id $runId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

`tool-contract` は別repository / runで開始し、run bindingを手編集しません。

### 宣言された成果物だけを作る

両conditionで次を作ります。

- `participant/hc-020/design.md`
- `participant/hc-020/counts.md`
- `participant/hc-020/counter-input.txt.template`

`tool-contract` だけ次を追加します。

- `participant/hc-020/input-contract.md`
- `participant/hc-020/extension.cjs.template`
- `participant/hc-020/package.json.template`

analyzerは `.hackathon/challenge/hc-020/materials/analyzer.cjs.template` の固定素材を使い、participant側へ別実装を追加しません。wrapper / manifestは不活性です。通常Nodeから `require('vscode')` して動かしません。

### 同じpure analyzerで三状態を確認する

各Runtime rootで、同じ明示CommonJS requireを使います。

```powershell
node --input-type=commonjs -e "const { analyze } = require(process.argv[1]); const fs = require('node:fs'); const text = fs.readFileSync(process.argv[2], 'utf8'); console.log(JSON.stringify(analyze({ text })));" .\.hackathon\challenge\hc-020\materials\analyzer.cjs.template .\participant\hc-020\counter-input.txt.template
```

1. **original**: fixed 4 linesと終端LFをparticipant copyへ置き、status 0と `[1,1,1]` を記録します。
2. **missing-heading**: `## Unknowns` の見出し行とその終端LFだけを除きます。最後の `実行時の挙動は確認していない。` は残します。これは有効入力なのでstatusは0、countsは `[1,0,1]` です。
3. **restored**: 同じ位置へ見出し行を戻し、元全文・bytes・hashとの一致、status 0、`[1,1,1]` を記録します。

最終 `counter-input.txt.template` はrestored bytesにします。中間本文、hash、resultは `counts.md` に残します。Unknowns本文まで削除したり、見出し欠落をinput errorへ作り替えたりしません。

全conditionで `allowedMutations: []` を維持します。Evidenceは `allowedAdditions` ではなく、Runtime所有の `.hackathon/evidence/hc-020/comparison.md` へ記入します。

## Compare

Hub共通の比較表示では `baseline` を **Baseline**、`tool-contract` を **Customized** と呼びます。Customizedはactive extensionやTool登録の適用・成功を意味せず、このChallengeで不活性なTool契約を設計する側の表示語です。

| condition | 同じanalyzerで行うこと | 比較上の非主張 |
|---|---|---|
| `baseline` | 普通のNodeから三状態を観測し、extension追加不要を含む設計を記録 | Nodeはpure calculationだけの基準 |
| `tool-contract` | 別runで同じ三状態を確認し、同じanalyzerを呼ぶTool wrapper / manifestの不活性原稿と契約を作る | 実Tool登録、発見、call、確認、cancelを観測した条件ではない |

両conditionで `[1,1,1] → [1,0,1] → [1,1,1]`（ASCII表記では `[1,1,1] -> [1,0,1] -> [1,1,1]`）が一致するのは意図した結果です。差は入口の設計、説明、error / cancel、保守負担、追加不要の判断にあります。

Nodeは将来Toolのpure calculationに対する限定対照ですが、確認UI、registration、activation、lifecycleの等価条件ではありません。stubで宣言名、確認文、cancel、result shape、Disposableを点検できてもlive Host成功ではありません。

結果は同等、悪化、追加不要、`blocked`、`unsupported`、`incomparable`、未観測を許容します。数値一致をsemantic accuracyやsource accuracyへ昇格しません。

## Evidence

各runの `.hackathon/evidence/hc-020/comparison.md` は次のexact 7見出しを使います。

`Fixed task` / `Environment` / `Design` / `Run log` / `Comparison` / `Outcome` / `Limits and cleanup`

- **Fixed task**: condition、run-id、fixed 4 lines、analyzer / Pack hash、三状態のexact post-image、`SYNTHETIC_TRAINING_ONLY`
- **Environment**: OS、Node version、整数status、起動error / signal / timeoutの有無、モデル不使用
- **Design**: input / output / error / confirmation / cancel / dispose、追加不要の判断
- **Run log**: original / missing-heading / restoredの本文hash、status、4 output fields
- **Comparison**: 相手run-id、同じanalyzer、同じinput、NodeとTool入口の非同等性
- **Outcome**: 同等、悪化、追加不要、blocked等と根拠
- **Limits and cleanup**: Markdown parse、source / URL確認、semantic validation、Tool / Participant登録、Host、LLM、教育効果を観測していないこと

負例を行う場合は、processが実際に起動したこと、正のPID、整数status、signal / timeoutなし、期待したTypeError / RangeErrorを先に確認します。`status !== 0` だけでENOENT等の起動失敗を成功扱いしません。

`runtimeBehavior` と `educationalEffect` は `not-observed` のままです。stub、Node、synthetic、liveを別欄にします。

## Submit

各conditionの許可成果物と記入済みEvidenceを検査・exportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

baselineのRuntime PRには3つの共通成果物、tool-contractにはそれらと `input-contract.md` / `extension.cjs.template` / `package.json.template` を含めます。別analyzer、active extension、Host logは含めません。

[共通Challenge Result Issue](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ各run、Runtime PR、Pack、三状態、比較結果を対応付けます。`Challenge-specific design` には、Nodeだけで十分 / 不足する理由、Tool名と説明、input contract、confirmation、cancel、dispose、literal countの限界を書きます。

## Judging

- Language Model Tool、Chat Participant、Custom Agent、Subagent、Agent Plugin、Nodeを区別したか
- baselineとtool-contractがexact same analyzerを呼び、コピー実装を作っていないか
- fixed 4 linesと三状態のpost-image、status 0、復元bytesを確認したか
- input、8,192 code points、error、4 output fieldsを正確に説明したか
- confirmation、cancel、registration / activation / disposeの契約を設計したか
- Node / stub成功をTool discovery / call / semantic accuracyへ昇格していないか
- equal / worse / blocked / 追加不要を有効な結果として扱ったか

Toolを登録した数、marker数、extensionの行数では採点しません。契約の正確さ、同一処理、誤認防止、保守理由を人が確認します。

## Bonus Mission

本編の三状態を変えず、空白だけのinputまたは8,193 code pointsのどちらか一つについて、期待するerror type、message、process成立の確認方法を設計してください。未審査コードの実行、別analyzer、追加conditionは作りません。

## Support / Fallback

次の任意routeは `OPTIONAL_GUIDE_ONLY` / `live-unobserved` で、本編とは別の将来観測です。

- [extension-tool-host: Language Model ToolのHost準備](optional/extension-tool-host.md) — 承認済みDevelopment Host、独立した開発folder、対応API / client、selection、confirmation、call、cancel、disposeの観測許可が必要です。
- [chat-participant-host: Chat ParticipantのHost準備](optional/chat-participant-host.md) — Toolとは独立したParticipant入口で、同じanalyzerとfixed textを使います。Participant応答をTool conditionの得点へ合算しません。

Runtime v1は開発folderやHost運用を許可せず、extension development / Tool observationは未確認です。通常profileへのinstall、既存package上書き、候補表示不明、client不在、未知の追加model callがある場合は停止します。

将来Hostを準備する場合も、別承認した新しいfolderで `package.json.template` → `package.json`、`extension.cjs.template` → `extension.cjs`、同じ `analyzer.cjs.template` → `analyzer.cjs` とし、`require('./analyzer.cjs')` を保ちます。本編では展開・install・F5起動を行いません。

Nodeが使えなければ `blocked`、Host非対応はoptional routeだけ `unsupported` とできます。終了時に整理するのは自分のparticipant原稿と当該runだけで、通常profile、既存extension、Runtime root package、User設定を変更しません。
