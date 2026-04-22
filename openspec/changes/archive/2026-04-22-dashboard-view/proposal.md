## Why

既存のトップページ (`/`) は「各環境 × 全サービスのデプロイバージョンを一覧表示する」という本プロダクトの中核 UI だが、要件・画面構造・API 契約が README とコードに散在しており、仕様として明文化されていない。今後の機能追加 (環境の増減、グルーピング改修、リフレッシュ戦略の変更など) で回帰や仕様ブレが起きやすいため、既存挙動を spec として固定し、以降の変更の土台とする。

## What Changes

- 既存のダッシュボード表示機能 (`/` トップページ) を `dashboard-view` capability として spec 化する
- spec に含めるもの:
  - 画面の責務と対象ユーザー (社内開発者)
  - マトリクス表示 (行: サービス / 列: 環境) とサービスの並び順ルール
  - `ServiceGroup` による行のグルーピング表示と、未グルーピング行の扱い
  - セル表示: タグ優先 / ブランチフォールバック、short SHA、相対時刻、ツールチップ詳細
  - ブランチ名の短縮ルール (`vX.Y.Z` 抽出 → `/` 以降 5 文字 + `...` → そのまま) の UI 側での利用
  - デプロイ未登録セル (`—`) / サービス未登録時の空状態メッセージ
  - セルクリックで開くデプロイ履歴 Drawer (ページング付き) の仕様
  - 30 秒ごとの自動リフレッシュと「最終更新時刻」表示
  - データ取得 API: `GET /api/deployments` (マトリクス用) / `GET /api/deployments/history` (履歴用) のレスポンス契約
- この change では実装は変更しない (既存挙動のドキュメント化のみ)

## Capabilities

### New Capabilities
- `dashboard-view`: トップページの環境 × サービスマトリクス表示、行グルーピング、デプロイ履歴 Drawer、自動リフレッシュ、および裏側の読み取り API (`GET /api/deployments`, `GET /api/deployments/history`) を含む「最新デプロイの閲覧」機能一式

### Modified Capabilities
<!-- 既存 spec は存在しないため変更なし -->

## Impact

- **対象コード (読み取り専用・変更なし)**
  - `src/app/page.tsx`
  - `src/components/dashboard-matrix.tsx`
  - `src/components/deployment-cell.tsx`
  - `src/components/deployment-history-drawer.tsx`
  - `src/app/api/deployments/route.ts` (GET)
  - `src/app/api/deployments/history/route.ts`
  - `src/lib/constants.ts` (`ENVIRONMENTS`, `ENVIRONMENT_META`)
  - `src/lib/utils.ts` (`extractBranchVersion`)
  - `src/types/index.ts`
- **データソース**: Prisma スキーマの `Repository` / `Service` / `ServiceGroup` / `Deployment` (変更なし)
- **API / 依存**: 追加・変更なし。外部契約はそのまま spec として固定
- **リスク**: 実装と spec が食い違ったまま固定されると誤った仕様が残るため、spec 作成時に現状実装と突き合わせる必要あり
