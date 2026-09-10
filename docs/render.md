# Exportación a email (`ts/core/render/exportToEmailHtml.ts`)

Motor aparte del editor: traduce bloques a filas de `<table>` con estilos
inline (600 px, `role="presentation"`), tema Bolos (Nunito, tarjeta blanca
con radio 16 px, fondo `#f0faff`). Preview y descarga usan estas mismas
funciones para no desincronizarse.

- `RenderedRow` — `{ html: "<tr>…</tr>" }`.
- `renderTitle(data, corners?)` — `h1`–`h6` con tamaño, color (o el del
  nivel), alineación, banda de fondo y márgenes superior/inferior.
- `renderText(data, corners?)` — párrafo 16 px/1.75 con alineación, fondo
  y márgenes superior/inferior.
- `renderImage(data)` — imagen con radio 12 px o aviso si la URL no es válida.
- `renderList(data)` — `ul`/`ol` con alineación.
- `renderQuote(data)` — cita con borde de marca y alineación.
- `renderDivider(data, corners?)` — barra de 2 px (color propio o degradado
  de marca) con márgenes superior/inferior configurables.
- `renderButton(data)` — pill centrada/izquierda/derecha con enlace
  `wa.me` oficial; sin teléfono, pill sin enlace.
- `renderBlockToRow(data, index?, total?)` — despacha por `type` y calcula
  si la fila es primera/última para heredar el radio de la tarjeta.
- `buildEmailDocument(blocks)` — documento `.html` completo descargable.
- `buildPreviewTable(blocks)` — solo la tarjeta, para el panel de preview.
