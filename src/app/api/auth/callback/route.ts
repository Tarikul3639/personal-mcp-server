import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/lib/google-auth";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.json(
            { error: "Missing authorization code" },
            { status: 400 },
        );
    }

    try {
        await handleGoogleCallback(code);
        return NextResponse.redirect(new URL("/", request.url));
    } catch (error) {
        console.error("Google OAuth callback failed:", error);

        return NextResponse.json(
            { error: "Google authentication failed" },
            { status: 500 },
        );
    }
}