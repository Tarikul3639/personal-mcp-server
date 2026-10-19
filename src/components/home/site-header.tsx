"use client";

import { Plug, UserRound } from "lucide-react";
import { Space_Grotesk } from "next/font/google";
import { useEffect, useState } from "react";

const font = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

type User = {
  name: string;
  email?: string;
  picture?: string | null;
};

function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-2.5">
      <div className="h-9 w-9 rounded-full bg-white/10" />
      <div className="h-3.5 w-20 rounded bg-white/10" />
    </div>
  );
}

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/auth/me", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch((error) => {
        if (error.name !== "AbortError") setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <header className="rise flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#F5C518] text-black">
          <Plug size={23} strokeWidth={2.4} />
        </span>

        <span
          className={`${font.className} truncate text-base font-bold tracking-tight`}
        >
          Tarikul's MCP
        </span>
      </div>

      {loading ? (
        <ProfileSkeleton />
      ) : user ? (
        <div
          className="flex min-w-0 items-center gap-2.5"
          title={user.email || user.name}
        >
          {user.picture ? (
            <img
              src={user.picture}
              alt={`${user.name}'s profile`}
              referrerPolicy="no-referrer"
              className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F5C518] text-black">
              <UserRound size={19} />
            </span>
          )}

          <span className="max-w-36 truncate text-sm font-semibold">
            {user.name}
          </span>
        </div>
      ) : (
        <a
          href="/api/auth/login"
          className="shrink-0 rounded-md bg-[#F5C518] px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-[#FFD84A] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]"
        >
          Login
        </a>
      )}
    </header>
  );
}
