# Generador de Plantillas (Drag & Drop Template Builder)

Editor visual de plantillas de correo con arrastrar y soltar, compuesto por
**tres columnas**: paleta de bloques, lienzo de edición y previsualización en
tiempo real. El resultado se exporta como HTML de **tablas con estilos inline**
(600 px, `role="presentation"`), compatible con Outlook, Gmail y webmails, y se
descarga como `.html` listo para un ESP (Mailchimp, SendGrid, etc.).

Reglas del proyecto en [`AGENTS.md`](./AGENTS.md): TypeScript estricto sin
`any`, decoradores, sanitización al entrar, CSS puro con nesting nativo, HTML
semántico + ARIA y **pnpm** como único gestor (`pnpm-lock.yaml`).

## Requisitos

- Node.js 22
- pnpm 11 (`npm` está prohibido por `AGENTS.md`; el `preinstall` lo bloquea)

## Uso

```bash
pnpm install     # instalar dependencias
pnpm start       # compilar (tsc) y servir en http://localhost:8080
pnpm run check   # tsc --noEmit (validación)
pnpm run build   # compilar ts/ -> js/
```

Flujo de usuario: arrastra bloques de la **Paleta** al **Lienzo** (o pulsa
Enter), reordénalos, edítalos, cambia el fondo de la plantilla desde el
**Preview**, vacía todo con **Limpiar** y pulsa **Descargar plantilla**.

## Bloques (18)

| Tipo | Etiqueta | Contenido |
|------|----------|-----------|
| `title` | Título | `h1`–`h6`, alineación, colores, formato, márgenes |
| `text` | Caja de texto | Párrafo con formato y márgenes |
| `image` | Imagen | URL https/data + alt |
| `list` | Lista | `ul`/`ol`, un punto por línea |
| `quote` | Cita | Texto + autor opcional |
| `divider` | Separador | Degradado bulletproof (fallback sólido en Outlook) |
| `button` | Botón WhatsApp | Enlace `wa.me` oficial (verde/azul) |
| `spacer` | Espaciador | Altura fija Outlook-safe |
| `header` | Encabezado | Logo + tagline de marca |
| `footer` | Pie de página | Dirección + darse de baja + redes (CAN-SPAM) |
| `cta` | Botón enlace | URL genérica (Comprar ahora, Ver más…) |
| `columns` | Columnas | 2–3 columnas con bloques anidados (cualquiera) |
| `table` | Tabla de datos | `th/td` reales con bordes |
| `social` | Redes sociales | Enlaces Instagram/Facebook/X/LinkedIn |
| `banner` | Video / banner | Imagen enlazable + pie (p. ej. ▶ Ver video, GIF countdown) |
| `product` | Producto | Imagen + nombre + precio + botón |
| `coupon` | Cupón | Código estilo ticket con borde |
| `signature` | Firma | Nombre + cargo + foto |

Agregar uno nuevo: crear `ts/blocks/XBlock.ts` con `@Block` + `@Editable`,
registrarlo en `ts/blocks/index.ts`; la Paleta lo descubre sola
(detalle en [`docs/blocks.md`](./docs/blocks.md), plan en
[`docs/blocks-plan.md`](./docs/blocks-plan.md)).

## Dónde está cada cosa

```
ts/
├── blocks/        # 18 clases decoradas + types.ts + index.ts (fábrica/registro)
├── core/
│   ├── decorators/  # @Block (registro central) y @Editable
│   ├── dnd/         # payloads HTML5 DnD (nivel superior + columnas anidadas)
│   ├── sanitize/    # escape y listas blancas (texto, imágenes, urls, colores…)
│   ├── color/       # lightenHex para el degradado del divisor
│   ├── store/       # EditorStore: única fuente de verdad (+ fondo y clear())
│   └── render/      # exportToEmailHtml: filas <tr> con inline (preview = descarga)
├── components/
│   ├── Palette/     # columna 1 (aside): bloques arrastrables + atajos
│   ├── Canvas/      # columna 2 (main): edición, reorden, columnas anidadas, Limpiar
│   └── Preview/     # columna 3 (section): tarjeta viva + fondo + Descargar
└── main.ts          # cableado (sin lógica de negocio)
css/               # base/palette/canvas/preview/main: puro, con nesting nativo
index.html         # aside + main + section semánticos
server.js          # servidor estático local (solo desarrollo)
scripts/           # copy-static.mjs (build de Cloudflare Pages)
```

Qué hace cada pieza, en detalle:

- [`docs/blocks.md`](./docs/blocks.md) — sistema de bloques y datos por tipo.
- [`docs/decorators.md`](./docs/decorators.md) — `@Block` y `@Editable`.
- [`docs/store.md`](./docs/store.md) — `EditorStore` (`insertAt/move/update/remove/clear`, fondo).
- [`docs/dnd.md`](./docs/dnd.md) — payloads y cálculo del índice de inserción.
- [`docs/sanitize.md`](./docs/sanitize.md) — qué se sanitiza y dónde.
- [`docs/render.md`](./docs/render.md) — motor de exportación a email.
- [`docs/palette.md`](./docs/palette.md) / [`docs/canvas.md`](./docs/canvas.md) / [`docs/preview.md`](./docs/preview.md) — las tres columnas.
- [`docs/color.md`](./docs/color.md) — matemática de color.
- [`docs/deployment.md`](./docs/deployment.md) — despliegue en Cloudflare Pages.

## Compatibilidad con email

- Todo el contenido de usuario se sanitiza **al entrar al modelo**; el render
  no re-escapa (evita doble escape) y revalida URLs (`image`, `cta`, `banner`,
  `product`) igual que el precedente de `renderImage`.
- Sin `class`/`id`/`flex`/`grid`/`<script>` en la salida; cada celda es
  autocontenida con estilos inline y atributos legacy (`width`, `bgcolor`,
  `height`, `align`) que Outlook sí honra.
- Degradados con fallback sólido, divisor y botones en tablas anidadas
  bulletproof, espaciador con `height` en `<td>`.

## Despliegue

Cloudflare Pages compila en cada despliegue (`pnpm run build:pages` → `dist/`).
Ver [`docs/deployment.md`](./docs/deployment.md) para ajustes del dashboard y
cómo comprobar que el build se publicó.
