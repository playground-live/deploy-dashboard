# Deploy Dashboard 仕様書

## 1. 概要

Deploy Dashboard は、組織内の複数サービスが各環境（dev, test, staging, production 等）にどのバージョンがデプロイされているかを **マトリクス形式で一覧表示** するための Web ダッシュボードアプリケーションである。

GitHub Actions のデプロイワークフロー完了時に API を呼び出してデプロイ情報を記録し、ダッシュボード上でリアルタイムに確認できる。

### 1.1 解決する課題

- 複数サービス × 複数環境の組み合わせにおいて、現在どのバージョンがデプロイされているかを一目で把握できない問題
- デプロイ履歴の追跡が困難な問題

### 1.2 主要機能

| 機能 | 説明 |
|------|------|
| デプロイマトリクス表示 | サービス × 環境のマトリクスで最新デプロイ状況を一覧表示 |
| デプロイ記録 API | CI/CD パイプラインからデプロイ情報を受け取る REST API |
| デプロイ履歴閲覧 | サービス × 環境ごとのデプロイ履歴をタイムライン表示 |
| サービス管理 | ダッシュボードに表示するサービスの CRUD 操作 |
| GitHub Actions 連携 | 再利用可能な Composite Action による簡易連携 |

---

## 2. 技術スタック

| カテゴリ | 技術 | バージョン |
|----------|------|-----------|
| フレームワーク | Next.js (App Router) | 16.1.6 |
| 言語 | TypeScript | 5.x |
| UI ライブラリ | React | 19.2.3 |
| CSS | Tailwind CSS | 4.x |
| UI コンポーネント | shadcn/ui (new-york スタイル) | — |
| アイコン | Lucide React | 0.575.0 |
| ORM | Prisma | 6.19.2 |
| データベース | PostgreSQL | — |
| バリデーション | Zod | 4.3.6 |
| フォント | Geist, Geist Mono | — |

---

## 3. アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│                GitHub Actions                    │
│  (各サービスのデプロイワークフロー)                  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ report-deployment (Composite Action)     │    │
│  │ curl POST /api/deployments               │    │
│  └──────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────┘
                        │ HTTP POST (Bearer Token)
                        ▼
┌─────────────────────────────────────────────────┐
│              Deploy Dashboard                    │
│              (Next.js App Router)                │
│                                                  │
│  ┌─────────────┐  ┌───────────────────────────┐ │
│  │ フロントエンド │  │ API Routes               │ │
│  │ (React SSR/ │  │                           │ │
│  │  CSR)       │  │ POST /api/deployments     │ │
│  │             │  │ GET  /api/deployments     │ │
│  │ / (マトリクス)│  │ GET  /api/deployments/    │ │
│  │ /services   │  │      history              │ │
│  │             │  │ GET  /api/services        │ │
│  └──────┬──────┘  │ POST /api/services        │ │
│         │         │ PATCH /api/services       │ │
│         │         └───────────┬───────────────┘ │
│         └─────────────────────┘                  │
│                        │                         │
│                        ▼                         │
│              ┌─────────────────┐                 │
│              │   Prisma ORM    │                 │
│              └────────┬────────┘                 │
│                       │                          │
└───────────────────────┼──────────────────────────┘
                        ▼
               ┌─────────────────┐
               │   PostgreSQL    │
               └─────────────────┘
