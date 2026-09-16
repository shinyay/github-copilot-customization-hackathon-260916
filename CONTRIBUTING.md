# Contributing

Hubへの変更は、参加者が過去のLABや非公開の解答資料に依存せず、Challengeページだけで安全に実験できることを優先します。

## Rules

- Challenge本文を参加者向けの唯一の手順書にする。
- `catalog/challenges.json` は公開状態、由来、運営者の公開順、任意ガイドの準備条件を管理する。生成する本文は索引とSupport表だけで、Challengeの実行手順は手書きMarkdownを維持する。
- Packは `manifest.json` と `payload/` 配下の不活性な `*.template` だけで構成する。
- `.github/copilot-instructions.md`、`*.instructions.md`、`*.prompt.md`、`*.agent.md`、`SKILL.md`、`.vscode/mcp.json` をHub内で有効な名前として追加しない。
- Overlay先は `.hackathon/challenge/**` の不活性領域だけにする。既存ファイルがあれば上書きせず、active artifactは参加者がRuntimeで新規作成する。
- 正解ラベル、採点者だけが知る判定表、Instructor-only解答を追加しない。
- 製品機能が利用できないケースを失敗扱いにせず、Fallbackと `unsupported` 結果を保つ。
- 実データ、認証情報、顧客情報、社内限定情報をfixtureやEvidenceへ含めない。

## Change flow

```console
npm ci
npm run render
npm run test:targeted
npm run verify
```

Challengeを公開する変更では、ページ、Pack、Catalog、共通Issue FormのChallenge ID選択肢、Pack hash一覧を同じPull Requestで更新します。Formは手書きのまま維持し、全体generatorや2つ目のFormを追加しません。生成対象の文書は
`docs/generated/challenge-index.md` と `docs/generated/support-matrix.md` だけです。
新しいPack contractやtemplate versionへ依存する場合は、対応するRuntime foundationを先にmergeできる状態にし、Hub Pull Requestへ依存関係とmerge順を明記します。

Packの再現性は次で確認できます。hash定義とglob fixtureはRuntime v1と共有し、`catalog/pack-hashes.json` の期待値も確認します。

```console
node scripts/build-pack.mjs --challenge HC-001 --output .runtime/packs
npm run hashes:check
```

出力ディレクトリと隣接する `.sha256` は生成物のためコミットしません。

## Maintainer release plan

`catalog/challenges.json` の `releasePlan` は制作・公開と内容確認の順序だけを記録します。
公開状態の唯一の正本は各Challengeの `status` です。公開後もwaveからIDを消さず、
`currentWave`、公開数、承認済み状態などを重複登録しません。

| Wave | 新規制作・公開するID |
|---|---|
| 1 | HC-002, HC-003, HC-004, HC-005, HC-008 |
| 2 | HC-010, HC-012, HC-013, HC-014, HC-015 |
| 3 | HC-016, HC-017, HC-018, HC-019, HC-020 |
| 4 | HC-021, HC-022, HC-023, HC-024, HC-025 |
| 5 | HC-026, HC-027, HC-028, HC-029, HC-031 |
| 6 | HC-032, HC-033, HC-034, HC-035, HC-036 |
| 7 | HC-037, HC-038, HC-039, HC-040, HC-041 |
| 8 | HC-042, HC-043, HC-044, HC-045 |

`reviewBetweenWaves: true` に従い、各waveの完了報告・人による内容確認を挟み、承認なしに次へ進みません。
CIは配列の欠落・追加・重複・順序違いとflagを検査しますが、人の内容承認を観測・代行しません。
`participantPrerequisite: false` は固定です。参加者に前waveや元LABの履修、フェーズによるunlockを要求しません。
Phase 0はこの基盤の整備だけで、新規Challengeの制作・公開を含みません。

## Source metadata

公開時は `sourceKind`、`sourcePaths`、`optionalRoutes` を必須とします。計画中のentryにはこれらの未確定metadataや仮のページ・Packを埋めません。

| sourceKind | sourcePathsと本文の要件 |
|---|---|
| `baseline` | 固定source baselineに存在するexact pathを1件以上、重複なく指定し、本文でも各pathを説明する |
| `synthetic` | 必ず `[]`。Starter Kit章の本文に `SYNTHETIC_TRAINING_ONLY` を表示し、合成教材であることを説明する |

合成課題のために架空のJava pathを作らないでください。`baseline` 課題で併用する合成メモ等も、素材ごとのsyntheticラベルを保持します。
合成教材を使っても、Runtimeの515-file baseline、provenance、2件の運用override、不変検査は残ります。

[`catalog/source-baseline-paths.json`](catalog/source-baseline-paths.json) はネットワーク不要の**path-only inventory**です。
source repository `shinyay/code-to-doc-workshop-260910`、commit `398d7d1982a1402bcdba00d6c3ded67d8d338787`、
実Git tree `5c76826366ecd02f432357b3ad0d74b9f4a6fce6` に対応します。
GitHubの固定commitの `git/commits` 応答でtreeを解決し、recursive `git/trees` 応答が
`truncated:false` であることを確認して、`type:blob` の515件だけを採取しました（すべてmode `100644`）。

