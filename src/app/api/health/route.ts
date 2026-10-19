import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/db";

export async function GET() {
  try {
    await checkDatabase();
    return NextResponse.json(
      { status: "online", database: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
