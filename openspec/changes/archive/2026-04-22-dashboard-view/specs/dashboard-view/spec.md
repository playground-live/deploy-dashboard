## ADDED Requirements

### Requirement: マトリクス表示 (行: サービス / 列: 環境)

システムはトップページ (`/`) で、登録されている全 `Service` を行、`src/lib/constants.ts` に定義された `ENVIRONMENTS` 配列を列とするテーブルを表示する SHALL。

行の表示順は `ServiceGroup.displayOrder` 昇順 → `Service.displayOrder` 昇順に従う MUST。列の並びは `ENVIRONMENTS` 配列の並び順と一致する MUST。

#### Scenario: 全サービスが行として表示される
- **WHEN** ユーザーが `/` を開く
- **THEN** 登録されている全 `Service` が 1 行ずつ描画される
- **AND** ヘッダー行に `ENVIRONMENTS` の各環境が左から順に並ぶ
- **AND** ヘッダー行右上に「N サービス × M 環境」が表示される

#### Scenario: サービスが 1 件も無い場合
- **WHEN** `GET /api/deployments` が空配列を返す
- **THEN** 表の本体に「サービスが登録されていません。サービス管理画面から追加するか、デプロイAPIを呼び出してください。」というメッセージが 1 行で表示される

#### Scenario: 環境列のツールチップ
- **WHEN** ユーザーが列ヘッダーの環境名にホバーする
- **THEN** `ENVIRONMENT_META[env].description` の説明文がツールチップで表示される

---

### Requirement: ServiceGroup による行のグルーピング表示

システムは `ServiceGroup` を持つサービスをグループ単位でまとめて表示し、グループ名を区切り行として描画する SHALL。グループに属さないサービスは最後にまとめて表示する MUST。

#### Scenario: 複数のグループがある場合
- **WHEN** 複数の `ServiceGroup` に属するサービスが存在する
- **THEN** 各グループの最初のサービス行の上にグループ名の区切り行 (背景強調、全列分) が挿入される
- **AND** グループ表示順は `ServiceGroup.displayOrder` 昇順に従う

#### Scenario: グループ未所属のサービス
- **WHEN** グループ未所属のサービスが存在する
- **THEN** それらはグループ区切り行なしで、全ての名前付きグループの後ろにまとめて表示される

#### Scenario: サービス行のツールチップ
- **WHEN** ユーザーがサービス名セルにホバーする
- **THEN** `Repository.fullName`、`serviceKey`、`Service.description` (あれば) が表示される

---

### Requirement: デプロイセルの表示

各セルは、該当 `(service, environment)` の最新 `Deployment` 1 件を表示する SHALL。

タグ付きデプロイとブランチデプロイは視覚的に区別されなければならない MUST。

#### Scenario: タグ付きデプロイ
- **WHEN** 最新 `Deployment` の `tag` が非空
- **THEN** タグ文字列が emerald 系カラーのバッジで表示される
- **AND** バッジの下に short SHA (先頭 7 文字) と相対時刻が表示される

#### Scenario: ブランチデプロイ
- **WHEN** 最新 `Deployment` の `tag` が空 / null
- **THEN** `branch` を `extractBranchVersion` で短縮した文字列が blue 系カラーのバッジで表示される
- **AND** バッジの下に short SHA と相対時刻が表示される

#### Scenario: デプロイ未登録セル
- **WHEN** 該当 `(service, environment)` の `Deployment` が存在しない
- **THEN** セルに em-dash (`—`) のみが中央表示される

#### Scenario: セルの詳細ツールチップ
- **WHEN** ユーザーがデプロイセルにホバーする
- **THEN** 以下のフィールドがツールチップに表示される:
  - タグ (あれば)
  - ブランチ名 (フル)
  - コミット SHA の先頭 12 文字
  - デプロイ者
  - デプロイ日時 (`ja-JP` ロケールの絶対時刻 + 相対時刻)

---

### Requirement: ブランチ名の短縮表示ルール

UI 上でブランチ名を表示する際、システムは以下の優先順で短縮する MUST:

1. ブランチ名に `vX.Y.Z` (X,Y,Z は数字) パターンが含まれていれば、そのバージョン文字列だけを表示する
2. さもなくば、ブランチ名に `/` が含まれる場合、最初の `/` 以降の文字列を取り出し、8 文字を超えるなら先頭 5 文字 + `...` に短縮する
3. 上記に該当しなければそのまま表示する

#### Scenario: バージョンタグがブランチ名に含まれる
- **WHEN** ブランチ名が `release/v1.30.2/hotfix` である
- **THEN** セルのバッジには `v1.30.2` と表示される

#### Scenario: 長いフィーチャーブランチ
- **WHEN** ブランチ名が `feature/payment-retry` である
- **THEN** セルのバッジには `payme...` と表示される

#### Scenario: 短いブランチ名
- **WHEN** ブランチ名が `main` である
- **THEN** セルのバッジには `main` と表示される

#### Scenario: ツールチップではフル表示
- **WHEN** セルのツールチップが開かれている
- **THEN** ツールチップの「ブランチ」行にはブランチ名の完全な文字列が表示される

---

### Requirement: デプロイ履歴 Drawer

