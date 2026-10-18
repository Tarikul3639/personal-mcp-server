import EndpointConnect from "@/components/home/endpoint-connect";
import ServerStatus from "@/components/home/server-status";

export default function IntroSection() {
  return (
    <section className="pt-12 sm:pt-16">
      <ServerStatus />
      <h1
        className="rise text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl"
        style={{ animationDelay: "80ms" }}
      >
        Plug your calendar into any AI assistant.
      </h1>
      <p
        className="rise mt-4 max-w-md text-base leading-relaxed text-[#8A8A8A]"
        style={{ animationDelay: "160ms" }}
      >
        A small MCP server that lets your assistant work with your Google
        Calendar. Copy the URL, paste it into your client.
      </p>
      <EndpointConnect />
    </section>
  );
}
