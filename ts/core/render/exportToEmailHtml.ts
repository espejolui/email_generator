import {
  buildWhatsAppUrl,
  sanitizeColor,
  sanitizeHttpsUrl,
  sanitizeImageSrc,
} from "../sanitize/sanitize.js";
import { lightenHex } from "../color/color.js";
import type {
  AnyBlockData,
  BannerBlockData,
  ButtonAlign,
  ButtonBlockData,
  ColumnsBlockData,
  CouponBlockData,
  CtaBlockData,
  DividerBlockData,
  FooterBlockData,
  HeaderBlockData,
  ImageBlockData,
  ListBlockData,
  ProductBlockData,
  QuoteBlockData,
  SignatureBlockData,
  SocialBlockData,
  SocialUrls,
  SpacerBlockData,
  TableBlockData,
  TextBlockData,
  TitleBlockData,
  TitleLevel,
} from "../../blocks/types.js";

export interface RenderedRow {
  readonly html: string;
}

/** Tema "Bolos Comfacundi": Nunito + azules de marca sobre tarjeta blanca. */
const FONT = "'Nunito','Trebuchet MS',sans-serif";
/** Fondo exterior de la plantilla (configurable desde el Preview, §1 Fix). */
export const DEFAULT_TEMPLATE_BG = "#f0faff";
const BG = DEFAULT_TEMPLATE_BG;
const CARD = "#ffffff";
const PRIMARY = "#41b6e6";
const LIGHT = "#8DE1F7";
const BODY_TEXT = "#444444";
const MUTED = "#888888";
const GREEN = "#25d366";

type Corner = "" | "top" | "bottom" | "both";

function cornerStyle(corners: Corner): string {
  if (corners === "both") return " border-radius:16px;";
  if (corners === "top") return " border-radius:16px 16px 0 0;";
  if (corners === "bottom") return " border-radius:0 0 16px 16px;";
  return "";
}

function row(inner: string, bg = "", corners: Corner = ""): RenderedRow {
  // La última fila es la última <tr> de la tarjeta (sin pie/espaciador:
  // espejo del primer bloque, que arranca en el punto cero superior). Su
  // aire inferior (20px propios + 12px del antiguo espaciador) vive dentro
  // de la celda para que la banda de fondo llegue hasta el borde redondeado.
  const bottomPad = corners === "bottom" || corners === "both" ? 32 : 20;
  const bgStyle = bg === "" ? "" : ` background-color:${bg};`;
  return { html: `<tr><td style="padding:0 48px ${String(bottomPad)}px; font-family:${FONT};${bgStyle}${cornerStyle(corners)}">${inner}</td></tr>` };
}

const TITLE_SIZE: Record<TitleLevel, string> = {
  1: "font-size:26px; font-weight:900;",
  2: "font-size:22px; font-weight:700;",
  3: "font-size:17px; font-weight:900;",
  4: "font-size:16px; font-weight:700;",
  5: "font-size:14px; font-weight:700;",
  6: "font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase;",
};

const TITLE_COLOR: Record<TitleLevel, string> = {
  1: "#111111",
  2: "#444444",
  3: "#41b6e6",
  4: "#444444",
  5: "#555555",
  6: "#888888",
};

interface TextStyle {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
}

/**
 * Formato inline (negrita/cursiva/subrayado/tachado). La negrita solo se
 * emite si aporta peso: los títulos ya son bold por diseño de cada nivel.
 */
function formatStyle(style: TextStyle, baseBold: boolean): string {
  const parts: string[] = [];
  if (style.bold && !baseBold) parts.push("font-weight:700;");
  if (style.italic) parts.push("font-style:italic;");
  const decoration: string[] = [];
  if (style.underline) decoration.push("underline");
  if (style.strike) decoration.push("line-through");
  if (decoration.length > 0) parts.push(`text-decoration:${decoration.join(" ")};`);
  return parts.join(" ");
}

