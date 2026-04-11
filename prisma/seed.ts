import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const services = [
  { name: "user-api", repository: "myorg/user-api", description: "ユーザー管理API", displayOrder: 1 },
  { name: "auth-service", repository: "myorg/auth-service", description: "認証サービス", displayOrder: 2 },
  { name: "payment-api", repository: "myorg/payment-api", description: "決済API", displayOrder: 3 },
  { name: "notification-service", repository: "myorg/notification-service", description: "通知サービス", displayOrder: 4 },
  { name: "web-frontend", repository: "myorg/web-frontend", description: "Webフロントエンド", displayOrder: 5 },
];

async function main() {
  console.log("Seeding services...");

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
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
