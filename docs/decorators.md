# Decoradores (`ts/core/decorators/`)

## `Block.ts`

- `Block(metadata)` — decorador de clase. Registra `{ type, label, icon }`
  (icono Lucide) en el registro central; la paleta lo descubre sin cambios.
- `getRegisteredBlocks()` — metadatos de todos los bloques registrados.
- `getBlockMetadata(type)` — metadatos de un tipo o `undefined`.
- `BlockMetadata` — interfaz `{ type, label, icon }`.

## `Editable.ts`

- `Editable()` — decorador de método. Marca los setters editables por el
  usuario; el sanitizado ocurre dentro de cada setter.
