# 許可済み Copilot Space を読み取る前の確認ガイド

**言語:** **日本語** / [English](../../../en/challenges/hc-013/optional/space-read.md)

[HC-013 本編へ戻る](../README.md)

## 目的

HC-013 で設計したローカルカードと、既に用意されている専用 Copilot Space の内容を
安全に照合するための補足ガイドです。新しい Space を作る手順ではありません。

確認する層を分けます。

1. リモートGitHub MCPへ接続できるか。
2. Copilot Spacesのツールを利用できるか。
3. 対象 Space を閲覧できるか。
4. Space が参照する各ソースを閲覧できるか。
5. 返された本文・版・範囲が、ローカルの固定資料と一致するか。

接続に成功したことやSpace名が表示されたことだけを根拠に、ソース本文を取得できたとは判断しません。

## 前提

- HC-013 本編を完了し、`work\context-card.json.template` を検証済みであること。
- 本編とは別の使い捨てワークスペースと新しい会話を使えること。
- 所有者がすでに承認した専用教材Spaceの正確な `owner/name` が分かっていること。
- Copilotの利用資格、既存の正規認証、組織のMCPポリシーを確認できること。
- 対象Spaceと各ソースの既存の閲覧権を、それぞれ確認できること。

IDEからSpacesを使うための現在の要件と、対応するソース種別は、実施時点の
[Using Copilot Spaces](https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/use-copilot-spaces)
と [GitHub MCP server in your IDE](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/use-the-github-mcp-server?tool=vscode)
で確認してください。Webで表示されるソース種別が、IDEでも同じように返されるとは限りません。

## 権限と安全

- 環境とSpaceの所有者から、既知の `owner/name` を読み取る試行について、別途承認を得てください。
- 承認範囲は既存認証による読み取りだけに限定します。
- 新規共有、ソースの追加、アップロード、PATの発行、OAuth、ACL、組織ポリシーの変更は行いません。
- `list_copilot_spaces` などで候補を探索せず、正確な `owner/name` が分からなければ停止します。
- ツールの引数は、実施時に表示されるスキーマを確認してから指定し、推測で組み立てません。
- `starter\examples\github-spaces.mcp.json.template` は参照例です。このリポジトリへ有効な設定としてコピーしません。

`X-MCP-Readonly: "true"` はツールを読み取り系に限定する指定であり、Spaceやソースの閲覧権を付与するものではありません。

## 手順

1. 新しいワークスペースと会話を開き、利用中のIDE、Copilot、リモートGitHub MCPの状態を記録する。
2. Copilot Spacesのツールが検出され、有効になっているかを確認する。
3. 正規認証と組織ポリシーが対象の読み取りを許可しているか確認する。
4. 承認済みの正確な `owner/name` と、その場で確認したツールのスキーマを使って、対象を一度だけ読み取る。
5. Spaceの `instructions`、`description`、ソース種別、ソースごとのリビジョン、範囲、返却状態を分けて記録する。
6. Add text content にカードがある場合は、`textContent.text` だけでなくカード全体を
   `work\context-card.json.template` と比較する。
7. 配列順、値、欠落、`missing` / `error` / `empty` / `partial` を確認する。
8. B1/B2/B3の原本のハッシュと表示用のハッシュを混同せず、Spaceがどちらを保持しているか確認する。
9. 確認後は、会話に取得済みのコンテキストが残る可能性を記録し、承認済みの追加物だけを片付ける。

## 観察すること

- MCPの接続、ツールの検出、ツールの有効化、認証、組織ポリシー
- Spaceの `owner/name`、`instructions`、`description`
- SpaceのACLと各ソースのACL
- ソース種別、リビジョン、解決済みのコミット、返却範囲
- 全文、空、部分、欠落、エラーの違い
- ローカルカードと返却内容の一致・不一致・確認不能
- B3 の表示が、六行を除いた安全な表示版かどうか

ローカルのソースを読めることは、Space経由で同じソースを取得できたことの代わりにはなりません。

## 停止条件

次のいずれかに当てはまる場合は実施しません。

- 正確な `owner/name`、所有者の承認、利用資格、組織ポリシー、SpaceのACL、ソースのACLのいずれかが不明。
- 他人の Space や候補一覧を探索する必要がある。
- 新しい認証、権限の拡大、共有、ソースの追加、アップロード、設定変更が必要。
- `instructions`、カード全文、ソース種別、版、範囲が固定資料と一致しない。
- 本文が空・部分・欠落・エラーで、必要な範囲を確認できない。
- B3 に除去対象の認証情報が含まれている疑いがある。

404や読み取り失敗だけを根拠に、対象が存在しない、またはACLによって拒否されたと断定しないでください。

## 終了時の扱い

このガイドで確認できるのは、特定のクライアント、時点、権限における読み取り結果です。
共有や同期の一般的な保証、ほかの利用者のアクセス、教育効果を証明するものではありません。
秘密、実アカウント名、生の応答全文を不用意に保存しないでください。

[HC-013 本編へ戻る](../README.md)
