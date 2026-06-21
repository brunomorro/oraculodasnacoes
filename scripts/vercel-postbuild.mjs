import fs from "fs";
import path from "path";

const OUT = ".vercel/output";

// 1. Estrutura de diretórios
fs.mkdirSync(`${OUT}/functions/__nitro.func/assets`, { recursive: true });
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

// 3. Config da Edge Function
fs.writeFileSync(
  `${OUT}/functions/__nitro.func/.vc-config.json`,
  JSON.stringify({
    runtime: "edge",
    entrypoint: "server.js",
  })
);

// 4. Copia o servidor
fs.copyFileSync("dist/server/server.js", `${OUT}/functions/__nitro.func/server.js`);

// 5. Copia assets do servidor (importados pelo server.js)
const serverAssets = fs.readdirSync("dist/server/assets");
for (const file of serverAssets) {
  fs.copyFileSync(`dist/server/assets/${file}`, `${OUT}/functions/__nitro.func/assets/${file}`);
}

// 6. Copia assets estáticos do cliente
const clientAssets = fs.readdirSync("dist/client/assets");
for (const file of clientAssets) {
  fs.copyFileSync(`dist/client/assets/${file}`, `${OUT}/static/assets/${file}`);
}

console.log("✓ .vercel/output estruturado com sucesso");
