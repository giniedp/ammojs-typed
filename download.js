// Requires Node 18+ (global fetch)
const fs = require("node:fs/promises");
const path = require("node:path");

const BASE =
  "https://raw.githubusercontent.com/kripken/ammo.js/refs/heads/main";
const OUT = path.join(__dirname, "ammo");

const FILES = [
  "ammo.idl",
  "builds/ammo.js",
  "builds/ammo.wasm.js",
  "builds/ammo.wasm.wasm",
];

async function download(file) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: ${res.status} ${res.statusText}`);
  const target = path.join(OUT, path.basename(file));
  await fs.writeFile(target, Buffer.from(await res.arrayBuffer()));
  console.log(`✔ ${target}`);
}

(async () => {
  await fs.mkdir(OUT, { recursive: true });
  await Promise.all(FILES.map(download));
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
