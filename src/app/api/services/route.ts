import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";

const createServiceSchema = z.object({
  githubId: z.string().min(1),
  repositoryName: z.string().min(1),
  serviceKey: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
  groupId: z.string().optional(),
});

const updateServiceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
  groupId: z.string().nullable().optional(),
});

export async function GET() {
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
  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = z.safeParse(createServiceSchema, body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.issues },
      { status: 400 }
    );
  }

  const { githubId, repositoryName, serviceKey, name, description, displayOrder, groupId } = result.data;

  try {
    const repository = await prisma.repository.upsert({
      where: { githubId },
      update: { fullName: repositoryName },
      create: { githubId, fullName: repositoryName },
    });

    const existing = await prisma.service.findUnique({
      where: {
        repositoryId_serviceKey: {
          repositoryId: repository.id,
          serviceKey,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Service with this repositoryId + serviceKey already exists" },
        { status: 409 }
      );
    }

    const service = await prisma.service.create({
      data: {
        repositoryId: repository.id,
        serviceKey,
        name,
        description,
        displayOrder,
        groupId,
      },
      include: {
        repository: true,
        group: true,
      },
    });
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("POST /api/services error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = z.safeParse(updateServiceSchema, body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.issues },
      { status: 400 }
    );
  }

  const { id, ...data } = result.data;

  try {
    const service = await prisma.service.update({
      where: { id },
      data,
      include: {
        repository: true,
        group: true,
      },
    });
    return NextResponse.json(service);
  } catch {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
}
