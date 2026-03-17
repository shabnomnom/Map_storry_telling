// server.js — local proxy for Carte
// Serves your HTML files AND forwards /api/claude → Anthropic API
//
// Setup:
//   1. Set env vars: Mapbox_KEY and Claude_KEY
//   2. Run: node server.js
//   3. Open: http://localhost:3000/carte.html

// write these with import statements instead of require, and export the server at the end of the file
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CONFIG ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const ANTHROPIC_KEY = process.env.Claude_KEY || "YOUR_ANTHROPIC_API_KEY_HERE";

// ── MIME TYPES ──────────────────────────────────────────
const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// ── SERVER ──────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS headers on every response
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── PROXY: POST /api/claude → Anthropic ──────────────
  if (req.method === "POST" && req.url === "/api/claude") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const options = {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(body),
        },
      };

      const proxy = https.request(options, (apiRes) => {
        res.writeHead(apiRes.statusCode, {
          "Content-Type": "application/json",
        });
        apiRes.pipe(res);
      });

      proxy.on("error", (err) => {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: err.message } }));
      });

      proxy.write(body);
      proxy.end();
    });
    return;
  }

  // ── STATIC FILES ─────────────────────────────────────
  // Strip query strings so ?v=123 cache-busters still resolve
  const pathname = req.url.split("?")[0];
  let filePath = pathname === "/" ? "/carte.html" : pathname;
  filePath = path.join(__dirname, filePath);
  const ext = path.extname(filePath);
  // manifest.json must be served as application/manifest+json for PWA install
  const contentType = filePath.endsWith("manifest.json")
    ? "application/manifest+json"
    : MIME[ext] || "text/plain";

  // Binary types must NOT be decoded as UTF-8
  const isBinary = [".png", ".ico"].includes(ext);

  fs.readFile(filePath, isBinary ? null : "utf8", (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    // Inject env tokens into HTML files before serving
    if (ext === ".html") {
      data = data.replace("__MAPBOX_TOKEN__", process.env.Mapbox_KEY || "");
    }
    const headers = { "Content-Type": contentType };
    // Allow the SW to control the entire origin
    if (filePath.endsWith("sw.js")) {
      headers["Service-Worker-Allowed"] = "/";
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Carte server running`);
  console.log(`  → http://localhost:${PORT}/carte.html\n`);

  if (ANTHROPIC_KEY === "YOUR_ANTHROPIC_API_KEY_HERE") {
    console.warn("  ⚠  Set your Anthropic API key via:");
    console.warn("     Claude_KEY=sk-ant-... node server.js\n");
  }
});
