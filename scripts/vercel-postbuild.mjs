import fs from "fs";

const OUT = ".vercel/output";
const FUNC = `${OUT}/functions/__nitro.func`;

// 1. Estrutura de diretórios
fs.mkdirSync(`${FUNC}/assets`, { recursive: true });
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
    handler: "handler.js",
    launcherType: "Nodejs",
  })
);

// 4. Wrapper Node.js que adapta o fetch handler do Nitro para o Vercel
fs.writeFileSync(
  `${FUNC}/handler.js`,
  `import server from "./server.js";

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

  const response = await server.fetch(request, {});

  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  const buf = await response.arrayBuffer();
  res.end(Buffer.from(buf));
}
`
);

// 5. package.json para ESM na função
fs.writeFileSync(`${FUNC}/package.json`, JSON.stringify({ type: "module" }));

// Copia o servidor e seus assets
fs.copyFileSync("dist/server/server.js", `${FUNC}/server.js`);
for (const file of fs.readdirSync("dist/server/assets")) {
  fs.copyFileSync(`dist/server/assets/${file}`, `${FUNC}/assets/${file}`);
}

// 6. Copia assets estáticos do cliente
for (const file of fs.readdirSync("dist/client/assets")) {
  fs.copyFileSync(`dist/client/assets/${file}`, `${OUT}/static/assets/${file}`);
}

console.log("✓ .vercel/output estruturado com sucesso");
