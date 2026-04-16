import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seeds = [
  { githubId: "100000001", repoName: "myorg/user-api", serviceKey: "user-api", name: "user-api", description: "ユーザー管理API", displayOrder: 1 },
  { githubId: "100000002", repoName: "myorg/auth-service", serviceKey: "auth-service", name: "auth-service", description: "認証サービス", displayOrder: 2 },
  { githubId: "100000003", repoName: "myorg/payment-api", serviceKey: "payment-api", name: "payment-api", description: "決済API", displayOrder: 3 },
  { githubId: "100000004", repoName: "myorg/notification-service", serviceKey: "notification-service", name: "notification-service", description: "通知サービス", displayOrder: 4 },
  { githubId: "100000005", repoName: "myorg/web-frontend", serviceKey: "web-frontend", name: "web-frontend", description: "Webフロントエンド", displayOrder: 5 },
];

async function main() {
  console.log("Seeding services...");

  for (const seed of seeds) {
    const repository = await prisma.repository.upsert({
      where: { githubId: seed.githubId },
      update: { fullName: seed.repoName },
      create: { githubId: seed.githubId, fullName: seed.repoName },
    });

    await prisma.service.upsert({
      where: {
        repositoryId_serviceKey: {
          repositoryId: repository.id,
          serviceKey: seed.serviceKey,
        },
      },
      update: {},
      create: {
        repositoryId: repository.id,
        serviceKey: seed.serviceKey,
        name: seed.name,
        description: seed.description,
        displayOrder: seed.displayOrder,
      },
    });
  }

  console.log(`Seeded ${seeds.length} services.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
