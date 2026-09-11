# Arrastrar y soltar (`ts/core/dnd/dragController.ts`)

HTML5 Drag and Drop API. La paleta clona al soltar; el asa del bloque
reordena dentro del lienzo.

- `DragPayload` — `{ blockType, sourceId?, fromColumn? }` (`sourceId` solo en
  reorden; `fromColumn: ColumnRef` solo en arrastres nacidos en una columna).
- `ColumnRef` — `{ columnsId, colIndex }` (origen anidado; ausente = nivel superior).
- `setDragPayload(event, payload)` — guarda el JSON en `dataTransfer`
  (`application/json`) con `effectAllowed` compatible con el `dropEffect`
  del lienzo (`copyMove` para nuevos, `move` para reordenar).
- `getDragPayload(event)` — lee y valida el payload en el `drop`;
  devuelve `undefined` si no es válido.
- `insertionIndexFor(container, clientY)` — índice de inserción según
  la mitad vertical de cada bloque.
