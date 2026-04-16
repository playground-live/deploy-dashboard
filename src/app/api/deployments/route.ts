import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth";
import { ENVIRONMENTS } from "@/lib/constants";

const deploymentSchema = z.object({
  repositoryId: z.string().min(1),
  repositoryName: z.string().min(1),
  serviceKey: z.string().min(1),
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

  try {
    const { repositoryId, repositoryName, serviceKey, environment, tag, branch, commitSha, deployedBy } = result.data;

    const repository = await prisma.repository.upsert({
      where: { githubId: repositoryId },
      update: { fullName: repositoryName },
      create: { githubId: repositoryId, fullName: repositoryName },
    });

    const service = await prisma.service.upsert({
      where: {
        repositoryId_serviceKey: {
          repositoryId: repository.id,
          serviceKey,
        },
      },
      update: {},
      create: {
        repositoryId: repository.id,
        serviceKey,
        name: serviceKey,
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
  } catch (error) {
    console.error("POST /api/deployments error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        repository: true,
        group: true,
      },
      orderBy: [
        { group: { displayOrder: "asc" } },
        { displayOrder: "asc" },
      ],
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
      id: service.id,
      serviceKey: service.serviceKey,
      name: service.name,
      description: service.description,
      displayOrder: service.displayOrder,
      repository: {
        id: service.repository.id,
        githubId: service.repository.githubId,
        fullName: service.repository.fullName,
      },
      group: service.group
        ? {
            id: service.group.id,
            name: service.group.name,
            description: service.group.description,
            displayOrder: service.group.displayOrder,
          }
        : null,
      deployments: deploymentMap[service.id] ?? {},
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/deployments error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
