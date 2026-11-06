# Seguridad

Revisión realizada el **5 de noviembre de 2026**. El proyecto es una aplicación
estática TypeScript/HTML/CSS; no contiene PHP, base de datos, autenticación ni
API remota. Las vulnerabilidades de PHP publicadas en octubre de 2026 no son
alcanzables desde este repositorio.

## Runtime y dependencias

- `.nvmrc` fija Node **22.23.4**, versión que incluye las correcciones de
  seguridad del 21 de octubre de 2026. `package.json#engines` admite únicamente
  las ramas 22.23.4+, 24.22.1+ y 26.12.1+.
- Cloudflare Pages debe usar `NODE_VERSION=22.23.4`, no una versión anterior.
- TypeScript **5.9.3**, Playwright **1.65.0** y Lucide **1.69.0** están fijados
  en `package.json`/`pnpm-lock.yaml`. `pnpm audit` no reporta vulnerabilidades
  conocidas al momento de la revisión.
- Lucide se copia desde el paquete fijado a `vendor/` durante cada build. Ya no
  se ejecuta JavaScript de un CDN ni una etiqueta flotante `@latest`.

Fuentes oficiales: [seguridad Node, octubre de
2026](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
y [avisos PHP de 2026](https://www.php.net/archive/2026.php).

## Controles de la aplicación

- Todo texto del editor o de una plantilla importada se escapa antes de entrar
  al modelo; URLs e imágenes tienen listas blancas de protocolos.
- El importador usa `DOMParser` inerte y descarta scripts, atributos de evento,
  hojas de estilo y elementos no compatibles. Archivos limitados a 2 MB,
  1000 elementos y profundidad 100 para evitar agotar recursos del navegador.
- CSP restringe scripts al mismo origen, objetos deshabilitados, formularios sin
  destino, conexiones al mismo origen y fuentes solo a Google Fonts. Los estilos
  inline siguen permitidos porque son necesarios para el email.
- `_headers` añade anti-framing, `nosniff`, `Referrer-Policy: no-referrer`,
  COOP y una `Permissions-Policy` mínima en Cloudflare Pages.
- El Preview usa `innerHTML` únicamente con markup propio y datos ya sanitizados;
  no inserta el HTML importado directamente.

## Servidor local

`server.js` es solo para desarrollo y escucha en `127.0.0.1`. Sirve únicamente
`index.html`, `css/`, `js/` y `vendor/`; no expone `package.json`, lockfiles,
documentación, código fuente ni `.git`. Normaliza rutas, comprueba la ruta real,
rechaza traversal, limita métodos a GET/HEAD y envía las mismas cabeceras de
seguridad que producción. No debe usarse como servidor público.

## Comprobaciones periódicas

```bash
pnpm install
pnpm audit
pnpm run check
pnpm run build:pages
```

Antes de desplegar, revisar también los avisos oficiales de Node y actualizar
`.nvmrc`, `engines` y `NODE_VERSION` cuando aparezca una nueva versión de
seguridad. La ausencia de hallazgos en `pnpm audit` no sustituye estas revisiones.