```

---

## 4. データベース設計

### 4.1 ER 図

```
Service (1) ──── (*) Deployment
```

### 4.2 Service テーブル

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | String (CUID) | PK | 一意識別子 |
| name | String | UNIQUE, NOT NULL | サービス名（例: `user-api`） |
| repository | String | NOT NULL | GitHub リポジトリ（例: `myorg/user-api`） |
| description | String | NULL 許可 | サービスの説明 |
| displayOrder | Int | DEFAULT 0 | ダッシュボードでの表示順 |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | @updatedAt | 更新日時 |

### 4.3 Deployment テーブル

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | String (CUID) | PK | 一意識別子 |
| serviceId | String | FK → Service.id, CASCADE | 対象サービス |
| environment | String | NOT NULL | デプロイ先環境 |
| tag | String | NULL 許可 | Git タグ（例: `v1.2.3`） |
| branch | String | NOT NULL | ブランチ名 |
| commitSha | String | NOT NULL | コミット SHA |
| deployedBy | String | NOT NULL | デプロイ実行者（GitHub Actor） |
| deployedAt | DateTime | DEFAULT now() | デプロイ日時 |

### 4.4 インデックス

| インデックス | カラム | 用途 |
|-------------|--------|------|
| 複合インデックス 1 | (serviceId, environment, deployedAt DESC) | 最新デプロイの高速取得 |
| インデックス 2 | (environment) | 環境別フィルタリング |

---

## 5. 環境定義

アプリケーションは以下の 7 環境を管理対象とする。

| 環境キー | ラベル | 説明 | デプロイトリガー |
|----------|--------|------|-----------------|
| `dev` | Dev | 開発環境 | main ブランチへの push |
| `test` | Test | テスト環境 | test ブランチへのマージ |
| `test2` | Test2 | 自動テスト環境 | test ブランチへのマージ（matrix） |
| `test3` | Test3 | 並行テスト環境 | workflow_dispatch で任意ブランチ指定 |
| `sandbox` | Sandbox | サンドボックス環境 | タグデプロイまたは workflow_dispatch |
| `stg` | Staging | ステージング環境 | prod ブランチ + v タグ |
| `prod` | Production | 本番環境 | prod ブランチ + v タグ |

---

## 6. API 仕様

### 6.1 デプロイ記録 — `POST /api/deployments`

CI/CD パイプラインからデプロイ情報を記録する。

**認証:** 必須（Bearer トークン）

```
Authorization: Bearer <DEPLOY_API_KEY>
```

**リクエストボディ:**

| フィールド | 型 | 必須 | 説明 |
|------------|------|------|------|
| service | string | Yes | サービス名 |
| environment | string | Yes | 環境（`dev` / `test` / `test2` / `test3` / `sandbox` / `stg` / `prod`） |
| tag | string | No | Git タグ（デフォルト: 空文字） |
| branch | string | Yes | ブランチ名 |
| commitSha | string | Yes | コミット SHA（7文字以上） |
| deployedBy | string | Yes | デプロイ実行者 |

**レスポンス:**

| ステータス | 説明 |
|-----------|------|
| 201 | 記録成功。`{ ok: true, deployment: {...} }` |
| 400 | バリデーションエラーまたは不正な JSON |
| 401 | 認証失敗 |

**特殊動作:** 指定された `service` 名の Service レコードが存在しない場合、`repository` にサービス名をセットして自動作成する（upsert）。

---

### 6.2 最新デプロイ一覧取得 — `GET /api/deployments`

全サービスの全環境における最新デプロイ情報をマトリクスデータとして返す。

**認証:** 不要

**レスポンス:** `ServiceWithDeployments[]`

```json
[
  {
    "id": "cuid...",
    "name": "user-api",
    "repository": "myorg/user-api",
    "description": "ユーザー管理API",
    "displayOrder": 1,
    "deployments": {
      "dev": {
        "id": "cuid...",
        "serviceId": "cuid...",
        "environment": "dev",
        "tag": null,
        "branch": "main",
        "commitSha": "abc1234...",
        "deployedBy": "github-actor",
        "deployedAt": "2026-04-11T00:00:00.000Z"
      },
      "prod": { ... }
    }
  }
]
```

**クエリ手法:** PostgreSQL の `DISTINCT ON ("serviceId", "environment")` を使用し、各サービス × 環境の最新 1 件のみを効率的に取得する。サービスは `displayOrder` 昇順で返される。

---

### 6.3 デプロイ履歴取得 — `GET /api/deployments/history`

特定サービス × 環境のデプロイ履歴をカーソルベースのページネーションで返す。

**認証:** 不要

**クエリパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| service | string | Yes | サービス名 |
| environment | string | Yes | 環境名 |
| cursor | string | No | ページネーション用カーソル（Deployment ID） |
| limit | number | No | 取得件数（デフォルト: 20、最大: 100） |

**レスポンス:**

```json
{
  "items": [ { ... DeploymentInfo } ],
  "nextCursor": "cuid..." | null,
  "hasMore": true | false
}
```

---

### 6.4 サービス一覧取得 — `GET /api/services`

**認証:** 不要

**レスポンス:** `ServiceInfo[]`（`displayOrder` 昇順）

---

### 6.5 サービス作成 — `POST /api/services`

**認証:** 不要

**リクエストボディ:**

| フィールド | 型 | 必須 | 説明 |
|------------|------|------|------|
| name | string | Yes | サービス名（一意） |
| repository | string | Yes | リポジトリ名 |
| description | string | No | 説明 |
| displayOrder | number | No | 表示順 |

**レスポンス:**

| ステータス | 説明 |
|-----------|------|
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 409 | 同名サービスが既に存在 |

---

### 6.6 サービス更新 — `PATCH /api/services`

**認証:** 不要

**リクエストボディ:**

| フィールド | 型 | 必須 | 説明 |
|------------|------|------|------|
| id | string | Yes | サービス ID |
| name | string | No | サービス名 |
| repository | string | No | リポジトリ名 |
| description | string | No | 説明 |
| displayOrder | number | No | 表示順 |

**レスポンス:**

| ステータス | 説明 |
|-----------|------|
| 200 | 更新成功 |
| 400 | バリデーションエラー |
| 404 | サービスが見つからない |

---

## 7. フロントエンド仕様

### 7.1 画面一覧

| パス | ページ名 | 説明 |
|------|---------|------|
| `/` | デプロイダッシュボード | メイン画面。サービス × 環境のマトリクス表示 |
| `/services` | サービス管理 | サービスの一覧・追加・編集 |

---

### 7.2 デプロイダッシュボード（`/`）

#### レイアウト

- **ヘッダー:** アプリ名「Deploy Dashboard」、サブテキスト、サービス管理へのリンク
- **ステータスバー:** サービス数 × 環境数、最終更新時刻、自動更新間隔
- **マトリクステーブル:** 横軸 = 環境（7列）、縦軸 = サービス（N行）

#### マトリクステーブル仕様

- サービス名列は `sticky left` で横スクロール時も固定表示
- 環境ヘッダーにはツールチップで環境の説明を表示
- サービス名にはツールチップでリポジトリ名・説明を表示

#### デプロイセル表示

各セル（サービス × 環境の交差点）は以下の情報を表示する。

| 状態 | 表示 |
|------|------|
| デプロイあり（タグ付き） | 緑色 Badge でタグ名を表示 |
| デプロイあり（ブランチのみ） | 青色 Badge でブランチ名を表示 |
| デプロイなし | ダッシュ記号（—） |

セルのツールチップには詳細情報（タグ、ブランチ、コミット SHA 12桁、デプロイ者、デプロイ日時 + 相対時刻）を表示する。

#### 相対時刻表示ルール

| 経過時間 | 表示 |
|---------|------|
| 1 分未満 | 「たった今」 |
| 1〜59 分 | 「N分前」 |
| 1〜23 時間 | 「N時間前」 |
| 1〜29 日 | 「N日前」 |
| 30 日以上 | 日付表示（ja-JP ロケール） |

#### 自動更新

- 30 秒間隔（`REFRESH_INTERVAL = 30_000`）で `GET /api/deployments` をポーリング
- ポーリング間隔は UI に表示

#### セルクリック → 履歴ドロワー

セルをクリックすると、該当サービス × 環境のデプロイ履歴を右側のシートドロワーで表示する。

---

### 7.3 デプロイ履歴ドロワー

- **表示形式:** タイムライン（縦方向の時系列表示）
- **幅:** 440px
- **先頭アイテムに「最新」バッジ** を表示
- タグ付きデプロイは緑色 Badge、ブランチのみは青色 Badge
- 各エントリに表示する情報: タグ/ブランチ、コミット SHA（12桁）、デプロイ者、デプロイ日時
- **ページネーション:** 「さらに読み込む」ボタンで追加取得（カーソルベース、20件ずつ）
- 読み込み中は Skeleton でプレースホルダを表示

---

### 7.4 サービス管理ページ（`/services`）

#### 機能

- サービス一覧をテーブル形式で表示（表示順、サービス名、リポジトリ、説明、操作）
- リポジトリ名は GitHub へのリンクとして表示
- 「サービスを追加」ボタンで新規作成ダイアログを開く
- 各行の「編集」ボタンで編集ダイアログを開く

#### サービスフォームダイアログ

| フィールド | 入力タイプ | 必須 | 編集時 |
|------------|-----------|------|--------|
| サービス名 | テキスト | Yes | 変更不可（disabled） |
| リポジトリ | テキスト | Yes | 変更可 |
| 説明 | テキスト | No | 変更可 |
| 表示順 | 数値 | No | 変更可 |

---

## 8. 認証・認可

### 8.1 API キー認証

- **対象:** `POST /api/deployments` のみ
- **方式:** `Authorization: Bearer <DEPLOY_API_KEY>` ヘッダー
- **検証:** 環境変数 `DEPLOY_API_KEY` と一致するかを比較

### 8.2 IP 制限（未実装）

`src/proxy.ts` に IP ベースのアクセス制限ロジックが定義されているが、Next.js の middleware として配線されていない（将来的な実装予定と思われる）。

- 環境変数 `ALLOWED_IPS`（カンマ区切り）で許可 IP を指定
- `POST /api/deployments` は IP 制限の対象外（CI/CD からのアクセスを許可）
- 未設定の場合は全 IP を許可

### 8.3 認証が不要な API

以下の API は認証なしでアクセス可能。

- `GET /api/deployments`
- `GET /api/deployments/history`
- `GET /api/services`
- `POST /api/services`
- `PATCH /api/services`

---

## 9. GitHub Actions 連携

### 9.1 Composite Action: `report-deployment`

各サービスのデプロイワークフローに組み込む再利用可能な Composite Action。

**パス:** `.github/actions/report-deployment/action.yml`

#### 入力パラメータ

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `service` | Yes | サービス名 |
| `environment` | Yes | デプロイ先環境 |
| `dashboard-url` | Yes | Dashboard の URL |
| `api-key` | Yes | Dashboard API キー |
| `tag` | No | Git タグ（省略時は GitHub コンテキストから自動取得） |
| `branch` | No | ブランチ名（省略時は GitHub コンテキストから自動取得） |

#### 自動取得ロジック

| パラメータ | 入力値あり | 入力値なし |
|-----------|-----------|-----------|
| tag | 入力値を使用 | `github.ref_type == 'tag'` の場合は `github.ref_name`、それ以外は空 |
| branch | 入力値を使用 | `github.head_ref`（PR の場合）または `github.ref_name` |

#### 動作

1. `curl` で `POST /api/deployments` を呼び出し
2. HTTP ステータスコード 2xx の場合は成功ログを出力
3. 失敗してもデプロイ自体には影響しない（非ブロッキング）

### 9.2 必要な Organization Secrets

| シークレット名 | 説明 |
|---------------|------|
| `DASHBOARD_URL` | Deploy Dashboard の URL |
| `DASHBOARD_API_KEY` | `DEPLOY_API_KEY` 環境変数に設定した値 |

### 9.3 ワークフロー例

#### dev 環境（main ブランチ push 時）

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:

steps:
  - uses: actions/checkout@v4
  # デプロイ処理...
  - uses: myorg/deploy-dashboard/.github/actions/report-deployment@main
    with:
      service: ${{ github.event.repository.name }}
      environment: dev
      dashboard-url: ${{ secrets.DASHBOARD_URL }}
      api-key: ${{ secrets.DASHBOARD_API_KEY }}
```

