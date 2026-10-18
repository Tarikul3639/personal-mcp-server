
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";

serveStdio(createServer, {
  onerror: (error) => console.error("MCP server error:", error),
});

console.error("Personal MCP Server running on stdio");