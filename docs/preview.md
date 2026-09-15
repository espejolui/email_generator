# Vista previa (`ts/components/Preview/`)

Columna 3 (`section`). Solo lectura; consume lo mismo que la descarga.

## `Preview.ts`

- `initPreview(frameEl, downloadBtn, store)` — ante cada cambio del store
  regenera la tarjeta con `buildPreviewTable` (con el fondo vigente, que
  también tiñe el marco del panel) y habilita el botón solo si
  hay bloques **y** nombre de plantilla; el clic descarga el documento vigente.
- Control de fondo (`label.preview__bg` + `<input type="color">` nativo en la
  toolbar): escribe con `store.setBackground()`; sin duplicar el popover del Canvas.

## `DownloadButton.ts`

- `downloadTemplate(html, filename?)` — descarga el HTML vía `Blob` +
  enlace temporal (por defecto `"plantilla.html"`).
- `fileNameFromTitle(title)` — slug del nombre (`"Curso Power BI"` →
  `"curso-power-bi.html"`); el Preview lo usa para que el archivo lleve el
  nombre de la plantilla.
