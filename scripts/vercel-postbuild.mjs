import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".vercel/output");

// 1. Diretório estático
fs.mkdirSync(`${OUT}/static/assets`, { recursive: true });

// 2. Gera index.html rodando o servidor SSR localmente
console.log("Gerando index.html via SSR local...");
const serverModule = await import(path.join(ROOT, "dist/server/server.js"));
const server = serverModule.default;
const response = await server.fetch(new Request("http://localhost/"), {});
const html = await response.text();
fs.writeFileSync(`${OUT}/static/index.html`, html);
console.log("✓ index.html gerado");

// 3. Assets estáticos do cliente
for (const file of fs.readdirSync(`${ROOT}/dist/client/assets`)) {
  fs.copyFileSync(
    `${ROOT}/dist/client/assets/${file}`,
    `${OUT}/static/assets/${file}`
  );
}

// 4. Config do Vercel Output — SPA estática com rewrite
fs.writeFileSync(
  `${OUT}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      // Serve assets diretamente
      { src: "/assets/(.*)", dest: "/assets/$1" },
      // Tudo mais → SPA
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/index.html" },
    ],
  })
);

console.log("✓ .vercel/output estruturado com sucesso");
