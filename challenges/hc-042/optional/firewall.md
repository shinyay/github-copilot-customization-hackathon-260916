# Firewall経路を限定観測する

[HC-042本編へ戻る](../README.md)

## 目的

Bash、MCP、setupの経路ごとに、どのnetwork policyが関係し、何を実際に観察できたかを分けます。Bash firewallの対象外を、安全・到達可能・認可済みと解釈しません。

## 前提

- 承認済みの専用環境がある。
- Bash/MCP/setupの対象経路、現行policy、許可先を特定できる。
- network policyを確認できる資格がある。
- 回数、時間、ログ、停止、復元の上限が決まっている。

## 権限と安全

- 無害な限定経路、許可先、観察回数について個別の許可を得る。
- firewallの無効化・迂回、任意endpoint probe、許可先拡大を行わない。
- credentialや業務データを送信しない。
- ログには必要最小限のroute/resultだけを残す。

## 手順

1. route、process origin、対象policy、許可先、ownerを記録する。
2. Bash firewallの対象内/対象外を資料で確認する。
3. 承認済みの無害な経路だけを一回観察する。
4. network結果、authentication、authorization、output useを別々に記録する。
5. MCP/setupがBash制御の対象外でも、成功や安全を推定しない。
6. 自分の変更がある場合だけ復元する。

## 観察すること

| 項目 | 記録 |
|---|---|
| route | Bash / MCP / setup |
| policy | 対象scope、owner、許可先 |
| transport | 到達、拒否、timeout、unknown |
| identity | authentication |
| access | authorization |
| use | returned outputと実利用 |

## 停止条件

- firewall無効化または迂回が必要。
- route、許可先、上限、ログ範囲が不明。
- 停止・復元担当が不明。
- 対象外であることを成功・安全の証拠にする必要がある。

## 本編へ戻る

結果は [HC-042のroute map](../README.md#試してみる) に戻し、network以外の層を自動的に成功扱いしないでください。
