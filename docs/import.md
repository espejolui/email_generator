# Importación de HTML (`ts/core/import/importEmailHtml.ts`)

El botón **Importar HTML** del Lienzo abre un selector de archivos `.html`
(máximo 2 MB, 1000 elementos y profundidad 100). Si el lienzo ya contiene
bloques, pide confirmación antes de reemplazarlos. La importación carga bloques, fondo y `<title>` en una sola
actualización con `EditorStore.load()`.

## Conversión

`importEmailHtml(html)` usa `DOMParser`, cuyo documento es inerte: no ejecuta
scripts ni inserta el HTML original en el editor. Interpreta:

- `h1`–`h6`, `p`, `ul`/`ol`, `blockquote`/`cite` y `hr`.
- Imágenes solas como `image`; enlazadas o con `figcaption` como `banner`.
- Enlaces con texto y URL `https:` como `cta`, incluido el fondo de su celda.
- Tablas de datos con `th` (o tablas simples de varias celdas) como `table`.
- Filas de presentación con 2–3 celdas como `columns`, recursivamente.
- Alineación, colores, tamaño, márgenes y formato básico desde estilos inline.

El resto de contenedores se recorre para encontrar contenido compatible. Los
elementos no compatibles se omiten y su cantidad se anuncia por `aria-live`.
Si no se reconoce ningún bloque, el lienzo anterior permanece intacto.

Todo texto se normaliza desde `textContent` y pasa por `sanitizeText()` antes
de entrar al modelo; URLs e imágenes usan sus listas blancas habituales. Los
atributos de evento, scripts y estilos externos nunca se copian a los bloques.
