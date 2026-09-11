# Lienzo (`ts/components/Canvas/Canvas.ts`)

Columna 2 (`main`). Edita y reordena; escribe en el `EditorStore`.

- `initCanvas(rootEl, listEl, hintEl, liveEl, store, clearBtn)` — cablea la zona de
  drop (todo el `main`), el `placeholder` de inserción y la suscripción al
  store. No re-renderiza ante cambios solo de contenido (conserva el foco).
- Botón Limpiar (`clearBtn`): vacía el lienzo con `store.clear()`, anuncia
  cuántos bloques eliminó y se deshabilita cuando no hay bloques.
- Internas:
  - `announce` — mensajes al `aria-live`.
  - `signature` — firma tipo:id para detectar cambios estructurales.
  - `el` / `labelFor` — creación de nodos sin `innerHTML`.
  - `selectField` — desplegable propio estilo pill (el popup nativo lo
    pinta el SO): botón + lista `listbox` con teclado (flechas/Enter/Escape)
    y cierre al hacer clic fuera; lo usan nivel, alineaciones y colores.
  - `closeSelect` — cierra la lista abierta y suelta sus oyentes.
  - `optionalColor` / `bgControls` — botón de muestra que abre un panel
    estilo Excel: primero la casilla de valor automático en una línea
    (Sin fondo/Automático/Degradado), luego presets de marca y fila
    Personalizado con campo HEX primero + selector nativo `<input
    type="color">` precargado (MDN) y sincronizados en ambos sentidos;
    el panel lee el valor vigente al abrir (espejo local) para que
    Sin fondo/Automático/Degradado nunca quede desfasado; se ancla al
    contenedor vivo, cierra con Escape o clic fuera y su cierre es
    re-entrante. En título/párrafo fondo y texto comparten fila.
  - `marginControls` — números de margen superior/inferior (0–80 px)
    usados en título, párrafo, botón y divisor.
  - `colorRow` — junta dos controles de color en una fila horizontal.
  - `formatRow` — casillas Negrita/Cursiva/Subrayado/Tachado en fila
    (título, párrafo y cita).
  - `lucideIcon` / `refreshIcons` — iconos Lucide tras cada render.
  - `ensurePlaceholder` / `clearPlaceholder` / `movePlaceholder` —
    indicador visual de inserción.
  - `handleDrop` — `drop` → `insertAt` (nuevo) o `move` (reorden).
  - `render` / `renderItem` / `renderFields` — lista semántica con asa de
    arrastre, campos editables y botones subir/bajar/eliminar por bloque.