#### test 環境（test ブランチ push 時、matrix 使用）

```yaml
on:
  push:
    branches: [test]

strategy:
  matrix:
    environment: [test, test2]
```

#### production 環境（v タグ push 時、matrix 使用）

```yaml
on:
  push:
    tags: ['v*']

strategy:
  matrix:
    environment: [sandbox, stg, prod]
```

#### test3 / sandbox 環境（手動ディスパッチ）

```yaml
on:
  workflow_dispatch:
```

---

## 10. 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `DATABASE_URL` | Yes | PostgreSQL 接続文字列（Prisma 用、接続プーリング対応） |
| `DIRECT_URL` | Yes | PostgreSQL 直接接続文字列（マイグレーション用） |
| `DEPLOY_API_KEY` | Yes | デプロイ記録 API の認証キー |
| `ALLOWED_IPS` | No | アクセス許可 IP（カンマ区切り、未実装） |

---

## 11. 型定義

### DeploymentInfo

```typescript
interface DeploymentInfo {
  id: string;
  serviceId: string;
  environment: string;
  tag: string | null;
  branch: string;
  commitSha: string;
  deployedBy: string;
  deployedAt: string;
}
```

### ServiceWithDeployments

```typescript
interface ServiceWithDeployments {
  id: string;
  name: string;
  repository: string;
  description: string | null;
  displayOrder: number;
  deployments: Partial<Record<Environment, DeploymentInfo>>;
}
```

