import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const outputRoot = process.argv[2] ?? ".";
const vendorDir = path.join(outputRoot, "vendor");
mkdirSync(vendorDir, { recursive: true });
copyFileSync(
  path.join("node_modules", "lucide", "dist", "umd", "lucide.min.js"),
  path.join(vendorDir, "lucide.min.js"),
);
console.log(`Lucide local copiado en ${path.join(vendorDir, "lucide.min.js")}`);
