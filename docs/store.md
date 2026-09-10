# Estado (`ts/core/store/store.ts`)

`EditorStore` es la única fuente de verdad: Lienzo y Preview se suscriben
a él, nunca se leen entre sí.

- `blocks` — copia de solo lectura del estado actual.
- `subscribe(listener)` — registra un oyente (recibe el estado inicial)
  y devuelve función para desuscribirse.
- `insertAt(index, block)` — inserta un bloque (índice limitado al rango).
- `move(sourceId, targetIndex)` — reordena un bloque existente.
- `update(id, patch)` — aplica cambios parciales sin cambiar `id`/`type`.
- `remove(id)` — elimina un bloque.
- `StoreListener` — tipo `(blocks) => void` de los suscriptores.
