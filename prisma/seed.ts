import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── グループ定義 ──

const groups = [
  { name: "Moala Square", description: "決済プラットフォーム", displayOrder: 1 },
  { name: "Moala Pay", description: "QR決済アプリ", displayOrder: 2 },
  { name: "共通基盤", description: "認証・通知など横断サービス", displayOrder: 3 },
];

// ── リポジトリ & サービス定義 ──

interface ServiceSeed {
  githubId: string;
  repoName: string;
  serviceKey: string;
  name: string;
  description: string;
  displayOrder: number;
  groupName: string | null;
}

const services: ServiceSeed[] = [
  // Moala Square — モノレポ (同一リポジトリ)
  { githubId: "200000001", repoName: "playground-live/moala-square", serviceKey: "square-api", name: "Square API", description: "加盟店向け決済API", displayOrder: 1, groupName: "Moala Square" },
  { githubId: "200000001", repoName: "playground-live/moala-square", serviceKey: "square-admin", name: "Square Admin", description: "管理画面BFF", displayOrder: 2, groupName: "Moala Square" },
  { githubId: "200000001", repoName: "playground-live/moala-square", serviceKey: "square-batch", name: "Square Batch", description: "日次バッチ処理", displayOrder: 3, groupName: "Moala Square" },
  // Moala Square — 別リポ
  { githubId: "200000002", repoName: "playground-live/square-web", serviceKey: "square-web", name: "Square Web", description: "加盟店ポータルUI", displayOrder: 4, groupName: "Moala Square" },

  // Moala Pay
  { githubId: "200000003", repoName: "playground-live/moala-pay-backend", serviceKey: "pay-backend", name: "Pay Backend", description: "決済処理バックエンド", displayOrder: 1, groupName: "Moala Pay" },
  { githubId: "200000004", repoName: "playground-live/moala-pay-bff", serviceKey: "pay-bff", name: "Pay BFF", description: "モバイルアプリBFF", displayOrder: 2, groupName: "Moala Pay" },

  // 共通基盤
  { githubId: "200000005", repoName: "playground-live/auth-service", serviceKey: "auth-service", name: "Auth Service", description: "認証・認可サービス", displayOrder: 1, groupName: "共通基盤" },
  { githubId: "200000006", repoName: "playground-live/notification-service", serviceKey: "notification-service", name: "Notification Service", description: "メール・Push通知", displayOrder: 2, groupName: "共通基盤" },

  // 未分類
  { githubId: "200000007", repoName: "playground-live/internal-tools", serviceKey: "internal-tools", name: "Internal Tools", description: "社内運用ツール", displayOrder: 1, groupName: null },
];

// ── デプロイデータ定義 ──

type Env = "dev" | "test" | "test2" | "test3" | "sandbox" | "stg" | "prod";

interface DeploymentSeed {
  serviceKey: string;
  environment: Env;
  tag: string | null;
  branch: string;
  commitSha: string;
  deployedBy: string;
  hoursAgo: number;
}

