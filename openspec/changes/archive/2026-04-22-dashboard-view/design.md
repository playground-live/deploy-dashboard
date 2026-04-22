## Context

Deploy Dashboard のトップページ (`/`) は、各環境 × 全サービスのデプロイ最新版を 1 画面で把握するための社内向け UI。現在以下の構成で動作している:

- Next.js 16 App Router (`force-dynamic`)、サーバー: Vercel、DB: PostgreSQL (Supabase) + Prisma
- データモデル: `Repository`, `ServiceGroup`, `Service`, `Deployment` の 4 モデル
- フロント: `src/app/page.tsx` → Client Component `DashboardMatrix` が `/api/deployments` を fetch
- セル: `DeploymentCell` (最新 1 件の表示) / 行展開: `DeploymentHistoryDrawer` (履歴)
- 自動リフレッシュ: 30 秒ごとに `/api/deployments` を再取得
- 環境は `ENVIRONMENTS = ["dev","test","test2","test3","sandbox","stg","prod"]` の固定配列

この change では「既存挙動の明文化」が目的であり、実装変更は含まない。従って design.md は「なぜ現状がこうなっているか」の固定化と、spec 化する際の意思決定ラインを記録する。

## Goals / Non-Goals

**Goals:**
- 既存のトップページ機能を仕様として固定し、以降の差分 change で参照可能にする
- 画面 / API / 型 / 定数の現状の責務境界を記録する
- 「表示ルール」(並び順、グルーピング、ブランチ短縮、相対時刻) を明示的に仕様化し、実装と乖離しないようにする

**Non-Goals:**
- 現状の実装を変更する (UI 改修、API 変更、パフォーマンス改善はすべてスコープ外)
- Deployment 記録 API (`POST /api/deployments`) の仕様化 (別 capability として切り出す想定)
- `/services` サービス管理画面の仕様化 (別 capability)
- 認証 / IP 制限 / CI 連携の仕様化 (別 capability)
- 新しい環境の追加や並び順の変更
- テストカバレッジ基準の設定

## Decisions

### D1. capability の粒度は「トップページ全体」で 1 つにまとめる
トップページは「マトリクス表示 + 履歴 Drawer + 自動更新 + それに付随する 2 つの GET API」が密結合しており、ユーザーから見て 1 つの機能として成立している。分割すると spec 間の相互参照が増え、整合性維持コストが上がる。

**代替案**: 「matrix-view」「deployment-history-drawer」「auto-refresh」の 3 つに分割。
**棄却理由**: 現状の実装では Drawer は `DashboardMatrix` からしか開かず、`/api/deployments/history` も Drawer 専用。独立 capability にする独立性がまだ薄い。将来的に他画面からも履歴を参照するようになった時点で分離を再検討する。

### D2. 既存挙動をそのまま spec 化する (バグも含めて)
現状発見済みの実装上の細部 (例: `groupServices` が `Map` の挿入順に依存している、`force-dynamic` で全件取得している、自動リフレッシュが 30 秒固定) はすべて「現状仕様」として記述する。改善提案は別 change として切り出す。

**代替案**: spec 化のタイミングで改善も取り込む。
**棄却理由**: 目的は現状の明文化。仕様と改善を同じ change に混ぜると、何が「現状」で何が「新規」か読めなくなる。

### D3. ブランチ表示ルールは spec の WHEN/THEN に落とす
`extractBranchVersion` の 3 段階ルール (`vX.Y.Z` 抽出 → `/` 以降 5 文字 + `...` → そのまま) は UI 上の挙動として目立つため、ユーティリティではなく spec の scenario として固定する。

### D4. API レスポンス契約を spec に含める
`GET /api/deployments` と `GET /api/deployments/history` のレスポンス構造は UI の前提なので、フィールド名・型・並び順を spec requirement として記述する。内部実装 (Prisma の `DISTINCT ON` クエリ等) は spec に含めない。

### D5. 環境一覧とメタ情報は spec 本文ではなく参照で扱う
`ENVIRONMENTS` 配列と `ENVIRONMENT_META` は `src/lib/constants.ts` に定義されており、spec ではファイル参照に留めて重複を避ける。ただし「配列の並び順がそのまま列順になる」という不変条件は spec に明記する。

## Risks / Trade-offs

- **[リスク]** spec 化後に実装の細かいロジック (相対時刻の閾値、スケルトン件数、Drawer 幅など) を変えたくなった場合、毎回 change を作る必要がある。 → **緩和**: spec には「ユーザー可観測な挙動」に絞って記述し、ピクセル幅など UI 詳細は含めない。
- **[リスク]** 30 秒の自動リフレッシュ間隔は `REFRESH_INTERVAL` 定数としてハードコードされているが、spec に「30 秒」と固定すると将来の調整が change 必須になる。 → **緩和**: 現状値として 30 秒を記録しつつ、change ログで差分管理する。
- **[リスク]** `GET /api/deployments` が全サービス全環境をフェッチするため、サービス数増加でレスポンスが肥大化する。 → **緩和**: 本 change では現状追認。将来のページング/フィルタリング追加は別 change。
- **[トレードオフ]** spec と README のダッシュボード説明が重複する。→ README は運用手順、spec は挙動契約、と役割を分ける。

## Migration Plan

実装変更がないため移行不要。この change のアーカイブ時に `openspec/specs/dashboard-view/spec.md` として固定される。ロールバックも不要 (ドキュメントのみ)。

## Open Questions

- 将来 `POST /api/deployments` (記録 API) を別 capability として切り出す際、どの命名にするか (`deployment-ingest` / `deployment-record` など) — 本 change では決定不要
- サービス管理画面 (`/services`) を capability 化するタイミングで、`dashboard-view` 側の「サービス表示順の根拠 (`displayOrder`)」をどこまで相互参照させるか
