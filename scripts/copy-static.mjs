import { cpSync, mkdirSync, rmSync } from "node:fs";

/** Copia los estáticos a dist/ (el JS lo genera tsc con tsconfig.pages.json). */
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("index.html", "dist/index.html");
cpSync("css", "dist/css", { recursive: true });
console.log("dist/ listo: index.html + css/ (+ js/ generado por tsc)");
