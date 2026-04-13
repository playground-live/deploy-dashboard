import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  { repositoryId: "100000001", name: "user-api", repositoryName: "myorg/user-api", description: "ユーザー管理API", displayOrder: 1 },
  { repositoryId: "100000002", name: "auth-service", repositoryName: "myorg/auth-service", description: "認証サービス", displayOrder: 2 },
  { repositoryId: "100000003", name: "payment-api", repositoryName: "myorg/payment-api", description: "決済API", displayOrder: 3 },
  { repositoryId: "100000004", name: "notification-service", repositoryName: "myorg/notification-service", description: "通知サービス", displayOrder: 4 },
  { repositoryId: "100000005", name: "web-frontend", repositoryName: "myorg/web-frontend", description: "Webフロントエンド", displayOrder: 5 },
];

async function main() {
  console.log("Seeding services...");

  for (const service of services) {
    await prisma.service.upsert({
      where: { repositoryId: service.repositoryId },
      update: { repositoryName: service.repositoryName },
      create: service,
    });
  }

  console.log(`Seeded ${services.length} services.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
