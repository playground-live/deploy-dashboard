# Deploy Dashboard

各環境 × 全サービスのデプロイバージョンを一覧表示する社内向けダッシュボード。

## アーキテクチャ

- **フレームワーク**: Next.js 16 (App Router, TypeScript)
- **データベース**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **ホスティング**: Vercel

GitHub Actions のデプロイワークフロー完了時に API を呼び出し、バージョン情報を記録する。

### データモデル

```
ServiceGroup (1) ──→ (N) Service (N) ←── (1) Repository
                            │
                           (1)
                            ↓
                           (N)
                         Deployment
```

| モデル | 役割 |
|---|---|
| `Repository` | GitHub リポジトリ。`githubId` で一意に識別。モノレポの場合、1つの Repository に複数の Service が紐づく |
| `Service` | デプロイ単位。`(repositoryId, serviceKey)` の複合ユニーク。表示名 (`name`) とは別に安定した機械識別子 (`serviceKey`) を持つ |
| `ServiceGroup` | UI 上のサービスグルーピング（例: プロダクト単位）。Repository とは独立した論理的なまとまり |
| `Deployment` | デプロイイベント。サービス × 環境 × 時刻の記録 |

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/myorg/deploy-dashboard.git
cd deploy-dashboard
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集:

| 変数 | 説明 |
|---|---|
| `DATABASE_URL` | PostgreSQL 接続文字列（Supabase Pooler / Transaction mode） |
| `DIRECT_URL` | PostgreSQL 直接接続文字列（マイグレーション用 / Session mode） |
| `DEPLOY_API_KEY` | CI/CD からの API 認証キー（十分にランダムな文字列） |
| `ALLOWED_IPS` | 許可する IP アドレス（カンマ区切り、空でIP制限なし） |

### 3. データベースのセットアップ

```bash
# マイグレーションを適用
npx prisma migrate deploy

# (任意) 初期サービスデータ投入
npm run db:seed
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でダッシュボードを開く。

### 5. Vercel へのデプロイ

```bash
# Vercel CLI でデプロイ
npx vercel

# 本番デプロイ
npx vercel --prod
```

Vercel のダッシュボードで環境変数 (`DATABASE_URL`, `DIRECT_URL`, `DEPLOY_API_KEY`, `ALLOWED_IPS`) を設定。

## 各サービスへの導入方法

各サービスのデプロイワークフローに、デプロイ完了後のステップとして以下を追加する。

### 前提: Organization Secrets / Variables の設定

GitHub Organization の Settings > Secrets and variables > Actions に以下を追加:

- **Variables** に `DEPLOY_DASHBOARD_URL`: Deploy Dashboard の URL (例: `https://deploy-dashboard.vercel.app`)
- **Secrets** に `DEPLOY_DASHBOARD_API_KEY`: `.env` の `DEPLOY_API_KEY` と同じ値

### ワークフローへの組み込み

```yaml
# デプロイ処理の後に追加
- name: Report deployment
  uses: myorg/deploy-dashboard/.github/actions/report-deployment@main
  with:
    environment: dev  # 環境に応じて変更
    service-key: user-api  # サービス識別キー
    dashboard-url: ${{ vars.DEPLOY_DASHBOARD_URL }}
    api-key: ${{ secrets.DEPLOY_DASHBOARD_API_KEY }}
```

### service-key の指定方法

| リポジトリ構成 | service-key の例 |
|---|---|
| 単一サービスのリポジトリ | `${{ github.event.repository.name }}`（リポジトリ名をそのまま使用） |
| モノレポ（固定値） | `user-api`, `worker` など各ワークフローに直接記述 |
| モノレポ（matrix） | `${{ matrix.service }}` で切り替え |

モノレポでの matrix 例:

```yaml
strategy:
  matrix:
    service: [user-api, worker, admin-api]
steps:
  - name: Report deployment
    uses: myorg/deploy-dashboard/.github/actions/report-deployment@main
    with:
      environment: prod
      service-key: ${{ matrix.service }}
      dashboard-url: ${{ vars.DEPLOY_DASHBOARD_URL }}
      api-key: ${{ secrets.DEPLOY_DASHBOARD_API_KEY }}
```

## API リファレンス

### `POST /api/deployments`

デプロイ情報を登録する。CI/CD から呼び出す。

- **認証**: `Authorization: Bearer <API_KEY>`
- **ボディ**: `{ repositoryId, repositoryName, serviceKey, environment, tag?, branch, commitSha, deployedBy }`
- Repository が未登録の場合は自動作成される
- Service が未登録の場合は `serviceKey` を表示名として自動作成される
- `repositoryName` は毎回更新される（リポジトリ名の変更に自動追従）

### `GET /api/deployments`

全サービス × 全環境の最新デプロイ情報を返す。サービスグループの `displayOrder` → サービスの `displayOrder` 順でソート。

### `GET /api/deployments/history?serviceId=xxx&environment=yyy`

指定サービス × 環境のデプロイ履歴をページネーション付きで返す。

- クエリパラメータ: `serviceId` (必須), `environment` (必須), `cursor` (任意), `limit` (任意, デフォルト 20)

### `GET /api/services`

登録サービス一覧を返す。Repository と ServiceGroup の情報を含む。

### `POST /api/services`

サービスを手動登録する。ボディ: `{ githubId, repositoryName, serviceKey, name, description?, displayOrder?, groupId? }`

### `PATCH /api/services`

サービス情報を更新する。ボディ: `{ id, name?, description?, displayOrder?, groupId? }`

### `GET /api/service-groups`

サービスグループ一覧を返す。

### `POST /api/service-groups`

サービスグループを作成する。ボディ: `{ name, description?, displayOrder? }`

### `PATCH /api/service-groups`

サービスグループを更新する。ボディ: `{ id, name?, description?, displayOrder? }`

## ダッシュボードの表示ルール

- **サービスグループ** → グループヘッダ行で区切って表示。未分類のサービスは末尾にまとめる
- **タグあり** → 緑色バッジでタグ名を表示 (例: `v1.2.0`)
- **タグなし** → 青色バッジでブランチ名を表示。ブランチ名に `vX.Y.Z` パターンが含まれる場合はバージョン部分のみ抽出 (例: `release/moala-square/test/v1.30.2/2026-04-15-1` → `v1.30.2`)
- 常にコミットSHA (短縮7桁) をサブ情報として表示