export function renderTitle(data: TitleBlockData, corners: Corner = ""): RenderedRow {
  // Contrato: el contenido llega ya escapado desde el store (Canvas sanitiza
  // al guardar, AGENTS §7). No re-escapar aquí para evitar doble escape.
  const tag = `h${String(data.level)}`;
  const color = data.color === "" ? TITLE_COLOR[data.level] : data.color;
  return row(
    `<${tag} style="margin:${String(data.marginTop)}px 0 ${String(data.marginBottom)}px; font-family:${FONT}; text-align:${data.align}; color:${color}; ${TITLE_SIZE[data.level]}${formatStyle(data, true)}">${data.content}</${tag}>`,
    data.bg,
    corners,
  );
}

export function renderText(data: TextBlockData, corners: Corner = ""): RenderedRow {
  const color = data.color === "" ? BODY_TEXT : data.color;
  return row(
    `<p style="margin:${String(data.marginTop)}px 0 ${String(data.marginBottom)}px; font-family:${FONT}; font-size:16px; line-height:1.75; text-align:${data.align}; color:${color};${formatStyle(data, false)}">${data.content}</p>`,
    data.bg,
    corners,
  );
}

export function renderImage(data: ImageBlockData, corners: Corner = ""): RenderedRow {
  const src = sanitizeImageSrc(data.src);
  const img = src === ""
    ? `<p style="margin:0; font-size:13px; color:${MUTED};">[Imagen sin URL válida]</p>`
    : `<img src="${src}" width="504" alt="${data.alt}" style="display:block; width:100%; max-width:504px; height:auto; border:0; border-radius:12px;">`;
  return row(img, "", corners);
}

export function renderList(data: ListBlockData, corners: Corner = ""): RenderedRow {
  const tag = data.ordered ? "ol" : "ul";
  const items = data.items
    .map((item) => `<li style="font-size:16px; line-height:1.75; color:${BODY_TEXT};">${item}</li>`)
    .join("");
  return row(
    `<${tag} style="margin:0; padding-left:20px; font-family:${FONT}; text-align:${data.align};">${items}</${tag}>`,
    "",
    corners,
  );
}

export function renderQuote(data: QuoteBlockData, corners: Corner = ""): RenderedRow {
  const color = data.color === "" ? "#555555" : data.color;
  return row(
    `<blockquote style="margin:${String(data.marginTop)}px 0 ${String(data.marginBottom)}px; padding-left:12px; border-left:3px solid ${PRIMARY}; font-style:italic; text-align:${data.align}; color:${color};">` +
      `<p style="margin:0; font-size:16px; line-height:1.75;${formatStyle(data, false)}">${data.content}</p>` +
      (data.cite === "" ? "" : `<cite style="font-size:12px; color:${MUTED};">— ${data.cite}</cite>`) +
      `</blockquote>`,
    data.bg,
    corners,
  );
}

export function renderDivider(data: DividerBlockData, corners: Corner = ""): RenderedRow {
  // Sin color: degradado de marca original. Con color: degradado que nace
  // del color elegido hacia su versión aclarada.
  // Tabla anidada (patrón bulletproof, igual que el botón): Outlook desktop
  // ignora linear-gradient y el height en <div>, pero honra bgcolor+height
  // en <td>, así que allí muestra la barra sólida del color de marca con su
  // grosor correcto. El resto de clientes ve el degradado redondeado.
  const solid = data.color === "" ? PRIMARY : data.color;
  const light = data.color === "" ? LIGHT : lightenHex(data.color, 0.45);
  const gradient = `linear-gradient(90deg,${solid} 0%,${light} 100%)`;
  // Sin pie/espaciador inferior: si es la última fila, el aire (12px del
  // antiguo espaciador) vive en el padding de la celda (12 + marginBottom).
  const bottomPad = corners === "bottom" || corners === "both" ? "0 48px 12px" : "0 48px";
  const thickness = String(data.thickness);
  const radius = String(data.borderRadius);
  const margins = `${String(data.marginTop)}px 0 ${String(data.marginBottom)}px`;
  return {
    html: `<tr><td style="padding:${bottomPad}; font-family:${FONT};${cornerStyle(corners)}">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${margins};">` +
      `<tr><td height="${thickness}" bgcolor="${solid}" style="height:${thickness}px; font-size:0; line-height:0; background-color:${solid}; background:${gradient}; border-radius:${radius}px;">&nbsp;</td></tr>` +
      `</table></td></tr>`,
  };
}

