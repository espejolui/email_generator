import { sanitizeHref, sanitizeImageSrc, sanitizeText } from "../sanitize/sanitize.js";
import type {
  AnyBlockData,
  ButtonBlockData,
  DividerBlockData,
  ImageBlockData,
  ListBlockData,
  QuoteBlockData,
  TextBlockData,
  TitleBlockData,
} from "../../blocks/types.js";

export interface RenderedRow {
  readonly html: string;
}

/** Tema "Bolos Comfacundi": Nunito + azules de marca sobre tarjeta blanca. */
const FONT = "'Nunito','Trebuchet MS',sans-serif";
const BG = "#f0faff";
const CARD = "#ffffff";
const PRIMARY = "#41b6e6";
const LIGHT = "#8DE1F7";
const BODY_TEXT = "#444444";
const MUTED = "#888888";
const GREEN = "#25d366";

function row(inner: string): RenderedRow {
  return { html: `<tr><td style="padding:0 48px 20px; font-family:${FONT};">${inner}</td></tr>` };
}

function spacer(height: number): string {
  return `<tr><td style="padding:0 48px; font-family:${FONT};"><div style="height:${String(height)}px; line-height:${String(height)}px;">&nbsp;</div></td></tr>`;
}

export function renderTitle(data: TitleBlockData): RenderedRow {
  const tag = data.level === 1 ? "h1" : data.level === 3 ? "h3" : "h2";
  const style = data.level === 1
    ? `font-size:26px; font-weight:900; color:#111111;`
    : data.level === 3
      ? `font-size:17px; font-weight:900; color:${PRIMARY};`
      : `font-size:19px; font-weight:700; color:${BODY_TEXT};`;
  const text = sanitizeText(data.content);
  return row(
    `<${tag} style="margin:0 0 12px; font-family:${FONT}; ${style}">${text}</${tag}>`,
  );
}

export function renderText(data: TextBlockData): RenderedRow {
  return row(
    `<p style="margin:0; font-family:${FONT}; font-size:16px; line-height:1.75; color:${BODY_TEXT};">${sanitizeText(data.content)}</p>`,
  );
}

export function renderImage(data: ImageBlockData): RenderedRow {
  const src = sanitizeImageSrc(data.src);
  const alt = sanitizeText(data.alt);
  const caption = sanitizeText(data.caption);
  const img = src === ""
    ? `<p style="margin:0; font-size:13px; color:${MUTED};">[Imagen sin URL válida]</p>`
    : `<img src="${src}" width="504" alt="${alt}" style="display:block; width:100%; max-width:504px; height:auto; border:0; border-radius:12px;">`;
  const cap = caption === ""
    ? ""
    : `<p style="margin:8px 0 0; font-size:12px; color:${MUTED};">${caption}</p>`;
  return row(`${img}${cap}`);
}

export function renderList(data: ListBlockData): RenderedRow {
  const tag = data.ordered ? "ol" : "ul";
  const items = data.items
    .map((item) => `<li style="font-size:16px; line-height:1.75; color:${BODY_TEXT};">${sanitizeText(item)}</li>`)
    .join("");
  return row(
    `<${tag} style="margin:0; padding-left:20px; font-family:${FONT};">${items}</${tag}>`,
  );
}

export function renderQuote(data: QuoteBlockData): RenderedRow {
  const cite = sanitizeText(data.cite);
  return row(
    `<blockquote style="margin:0; padding-left:12px; border-left:3px solid ${PRIMARY}; font-style:italic; color:#555555;">` +
      `<p style="margin:0; font-size:16px; line-height:1.75;">${sanitizeText(data.content)}</p>` +
      (cite === "" ? "" : `<cite style="font-size:12px; color:${MUTED};">— ${cite}</cite>`) +
      `</blockquote>`,
  );
}

export function renderDivider(_data: DividerBlockData): RenderedRow {
  return row(
    `<div style="height:3px; margin:12px 0 8px; background:linear-gradient(90deg,${PRIMARY} 0%,${LIGHT} 100%); border-radius:2px;"></div>`,
  );
}

export function renderButton(data: ButtonBlockData): RenderedRow {
  const bg = data.color === "blue" ? PRIMARY : GREEN;
  const label = sanitizeText(data.label);
  const href = sanitizeHref(data.href);
  const text = href === ""
    ? `<span style="display:inline-block; padding:13px 32px; font-family:${FONT}; font-size:15px; font-weight:900; color:#ffffff; letter-spacing:0.4px;">${label}</span>`
    : `<a href="${href}" style="display:inline-block; padding:13px 32px; font-family:${FONT}; font-size:15px; font-weight:900; color:#ffffff; text-decoration:none; letter-spacing:0.4px;">${label}</a>`;
  return row(
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">` +
      `<tr><td align="center" style="background-color:${bg}; border-radius:50px;">${text}</td></tr>` +
      `</table>`,
  );
}

export function renderBlockToRow(data: AnyBlockData): RenderedRow {
  switch (data.type) {
    case "title":
      return renderTitle(data);
    case "text":
      return renderText(data);
    case "image":
      return renderImage(data);
    case "list":
      return renderList(data);
    case "quote":
      return renderQuote(data);
    case "divider":
      return renderDivider(data);
    case "button":
      return renderButton(data);
  }
}

function cardTable(body: string): string {
  return `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" ` +
    `style="width:600px; max-width:600px; margin:0 auto; border-collapse:collapse; background-color:${CARD}; border-radius:16px;">` +
    `${spacer(36)}\n${body}\n${spacer(12)}` +
    `</table>`;
}

/** Misma salida para Preview y descarga: evita desincronización. */
export function buildEmailDocument(blocks: readonly AnyBlockData[]): string {
  const body = blocks.map(renderBlockToRow).map((r) => r.html).join("\n");
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
<body style="margin:0; padding:0; background-color:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG}; padding:32px 0;">
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
export function buildPreviewTable(blocks: readonly AnyBlockData[]): string {
  const body = blocks.map(renderBlockToRow).map((r) => r.html).join("\n");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG}; padding:24px 8px;">` +
    `<tr><td align="center">${cardTable(body)}</td></tr></table>`;
}
