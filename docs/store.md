# Estado (`ts/core/store/store.ts`)

`EditorStore` es la única fuente de verdad: Lienzo y Preview se suscriben
a él, nunca se leen entre sí.

- `blocks` — copia de solo lectura del estado actual.
- `background` — color de fondo exterior vigente (`DEFAULT_TEMPLATE_BG` inicial).
- `setBackground(value)` — fija el fondo (sanitizado; inválido/vacío vuelve al defecto).
- `docTitle` — nombre de la plantilla (va al `<title>`; vacío = `"Plantilla"`).
- `setDocTitle(value)` — fija el nombre (sanitizado, recorte a 120).
- `subscribe(listener)` — registra un oyente (recibe el estado inicial)
  y devuelve función para desuscribirse.
- `insertAt(index, block)` — inserta un bloque (índice limitado al rango).
- `move(sourceId, targetIndex)` — reordena un bloque existente.
- `update(id, patch)` — aplica cambios parciales sin cambiar `id`/`type`.
- `remove(id)` — elimina un bloque.
- `clear()` — vacía el lienzo de un solo golpe (sin bloques no emite).
- `StoreListener` — tipo `(blocks, background, docTitle) => void` de los suscriptores.
