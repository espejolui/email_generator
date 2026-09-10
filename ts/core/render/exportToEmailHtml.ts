import { sanitizeImageSrc, sanitizeText } from "../sanitize/sanitize.js";
import type {
  AnyBlockData,
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

const FONT = "Arial, Helvetica, sans-serif";

function row(inner: string): RenderedRow {
  return { html: `<tr><td style="padding:0 24px 16px; font-family:${FONT};">${inner}</td></tr>` };
}

export function renderTitle(data: TitleBlockData): RenderedRow {
  const tag = data.level === 1 ? "h1" : data.level === 3 ? "h3" : "h2";
  const size = data.level === 1 ? "28px" : data.level === 3 ? "18px" : "24px";
  const text = sanitizeText(data.content);
  return row(
    `<${tag} style="margin:16px 0 8px; font-family:${FONT}; font-size:${size}; font-weight:bold; color:#111111;">${text}</${tag}>`,
  );
}

export function renderText(data: TextBlockData): RenderedRow {
  return row(
    `<p style="margin:0; font-family:${FONT}; font-size:14px; line-height:1.5; color:#333333;">${sanitizeText(data.content)}</p>`,
  );
}

export function renderImage(data: ImageBlockData): RenderedRow {
  const src = sanitizeImageSrc(data.src);
  const alt = sanitizeText(data.alt);
  const caption = sanitizeText(data.caption);
  const img = src === ""
    ? `<p style="margin:0; font-size:13px; color:#888888;">[Imagen sin URL válida]</p>`
    : `<img src="${src}" width="552" alt="${alt}" style="display:block; width:100%; max-width:552px; height:auto; border:0;">`;
  const cap = caption === ""
    ? ""
    : `<p style="margin:8px 0 0; font-size:12px; color:#666666;">${caption}</p>`;
  return row(`${img}${cap}`);
}

export function renderList(data: ListBlockData): RenderedRow {
  const tag = data.ordered ? "ol" : "ul";
  const items = data.items
    .map((item) => `<li style="font-size:14px; line-height:1.5; color:#333333;">${sanitizeText(item)}</li>`)
    .join("");
  return row(
    `<${tag} style="margin:0; padding-left:20px; font-family:${FONT};">${items}</${tag}>`,
  );
}

export function renderQuote(data: QuoteBlockData): RenderedRow {
  const cite = sanitizeText(data.cite);
  return row(
    `<blockquote style="margin:0; padding-left:12px; border-left:3px solid #cccccc; font-style:italic; color:#555555;">` +
      `<p style="margin:0; font-size:14px; line-height:1.5;">${sanitizeText(data.content)}</p>` +
      (cite === "" ? "" : `<cite style="font-size:12px; color:#888888;">— ${cite}</cite>`) +
      `</blockquote>`,
  );
}

export function renderDivider(_data: DividerBlockData): RenderedRow {
  return row(`<hr style="border:0; border-top:1px solid #dddddd; margin:8px 0;">`);
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
  }
}

/** Misma salida para Preview y descarga: evita desincronización. */
export function buildEmailDocument(blocks: readonly AnyBlockData[]): string {
  const body = blocks.map(renderBlockToRow).map((r) => r.html).join("\n");
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Plantilla</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px; margin:0 auto; border-collapse:collapse; background-color:#ffffff;">
${body}
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

/** Solo las filas, para incrustar en el panel de vista previa del editor. */
export function buildPreviewTable(blocks: readonly AnyBlockData[]): string {
  const body = blocks.map(renderBlockToRow).map((r) => r.html).join("\n");
  return `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; margin:0 auto; border-collapse:collapse; background-color:#ffffff;">${body}</table>`;
}
