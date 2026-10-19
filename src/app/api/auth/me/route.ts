import { NextResponse } from "next/server";
import { getGoogleProfile } from "@/lib/db";

export async function GET() {
  try {
    const user = await getGoogleProfile();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to get user profile:", error);

    return NextResponse.json({ user: null }, { status: 401 });
  }
}
