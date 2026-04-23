import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ buildId: null });
  }

  return NextResponse.json({
    buildId: process.env.APP_BUILD_ID ?? "local",
  });
}
