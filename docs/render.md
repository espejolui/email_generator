# Exportación a email (`ts/core/render/exportToEmailHtml.ts`)

Motor aparte del editor: traduce bloques a filas de `<table>` con estilos
inline (600 px, `role="presentation"`), tema Bolos (Nunito, tarjeta blanca
con radio 16 px, fondo `#f0faff`). Preview y descarga usan estas mismas
funciones para no desincronizarse.

- `RenderedRow` — `{ html: "<tr>…</tr>" }`.
- `renderTitle(data, corners?)` — `h1`–`h6` con tamaño, color (o el del
  nivel), alineación, banda de fondo, márgenes y formato (la negrita solo
  se emite si aporta: los niveles ya son bold).
- `renderText(data, corners?)` — párrafo 16 px/1.75 con alineación, fondo,
  márgenes y formato (negrita/cursiva/subrayado/tachado).
- `renderImage(data)` — imagen con radio 12 px o aviso si la URL no es válida.
- `renderList(data)` — `ul`/`ol` con alineación.
- `renderQuote(data)` — cita con borde de marca, alineación, fondo, color
  y formato.
- `renderDivider(data, corners?)` — barra con grosor y radio configurables
  y márgenes superior/inferior; siempre en degradado: el de marca por
  defecto o uno que nace del color elegido (`lightenHex`).
- `renderButton(data)` — pill con enlace `wa.me` oficial y márgenes
  superior/inferior; sin teléfono, pill sin enlace.
- `pillRow(href, label, bg, align, marginTop, marginBottom, corners?)` —
  fila pill compartida por `button` y `cta`.
- `renderCta(data, corners?)` — pill con URL https (revalidada, igual que
  `renderImage` con `src`); sin URL, pill sin enlace.
- `renderSpacer(data)` — fila vacía con `height` + `bgcolor` en `<td>`
  (Outlook-safe).
- `renderHeader(data, corners?)` — logo (tabla anidada con `align` para
  Outlook) + tagline.
- `socialLinksInner(social)` — enlaces de texto de redes; la usan `social`
  y `footer`.
- `pillTable(href, label, bg, align, marginTop, marginBottom)` — tabla pill
  interior; `pillRow` la envuelve en fila y `product` la incrusta.
- `renderSocial / renderBanner / renderProduct / renderCoupon / renderSignature`
  — fila de redes (con aviso si vacía), imagen enlazable + pie opcional,
  tarjeta de producto 45/55, badge con `border` en `<td>`, firma con foto.
- `renderFooter(data, corners?)` — dirección + enlace de baja + redes.
- `renderBlockToRow(data, index?, total?, cornersOverride?)` — el override lo
  usan las filas anidadas de `columns` (nunca llevan radio).
- `renderColumns(data, corners?)` — tabla anidada (`<td width="50%|33.33%">`
  por columna) con render recursivo sin esquinas.
- `renderTable(data, corners?)` — tabla de datos real con `th/td` y bordes.
- `renderBlockToRow(data, index?, total?)` — despacha por `type` y calcula
  si la fila es primera/última para heredar el radio de la tarjeta.
- `buildEmailDocument(blocks)` — documento `.html` completo descargable.
- `buildPreviewTable(blocks)` — solo la tarjeta, para el panel de preview.
