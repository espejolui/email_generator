# 🧩 Generador de Plantillas (Drag & Drop Template Builder)

Editor visual de plantillas compuesto por **tres columnas**: paleta de bloques, lienzo de edición (drag & drop) y previsualización en tiempo real.

---

## 1. Visión general

| Columna | Nombre        | Función                                                                 |
|---------|---------------|--------------------------------------------------------------------------|
| 1       | `Paleta`      | Lista de bloques disponibles (texto, título, imagen, etc.) para arrastrar |
| 2       | `Lienzo`      | Zona donde el usuario suelta los bloques, los reordena y edita contenido |
| 3       | `Preview`     | Renderizado en vivo de la plantilla resultante, **maquetada con tablas** para compatibilidad con clientes de correo, con **botón de descarga** |

El usuario debe poder:
- Arrastrar un bloque desde la **Paleta** hacia el **Lienzo**.
- Reordenar bloques dentro del **Lienzo** libremente (drag para reposicionar).
- Editar el contenido de cada bloque directamente en el **Lienzo**.
- Ver el resultado reflejado instantáneamente en el **Preview**.
- **Descargar** desde el Preview el archivo `.html` final exactamente igual a lo que se está visualizando.

---

## 2. Reglas generales del proyecto

1. **HTML semántico**: todo el marcado debe pasar el validador [W3C Nu Html Checker](https://validator.w3.org/nu/) sin errores ni warnings relevantes.
2. **TypeScript estricto**:
   - `strict: true` en `tsconfig.json`.
   - **Prohibido usar `any`** bajo cualquier circunstancia (usar `unknown`, genéricos o tipos discriminados).
   - Uso de **decoradores** (`experimentalDecorators` / decoradores de la propuesta TC39 stage 3) para definir bloques, propiedades reactivas o metadatos de componentes.
3. **Seguridad**: todo contenido insertado por el usuario debe pasar por **escape/sanitización** antes de renderizarse (prevención de XSS). Nunca usar `innerHTML` con contenido sin sanitizar.
4. **CSS puro**: sin frameworks ni preprocesadores. Usar **CSS Nesting nativo** (`& {}`) según la especificación moderna del CSS Working Group.
5. **Accesibilidad**: roles ARIA en las zonas de drag & drop (`aria-grabbed`, `aria-dropeffect` o el patrón moderno con `aria-live` para anunciar cambios de orden).
6. **Compatibilidad con clientes de correo**: el HTML que se genera en el **Preview** (y el que se descarga) debe maquetarse con `<table>` en lugar de `display: grid`/`flexbox`, y usar **estilos inline** en cada elemento. Esto es obligatorio porque Outlook, Gmail y la mayoría de webmails ignoran o eliminan `<style>` en `<head>` y no soportan CSS moderno, lo que además reduce el riesgo de que el correo caiga en spam.
7. **Descarga de la plantilla**: el Preview debe incluir un botón que exporte exactamente el HTML mostrado (mismo contenido, mismo orden de bloques) como archivo `.html` descargable, listo para pegar en un ESP (Mailchimp, SendGrid, etc.) o enviar directo.

> ⚠️ Importante: la regla 4 (CSS puro con nesting) aplica a la **interfaz del editor** (Paleta, Lienzo, controles). El **HTML exportado para email** es un caso especial y **no** usa nesting ni hojas de estilo externas — ver sección 9.

---

## 3. Estructura de carpetas sugerida

```
src/
├── blocks/                # Definición de cada bloque disponible
│   ├── TextBlock.ts
│   ├── TitleBlock.ts
│   ├── ImageBlock.ts
│   └── index.ts            # Registro central de bloques (extensible)
├── core/
│   ├── decorators/          # @Block, @Editable, @Sanitize, etc.
│   ├── dnd/                 # Lógica de drag & drop (HTML5 DnD API / Pointer Events)
│   ├── sanitize/            # Utilidades de escape/seguridad
│   └── render/               # Motor de renderizado del preview
├── components/
│   ├── Palette/              # Columna 1
│   ├── Canvas/                # Columna 2
│   └── Preview/                # Columna 3
├── styles/
│   ├── base.css
│   ├── palette.css
│   ├── canvas.css
│   └── preview.css
└── main.ts
```

---

## 4. Sistema de bloques (extensible)

Cada bloque se define como una clase decorada, de forma que agregar uno nuevo no requiera tocar el núcleo del editor.

```ts
// core/decorators/Block.ts
export interface BlockMetadata {
  type: string;
  label: string;
  icon: string;
}

const registry = new Map<string, BlockMetadata>();

export function Block(metadata: BlockMetadata) {
  return function <T extends { new (...args: unknown[]): object }>(target: T): T {
    registry.set(metadata.type, metadata);
    return target;
  };
}

export function getRegisteredBlocks(): BlockMetadata[] {
  return Array.from(registry.values());
}
```

```ts
// blocks/TextBlock.ts
import { Block } from "../core/decorators/Block";
import { Editable } from "../core/decorators/Editable";
import { sanitizeText } from "../core/sanitize/sanitizeText";

export interface TextBlockData {
  readonly id: string;
  content: string;
}

@Block({ type: "text", label: "Caja de texto", icon: "📝" })
export class TextBlock {
  readonly id: string;
  #content = "";

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set content(value: string) {
    this.#content = sanitizeText(value);
  }

  get content(): string {
    return this.#content;
  }
}
```

### Bloques mínimos requeridos

| Tipo      | Etiqueta        | Elemento HTML semántico sugerido |
|-----------|-----------------|-----------------------------------|
| `title`   | Título           | `<h1>`–`<h6>` según nivel         |
| `text`    | Caja de texto    | `<p>`                              |
| `image`   | Imagen           | `<figure><img><figcaption></figure>` |
| `list`    | Lista            | `<ul>` / `<ol>` con `<li>`         |
| `quote`   | Cita             | `<blockquote>`                     |
| `divider` | Separador        | `<hr>`                             |

> Nuevos bloques se agregan creando un archivo en `blocks/`, decorándolo con `@Block(...)` y registrándolo en `blocks/index.ts`. El editor debe descubrirlos automáticamente sin modificar `Palette` ni `Canvas`.

---

## 5. HTML semántico (columna a columna)

```html
<div class="editor">
  <aside class="palette" aria-label="Bloques disponibles">
    <h2>Bloques</h2>
    <ul>
      <li draggable="true" data-block-type="text">Caja de texto</li>
      <li draggable="true" data-block-type="title">Título</li>
      <li draggable="true" data-block-type="image">Imagen</li>
    </ul>
  </aside>

  <main class="canvas" aria-label="Área de edición" aria-dropeffect="move">
    <!-- bloques soltados por el usuario -->
  </main>

  <section class="preview" aria-label="Previsualización">
    <!-- render de solo lectura -->
  </section>
</div>
```

Reglas específicas:
- `<aside>` para la Paleta (contenido complementario a la navegación principal).
- `<main>` para el Lienzo (es el contenido editable principal de la página).
- `<section>` con `aria-label` para el Preview.
- Cada bloque insertado debe usar la etiqueta semántica correspondiente, **nunca** `<div>` genérico como contenedor de contenido significativo.
- Validar cada cambio contra `https://validator.w3.org/nu/` antes de dar por cerrada una funcionalidad.

---

## 6. Drag & Drop

- Usar la **HTML5 Drag and Drop API** (`dragstart`, `dragover`, `drop`) o **Pointer Events** como alternativa accesible.
- El bloque arrastrado desde la Paleta debe clonarse (no moverse) al soltarse en el Lienzo.
- Dentro del Lienzo, los bloques existentes deben poder reordenarse mediante drag interno (`dragstart` sobre el bloque ya insertado + `dragover` para calcular la posición de inserción).
- Mostrar un indicador visual (placeholder) de dónde se insertará el bloque al soltar.
- Sincronizar el estado del Lienzo con el Preview mediante un modelo de datos único (single source of truth), evitando leer/escribir directamente del DOM del preview.

```ts
// core/dnd/dragController.ts
export interface DragPayload {
  readonly blockType: string;
  readonly sourceId?: string; // presente si es reordenamiento interno
}

export function onDrop(event: DragEvent, insertAt: number): void {
  event.preventDefault();
  const raw = event.dataTransfer?.getData("application/json");
  if (!raw) return;

  const payload = JSON.parse(raw) as DragPayload;
  // delegar en el store/estado del editor, nunca mutar el DOM directamente
}
```

---

## 7. Seguridad (escapes)

- Todo texto ingresado por el usuario pasa por `sanitizeText()` antes de guardarse en el modelo de datos.
- Atributos como `src` de imágenes deben validarse contra una lista blanca de protocolos (`https:`, `data:image/*` controlado).
- Prohibido usar `dangerouslySetInnerHTML`-equivalentes sin sanitización previa (usar `textContent` en lugar de `innerHTML` siempre que sea posible).

```ts
// core/sanitize/sanitizeText.ts
export function sanitizeText(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return input.replace(/[&<>"']/g, (char) => map[char] ?? char);
}
```

---

## 8. CSS puro con nesting nativo

```css
.editor {
  display: grid;
  grid-template-columns: 240px 1fr 1fr;
  gap: 1rem;

  & .palette {
    border-right: 1px solid var(--border-color);

    & li {
      cursor: grab;

      &:hover {
        background: var(--hover-bg);
      }
    }
  }

  & .canvas {
    & .block {
      &[data-dragging="true"] {
        opacity: 0.5;
      }
    }
  }
}
```

- No usar Sass/Less/PostCSS: apoyarse en el soporte nativo de **CSS Nesting** de los navegadores modernos.
- Variables CSS (`--custom-prop`) para theming.
- Sin frameworks de utilidades (Tailwind, Bootstrap, etc.).

---

## 9. Preview con tablas compatibles con email

El Preview no renderiza el `<div>`/CSS del editor: renderiza un **motor de exportación aparte** que traduce cada bloque del modelo de datos a HTML de tablas con estilos inline, siguiendo las convenciones estándar de email marketing (600px de ancho, `role="presentation"`, `cellpadding`/`cellspacing` en 0, atributos `width` explícitos).

```html
<!-- Salida del motor de exportación, NO el HTML del editor -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px; margin:0 auto; border-collapse:collapse;">
  <tr>
    <td style="padding:16px 24px; font-family:Arial, sans-serif; font-size:24px; font-weight:bold; color:#111111;">
      Título de ejemplo
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 16px; font-family:Arial, sans-serif; font-size:14px; line-height:1.5; color:#333333;">
      Texto de ejemplo generado desde el bloque de tipo <code>text</code>.
    </td>
  </tr>
  <tr>
    <td style="padding:0 24px 16px;">
      <img src="https://example.com/imagen.jpg" width="552" alt="Descripción de la imagen"
           style="display:block; width:100%; max-width:552px; height:auto; border:0;">
    </td>
  </tr>
</table>
```

Reglas del motor de exportación (`core/render/exportToEmailHtml.ts`):
- Un renderer por tipo de bloque (`renderTitle`, `renderText`, `renderImage`, …), cada uno devuelve una fila (`<tr><td>...</td></tr>`) con estilos **inline**, nunca clases ni `<style>` externo.
- Todo el contenido de texto pasa por `sanitizeText()` antes de insertarse (misma regla de seguridad de la sección 7).
- El documento final incluye `<!DOCTYPE html>`, `<html lang="es">`, `<meta charset="utf-8">` y `<meta name="viewport">`, validado igualmente contra `https://validator.w3.org/nu/`.
- Evitar `background-image` vía CSS (soporte pobre en Outlook); usar `<img>` o color plano en `bgcolor`.
- No usar `id`/`class` que dependan de una hoja de estilos externa: cada `<td>` debe ser autocontenido.

```ts
// core/render/exportToEmailHtml.ts
export interface RenderedRow {
  readonly html: string; // "<tr>...</tr>" con estilos inline
}

export interface EmailBlockRenderer<TData> {
  render(data: TData): RenderedRow;
}

export function buildEmailDocument(rows: readonly RenderedRow[]): string {
  const body = rows.map((row) => row.html).join("\n");
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plantilla</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; margin:0 auto;">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
```

---

## 10. Botón de descarga

- Vive dentro de la columna Preview (`components/Preview/DownloadButton.ts`), como un `<button type="button">` (nunca `<a>` sin `download` ni `<form>`).
- Al hacer click, toma el **mismo HTML** que se está mostrando en el Preview (salida de `buildEmailDocument`, sección 9) y lo descarga como `.html`.
- No debe recalcular ni regenerar el HTML por separado: Preview y descarga consumen la misma función, para evitar que difieran.

```ts
// components/Preview/DownloadButton.ts
export function downloadTemplate(html: string, filename = "plantilla.html"): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
```

```html
<section class="preview" aria-label="Previsualización">
  <header class="preview__toolbar">
    <button type="button" data-action="download-template">Descargar plantilla</button>
  </header>
  <div class="preview__frame" aria-live="polite">
    <!-- HTML de tablas generado por buildEmailDocument -->
  </div>
</section>
```

---

## 11. Checklist de validación antes de cada entrega

- [ ] El HTML generado pasa `validator.w3.org/nu` sin errores.
- [ ] `tsc --noEmit` sin errores y sin ningún `any`.
- [ ] Todo contenido de usuario pasa por sanitización.
- [ ] El CSS del editor usa nesting nativo, sin preprocesadores.
- [ ] El HTML exportado para email usa **tablas + estilos inline**, sin CSS externo ni nesting.
- [ ] El botón de descarga genera un archivo idéntico a lo que se ve en el Preview.
- [ ] Los tres bloques mínimos (texto, título, imagen) están registrados vía decorador.
- [ ] El drag & drop funciona tanto para insertar desde la Paleta como para reordenar en el Lienzo.
- [ ] El Preview refleja el estado del Lienzo sin desincronización.

---

## 12. Extensibilidad futura

Nuevos tipos de bloque (video, tabla, botón, columnas, separadores personalizados) solo requieren:
1. Crear el archivo en `blocks/`.
2. Decorar la clase con `@Block({...})`.
3. Definir su renderizado semántico correspondiente en `core/render/` (vista del editor) **y** su renderer de fila de tabla en `exportToEmailHtml.ts` (vista de Preview/descarga).
4. El bloque aparecerá automáticamente en la Paleta gracias al registro central.