const deployments: DeploymentSeed[] = [
  // Square API — 全環境にデプロイ済み、prod/stg/sandbox はタグ付き
  { serviceKey: "square-api", environment: "dev", tag: null, branch: "main", commitSha: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0", deployedBy: "tanaka", hoursAgo: 1 },
  { serviceKey: "square-api", environment: "test", tag: null, branch: "release/moala-square/test/v1.30.2/2026-04-15-1", commitSha: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1", deployedBy: "suzuki", hoursAgo: 3 },
  { serviceKey: "square-api", environment: "test2", tag: null, branch: "release/moala-square/test/v1.30.2/2026-04-15-1", commitSha: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1", deployedBy: "suzuki", hoursAgo: 3 },
  { serviceKey: "square-api", environment: "test3", tag: null, branch: "feature/payment-retry", commitSha: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2", deployedBy: "yamada", hoursAgo: 5 },
  { serviceKey: "square-api", environment: "sandbox", tag: "v1.30.1", branch: "prod", commitSha: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3", deployedBy: "tanaka", hoursAgo: 24 },
  { serviceKey: "square-api", environment: "stg", tag: "v1.30.1", branch: "prod", commitSha: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3", deployedBy: "tanaka", hoursAgo: 24 },
  { serviceKey: "square-api", environment: "prod", tag: "v1.30.0", branch: "prod", commitSha: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4", deployedBy: "tanaka", hoursAgo: 72 },

  // Square Admin — dev/test/stg/prod
  { serviceKey: "square-admin", environment: "dev", tag: null, branch: "main", commitSha: "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5", deployedBy: "yamada", hoursAgo: 2 },
  { serviceKey: "square-admin", environment: "test", tag: null, branch: "release/moala-square/test/v2.5.0/2026-04-14-1", commitSha: "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6", deployedBy: "yamada", hoursAgo: 8 },
  { serviceKey: "square-admin", environment: "stg", tag: "v2.4.3", branch: "prod", commitSha: "b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7", deployedBy: "suzuki", hoursAgo: 48 },
  { serviceKey: "square-admin", environment: "prod", tag: "v2.4.3", branch: "prod", commitSha: "b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7", deployedBy: "suzuki", hoursAgo: 48 },

  // Square Batch — stg/prod のみ
  { serviceKey: "square-batch", environment: "stg", tag: "v1.12.0", branch: "prod", commitSha: "c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8", deployedBy: "tanaka", hoursAgo: 36 },
  { serviceKey: "square-batch", environment: "prod", tag: "v1.11.2", branch: "prod", commitSha: "d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9", deployedBy: "tanaka", hoursAgo: 120 },

  // Square Web — dev/test/stg/prod
  { serviceKey: "square-web", environment: "dev", tag: null, branch: "main", commitSha: "e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0", deployedBy: "nakamura", hoursAgo: 0.5 },
  { serviceKey: "square-web", environment: "test", tag: null, branch: "release/square-web/test/v3.8.0/2026-04-15-2", commitSha: "f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1", deployedBy: "nakamura", hoursAgo: 4 },
  { serviceKey: "square-web", environment: "stg", tag: "v3.7.1", branch: "prod", commitSha: "a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", deployedBy: "nakamura", hoursAgo: 30 },
  { serviceKey: "square-web", environment: "prod", tag: "v3.7.1", branch: "prod", commitSha: "a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", deployedBy: "nakamura", hoursAgo: 30 },

  // Pay Backend — 活発に開発中
  { serviceKey: "pay-backend", environment: "dev", tag: null, branch: "main", commitSha: "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3", deployedBy: "watanabe", hoursAgo: 0.2 },
  { serviceKey: "pay-backend", environment: "test", tag: null, branch: "release/pay/test/v4.2.0/2026-04-16-1", commitSha: "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4", deployedBy: "watanabe", hoursAgo: 1 },
  { serviceKey: "pay-backend", environment: "test2", tag: null, branch: "release/pay/test/v4.2.0/2026-04-16-1", commitSha: "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4", deployedBy: "watanabe", hoursAgo: 1 },
  { serviceKey: "pay-backend", environment: "sandbox", tag: "v4.1.0", branch: "prod", commitSha: "d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5", deployedBy: "watanabe", hoursAgo: 12 },
  { serviceKey: "pay-backend", environment: "stg", tag: "v4.1.0", branch: "prod", commitSha: "d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5", deployedBy: "watanabe", hoursAgo: 12 },
  { serviceKey: "pay-backend", environment: "prod", tag: "v4.0.3", branch: "prod", commitSha: "e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6", deployedBy: "watanabe", hoursAgo: 168 },

  // Pay BFF
  { serviceKey: "pay-bff", environment: "dev", tag: null, branch: "main", commitSha: "f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7", deployedBy: "sato", hoursAgo: 6 },
  { serviceKey: "pay-bff", environment: "test", tag: null, branch: "release/pay-bff/test/v2.0.1/2026-04-14-1", commitSha: "a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8", deployedBy: "sato", hoursAgo: 20 },
  { serviceKey: "pay-bff", environment: "stg", tag: "v2.0.0", branch: "prod", commitSha: "b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9", deployedBy: "sato", hoursAgo: 96 },
  { serviceKey: "pay-bff", environment: "prod", tag: "v2.0.0", branch: "prod", commitSha: "b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9", deployedBy: "sato", hoursAgo: 96 },

  // Auth Service — 安定、更新頻度低い
  { serviceKey: "auth-service", environment: "dev", tag: null, branch: "main", commitSha: "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0", deployedBy: "tanaka", hoursAgo: 48 },
  { serviceKey: "auth-service", environment: "test", tag: null, branch: "test", commitSha: "c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0", deployedBy: "tanaka", hoursAgo: 48 },
  { serviceKey: "auth-service", environment: "stg", tag: "v5.1.0", branch: "prod", commitSha: "d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1", deployedBy: "tanaka", hoursAgo: 240 },
  { serviceKey: "auth-service", environment: "prod", tag: "v5.1.0", branch: "prod", commitSha: "d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1", deployedBy: "tanaka", hoursAgo: 240 },

  // Notification Service
  { serviceKey: "notification-service", environment: "dev", tag: null, branch: "main", commitSha: "e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2", deployedBy: "suzuki", hoursAgo: 10 },
  { serviceKey: "notification-service", environment: "test", tag: null, branch: "release/notification/test/v1.8.0/2026-04-15-1", commitSha: "f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3", deployedBy: "suzuki", hoursAgo: 10 },
  { serviceKey: "notification-service", environment: "stg", tag: "v1.7.2", branch: "prod", commitSha: "a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4", deployedBy: "suzuki", hoursAgo: 72 },
  { serviceKey: "notification-service", environment: "prod", tag: "v1.7.2", branch: "prod", commitSha: "a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4", deployedBy: "suzuki", hoursAgo: 72 },

  // Internal Tools — dev のみ
  { serviceKey: "internal-tools", environment: "dev", tag: null, branch: "main", commitSha: "b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5", deployedBy: "yamada", hoursAgo: 16 },
];

// ── Seed 実行 ──

async function main() {
  // 既存データをクリア
  await prisma.deployment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.repository.deleteMany();
  await prisma.serviceGroup.deleteMany();

  console.log("Seeding groups...");
  const groupMap: Record<string, string> = {};
  for (const g of groups) {
    const created = await prisma.serviceGroup.create({ data: g });
    groupMap[g.name] = created.id;
  }

  console.log("Seeding repositories & services...");
  const repoCache: Record<string, string> = {};
  const serviceIdMap: Record<string, string> = {};

  for (const s of services) {
    if (!repoCache[s.githubId]) {
      const repo = await prisma.repository.upsert({
        where: { githubId: s.githubId },
        update: { fullName: s.repoName },
        create: { githubId: s.githubId, fullName: s.repoName },
      });
      repoCache[s.githubId] = repo.id;
    }

    const svc = await prisma.service.create({
      data: {
        repositoryId: repoCache[s.githubId],
        serviceKey: s.serviceKey,
        name: s.name,
        description: s.description,
        displayOrder: s.displayOrder,
        groupId: s.groupName ? groupMap[s.groupName] : null,
      },
    });
    serviceIdMap[s.serviceKey] = svc.id;
  }

  console.log("Seeding deployments...");
  const now = Date.now();
  for (const d of deployments) {
    await prisma.deployment.create({
      data: {
        serviceId: serviceIdMap[d.serviceKey],
        environment: d.environment,
        tag: d.tag,
        branch: d.branch,
        commitSha: d.commitSha,
        deployedBy: d.deployedBy,
        deployedAt: new Date(now - d.hoursAgo * 3600_000),
      },
    });
  }

  console.log(
    `Seeded: ${groups.length} groups, ${services.length} services, ${deployments.length} deployments.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
