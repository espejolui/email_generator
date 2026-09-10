# Lienzo (`ts/components/Canvas/Canvas.ts`)

Columna 2 (`main`). Edita y reordena; escribe en el `EditorStore`.

- `initCanvas(rootEl, listEl, hintEl, liveEl, store)` — cablea la zona de
  drop (todo el `main`), el `placeholder` de inserción y la suscripción al
  store. No re-renderiza ante cambios solo de contenido (conserva el foco).
- Internas:
  - `announce` — mensajes al `aria-live`.
  - `signature` — firma tipo:id para detectar cambios estructurales.
  - `el` / `labelFor` — creación de nodos sin `innerHTML`.
  - `textAlignSelect` / `buttonAlignSelect` — selects de alineación.
  - `optionalColor` / `bgControls` — picker + casilla de valor automático.
  - `lucideIcon` / `refreshIcons` — iconos Lucide tras cada render.
  - `ensurePlaceholder` / `clearPlaceholder` / `movePlaceholder` —
    indicador visual de inserción.
  - `handleDrop` — `drop` → `insertAt` (nuevo) o `move` (reorden).
  - `render` / `renderItem` / `renderFields` — lista semántica con asa de
    arrastre, campos editables y botones subir/bajar/eliminar por bloque.
