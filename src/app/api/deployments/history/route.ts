import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const serviceId = searchParams.get("serviceId");
  const environment = searchParams.get("environment");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 100);

  if (!serviceId || !environment) {
    return NextResponse.json(
      { error: "serviceId and environment query params are required" },
      { status: 400 }
    );
  }

  const deployments = await prisma.deployment.findMany({
    where: {
      serviceId,
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
