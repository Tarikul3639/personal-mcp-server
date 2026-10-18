import { Plug } from "lucide-react";
import { Space_Grotesk } from "next/font/google";

const font = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export default function SiteHeader() {
  return (
    <header className="rise flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-[#F5C518] text-black">
          <Plug size={23} strokeWidth={2.4} />
        </span>
        <span
          className={`${font.className} text-base font-bold tracking-tight`}
        >
          Tarikul MCP Hub
        </span>
      </div>
      <a
        href="/api/auth/login"
        className="rounded-md bg-[#F5C518] px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-[#FFD84A] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]"
      >
        Login
      </a>
    </header>
  );
}
