# Sanitización (`ts/core/sanitize/sanitize.ts`)

Todo contenido de usuario se sanitiza **al entrar al modelo** (Canvas).
El render no re-escapa (evita doble escape); el mensaje de WhatsApp viaja
en crudo y se codifica para URL al renderizar.

- `sanitizeText(input)` — escapa `& < > " '` a entidades HTML.
- `sanitizeImageSrc(input)` — solo `https:` o `data:image/*` controlado;
  otra cosa devuelve `""`.
- `sanitizeAlt(input)` — texto escapado, máx. 200 caracteres.
- `sanitizePhone(input)` — solo dígitos, máx. 15.
- `buildWhatsAppUrl(phone, message)` — enlace oficial Click-to-Chat
  `https://wa.me/<tel>?text=<msg>`; antepone indicativo `57` si falta;
  sin teléfono devuelve `""`.
- `sanitizeColor(input)` — solo `#rrggbb`; otra cosa devuelve `""`.
- `sanitizeHttpsUrl(input)` — solo URLs absolutas `https:`; otra cosa
  devuelve `""` (sin `data:`, a diferencia de `sanitizeImageSrc`).
- `sanitizeMargin(input)` — entero 0–80 para márgenes en px; inválido → `8`.
