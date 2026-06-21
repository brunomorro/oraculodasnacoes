import fs from "fs";
import { execSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".vercel/output");
const FUNC = `${OUT}/functions/__nitro.func`;

// 1. Estrutura de diretórios
fs.mkdirSync(FUNC, { recursive: true });
fs.mkdirSync(`${OUT}/static/assets`, { recursive: true });

// 2. Config do Vercel Output
fs.writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/__nitro" },
    ],
  })
);

// 3. Config da função Node.js serverless
fs.writeFileSync(
  `${FUNC}/.vc-config.json`,
  JSON.stringify({
    runtime: "nodejs20.x",
    handler: "index.js",
    launcherType: "Nodejs",
  })
);

// 4. Cria entry point para o bundle
const entryPath = path.join(ROOT, "_vercel_entry_tmp.mjs");
fs.writeFileSync(entryPath, `
import server from "./dist/server/server.js";

export default async function handler(req, res) {
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  const url = \`\${protocol}://\${host}\${req.url}\`;

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on("data", (c) => chunks.push(c));
    req.on("end", resolve);
    req.on("error", reject);
  });

  const body = ["GET", "HEAD"].includes(req.method) || chunks.length === 0
    ? undefined
    : Buffer.concat(chunks);

  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body,
  });

  try {
    const response = await server.fetch(request, {});
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const buf = await response.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    console.error("[handler error]", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Server error: " + String(err?.stack ?? err));
  }
}
`);

// 5. Usa esbuild para criar bundle completo com todas as dependências
console.log("Bundling com esbuild...");
execSync(
  `node_modules/.bin/esbuild _vercel_entry_tmp.mjs \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=esm \
    --outfile=.vercel/output/functions/__nitro.func/index.js \
    --external:node:* \
    --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"`,
  { cwd: ROOT, stdio: "inherit" }
);

// 6. Limpa arquivo temporário
fs.unlinkSync(entryPath);

// 7. Copia assets estáticos do cliente
for (const file of fs.readdirSync(`${ROOT}/dist/client/assets`)) {
  fs.copyFileSync(`${ROOT}/dist/client/assets/${file}`, `${OUT}/static/assets/${file}`);
}

console.log("✓ .vercel/output estruturado com sucesso");
