import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/lib/google-auth";
import { createUserSession, USER_SESSION_COOKIE } from "@/lib/mcp-auth";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");
    const origin = request.nextUrl.origin;
    const expectedState = request.cookies.get("google_oauth_state")?.value;
    const requestedNext = request.cookies.get("google_oauth_next")?.value ?? "/";

    const next =
        requestedNext.startsWith("/") &&
            !requestedNext.startsWith("//") &&
            !requestedNext.includes("\\")
            ? requestedNext
            : "/";

    const response = (url: string) => {
        const result = NextResponse.redirect(url);
        result.cookies.delete("google_oauth_state");
        result.cookies.delete("google_oauth_next");
        return result;
    };

    if (
        error ||
        !code ||
        !expectedState ||
        request.nextUrl.searchParams.get("state") !== expectedState
    ) {
        return response(`${origin}/?auth=error`);
    }

    try {
        const user = await handleGoogleCallback(code);

        const result = response(
            `${origin}${next === "/" ? "/?auth=success" : next}`
        );

        result.cookies.set(
            USER_SESSION_COOKIE,
            await createUserSession(user.email),
            {
                httpOnly: true,
                secure: request.nextUrl.protocol === "https:",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 12,
            }
        );

        return result;
    } catch (error) {
        console.error("Google OAuth callback failed:", error);

        return response(`${origin}/?auth=error`);
    }
}