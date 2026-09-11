import { buildWhatsAppUrl, sanitizeColor, sanitizeImageSrc } from "../sanitize/sanitize.js";
import { lightenHex } from "../color/color.js";
import type {
  AnyBlockData,
  ButtonBlockData,
  DividerBlockData,
  ImageBlockData,
  ListBlockData,
  QuoteBlockData,
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

export function renderButton(data: ButtonBlockData, corners: Corner = ""): RenderedRow {
  const bg = data.color === "blue" ? PRIMARY : GREEN;
  // message viaja en crudo hasta aquí y se codifica para URL (nunca toca HTML).
  const href = buildWhatsAppUrl(data.phone, data.message);
  const text = href === ""
    ? `<span style="display:inline-block; padding:13px 32px; font-family:${FONT}; font-size:15px; font-weight:900; color:#ffffff; letter-spacing:0.4px;">${data.label}</span>`
    : `<a href="${href}" style="display:inline-block; padding:13px 32px; font-family:${FONT}; font-size:15px; font-weight:900; color:#ffffff; text-decoration:none; letter-spacing:0.4px;">${data.label}</a>`;
  return row(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${data.align}" style="margin:${String(data.marginTop)}px auto ${String(data.marginBottom)}px;">` +
      `<tr><td align="center" style="background-color:${bg}; border-radius:50px;">${text}</td></tr>` +
      `</table>`,
    "",
    corners,
  );
}

export function renderBlockToRow(data: AnyBlockData, index = 0, total = 1): RenderedRow {
  const corners: Corner = total <= 1 ? "both" : index === 0 ? "top" : index === total - 1 ? "bottom" : "";
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
