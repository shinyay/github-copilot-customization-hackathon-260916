# 許可済み Copilot Space を読み取る前の確認ガイド

[HC-013 本編へ戻る](../README.md)

## 目的

HC-013 で設計したローカルカードと、既に用意されている専用 Copilot Space の内容を
安全に照合するための補足ガイドです。新しい Space を作る手順ではありません。

確認する層を分けます。

1. remote GitHub MCP へ接続できるか。
2. Copilot Spaces の tool が利用できるか。
3. 対象 Space を閲覧できるか。
4. Space が参照する各 source を閲覧できるか。
5. 返された本文・版・範囲が、ローカルの固定資料と一致するか。

接続成功や Space 名の表示だけで、source 本文を取得できたとは判断しません。

## 前提

- HC-013 本編を完了し、`work\context-card.json.template` を検証済みであること。
- 本編とは別の使い捨て workspace と新しい会話を使えること。
- 所有者が既に承認した専用教材 Space の exact owner/name が分かっていること。
- Copilot の利用資格、既存の正規認証、組織の MCP policy を確認できること。
- 対象 Space と各 source の既存閲覧権を、別々に確認できること。

IDE から Spaces を使うための現在の要件と対応 source type は、実施時点の
[Using Copilot Spaces](https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/use-copilot-spaces)
と [GitHub MCP server in your IDE](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/use-the-github-mcp-server?tool=vscode)
で確認してください。Web で見える source type が IDE でも同じように返るとは限りません。

## 権限と安全

- 環境と Space の所有者から、既知の owner/name を読み取る試行について別承認を得てください。
- 承認範囲は既存認証による読み取りだけに限定します。
- 新規共有、source 追加、upload、PAT 発行、OAuth・ACL・組織 policy の変更は行いません。
- `list_copilot_spaces` などで候補を探索せず、exact owner/name が分からなければ停止します。
- tool の引数は、実施時に表示される schema を確認してから指定し、推測で組み立てません。
- `starter\examples\github-spaces.mcp.json.template` は参照例です。このリポジトリへ有効な設定としてコピーしません。

`X-MCP-Readonly: "true"` は tool を読み取り系へ絞る指定であり、Space や source の閲覧権を付与するものではありません。

## 手順

1. 新しい workspace と会話を開き、利用中の IDE、Copilot、remote GitHub MCP の状態を記録する。
2. Copilot Spaces の tool が発見・有効化されているかを確認する。
3. 正規認証と組織 policy が対象の読み取りを許可しているか確認する。
4. 承認済みの exact owner/name と、その場で確認した tool schema を使って対象を一度だけ読み取る。
5. Space instructions、description、source type、source ごとの revision・範囲・返却状態を分けて記録する。
6. Add text content にカードがある場合は、`textContent.text` だけでなくカード全体を
   `work\context-card.json.template` と比較する。
7. 配列順、値、欠落、`missing` / `error` / `empty` / `partial` を確認する。
8. B1/B2/B3 の原本 hash と表示用 hash を混同せず、Space がどちらを保持しているか確認する。
9. 確認後は会話に取得済み context が残り得ることを記録し、承認済みの追加物だけを片付ける。

## 観察すること

- MCP の接続、tool discovery、tool enabled、認証、組織 policy
- Space の owner/name、instructions、description
- Space ACL と各 source の ACL
- source type、revision、解決 commit、返却範囲
- 全文、空、部分、欠落、エラーの違い
- ローカルカードと返却内容の一致・不一致・確認不能
- B3 の表示が、六行を除いた安全な表示版かどうか

ローカル source を読めることは、Space 経由で同じ source を取得できたことの代わりにはなりません。

## 停止条件

次のいずれかに当てはまる場合は実施しません。

- exact owner/name、所有者の承認、利用資格、組織 policy、Space ACL、source ACL のどれかが不明。
- 他人の Space や候補一覧を探索する必要がある。
- 新しい認証、権限拡大、共有、source 追加、upload、設定変更が必要。
- instructions、カード全文、source type、版、範囲が固定資料と一致しない。
- 本文が空・部分・欠落・エラーで、必要な範囲を確認できない。
- B3 に除去対象の認証情報が含まれている疑いがある。

404 や読取失敗だけから、対象の不存在や ACL 拒否を断定しないでください。

## 終了時の扱い

このガイドで確認できるのは、特定の client・時点・権限における読み取り結果です。
共有や同期の一般的な保証、ほかの利用者のアクセス、教育効果を証明するものではありません。
秘密、実アカウント名、生の応答全文を不用意に保存しないでください。

[HC-013 本編へ戻る](../README.md)
