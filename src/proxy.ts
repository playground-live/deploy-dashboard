import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const allowedIps = process.env.ALLOWED_IPS?.split(",").filter(Boolean) ?? [];

  if (allowedIps.length === 0) {
    return NextResponse.next();
  }

  if (
    request.nextUrl.pathname.startsWith("/api/deployments") &&
    request.method === "POST"
  ) {
    return NextResponse.next();
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";

  if (!allowedIps.includes(ip)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