### ServiceInfo

```typescript
interface ServiceInfo {
  id: string;
  name: string;
  repository: string;
  description: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

### DeploymentHistoryResponse

```typescript
interface DeploymentHistoryResponse {
  items: DeploymentInfo[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

### Environment

```typescript
type Environment = "dev" | "test" | "test2" | "test3" | "sandbox" | "stg" | "prod";
```

---

## 12. シードデータ

初期データとして以下の 5 サービスが `prisma/seed.ts` で投入される。

| サービス名 | リポジトリ | 説明 | 表示順 |
|-----------|-----------|------|--------|
| user-api | myorg/user-api | ユーザー管理API | 1 |
| auth-service | myorg/auth-service | 認証サービス | 2 |
| payment-api | myorg/payment-api | 決済API | 3 |
| notification-service | myorg/notification-service | 通知サービス | 4 |
| web-frontend | myorg/web-frontend | Webフロントエンド | 5 |

---

## 13. コンポーネント構成

```
src/
├── app/
│   ├── layout.tsx              # ルートレイアウト（フォント、TooltipProvider）
│   ├── page.tsx                # ダッシュボードページ（SSR, force-dynamic）
│   ├── globals.css             # グローバルスタイル（Tailwind 4, CSS 変数）
│   ├── services/
│   │   └── page.tsx            # サービス管理ページ（CSR）
│   └── api/
│       ├── deployments/
│       │   ├── route.ts        # POST: デプロイ記録 / GET: 最新一覧
│       │   └── history/
│       │       └── route.ts    # GET: デプロイ履歴
│       └── services/
│           └── route.ts        # GET / POST / PATCH: サービス CRUD
├── components/
│   ├── dashboard-matrix.tsx    # マトリクステーブル（30秒ポーリング）
│   ├── deployment-cell.tsx     # セル表示（Badge + ツールチップ）
│   ├── deployment-history-drawer.tsx  # 履歴シートドロワー
│   ├── service-form.tsx        # サービス作成・編集ダイアログ
│   └── ui/                     # shadcn/ui コンポーネント群
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── table.tsx
│       └── tooltip.tsx
├── lib/
│   ├── auth.ts                 # API キー検証
│   ├── constants.ts            # 環境定義・メタデータ
│   ├── prisma.ts               # Prisma クライアント（シングルトン）
│   └── utils.ts                # cn() ユーティリティ
├── types/
│   └── index.ts                # 型定義
└── proxy.ts                    # IP 制限ロジック（未配線）
```

---

## 14. 開発用コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLint 実行 |
| `npm run db:generate` | Prisma Client 生成 |
| `npm run db:migrate` | マイグレーション実行 |
| `npm run db:push` | スキーマをDBに反映（マイグレーションファイルなし） |
| `npm run db:seed` | シードデータ投入 |

---

## 15. 制約・注意事項

1. **GET 系 API は認証なし** — ダッシュボード閲覧やサービス管理は認証が不要。IP 制限（`proxy.ts`）が将来的にその役割を担う想定。
2. **サービス自動作成** — `POST /api/deployments` で未知のサービス名が指定された場合、自動で Service レコードが作成される。`repository` はサービス名と同値がセットされる。
3. **環境の追加** — 環境を追加する場合は `src/lib/constants.ts` の `ENVIRONMENTS` 配列と `ENVIRONMENT_META` オブジェクトの両方を更新する必要がある。
4. **Prisma Client の出力先** — `src/generated/prisma` に生成され、`.gitignore` で除外されている。`postinstall` スクリプトで自動生成される。
5. **最新デプロイの取得** — PostgreSQL 固有の `DISTINCT ON` 構文を使用しているため、データベースを PostgreSQL 以外に変更する場合はクエリの書き換えが必要。
