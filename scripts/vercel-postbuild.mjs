import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".vercel/output");

fs.mkdirSync(`${OUT}/static/assets`, { recursive: true });

const assetFiles = fs.readdirSync(`${ROOT}/dist/client/assets`);
const cssFile = assetFiles.find((f) => f.endsWith(".css"));
const jsFile = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js"));

if (!jsFile) throw new Error("Could not find index-*.js in dist/client/assets");

const cssTag = cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}">` : "";

// TanStack Start's default client entry (hydrateRoot + StartClient) needs
// window.$_TSR to exist, otherwise hydrate() throws. We inject a minimal
// empty bootstrap so the router initialises without server data and does a
// full client-side render — effectively a pure SPA.
const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Oráculo das Nações</title>
    <meta name="description" content="Dispute PIB, juros, inflação e dívida — quem manda no tabuleiro global?" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Red+Hat+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
    ${cssTag}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${jsFile}"></script>
  </body>
</html>`;

fs.writeFileSync(`${OUT}/static/index.html`, html);
console.log(`✓ shell index.html gerado — js: ${jsFile}, css: ${cssFile ?? "none"}`);

for (const file of assetFiles) {
  fs.copyFileSync(
    `${ROOT}/dist/client/assets/${file}`,
    `${OUT}/static/assets/${file}`,
  );
}
console.log(`✓ ${assetFiles.length} assets copiados`);

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
