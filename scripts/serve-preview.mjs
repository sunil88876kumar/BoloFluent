import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".ttf": "font/ttf",
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const requested = path.resolve(root, "." + pathname);
    if (!requested.startsWith(root + path.sep) && requested !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    let file = requested === root ? path.join(root, "index.html") : requested;
    let data;
    try {
      data = await readFile(file);
    } catch {
      if (path.extname(pathname)) {
        res.writeHead(404);
        res.end();
        return;
      }
      file = path.join(root, "index.html");
      data = await readFile(file);
    }
    res.writeHead(200, {
      "content-type": types[path.extname(file)] ?? "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(500);
    res.end("Preview could not be served. Run npm run export:web first.");
  }
}).listen(4173, "127.0.0.1", () =>
  console.log("BoloFluent preview: http://127.0.0.1:4173"),
);
