const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const dir = path.join(__dirname, "ammo");
const idl = path.join(dir, "ammo.idl");
const ambient = path.join(dir, "ambient.d.ts");
const modules = ["ammo.d.ts", "ammo.wasm.d.ts"];

execSync(`npx webidl-dts-gen -i "${idl}" -o "${ambient}" -e -n Ammo`, {
  stdio: "inherit",
});

const content = "export = Ammo;\n" + fs.readFileSync(ambient, "utf8");
for (const file of modules) {
  const target = path.join(dir, file);
  fs.writeFileSync(target, content);
  console.log(`✔ ${target}`);
}
