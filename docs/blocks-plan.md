# Plan de nuevos bloques

Estado: **Fase 1 ✅ hecha** · **Fase 2 ✅ hecha** · **Fase 3 ✅ hecha**.

Decisiones acordadas: fases verificadas, CTA como tipo `cta` nuevo (sin tocar
el botón WhatsApp), columnas con anidado genérico cuidadoso (Fase 2), social
como enlaces de texto y countdown cubierto por el bloque `banner` genérico.

Rutina obligatoria por cada bloque nuevo (AGENTS.md, sin excepciones):

1. `ts/blocks/types.ts`: ampliar `BlockType`, interfaz `XBlockData`, guardas.
2. `ts/blocks/XBlock.ts`: clase `@Block` + setters `@Editable` (sanitizan) + `toData()`.
3. `ts/blocks/index.ts`: importar y caso en `createBlockData()`.
4. `ts/core/render/exportToEmailHtml.ts`: `renderX()` + caso en `renderBlockToRow()`.
5. `ts/components/Canvas/Canvas.ts`: caso en `renderFields()` con primitivas existentes.
6. La Paleta lo descubre sola (registro central). Cierre: `check` + `build` + test.

Helpers compartidos (no duplicar código):

- `sanitizeHttpsUrl()` en `sanitize.ts`: solo `https:` absoluto, resto `""`.
  Difiere de `sanitizeImageSrc` (que admite `data:`) a propósito.
- `pillRow()` en `exportToEmailHtml.ts`: fila de botón pill; la usan `button` y `cta`.
- `socialLinksInner()` en `exportToEmailHtml.ts`: fila de enlaces de texto;
  la usan `social` y `footer`.
- `columnsTable()` (Fase 2): tabla anidada de N columnas; la usan `columns`,
  `product` y `signature`.

## Fase 1 — base + cumplimiento (✅ hecha)

- `spacer`: `height` (número 0–80, `sanitizeMargin`, defecto 16). Fila vacía con
  `height` + `bgcolor` en `<td>` (Outlook-safe, sin depender de margin/padding).
- `header`: `logoSrc` (imagen https/data), `logoAlt`, `tagline` (texto),
  `align`. Logo centrado/izquierda + tagline tenue.
- `footer`: `address` (texto), `unsubscribeUrl` (https) + `social: SocialUrls`
  (4 urls opcionales). Dirección tenue centrada + enlace unsubscribe + redes.
  Casi obligatorio (CAN-SPAM / spam).
- `cta`: `label`, `url` (https), `color` (reutiliza `ButtonColor`),
  `align` (reutiliza `ButtonAlign`), márgenes. Mismo pill vía `pillRow()`;
  sin URL muestra pill sin enlace (igual que `button` sin teléfono).

## Fase 2 — layout (✅ hecha)

- `columns`: 2–3 columnas con **anidado genérico** (`blocks` por columna).
  Sin cambios al store (edición interna vía `update(id, {columns})` completo);
  render recursivo con `corners=""` interno; firma de Canvas extendida con
  conteo interno para refrescar ante cambios estructurales internos.
  Limitación v1 documentada: sin apilado móvil (Outlook manda).
- `table`: `headers: readonly string[]` (máx. 6 col), `rows: readonly
  (readonly string[])[]` (máx. 20 filas), `headerRow: boolean`. Tabla anidada
  real con `th/td` y bordes (Outlook-safe). Editor: un punto por línea con `|`.

## Fase 3 — marketing / personal

- `social`: `social: SocialUrls`. Fila centrada de enlaces de texto.
- `banner`: `src` (imagen), `alt`, `href` (https opcional). Cubre video con
  thumbnail (imagen + pill "▶ Ver video" debajo, sin overlay absoluto que
  Outlook no soporta) y countdown (GIF externo como `src`).
- `product`: `src`, `alt`, `name`, `price`, `url`, `color`, `align`.
  Reutiliza `columnsTable()` (imagen + texto) y `pillRow()`.
- `coupon`: `code`, `description`. Badge centrado con `border` en `<td>`
  (Outlook-safe), código destacado.
- `signature`: `name`, `role`, `photoSrc`, `photoAlt`. Reutiliza
  `columnsTable()` (foto pequeña + texto).

## Verificación de cada fase

- `pnpm run check` + `pnpm run build` limpios, cero `any`.
- Igualdad de salida pre/post refactor para los bloques existentes
  (`/tmp/opencode/baseline.json`): ningún cambio visual no intencional.
- Test de render de bloques nuevos: tablas + inline, sin `class`/`id`,
  sanitización de entradas hostiles.
