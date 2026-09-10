# Color (`ts/core/color/color.ts`)

Matemática de color pura, sin DOM.

- `lightenHex(hex, amount)` — mezcla un `#rrggbb` con blanco (`amount`
  0..1); con entrada inválida devuelve la entrada sin cambios. Se usa para
  que el degradado del divisor nazca del color elegido.
