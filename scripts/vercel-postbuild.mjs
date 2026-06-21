import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".vercel/output");

fs.mkdirSync(`${OUT}/static/assets`, { recursive: true });

// Discover built asset filenames
const assetFiles = fs.readdirSync(`${ROOT}/dist/client/assets`);
const cssFile = assetFiles.find((f) => f.endsWith(".css"));
const jsFile = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js"));

if (!jsFile) throw new Error("Could not find index-*.js in dist/client/assets");

// Generate a minimal client-only shell — no SSR content so React never hydrates
const cssTag = cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}">` : "";
const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Oráculo das Nações</title>
    ${cssTag}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>`;

fs.writeFileSync(`${OUT}/static/index.html`, html);
console.log(`✓ index.html (shell) gerado — js: ${jsFile}, css: ${cssFile ?? "none"}`);

// Copy all client assets
for (const file of assetFiles) {
  fs.copyFileSync(
    `${ROOT}/dist/client/assets/${file}`,
    `${OUT}/static/assets/${file}`,
  );
}
console.log(`✓ ${assetFiles.length} assets copiados`);

// Vercel Output API v3 — SPA rewrites
fs.writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      { src: "/assets/(.*)", dest: "/assets/$1" },
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/index.html" },
    ],
  }),
);

console.log("✓ .vercel/output pronto");
