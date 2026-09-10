# Vista previa (`ts/components/Preview/`)

Columna 3 (`section`). Solo lectura; consume lo mismo que la descarga.

## `Preview.ts`

- `initPreview(frameEl, downloadBtn, store)` — ante cada cambio del store
  regenera la tarjeta con `buildPreviewTable` y habilita el botón solo si
  hay bloques; el clic descarga el documento vigente.

## `DownloadButton.ts`

- `downloadTemplate(html, filename?)` — descarga el HTML como
  `plantilla.html` vía `Blob` + enlace temporal (por defecto
  `"plantilla.html"`).
