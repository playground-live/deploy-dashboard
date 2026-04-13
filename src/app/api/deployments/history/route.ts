import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const repositoryId = searchParams.get("repositoryId");
  const environment = searchParams.get("environment");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 100);

  if (!repositoryId || !environment) {
    return NextResponse.json(
      { error: "repositoryId and environment query params are required" },
      { status: 400 }
    );
  }

  const service = await prisma.service.findUnique({
    where: { repositoryId },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const deployments = await prisma.deployment.findMany({
    where: {
      serviceId: service.id,
      environment,
    },
    orderBy: { deployedAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = deployments.length > limit;
  const items = hasMore ? deployments.slice(0, limit) : deployments;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    items,
    nextCursor,
    hasMore,
  });
}