`paths` は安全なrepository-relative POSIX pathをUTF-8 byte順に整列した配列です。
重複・NFC/case collision・欠落を拒否します。`pathSetSha256` は整列したpathをLFで連結し、末尾にもLFを1つ付けたUTF-8 bytesのSHA-256で、
`3dd148b78dae9130214205e0f5f77996c1292dc4189f95086e3a6e8438153df3` に固定します。
pathの差替えやinventoryのprovenance変更も検査します。source bytes・内容の意味・学習上の適切さを検証する資料ではなく、
既存のsource tree SHA-256 `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` の代替ではありません。
source変更が必要な場合は固定commitから再検証する別の変更として扱い、path検査を緩めて通さないでください。

## Optional guide contract

`optionalRoutes: []` は有効です。Phase 0では本物の任意ページやrouteを追加せず、隔離fixtureで契約を検証しました。
Phase 1ではHC-003・004・005に計6ガイドを登録しています。現在の導線は [Support Matrix](docs/generated/support-matrix.md) を参照してください。
登録するrouteは**ガイド・準備確認だけ**のclosed objectで、次の全fieldを持ちます。

| Field | 契約 |
|---|---|
| `id` | 小文字英字で始まる英数字・ハイフン、最大32文字。Challenge内で一意。`core` は予約済み |
| `title` | 空でないガイド名 |
| `page` | `challenges/hc-NNN/optional/<id>.md`。対応するChallenge配下の安全な通常ファイル |
| `required` | 常に `false` |
| `prerequisites` | `environment`、`entitlements`、`additionalApprovals` の3つだけを持つobject。各値は重複のない説明文字列配列で、空配列も可 |
| `runtimeRequirements` | `{ capability, status, reason }` の配列。capabilityはidと同じslug形式で重複禁止。statusは `blocked` または `not-checked`、reasonは空でない説明 |
| `liveStatus` | 常に `live-unobserved` |
| `stopReasons` | 1件以上の重複のない停止・未実施理由の説明 |

route、prerequisites、runtime requirementの未知fieldは拒否します。
`conditions`、Pack、Evidence、outcome、grant、許可path等を追加して実行可能な任意runを装うことはできません。
v1で既知の `cross-branch-handoff` と `tracked-vscode-settings` は `blocked` が必須です。
他のcapabilityも観測済み・対応済みとは表示せず、未知なら `not-checked` とします。
1件でも `blocked` があればRuntime readiness全体を `blocked` にし、空集合は `not-checked` とします。

本編からガイドへ、ガイドから本編へ、本文中の相対Markdownリンクを置いてください。
エスケープされた文字列、コメント、コード、raw HTML block、画像のURLだけでは導線として認めません。
通常のinline/referenceリンクとangle-bracket付きdestinationは有効です。必須案内として認めるのはMarkdownリンクだけで、
raw HTML anchorからhrefを拾って補完しません。
構文tokenを使って実際のMarkdownリンクと本文を区別するため、リンク・guide・合成教材の検査には固定版 `markdown-it` を使います。
`npm ci` でlockfile通りの依存を用意してください。本編のrun計画ではparserを読み込まないため、従来のcore CLIには追加の実行前提を課しません。
lockfileは各環境のregistryから解決できるよう、registry固有の `resolved` URLを省略し、versionとintegrityを保持します。
依存を変更するときは `npm install --package-lock-only --omit-lockfile-registry-resolved=true` でlockを更新します。
未登録ページ、欠落、別Challengeのpath、
symlink/junction経由や通常ファイルでないページは拒否します。
ガイドは次の6見出しをこの順で1回ずつ持ち、それぞれに説明を書きます。補足にはH3以下を使えます。

| 見出し | 説明・検査対象 |
|---|---|
| `Guide scope` | `OPTIONAL_GUIDE_ONLY` と `live-unobserved`、本編へのリンク、任意であること |
| `Prerequisites` | environment / entitlementsの条件と未確認部分 |
| `Permissions / Safety` | 追加承認の条件と「このガイドは権限を付与せず、実機実行を開始しません。」 |
| `Runtime capabilities` | 各capability、status、reason。条件が空でも未確認であり実行サポートではない旨 |
| `Stop / Block` | 全stopReasonsと、停止後は未実施でよいこと |
| `Evidence / Non-claims` | 「任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。」と、記録の分離 |

詳細なCLI契約とv1の未対応境界は [Runtime repository guide](docs/runtime-repository-guide.md) を参照してください。
任意実機用のRuntime拡張は別途承認する将来フェーズであり、ガイドを登録しても有効にはなりません。

## Submission ownership

実際の提出は共通Issue FormとRuntime PRです。Runtime bundleの検証はRuntimeが担当します。
[`schemas/hub-result-draft.schema.json`](schemas/hub-result-draft.schema.json) は将来集約用の非規範草案で、
Runtime exporterの形式や、Hubの実装済み取込契約ではありません。
名称と限定helperの責務は [Submission guide](docs/submission-guide.md) を参照してください。