ユーザーがデプロイセル (未登録セル含む) をクリックすると、システムは右側からスライドインする Drawer を表示し、該当 `(service, environment)` の `Deployment` 履歴を新しい順に表示する SHALL。

Drawer は 1 ページ 20 件をデフォルトとし、カーソルベースのページングで追加読み込みができる MUST。

#### Scenario: Drawer の起動
- **WHEN** ユーザーがデプロイセルをクリックする
- **THEN** Drawer が開き、`GET /api/deployments/history?serviceId=<id>&environment=<env>&limit=20` が発火する
- **AND** Drawer ヘッダーにサービス名と環境ラベルのバッジが表示される

#### Scenario: 履歴アイテムの表示
- **WHEN** Drawer が履歴を受信する
- **THEN** 各アイテムに以下が表示される:
  - バージョン表示 (タグがあれば emerald バッジ、無ければ `extractBranchVersion(branch)` の blue バッジ)
  - タグ付きの場合はブランチ名の補助表示
  - コミット SHA の先頭 12 文字
  - デプロイ者
  - デプロイ日時 (`ja-JP` ロケールの絶対時刻)
- **AND** 一番上のアイテムには「最新」バッジが付く

#### Scenario: 追加読み込み
- **WHEN** `hasMore: true` で「さらに読み込む」ボタンが表示され、ユーザーがクリックする
- **THEN** `nextCursor` をクエリに付与した再リクエストが行われ、結果が既存リストの末尾に追記される

#### Scenario: 履歴が空
- **WHEN** 該当 `(service, environment)` の履歴が 0 件
- **THEN** 「デプロイ履歴がありません」というメッセージが表示される

---

### Requirement: 自動リフレッシュと最終更新表示

システムはマトリクス画面を開いている間、30 秒間隔で `GET /api/deployments` を再取得し、結果を差し替える SHALL。ヘッダーに最終更新時刻とリフレッシュ間隔を表示する MUST。

#### Scenario: 定期リフレッシュ
- **WHEN** ユーザーが `/` を開いて放置する
- **THEN** 30 秒ごとに `GET /api/deployments` が発火する
- **AND** ヘッダーの「最終更新: HH:MM:SS（30秒ごとに自動更新）」の時刻部分が更新される

#### Scenario: ページ離脱時のクリーンアップ
- **WHEN** ユーザーがトップページから離脱する
- **THEN** リフレッシュ用のインターバルは解除され、以降の fetch は発火しない

#### Scenario: ローディング中の表示
- **WHEN** 初回ロード時でデータ未取得
- **THEN** 5 本のスケルトン行がマトリクスの代わりに表示される

---

### Requirement: マトリクス用データ取得 API (`GET /api/deployments`)

システムは `GET /api/deployments` で全 `Service` の情報と、各サービス × 各環境での最新 `Deployment` (DISTINCT ON `(serviceId, environment)` で最新) を 1 回のレスポンスで返す SHALL。

結果は `ServiceGroup.displayOrder` 昇順 → `Service.displayOrder` 昇順でソートされる MUST。

#### Scenario: 正常レスポンスの構造
- **WHEN** `GET /api/deployments` が成功する
- **THEN** レスポンスは JSON 配列で、各要素が以下のフィールドを持つ:
  - `id` (string): Service ID
  - `serviceKey` (string)
  - `name` (string)
  - `description` (string | null)
  - `displayOrder` (number)
  - `repository`: `{ id, githubId, fullName }`
  - `group`: `{ id, name, description, displayOrder }` または `null`
  - `deployments`: 環境キーをキーとするオブジェクト。各値は `{ id, serviceId, environment, tag (string|null), branch, commitSha, deployedBy, deployedAt }`

#### Scenario: 特定環境にデプロイ実績がない
- **WHEN** あるサービスが一部環境にしかデプロイされていない
- **THEN** `deployments` オブジェクトにはデプロイ済みの環境キーのみが含まれ、未デプロイ環境のキーは存在しない

#### Scenario: サーバーエラー
- **WHEN** DB 取得中に例外が発生する
- **THEN** ステータス 500 と `{ error: "Internal server error", message: <string> }` を返す

---

### Requirement: 履歴取得 API (`GET /api/deployments/history`)

システムは `GET /api/deployments/history` で、指定された `(serviceId, environment)` の `Deployment` 履歴をカーソルページングで返す SHALL。

#### Scenario: 必須クエリパラメータの欠落
- **WHEN** `serviceId` または `environment` が指定されていない
- **THEN** ステータス 400 と `{ error: "serviceId and environment query params are required" }` を返す

#### Scenario: 履歴の取得
- **WHEN** `?serviceId=<id>&environment=<env>&limit=<n>` で呼び出される (limit の上限は 100、省略時 20)
- **THEN** 以下の構造の JSON を返す:
  - `items`: `Deployment` レコードの配列 (`deployedAt` 降順)
  - `nextCursor` (string | null): 次ページ取得用の最後の ID、なければ null
  - `hasMore` (boolean): 次ページが存在するか

#### Scenario: カーソルページング
- **WHEN** レスポンスの `hasMore` が `true` で、`cursor=<nextCursor>` を指定して再呼び出しされる
- **THEN** 指定カーソルの次のレコードから最大 `limit` 件が返される
