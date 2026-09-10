# Despliegue en Cloudflare Pages

El JS se genera desde TypeScript (`ts/` → `tsc`), y `js/` está ignorado en
git. Por eso Pages debe **compilar** en cada despliegue; sin comando de
build sirve el HTML de fallback en `/js/*` y la paleta sale vacía.

## Ajustes (Dashboard → Pages → genmail → Settings → Builds)

- **Build command:** `pnpm run build:pages`
  (compila a `dist/js` y copia `index.html` + `css/` a `dist/`;
  Cloudflare detecta pnpm por `pnpm-lock.yaml`).
- **Build output directory:** `dist`
- **Variable de entorno:** `NODE_VERSION=22`

El desarrollo local no cambia: `pnpm start` compila a `js/` y sirve con
`server.js`.

## Cómo saber si el build se subió

1. En el Dashboard → Deployments → abrir el despliegue → **Build log**:
   debe mostrar `tsc -p tsconfig.pages.json`, `dist/ listo` y
   `Deploy complete`.
2. Comprobación directa (el JS debe empezar con `import`, no con HTML):
   `curl -s https://genmail.pages.dev/js/main.js | head -1`
   → `import "./blocks/index.js";`
   Si devuelve `<!DOCTYPE html>`, el build no corrió o el output dir
   está mal configurado.
