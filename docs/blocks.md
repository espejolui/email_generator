# Bloques (`ts/blocks/`)

Sistema extensible de bloques. Cada bloque es una clase decorada con `@Block`
y expone sus datos sanitizados vía `toData()`. Para agregar un tipo nuevo:
crear el archivo, decorarlo y registrarlo en `index.ts`.

Todos extienden `StyledBlock`, que comparte `bg`, `color`, `borderColor`,
`borderWidth` (0–80), `borderStyle` (`solid`/`dashed`/`dotted`) y
`borderRadius` (0–80). `createBlockAppearance()` proporciona sus valores
iniciales a la fábrica y al importador.

## `types.ts`

- `BlockAppearance` / `BorderStyle` — apariencia y borde comunes a todos los bloques.
- `BlockType` — unión: `"title" | "text" | "image" | "list" | "quote" | "divider" | "button" | "spacer" | "header" | "footer" | "cta" | "columns" | "table" | "social" | "banner" | "product" | "coupon" | "signature" | "logo"`.
- `TitleLevel` — `1 | 2 | 3 | 4 | 5 | 6`.
- `TextAlign` — `"left" | "center" | "right"` (sin justificado).
- `ButtonAlign` — `"left" | "center" | "right"`.
- `TitleBlockData`, `TextBlockData`, `ImageBlockData`, `ListBlockData`,
  `QuoteBlockData`, `DividerBlockData`, `ButtonBlockData`, `SpacerBlockData`,
  `HeaderBlockData`, `FooterBlockData`, `CtaBlockData`, `ColumnData`,
  `ColumnsBlockData`, `TableBlockData`, `SocialBlockData`, `BannerBlockData`,
  `ProductBlockData`, `CouponBlockData`, `SignatureBlockData`, `LogoBlockData`,
  `SocialUrls` — datos de cada bloque.
- `AnyBlockData` — unión discriminada por `type`.
- `isBlockType(value)` — guarda de tipo para `BlockType`.
- `isBorderStyle(value)` — guarda de tipo para `BorderStyle`.
- `isTitleLevel(value)` — guarda de tipo para `TitleLevel`.
- `isTextAlign(value)` — guarda de tipo para `TextAlign`.
- `isButtonAlign(value)` — guarda de tipo para `ButtonAlign`.

## Clases (`TitleBlock`, `TextBlock`, `ImageBlock`, `ListBlock`, `QuoteBlock`, `DividerBlock`, `ButtonBlock`, `SpacerBlock`, `HeaderBlock`, `FooterBlock`, `CtaBlock`, `ColumnsBlock`, `TableBlock`, `SocialBlock`, `BannerBlock`, `ProductBlock`, `CouponBlock`, `SignatureBlock`, `LogoBlock`)

Cada una recibe `id` en el constructor, hereda la apariencia de `StyledBlock`,
sanitiza en sus setters decorados con `@Editable()` y convierte a datos con
`toData()`:

- `TitleBlock` — `content`, `level` (h1–h6), `align`, `bg`, `color`,
  `marginTop`, `marginBottom`, `bold`, `italic`, `underline`, `strike`,
  `fontSize` (0 = escala del nivel).
- `TextBlock` — `content`, `align`, `bg`, `color`, `marginTop`, `marginBottom`,
  `bold`, `italic`, `underline`, `strike`, `fontSize` (0 = 16 px).
- `ImageBlock` — `src` (solo https/data), `alt`, `marginTop`,
  `marginBottom`, `width` (16–600, defecto 504).
- `ListBlock` — `items` (máx. 20), `ordered`, `align`, `marginTop`,
  `marginBottom`, `fontSize` (0 = 16 px).
- `QuoteBlock` — `content`, `cite`, `align`, `bg`, `color`, `bold`, `italic`,
  `underline`, `strike`, `marginTop`, `marginBottom`, `fontSize` (0 = 16 px).
- `DividerBlock` — `color` (vacío = degradado), `marginTop`, `marginBottom`,
  `thickness`, `borderRadius` (0 = cuadrado).
- `ButtonBlock` — `label`, `phone` (dígitos, sin indicativo), `message`,
  `color`, `align`, `marginTop`, `marginBottom`, `fontSize` (0 = 15 px).
- `SpacerBlock` — `height` (0–80 px).
- `HeaderBlock` — `logoSrc` (solo https/data), `logoAlt`, `title` (opcional),
  `tagline`, `align`, `textPosition` (`top`/`bottom`/`left`/`right`),
  `marginTop`, `marginBottom`, `fontSize` (0 = 17 px, título),
  `logoWidth` (16–600, defecto 200).
- `FooterBlock` — `address`, `unsubscribeUrl` (solo https), `social`
  (urls https por red, ver `SocialUrls`), `marginTop`, `marginBottom`,
  `fontSize` (0 = 12 px).
- `CtaBlock` — `label`, `url` (solo https), `color` (`#rrggbb` personalizado,
  vacío = azul por defecto), `align`, `marginTop`, `marginBottom`,
  `fontSize` (0 = 15 px).
- `ColumnsBlock` — `columns` (2–3, cada una con `blocks` anidados ya
  sanitizados; edición interna vía `update` mayorista, sin cambios al store),
  `marginTop`, `marginBottom`.
- `TableBlock` — `headers` (máx. 6), `rows` (máx. 20), `headerRow`,
  `marginTop`, `marginBottom`, `fontSize` (0 = 13 px).
- `SocialBlock` — `social` (ver `SocialUrls`), `marginTop`, `marginBottom`,
  `fontSize` (0 = 13 px).
- `BannerBlock` — `src` (solo https/data), `alt`, `href` (solo https),
  `caption` (máx. 120), `marginTop`, `marginBottom`, `fontSize` (0 = 13 px),
  `width` (16–600, defecto 504).
- `ProductBlock` — `src`, `alt`, `name`, `price`, `url`, `buttonLabel`,
  `color`, `marginTop`, `marginBottom`, `fontSize` (0 = 17 px, nombre),
  `imgWidth` (16–600, defecto 220).
- `CouponBlock` — `code` (máx. 40), `description` (máx. 200), `marginTop`,
  `marginBottom`, `fontSize` (0 = 22 px, código).
- `SignatureBlock` — `name`, `role`, `photoSrc` (solo https/data), `photoAlt`,
  `marginTop`, `marginBottom`, `fontSize` (0 = 15 px, nombre),
  `photoWidth` (16–600, defecto 64).
- `LogoBlock` — `src` (solo https/data), `alt`, `align`, `width` (16–600),
  `bg`, `marginTop`, `marginBottom`.

## `index.ts`

- `createId()` — genera un id único para un bloque nuevo.
- `createBlockData(type, id)` — datos iniciales válidos por tipo.
- `getRegisteredBlocks()` / `isBlockType` — re-exportados para la paleta.
