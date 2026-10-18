import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/lib/google-auth";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const origin = request.nextUrl.origin;

    if (!code) {
        return NextResponse.redirect(`${origin}/?auth=error`);
    }

    try {
        await handleGoogleCallback(code);
        return NextResponse.redirect(`${origin}/?auth=success`);
    } catch (error) {
        console.error("Google OAuth callback failed:", error);
        return NextResponse.redirect(`${origin}/?auth=error`);
    }
}