/**
 * Fila de botón pill compartida por `button` (WhatsApp) y `cta` (enlace
 * genérico): mismo markup, solo cambian href/etiqueta/color.
 */
/** Tabla pill interior; `pillRow` la envuelve en fila. La usa también `product`. */
function pillTable(
  href: string,
  label: string,
  bg: string,
  align: ButtonAlign,
  marginTop: number,
  marginBottom: number,
): string {
  const text = href === ""
    ? `<span style="display:inline-block; padding:13px 32px; font-family:${FONT}; font-size:15px; font-weight:900; color:#ffffff; letter-spacing:0.4px;">${label}</span>`
    : `<a href="${href}" style="display:inline-block; padding:13px 32px; font-family:${FONT}; font-size:15px; font-weight:900; color:#ffffff; text-decoration:none; letter-spacing:0.4px;">${label}</a>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" style="margin:${String(marginTop)}px auto ${String(marginBottom)}px;">` +
    `<tr><td align="center" style="background-color:${bg}; border-radius:50px;">${text}</td></tr>` +
    `</table>`;
}

function pillRow(
  href: string,
  label: string,
  bg: string,
  align: ButtonAlign,
  marginTop: number,
  marginBottom: number,
  corners: Corner = "",
): RenderedRow {
  return row(pillTable(href, label, bg, align, marginTop, marginBottom), "", corners);
}

export function renderButton(data: ButtonBlockData, corners: Corner = ""): RenderedRow {
  const bg = data.color === "blue" ? PRIMARY : GREEN;
  // message viaja en crudo hasta aquí y se codifica para URL (nunca toca HTML).
  const href = buildWhatsAppUrl(data.phone, data.message);
  return pillRow(href, data.label, bg, data.align, data.marginTop, data.marginBottom, corners);
}

export function renderCta(data: CtaBlockData, corners: Corner = ""): RenderedRow {
  const bg = data.color === "blue" ? PRIMARY : GREEN;
  // Igual que renderImage revalida src: solo https (idempotente, sin doble escape).
  return pillRow(sanitizeHttpsUrl(data.url), data.label, bg, data.align, data.marginTop, data.marginBottom, corners);
}

export function renderSpacer(data: SpacerBlockData): RenderedRow {
  // Fila vacía con height fijo: margin/padding se pierden en algunos
  // clientes, height+bgcolor en <td> no. Sin radio propio (transparente).
  const height = String(data.height);
  return {
    html: `<tr><td height="${height}" style="height:${height}px; padding:0 48px; font-family:${FONT}; font-size:0; line-height:0;">&nbsp;</td></tr>`,
  };
}

export function renderHeader(data: HeaderBlockData, corners: Corner = ""): RenderedRow {
  // Tabla anidada con align en <td>: centra el logo también en Outlook,
  // donde margin:auto no funciona. El tagline usa text-align (soportado).
  const logo = data.logoSrc === ""
    ? ""
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
      `<tr><td align="${data.align}"><img src="${data.logoSrc}" width="200" alt="${data.logoAlt}" style="display:block; width:200px; max-width:100%; height:auto; border:0;"></td></tr>` +
      `</table>`;
  const tagline = data.tagline === ""
    ? ""
    : `<p style="margin:8px 0 0; font-family:${FONT}; font-size:13px; line-height:1.5; text-align:${data.align}; color:${MUTED};">${data.tagline}</p>`;
  return row(`${logo}${tagline}`, "", corners);
}

