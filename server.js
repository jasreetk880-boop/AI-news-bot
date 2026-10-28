import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8" };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relative = normalize(pathname).replace(/^[/\\]+/, "") || "index.html";
  const file = resolve(root, relative);
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("File not found");
    return;
  }
  try {
    const data = await readFile(file);
    response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("File not found");
  }
});

let port = Number(process.env.PORT) || 8000;
server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && port < 8010) {
    console.warn(`Port ${port} is already in use; trying ${port + 1}.`);
    port += 1;
    server.listen(port, "127.0.0.1");
    return;
  }
  console.error(`Could not start the local server: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => console.log(`AI News Bot is running at http://localhost:${port}`));
