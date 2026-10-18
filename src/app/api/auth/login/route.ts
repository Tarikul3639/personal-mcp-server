import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-auth";

export async function GET() {
  return NextResponse.redirect(getGoogleAuthUrl());
}