const SOCIAL_LABELS: ReadonlyArray<readonly [keyof SocialUrls, string]> = [
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["x", "X"],
  ["linkedin", "LinkedIn"],
];

/** Enlaces de texto de redes; "" si no hay ninguna URL. La usan `social` y `footer`. */
export function socialLinksInner(social: SocialUrls): string {
  const links = SOCIAL_LABELS.filter(([key]) => social[key] !== "").map(
    ([key, label]) =>
      `<a href="${social[key]}" style="font-family:${FONT}; font-size:13px; color:${PRIMARY}; text-decoration:underline;">${label}</a>`,
  );
  return links.length === 0 ? "" : `<p style="margin:8px 0 0; text-align:center;">${links.join(" &nbsp;·&nbsp; ")}</p>`;
}

export function renderFooter(data: FooterBlockData, corners: Corner = ""): RenderedRow {
  const address = data.address === ""
    ? ""
    : `<p style="margin:0; font-family:${FONT}; font-size:12px; line-height:1.6; text-align:center; color:${MUTED};">${data.address}</p>`;
  const unsubscribe = data.unsubscribeUrl === ""
    ? ""
    : `<p style="margin:8px 0 0; text-align:center;"><a href="${data.unsubscribeUrl}" style="font-family:${FONT}; font-size:12px; color:${MUTED}; text-decoration:underline;">Darse de baja</a></p>`;
  return row(`${address}${unsubscribe}${socialLinksInner(data.social)}`, "", corners);
}

