# Runtime Repository Guide

## HubとRuntimeの境界

HubはChallengeを説明し、不活性なPackを配り、提出を集約します。実際のJavaコード、Customization、実行ログ、PRは
[`shinyay/github-copilot-customization-runtime-template`](https://github.com/shinyay/github-copilot-customization-runtime-template)
から作ったRuntimeリポジトリに置きます。

HubのPackをそのまま実行しないでください。すべてのpayload sourceは `*.template` であり、Hubでは意図的に不活性です。

## Pack適用の安全規則

Runtime consumerは `--condition` を必須とし、manifestの該当 `overlay` を順番に読みます。

1. conditionがmanifestの `conditions` に存在することを検証する。
2. sourceとdestinationがrepository-relative POSIX pathであることを検証する。
3. sourceが `payload/` 配下の不活性ファイルであることを検証する。
4. destinationが `.hackathon/challenge/**` の不活性領域であることを検証する。
5. destinationがすでに存在したら停止する。`allowOverwrite` は常に `false`。
6. 該当conditionのStarter materialだけをpure byte-copyする。active fileを作らない。
7. 参加者がStarterを読み、`allowedAdditions` に一致するactive artifactを新規作成する。
8. Pack外の設定や既存参加者ファイルを暗黙に変更しない。

Hubの `plan-run.mjs` はこの予定を表示するだけで、コピーもリポジトリ作成も行いません。

資料・設計比較のconditionでは `allowedMutations: []`、`allowedAdditions: []` が有効です。
ただしPack全体には1件以上のinert overlayが必要です。Evidenceは `.hackathon/evidence/**` のrun-stateであり、
`allowedAdditions` に重複登録しません。合成教材の本編でもimmutable baseline/provenanceは維持します。

## Coreとoptional guideのdry-run

従来の呼出しは本編（`core`）のままです。次の2つは同一のJSONを返します。

```console
node scripts/plan-run.mjs --dry-run --challenge HC-001 --condition baseline --team team-sora --run run-01
node scripts/plan-run.mjs --dry-run --challenge HC-001 --route core --condition baseline --team team-sora --run run-01
```

本編は公開済みChallengeの有効なPackと宣言済みconditionを必要とし、既存の安全検査を維持します。
JSONは `mode: "dry-run"` のままで、実際のapply、remote作成、権限変更はしません。

登録済みの任意ガイドについて、以下の形式で準備条件を表示できます。
対象Challengeとroute IDは [Support Matrix](generated/support-matrix.md) と本編で確認します。
Phase 1の6ガイドはHC-003、HC-004、HC-005にあり、未登録の名前は利用できません。

```console
node scripts/plan-run.mjs --dry-run --challenge HC-005 --route user-scope
```

任意経路は `--condition`、`--team`、`--run` と混在させられません。
任意ガイドの構文検査には、Hub checkoutで `npm ci` によりauthoring依存を準備してください。
parserは任意経路の検査時にだけ読み込み、本編の従来呼出しは依存を追加せず利用できます。
Packは読まず、ガイドの登録・安全な通常ファイル・本編とのリンク・安全説明を確認します。
ファイル注入、実機起動、プロビジョニング、別runの計画は生成しません。
出力schemaは [`run-plan.schema.json`](../schemas/run-plan.schema.json) の別alternativeです。

| Optional出力 | 意味 |
|---|---|
| `mode: "optional-guide"` | 非実行のガイド・準備確認 |
| `challenge` / `route` | 対象ChallengeとガイドのID、名前、path。`required: false` |
| `prerequisites` | 環境・entitlement・追加承認の説明。観測・付与した資格ではない |
| `runtimeRequirements` | capabilityごとの `blocked` / `not-checked` と理由 |
| `readiness` | `status` と `runtimeCapabilities` は1件でもblockがあれば `blocked`。空・未確認だけなら `not-checked` |
| `readiness.environment` / `.entitlements` / `.additionalApprovals` | 常に `not-checked`。catalogを読んでも利用者の環境・権限は確認できない |
| `liveStatus` / `stopReasons` | 常に `live-unobserved` と、停止・未実施理由 |

| 終了code | stdout / stderrと解釈 |
|---|---|
| `0` | 本編計画または未確認ガイドのJSON。任意ガイドでは**表示の成功でありreadyではない** |
| `1` | 未知route、未公開Challenge、引数混在、不正metadata・ガイド等。stderrに理由、成功JSONは出さない |
| `2` | 既知のRuntime capability block。stdoutにガイドJSON、stderrに `OPTIONAL_ROUTE_BLOCKED`。成功扱いにしない |

任意経路を選んでも、追加承認、実環境やentitlementの確認を省略できません。
ガイドの完了を本編の改善やRuntimeの検証成功へ集約せず、未実施理由を共通Issue Formの任意欄へ分けて記録します。

## Isolation

- Challengeごとにfresh repositoryを使う。
- BaselineとCustomizedはページ指定のcondition strategyに従う。
- 新しい会話で条件間の記憶を切る。
- Customization discoveryを比較する場合はfresh profileまたは同等の分離を使う。
- 実行中process、MCP server、watcherを記録し、比較後に停止する。
- `branchSafe` は `single-workspace` でだけtrueにできます。`separate-workspace` / `separate-repository` はfalseで、Runtimeのcondition strategyを優先します。

## Version checks

Contract v1 Packは整数の `schemaVersion: 1` と `minimumTemplateVersion: 1` を宣言します。Runtime側がこれらを満たさない場合は注入せず、Hub Issueで `blocked` または `unsupported` として報告します。

実験を始める前にRuntimeの `.hackathon/template.json` がtemplate version 1を示し、共有Schema / glob fixture / Pack hash fixtureが
[`catalog/contract-artifacts.json`](../catalog/contract-artifacts.json)
のRuntime pathとSHA-256に一致することを確認します。markerやconsumerがない古いtemplateは使用せず、`blocked` として扱います。

Runtime v1はsource applicationの `.gitignore` と重いpush/PR workflowをそのまま運用に持ち込みません。template側で、source workflowをmanual-onlyにするoverrideと、`.vscode/mcp.json` だけを許可する`.gitignore` overrideを提供します。HC-011の参加者はforce-add手順を使いません。

## v1の未対応境界

共有Pack schema / glob / hashが一致しても、HubとRuntimeのactive path分類がすべて同じという意味ではありません。
Hubは `.agents/skills/**` をactiveとして扱いますが、Runtime v1はroot `.agents`、
`.vscode/settings.json`、extension source、setup workflow等を汎用のpathとして分類します。
この差を対応済みの機能やpath許可の根拠にせず、default-denyと宣言済みの制限を維持します。

`.vscode/settings.json` はgitignoredで、例外は `.vscode/mcp.json` だけです。
設定案が必要なら本編の宣言済み不活性成果物に保存し、`git add -f` を回避手順にしません。
任意routeで追跡済みsettingsが必要なら `tracked-vscode-settings` を `blocked` とします。

v1の `branchSafe: false` runは名前付きapply branchにbindingされます。
Cloud Agentが別branchを作ると、そのままではverifyを通せません。
少なくとも将来のHC-029・HC-045で必要になる任意cloud writeは、
別途承認された限定的なRuntime handoffができるまで `cross-branch-handoff: blocked` です。
`run.json` 編集、`branchSafe` の偽装、allow-allで代替してはいけません。
任意実機用Runtime拡張は本編・ガイド制作とは別の将来フェーズです。

Runtime exporterの `runtimeBehavior` と `educationalEffect` は静的検証では `not-observed` のままです。
将来、別に実機receiptを集めたとしても、その記録は静的verifierの成功とは別物です。

## Path ownership

| Ownership | 意味 |
|---|---|
| `baseline-owned` | pinned 515-file source baseline由来（2つの運用overrideを含む） |
| `template-owned` | Runtime templateが管理 |
| `run-state` | Runtimeがrunごとに管理（`.hackathon/evidence/**` を含む） |
| `pack-applied` | `.hackathon/challenge/**` にbyte copyされた不活性Starter |
| `participant-addition` | manifestが許可し、参加者がactive artifactを新規作成 |
| `submission-bundle` | flatな不活性名へexportされた提出bundle |
| `ignored` | submissionや検証の対象外 |
| `violation` | 所有権またはconditionに反する変更 |

## What belongs in the Runtime PR

- 参加者が新規作成したCustomizationと、自分で行った変更
- Challenge指定のEvidence file
- 再現手順
- BaselineとCustomizedの結果
- 環境差、失敗、unknown
- 必要部分へ絞りredactしたEvidence（secretやraw logは提出しない）
