# Paleta (`ts/components/Palette/Palette.ts`)

Columna 1 (`aside`). Muestra los bloques registrados sin tocar el núcleo.

- `initPalette(listEl, onAdd)` — renderiza un `li` arrastrable por bloque
  (icono Lucide + etiqueta), configura `dragstart`/`dragend` y alternativa
  accesible: clic o Enter/Espacio llama `onAdd(type)` para añadir al final.
