## 1. 実装の現状確認 (コード変更なし)

- [x] 1.1 `src/app/page.tsx` と `src/components/dashboard-matrix.tsx` を読み、spec の「マトリクス表示」「ServiceGroup グルーピング」「自動リフレッシュ」要件と実装が一致していることを確認する
- [x] 1.2 `src/components/deployment-cell.tsx` を読み、spec の「デプロイセルの表示」「ブランチ名の短縮表示ルール」要件と一致することを確認する (タグ/ブランチのバッジ色、short SHA 桁数、相対時刻ロジック)
- [x] 1.3 `src/components/deployment-history-drawer.tsx` を読み、spec の「デプロイ履歴 Drawer」要件と一致することを確認する (ページサイズ 20、カーソルページング、「最新」バッジ、空状態)
- [x] 1.4 `src/app/api/deployments/route.ts` の `GET` を読み、spec の「マトリクス用データ取得 API」のレスポンス構造と並び順要件と一致することを確認する
- [x] 1.5 `src/app/api/deployments/history/route.ts` を読み、spec の「履歴取得 API」要件 (limit 上限 100 / デフォルト 20、必須クエリ欠落時 400) と一致することを確認する
- [x] 1.6 `src/lib/utils.ts` の `extractBranchVersion` を読み、spec の「ブランチ名の短縮表示ルール」の 3 つの Scenario が現行実装の出力と一致することを確認する

## 2. spec と実装の差分対応 (差分がある場合のみ)

- [x] 2.1 タスク 1.x で実装と spec に差異が見つかった場合、差分を本 change のスコープに収められるか判断する (軽微な表現ズレは spec を実装に合わせて修正) — 差異なし、対応不要
- [x] 2.2 本質的な挙動差 (例: バッジ色、並び順ルールのズレ) が見つかった場合は、別 change として切り出し、本 change では「現状」を正確に記す — 差異なし、対応不要

## 3. ドキュメント整合性

- [x] 3.1 `README.md` のダッシュボード関連記述 (特に「アーキテクチャ」「データモデル」セクション) と spec の用語・構造が矛盾しないことを確認する
- [x] 3.2 必要なら README から spec (`openspec/specs/dashboard-view/spec.md`) への参照リンクを追加する — アーカイブ後の spec 配置 (`openspec/specs/dashboard-view/spec.md`) を確定させてから追加したほうがリンク切れを避けられるため、本 change では追加せず次回以降で対応

## 4. 検収

- [x] 4.1 `openspec validate dashboard-view` (利用可能なら) で change が検証をパスすることを確認する — `Change 'dashboard-view' is valid`
- [x] 4.2 ローカルで `npm run dev` を起動し、トップページで以下を目視確認する:
  - 全サービス × 全環境が表示される
  - グループ区切り行が `displayOrder` 順で出る
  - タグデプロイが emerald、ブランチデプロイが blue のバッジで表示される
  - セルをクリックすると履歴 Drawer が開き、ページングが動く
  - 30 秒後にヘッダーの「最終更新」時刻が進む
- [x] 4.3 問題がなければ `/opsx:archive dashboard-view` で `openspec/specs/dashboard-view/spec.md` として固定する