export function renderColumns(data: ColumnsBlockData, corners: Corner = ""): RenderedRow {
  // Tabla anidada: una <td> por columna (ancho fijo, Outlook-safe). El
  // contenido interno se renderiza recursivamente sin radio (las esquinas
  // solo pertenecen a los bordes de la tarjeta).
  const count = data.columns.length;
  const width = count >= 3 ? "33.33%" : "50%";
  const cells = data.columns
    .map((col) => {
      const inner = col.blocks.map((b) => renderBlockToRow(b, 0, 1, "").html).join("");
      const body = inner === ""
        ? `<tr><td style="font-family:${FONT}; font-size:0; line-height:0;">&nbsp;</td></tr>`
        : inner;
      return `<td width="${width}" valign="top" align="left" style="padding:0 8px;">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table></td>`;
    })
    .join("");
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>`,
    "",
    corners,
  );
}

const TABLE_BORDER = "#d9d9d9";

export function renderTable(data: TableBlockData, corners: Corner = ""): RenderedRow {
  const colCount = Math.max(
    data.headers.length,
    ...data.rows.map((r) => r.length),
    1,
  );
  const cell = (content: string, header: boolean): string => {
    const tag = header ? "th" : "td";
    const extra = header
      ? ` font-weight:700; background-color:#f0f4ff;`
      : "";
    const text = content === "" ? "&nbsp;" : content;
    return `<${tag} style="padding:6px 8px; font-family:${FONT}; font-size:13px; line-height:1.5; color:${BODY_TEXT}; border:1px solid ${TABLE_BORDER};${extra}">${text}</${tag}>`;
  };
  const head = data.headerRow && data.headers.length > 0
    ? `<tr>${Array.from({ length: colCount }, (_, i) => cell(data.headers[i] ?? "", true)).join("")}</tr>`
    : "";
  const body = data.rows
    .map((r) => `<tr>${Array.from({ length: colCount }, (_, i) => cell(r[i] ?? "", false)).join("")}</tr>`)
    .join("");
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${head}${body}</table>`,
    "",
    corners,
  );
}

export function renderSocial(data: SocialBlockData, corners: Corner = ""): RenderedRow {
  const inner = socialLinksInner(data.social);
  return row(
    inner === ""
      ? `<p style="margin:0; font-size:13px; color:${MUTED}; text-align:center;">[Sin redes configuradas]</p>`
      : inner,
    "",
    corners,
  );
}

export function renderBanner(data: BannerBlockData, corners: Corner = ""): RenderedRow {
  // Video real no existe en email: imagen enlazable + pie opcional
  // (p. ej. "▶ Ver video"). Sin overlay absoluto: Outlook no lo soporta.
  // href revalidado (igual que cta/url y renderImage/src).
  const href = sanitizeHttpsUrl(data.href);
  const img = data.src === ""
    ? `<p style="margin:0; font-size:13px; color:${MUTED}; text-align:center;">[Imagen sin URL válida]</p>`
    : `<img src="${data.src}" width="504" alt="${data.alt}" style="display:block; width:100%; max-width:504px; height:auto; border:0; border-radius:12px;">`;
  const visual = href === "" ? img : `<a href="${href}" style="text-decoration:none;">${img}</a>`;
  const caption = data.caption === ""
    ? ""
    : href === ""
      ? `<p style="margin:8px 0 0; font-size:13px; color:${MUTED}; text-align:center;">${data.caption}</p>`
      : `<p style="margin:8px 0 0; text-align:center;"><a href="${href}" style="font-family:${FONT}; font-size:13px; font-weight:700; color:${PRIMARY}; text-decoration:underline;">${data.caption}</a></p>`;
  return row(`${visual}${caption}`, "", corners);
}

export function renderProduct(data: ProductBlockData, corners: Corner = ""): RenderedRow {
  const bg = data.color === "blue" ? PRIMARY : GREEN;
  const url = sanitizeHttpsUrl(data.url);
  const img = data.src === ""
    ? `<p style="margin:0; font-size:13px; color:${MUTED};">[Imagen sin URL válida]</p>`
    : `<img src="${data.src}" width="220" alt="${data.alt}" style="display:block; width:220px; max-width:100%; height:auto; border:0; border-radius:12px;">`;
  const visual = url === "" ? img : `<a href="${url}" style="text-decoration:none;">${img}</a>`;
  const name = data.name === ""
    ? ""
    : `<p style="margin:0; font-family:${FONT}; font-size:17px; font-weight:900; color:#111111;">${data.name}</p>`;
  const price = data.price === ""
    ? ""
    : `<p style="margin:8px 0 0; font-family:${FONT}; font-size:16px; font-weight:700; color:${PRIMARY};">${data.price}</p>`;
  const cta = data.buttonLabel === ""
    ? ""
    : pillTable(url, data.buttonLabel, bg, "left", 12, 0);
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
      `<td width="45%" valign="top" align="left" style="padding-right:12px;">${visual}</td>` +
      `<td width="55%" valign="top" align="left">${name}${price}${cta}</td>` +
      `</tr></table>`,
    "",
    corners,
  );
}

export function renderCoupon(data: CouponBlockData, corners: Corner = ""): RenderedRow {
  // Badge con border en <td> (Outlook-safe): estilo ticket sin imágenes.
  const code = data.code === ""
    ? ""
    : `<p style="margin:0; font-family:${FONT}; font-size:22px; font-weight:900; letter-spacing:2px; text-align:center; color:#111111;">${data.code}</p>`;
  const description = data.description === ""
    ? ""
    : `<p style="margin:8px 0 0; font-family:${FONT}; font-size:13px; text-align:center; color:${MUTED};">${data.description}</p>`;
  return row(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">` +
      `<tr><td align="center" style="padding:16px 32px; border:2px dashed ${PRIMARY}; border-radius:12px;">${code}${description}</td></tr>` +
      `</table>`,
    "",
    corners,
  );
}

