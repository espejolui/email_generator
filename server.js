import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const rootPrefix = `${root}${path.sep}`;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};
const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cache-Control": "no-store",
};

function isPublicPath(relativePath) {
  return relativePath === "index.html" || /^(?:css|js|vendor)\/[a-zA-Z0-9._/-]+$/.test(relativePath);
}

const server = http.createServer((req, res) => {
  const method = req.method ?? "GET";
  const send = (status, body, headers = {}) => {
    res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
    res.end(method === "HEAD" ? undefined : body);
  };

  if (method !== "GET" && method !== "HEAD") {
    send(405, "Method not allowed", { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  let urlPath;
  try {
    const rawPath = new URL(req.url ?? "/", "http://localhost").pathname;
    urlPath = decodeURIComponent(rawPath);
  } catch {
    send(400, "Bad request", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  if (urlPath.includes("\0") || urlPath.includes("\\")) {
    send(400, "Bad request", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const relativePath = urlPath === "/" ? "index.html" : urlPath.slice(1);
  if (path.posix.normalize(relativePath) !== relativePath || !isPublicPath(relativePath)) {
    send(404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  const file = path.resolve(root, relativePath);
  if (!file.startsWith(rootPrefix)) {
    send(403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  fs.realpath(file, (realPathError, realFile) => {
    if (realPathError || !realFile.startsWith(rootPrefix)) {
      send(404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    fs.readFile(realFile, (readError, data) => {
      if (readError) {
        send(404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
        return;
      }
      const type = MIME[path.extname(realFile)] ?? "application/octet-stream";
      send(200, data, { "Content-Type": type });
    });
  });
});

server.requestTimeout = 10_000;
server.headersTimeout = 5_000;
server.keepAliveTimeout = 5_000;
const port = Number(process.env["PORT"] ?? 8080);
server.listen(port, "127.0.0.1", () => {
  console.log(`http://localhost:${String(port)}`);
});
