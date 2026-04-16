import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

const updateGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

export async function GET() {
  const groups = await prisma.serviceGroup.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = z.safeParse(createGroupSchema, body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.issues },
      { status: 400 }
    );
  }

  try {
    const group = await prisma.serviceGroup.create({ data: result.data });
    return NextResponse.json(group, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Group with this name already exists" },
      { status: 409 }
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

  const result = z.safeParse(updateGroupSchema, body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.issues },
      { status: 400 }
    );
  }

  const { id, ...data } = result.data;

  try {
    const group = await prisma.serviceGroup.update({
      where: { id },
      data,
    });
    return NextResponse.json(group);
  } catch {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
}