export function renderSignature(data: SignatureBlockData, corners: Corner = ""): RenderedRow {
  const photo = data.photoSrc === ""
    ? ""
    : `<img src="${data.photoSrc}" width="64" alt="${data.photoAlt}" style="display:block; width:64px; max-width:64px; height:auto; border:0; border-radius:50%;">`;
  const name = data.name === ""
    ? ""
    : `<p style="margin:0; font-family:${FONT}; font-size:15px; font-weight:700; color:#111111;">${data.name}</p>`;
  const role = data.role === ""
    ? ""
    : `<p style="margin:4px 0 0; font-family:${FONT}; font-size:13px; color:${MUTED};">${data.role}</p>`;
  return row(
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
      (photo === ""
        ? `<td valign="top" align="left">${name}${role}</td>`
        : `<td width="76" valign="top" align="left" style="padding-right:12px;">${photo}</td>` +
          `<td valign="top" align="left">${name}${role}</td>`) +
      `</tr></table>`,
    "",
    corners,
  );
}

/**
 * Despacha por tipo. `cornersOverride` fuerza las esquinas (lo usan las
 * filas anidadas de `columns`, que nunca llevan radio: solo los bordes de
 * la tarjeta). Sin override se calcula por posición, como siempre.
 */
export function renderBlockToRow(
  data: AnyBlockData,
  index = 0,
  total = 1,
  cornersOverride?: Corner,
): RenderedRow {
  const corners: Corner = cornersOverride ??
    (total <= 1 ? "both" : index === 0 ? "top" : index === total - 1 ? "bottom" : "");
  switch (data.type) {
    case "title":
      return renderTitle(data, corners);
    case "text":
      return renderText(data, corners);
    case "image":
      return renderImage(data, corners);
    case "list":
      return renderList(data, corners);
    case "quote":
      return renderQuote(data, corners);
    case "divider":
      return renderDivider(data, corners);
    case "button":
      return renderButton(data, corners);
    case "spacer":
      return renderSpacer(data);
    case "header":
      return renderHeader(data, corners);
    case "footer":
      return renderFooter(data, corners);
    case "cta":
      return renderCta(data, corners);
    case "columns":
      return renderColumns(data, corners);
    case "table":
      return renderTable(data, corners);
    case "social":
      return renderSocial(data, corners);
    case "banner":
      return renderBanner(data, corners);
    case "product":
      return renderProduct(data, corners);
    case "coupon":
      return renderCoupon(data, corners);
    case "signature":
      return renderSignature(data, corners);
  }
}

/** Fondo exterior sanitizado: vacío o inválido -> color por defecto. */
function templateBg(input: string | undefined): string {
  if (input === undefined) return BG;
  const next = sanitizeColor(input);
  return next === "" ? BG : next;
}

function cardTable(body: string): string {
  // Sin espaciadores: el primer bloque arranca en el punto cero superior y
  // el último termina en el punto cero inferior, cada uno con su radio.
  // Lienzo vacío: una fila blanca con el radio completo para no colapsar.
  const content = body === ""
    ? `<tr><td style="padding:0 48px; font-family:${FONT};${cornerStyle("both")}"><div style="height:12px; line-height:12px;">&nbsp;</div></td></tr>`
    : body;
  return `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" ` +
    `style="width:600px; max-width:600px; margin:0 auto; border-collapse:collapse; background-color:${CARD}; border-radius:16px;">` +
    `${content}` +
    `</table>`;
}

/** Misma salida para Preview y descarga: evita desincronización. */
export function buildEmailDocument(blocks: readonly AnyBlockData[], background?: string): string {
  const bg = templateBg(background);
  const body = blocks.map((b, i) => renderBlockToRow(b, i, blocks.length).html).join("\n");
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Plantilla</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
</style>
</head>
<body style="margin:0; padding:0; background-color:${bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${bg}; padding:32px 0;">
<tr>
<td align="center">
${cardTable(body)}
</td>
</tr>
</table>
</body>
</html>`;
}

/** Solo la tarjeta, para incrustar en el panel de vista previa del editor. */
export function buildPreviewTable(blocks: readonly AnyBlockData[], background?: string): string {
  const bg = templateBg(background);
  const body = blocks.map((b, i) => renderBlockToRow(b, i, blocks.length).html).join("\n");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${bg}; padding:24px 8px;">` +
    `<tr><td align="center">${cardTable(body)}</td></tr></table>`;
}
