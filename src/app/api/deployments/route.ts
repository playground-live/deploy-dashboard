import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { ENVIRONMENTS } from "@/lib/constants";

const deploymentSchema = z.object({
  service: z.string().min(1),
  environment: z.enum(ENVIRONMENTS),
  tag: z.string().optional().default(""),
  branch: z.string().min(1),
  commitSha: z.string().min(7),
  deployedBy: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = z.safeParse(deploymentSchema, body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.issues },
      { status: 400 }
    );
  }

  const { service: serviceName, environment, tag, branch, commitSha, deployedBy } = result.data;

  const service = await prisma.service.upsert({
    where: { name: serviceName },
    update: {},
    create: {
      name: serviceName,
      repository: serviceName,
    },
  });

  const deployment = await prisma.deployment.create({
    data: {
      serviceId: service.id,
      environment,
      tag: tag || null,
      branch,
      commitSha,
      deployedBy,
    },
  });

  return NextResponse.json({ ok: true, deployment }, { status: 201 });
}

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const latestDeployments = await prisma.$queryRaw<
    Array<{
      id: string;
      serviceId: string;
      environment: string;
      tag: string | null;
      branch: string;
      commitSha: string;
      deployedBy: string;
      deployedAt: Date;
    }>
  >`
    SELECT DISTINCT ON ("serviceId", "environment")
      "id", "serviceId", "environment", "tag", "branch",
      "commitSha", "deployedBy", "deployedAt"
    FROM "Deployment"
    ORDER BY "serviceId", "environment", "deployedAt" DESC
  `;

  const deploymentMap: Record<string, Record<string, (typeof latestDeployments)[number]>> = {};
  for (const d of latestDeployments) {
    if (!deploymentMap[d.serviceId]) deploymentMap[d.serviceId] = {};
    deploymentMap[d.serviceId][d.environment] = d;
  }

  const data = services.map((service) => ({
    ...service,
    deployments: deploymentMap[service.id] ?? {},
  }));

  return NextResponse.json(data);
}
