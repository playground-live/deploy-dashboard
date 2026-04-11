import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";

const createServiceSchema = z.object({
  name: z.string().min(1),
  repository: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

const updateServiceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  repository: z.string().min(1).optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { displayOrder: "asc" },
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

  const existing = await prisma.service.findUnique({
    where: { name: result.data.name },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Service with this name already exists" },
      { status: 409 }
    );
  }

  const service = await prisma.service.create({ data: result.data });
  return NextResponse.json(service, { status: 201 });
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
    });
    return NextResponse.json(service);
  } catch {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
}
