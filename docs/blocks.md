# Bloques (`ts/blocks/`)

Sistema extensible de bloques. Cada bloque es una clase decorada con `@Block`
y expone sus datos sanitizados vía `toData()`. Para agregar un tipo nuevo:
crear el archivo, decorarlo y registrarlo en `index.ts`.

## `types.ts`

- `BlockType` — unión: `"title" | "text" | "image" | "list" | "quote" | "divider" | "button" | "spacer" | "header" | "footer" | "cta" | "columns" | "table"`.
- `TitleLevel` — `1 | 2 | 3 | 4 | 5 | 6`.
- `TextAlign` — `"left" | "center" | "right"` (sin justificado).
- `ButtonAlign` — `"left" | "center" | "right"`.
- `ButtonColor` — `"green" | "blue"`.
- `TitleBlockData`, `TextBlockData`, `ImageBlockData`, `ListBlockData`,
  `QuoteBlockData`, `DividerBlockData`, `ButtonBlockData`, `SpacerBlockData`,
  `HeaderBlockData`, `FooterBlockData`, `CtaBlockData`, `ColumnData`,
  `ColumnsBlockData`, `TableBlockData`, `SocialBlockData`, `BannerBlockData`,
  `ProductBlockData`, `CouponBlockData`, `SignatureBlockData`, `SocialUrls`
  — datos de cada bloque.
- `AnyBlockData` — unión discriminada por `type`.
- `isBlockType(value)` — guarda de tipo para `BlockType`.
- `isButtonColor(value)` — guarda de tipo para `ButtonColor`.
- `isTitleLevel(value)` — guarda de tipo para `TitleLevel`.
- `isTextAlign(value)` — guarda de tipo para `TextAlign`.
- `isButtonAlign(value)` — guarda de tipo para `ButtonAlign`.

## Clases (`TitleBlock`, `TextBlock`, `ImageBlock`, `ListBlock`, `QuoteBlock`, `DividerBlock`, `ButtonBlock`)

Cada una recibe `id` en el constructor, sanitiza en sus setters decorados
con `@Editable()` y convierte a datos con `toData()`:

- `TitleBlock` — `content`, `level` (h1–h6), `align`, `bg`, `color`,
  `marginTop`, `marginBottom`, `bold`, `italic`, `underline`, `strike`.
- `TextBlock` — `content`, `align`, `bg`, `color`, `marginTop`, `marginBottom`,
  `bold`, `italic`, `underline`, `strike`.
- `ImageBlock` — `src` (solo https/data), `alt` (sin pie de foto).
- `ListBlock` — `items` (máx. 20), `ordered`, `align`.
- `QuoteBlock` — `content`, `cite`, `align`, `bg`, `color`, `bold`, `italic`,
  `underline`, `strike`, `marginTop`, `marginBottom`.
- `DividerBlock` — `color` (vacío = degradado), `marginTop`, `marginBottom`,
  `thickness`, `borderRadius` (0 = cuadrado).
- `ButtonBlock` — `label`, `phone` (dígitos, sin indicativo), `message`,
  `color`, `align`, `marginTop`, `marginBottom`.
- `SpacerBlock` — `height` (0–80 px).
- `HeaderBlock` — `logoSrc` (solo https/data), `logoAlt`, `tagline`, `align`.
- `FooterBlock` — `address`, `unsubscribeUrl` (solo https), `social`
  (urls https por red, ver `SocialUrls`).
- `CtaBlock` — `label`, `url` (solo https), `color`, `align`, `marginTop`,
  `marginBottom`.
- `ColumnsBlock` — `columns` (2–3, cada una con `blocks` anidados ya
  sanitizados; edición interna vía `update` mayorista, sin cambios al store).
- `TableBlock` — `headers` (máx. 6), `rows` (máx. 20), `headerRow`.
- `SocialBlock` — `social` (ver `SocialUrls`).
- `BannerBlock` — `src` (solo https/data), `alt`, `href` (solo https),
  `caption` (máx. 120).
- `ProductBlock` — `src`, `alt`, `name`, `price`, `url`, `buttonLabel`,
  `color`.
- `CouponBlock` — `code` (máx. 40), `description` (máx. 200).
- `SignatureBlock` — `name`, `role`, `photoSrc` (solo https/data), `photoAlt`.

## `index.ts`

- `createId()` — genera un id único para un bloque nuevo.
- `createBlockData(type, id)` — datos iniciales válidos por tipo.
- `getRegisteredBlocks()` / `isBlockType` — re-exportados para la paleta.
