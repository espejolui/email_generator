import { createId } from "../../blocks/index.js";
import { createBlockAppearance } from "../../blocks/types.js";
import type {
  AnyBlockData,
  BorderStyle,
  ButtonAlign,
  CtaBlockData,
  DividerBlockData,
  HeaderBlockData,
  SpacerBlockData,
  TableBlockData,
  TextAlign,
  TextBlockData,
  TitleLevel,
} from "../../blocks/types.js";
import {
  sanitizeAlt,
  sanitizeColor,
  sanitizeFontSize,
  sanitizeHttpsUrl,
  sanitizeImageSrc,
  sanitizeImageWidth,
  sanitizeMargin,
  sanitizeText,
} from "../sanitize/sanitize.js";
import { DEFAULT_TEMPLATE_BG } from "../render/exportToEmailHtml.js";
import { isBorderStyle } from "../../blocks/types.js";

const MAX_IMPORT_ELEMENTS = 1000;
const MAX_IMPORT_DEPTH = 100;

export interface ImportedTemplate {
  readonly blocks: readonly AnyBlockData[];
  readonly background: string;
  readonly docTitle: string;
  readonly ignoredElements: number;
}

interface FormatFlags {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
}

function cleanText(value: string, maxLength: number): string {
  return sanitizeText(value.replace(/\s+/g, " ").trim()).slice(0, maxLength);
}

/** Acepta los formatos habituales de estilos inline y devuelve #rrggbb. */
function safeColor(value: string): string {
  const direct = sanitizeColor(value);
  if (direct !== "") return direct;
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value.trim());
  if (short !== null) {
    return sanitizeColor(`#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`);
  }
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(value.trim());
  if (rgb === null) return "";
  const channels = rgb.slice(1, 4).map((channel) => Number(channel));
  if (channels.some((channel) => channel > 255)) return "";
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function elementColor(element: Element, property: "color" | "backgroundColor"): string {
  return element instanceof HTMLElement ? safeColor(element.style[property]) : "";
}

function alignOf(element: Element): TextAlign {
  let current: Element | null = element;
  for (let depth = 0; current !== null && depth < 4; depth += 1) {
    const inline = current instanceof HTMLElement ? current.style.textAlign : "";
    const value = inline || current.getAttribute("align") || "";
    if (value === "left" || value === "center" || value === "right") return value;
    current = current.parentElement;
  }
  return "left";
}

function buttonAlignOf(element: Element): ButtonAlign {
  return alignOf(element);
}

function pixelValue(value: string): number | undefined {
  const match = /^(\d{1,3})(?:px)?$/i.exec(value.trim());
  return match?.[1] === undefined ? undefined : Number(match[1]);
}

/** Ancho de imagen desde el atributo `width` o el estilo inline (16–600). */
function imageWidthOf(image: HTMLImageElement, fallback: number): number {
  const attr = Number(image.getAttribute("width") ?? "");
  const styled = image.style.width === undefined ? undefined : pixelValue(image.style.width);
  const parsed = Number.isInteger(attr) && attr > 0 ? attr : styled;
  if (parsed === undefined) return fallback;
  const width = sanitizeImageWidth(String(parsed));
  // sanitizeImageWidth devuelve 200 ante lo inválido: si el valor leído era
  // válido pero fuera de rango, se limita; si era inválido, usa el fallback.
  return parsed >= 16 && parsed <= 600 ? width : fallback;
}

function marginOf(element: Element, property: "marginTop" | "marginBottom", fallback: number): number {
  if (!(element instanceof HTMLElement)) return fallback;
  const pixels = pixelValue(element.style[property]);
  return pixels === undefined ? fallback : sanitizeMargin(String(pixels));
}

function fontSizeOf(element: Element): number {
  if (!(element instanceof HTMLElement)) return 0;
  const pixels = pixelValue(element.style.fontSize);
  return pixels === undefined ? 0 : sanitizeFontSize(String(pixels));
}

/**
 * Celda de bloque de nuestras exportaciones: el motor (`row()`) siempre
 * pinta `padding:0 48px …` en ella, así que es reconocible sin marcas.
 * Los fondos, colores de letra y bordes del bloque viven ahí
 * (`withAppearance`), no en el elemento de texto: sin leerla, la
 * reimportación los pierde (fondos y bordes vacíos).
 */
function blockCellOf(element: Element): HTMLTableCellElement | null {
  let current: Element | null = element;
  for (let depth = 0; current !== null && depth < 8; depth += 1) {
    if (current instanceof HTMLTableCellElement) {
      const pad = current.style.padding;
      if (pad === "0px 48px 20px" || pad === "0px 48px 32px") return current;
    }
    current = current.parentElement;
  }
  return null;
}

/** Fondo del bloque desde su celda (con `bgcolor` heredado como respaldo). */
function blockBg(element: Element): string {
  const cell = blockCellOf(element);
  if (cell === null) return "";
  const inline = safeColor(cell.style.backgroundColor);
  if (inline !== "") return inline;
  const attr = cell.getAttribute("bgcolor");
  return attr === null ? "" : safeColor(attr);
}

/** Color de letra: el propio elemento primero, si no el de la celda. */
function blockColor(element: Element, fallback = ""): string {
  const own = elementColor(element, "color");
  if (own !== "") return own;
  const cell = blockCellOf(element);
  if (cell === null) return fallback;
  return safeColor(cell.style.color) || fallback;
}

interface CellBorder {
  readonly borderWidth: number;
  readonly borderStyle: BorderStyle;
  readonly borderColor: string;
  readonly borderRadius: number;
}

const NO_BORDER: CellBorder = { borderWidth: 0, borderStyle: "solid", borderColor: "", borderRadius: 0 };

/** Borde y radio de la celda del bloque (`border:3px dashed #…` + radius). */
function blockBorder(element: Element): CellBorder {
  const cell = blockCellOf(element);
  if (cell === null) return NO_BORDER;
  const match = /^(\d{1,3})px\s+(solid|dashed|dotted)\s+(.+)$/i.exec(cell.style.border.trim());
  // Las esquinas de la tarjeta (`16px 16px 0 0`) pisan el radio propio en la
  // primera/última fila: se toma el primer valor (fiel a lo que se ve).
  const firstRadius = cell.style.borderRadius.split(/\s+/)[0] ?? "";
  const radius = pixelValue(firstRadius) ?? 0;
  if (match?.[1] === undefined || match?.[2] === undefined || match?.[3] === undefined) {
    return radius === 0 ? NO_BORDER : { ...NO_BORDER, borderRadius: sanitizeMargin(String(radius)) };
  }
  return {
    borderWidth: sanitizeMargin(match[1]),
    borderStyle: isBorderStyle(match[2].toLowerCase()) ? match[2].toLowerCase() as BorderStyle : "solid",
    borderColor: safeColor(match[3]),
    borderRadius: sanitizeMargin(String(radius)),
  };
}

/**
 * Margen propio o de la tabla envolvente (nuestro `margined()` lo deja en
 * la tabla, no en el contenido). Solo sube por tablas para no heredar
 * márgenes de párrafos vecinos.
 */
function marginUp(element: Element, property: "marginTop" | "marginBottom", fallback: number): number {
  if (element instanceof HTMLElement) {
    const own = pixelValue(element.style[property]);
    if (own !== undefined) return sanitizeMargin(String(own));
  }
  let current = element.parentElement;
  for (let depth = 0; current !== null && depth < 4; depth += 1, current = current.parentElement) {
    if (current instanceof HTMLTableElement) {
      const value = pixelValue(current.style[property]);
      if (value !== undefined) return sanitizeMargin(String(value));
    }
  }
  return fallback;
}

/** Tabla-logo solitaria (1 fila, 1 celda, solo una imagen): pie de encabezado. */
function logoImageOf(table: Element): HTMLImageElement | null {
  if (table.tagName !== "TABLE") return null;
  const rows = directRows(table);
  if (rows.length !== 1) return null;
  const cells = directCells(rows[0] ?? document.createElement("tr"));
  if (cells.length !== 1) return null;
  const kids = Array.from(cells[0]?.children ?? []);
  if (kids.length !== 1 || !(kids[0] instanceof HTMLImageElement)) return null;
  return kids[0];
}

interface HeaderSequence {
  readonly logo: HTMLImageElement;
  readonly texts: ReadonlyArray<{ readonly text: string; readonly el: Element }>;
  readonly alignEl: Element;
  readonly marginEl: Element;
  readonly position: "top" | "bottom";
}

/**
 * Secuencia [tabla-logo, párrafos…] (texto debajo) o [párrafos…, tabla-logo]
 * (texto arriba, solo al inicio): el encabezado de nuestras exportaciones.
 * Máximo 2 párrafos (título + tagline); el resto sigue como bloques aparte.
 */
function headerSequenceAt(kids: readonly Element[], at: number): HeaderSequence | null {
  const first = kids[at];
  if (first === undefined) return null;
  const logoDirect = logoImageOf(first);
  if (logoDirect !== null) {
    const texts: Array<{ text: string; el: Element }> = [];
    for (let i = at + 1; i < kids.length && texts.length < 2; i += 1) {
      const next = kids[i];
      if (next === undefined || next.tagName !== "P") break;
      const text = cleanText(next.textContent ?? "", 200);
      if (text === "") break;
      texts.push({ text, el: next });
    }
    if (texts.length === 0) return null;
    return { logo: logoDirect, texts, alignEl: texts[0]?.el ?? first, marginEl: first, position: "bottom" };
  }
  // Texto arriba: solo si la racha de párrafos abre la secuencia (si no,
  // el párrafo anterior sería un bloque de texto aparte, no el título).
  if (first.tagName === "P" && at === 0) {
    const texts: Array<{ text: string; el: Element }> = [];
    let logo: HTMLImageElement | null = null;
    for (let i = at; i < kids.length && texts.length < 2; i += 1) {
      const next = kids[i];
      if (next === undefined) break;
      if (next.tagName === "P") {
        const text = cleanText(next.textContent ?? "", 200);
        if (text === "") break;
        texts.push({ text, el: next });
        continue;
      }
      logo = logoImageOf(next);
      break;
    }
    if (logo === null || texts.length === 0) return null;
    const firstText = texts[0]?.el;
    return { logo, texts, alignEl: firstText ?? first, marginEl: first, position: "top" };
  }
  return null;
}

/** Último párrafo → tagline; el resto (unido) → título. Un único párrafo
 * con aspecto de título (negrita o ≥16 px, como exporta el encabezado)
 * va al título; si no, al tagline (compatibles con los antiguos). */
function splitHeaderTexts(texts: HeaderSequence["texts"]): { title: string; tagline: string } {
  if (texts.length === 0) return { title: "", tagline: "" };
  if (texts.length === 1) {
    const only = texts[0];
    if (only !== undefined && isTitleLike(only.el)) {
      return { title: only.text.slice(0, 120), tagline: "" };
    }
    return { title: "", tagline: texts[0]?.text ?? "" };
  }
  const head = texts.slice(0, -1).map((t) => t.text).join(" ");
  return { title: head.slice(0, 120), tagline: texts[texts.length - 1]?.text ?? "" };
}

/** Párrafo con aspecto de título de encabezado (17 px + negrita). */
function isTitleLike(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const weight = Number.parseInt(el.style.fontWeight, 10);
  if (el.style.fontWeight === "bold" || weight >= 700) return true;
  return (pixelValue(el.style.fontSize) ?? 0) >= 16;
}

/** Construye el bloque de encabezado desde una secuencia detectada. */
function headerFromSequence(seq: HeaderSequence): HeaderBlockData {
  const { title, tagline } = splitHeaderTexts(seq.texts);
  const titleEl = seq.texts.length > 1 ? seq.texts[0]?.el : undefined;
  const border = blockBorder(seq.marginEl);
  return {
    ...createBlockAppearance(),
    id: createId(),
    type: "header",
    logoSrc: sanitizeImageSrc(seq.logo.getAttribute("src") ?? ""),
    logoAlt: sanitizeAlt(seq.logo.getAttribute("alt") ?? ""),
    title,
    tagline,
    align: alignOf(seq.alignEl),
    textPosition: seq.position,
    marginTop: marginUp(seq.marginEl, "marginTop", 0),
    marginBottom: marginUp(seq.marginEl, "marginBottom", 0),
    fontSize: titleEl === undefined ? 0 : fontSizeOf(titleEl),
    logoWidth: imageWidthOf(seq.logo, 200),
    ...border,
    bg: blockBg(seq.marginEl),
    color: blockColor(titleEl ?? seq.texts[0]?.el ?? seq.marginEl),
  };
}

interface SideHeader {
  readonly logo: HTMLImageElement;
  readonly textCell: Element;
  readonly logoFirst: boolean;
}

/**
 * Encabezado lateral: tabla de 2 celdas donde una es solo logo (ancho en px
 * igual al de su imagen) y la otra solo texto. Nuestras columnas usan
 * anchos en % y mezclan bloques, así que no colisiona con lo exportado.
 */
function sideHeaderOf(cells: readonly HTMLTableCellElement[]): SideHeader | null {
  if (cells.length !== 2) return null;
  const pairs: ReadonlyArray<readonly [Element | undefined, Element | undefined, boolean]> = [
    [cells[0], cells[1], true],
    [cells[1], cells[0], false],
  ];
  for (const [logoCell, textCell, logoFirst] of pairs) {
    if (logoCell === undefined || textCell === undefined) continue;
    const kids = Array.from(logoCell.children);
    if (kids.length !== 1 || kids[0]?.tagName !== "TABLE") continue;
    const logo = logoImageOf(kids[0] as Element);
    if (logo === null) continue;
    if ((logoCell.textContent ?? "").trim() !== "") continue;
    const cellWidth = logoCell.getAttribute("width") ?? "";
    const imgWidth = logo.getAttribute("width") ?? "";
    if (cellWidth === "" || cellWidth !== imgWidth) continue;
    if (textCell.querySelector("table,img") !== null) continue;
    if (cleanText(textCell.textContent ?? "", 1) === "") continue;
    return { logo, textCell, logoFirst };
  }
  return null;
}

/** Encabezado lateral → bloque (último párrafo a tagline, resto a título). */
function headerFromSide(table: Element, side: SideHeader): HeaderBlockData {
  const entries = Array.from(side.textCell.children)
    .filter((el) => el.tagName === "P")
    .map((el) => ({ text: cleanText(el.textContent ?? "", 200), el }))
    .filter((t) => t.text !== "");
  const source: ReadonlyArray<{ readonly text: string; readonly el: Element }> = entries.length > 0
    ? entries
    : [{ text: cleanText(side.textCell.textContent ?? "", 200), el: side.textCell }];
  const { title, tagline } = splitHeaderTexts(source);
  const titleEl = source.length > 1 ? source[0]?.el : undefined;
  const firstTextEl = source[0]?.el;
  const border = blockBorder(table);
  return {
    ...createBlockAppearance(),
    id: createId(),
    type: "header",
    logoSrc: sanitizeImageSrc(side.logo.getAttribute("src") ?? ""),
    logoAlt: sanitizeAlt(side.logo.getAttribute("alt") ?? ""),
    title,
    tagline,
    align: firstTextEl === undefined ? alignOf(side.textCell) : alignOf(firstTextEl),
    textPosition: side.logoFirst ? "right" : "left",
    marginTop: marginUp(table, "marginTop", 0),
    marginBottom: marginUp(table, "marginBottom", 0),
    fontSize: titleEl === undefined ? 0 : fontSizeOf(titleEl),
    logoWidth: imageWidthOf(side.logo, 200),
    ...border,
    bg: blockBg(table),
    color: blockColor(titleEl ?? source[0]?.el ?? table),
  };
}

interface BarValues {
  readonly color: string;
  readonly thickness: number;
  readonly borderRadius: number;
}

/**
 * Separador exportado: tabla de una celda que ES la barra (altura + fondo +
 * degradado). El espaciador con relleno usa la misma forma pero sin
 * degradado (se detecta aparte). Solo mira la celda directa: bajar a
 * descendientes atraparía la plantilla entera.
 */
function dividerBarOf(table: Element): BarValues | null {
  const rows = directRows(table);
  if (rows.length !== 1) return null;
  const cells = directCells(rows[0] ?? document.createElement("tr"));
  if (cells.length !== 1) return null;
  const bar = cells[0];
  if (bar === undefined) return null;
  if (bar.getAttribute("height") === null || bar.getAttribute("bgcolor") === null) return null;
  if (!bar.style.cssText.includes("linear-gradient")) return null;
  return {
    color: safeColor(bar.getAttribute("bgcolor") ?? ""),
    thickness: sanitizeMargin(bar.getAttribute("height") ?? "2"),
    borderRadius: sanitizeMargin(String(pixelValue(bar.style.borderRadius) ?? 2)),
  };
}

/** Espaciador con relleno: celda única con altura + fondo, sin contenido. */
function spacerFillOf(table: Element): { height: number; color: string } | null {
  const rows = directRows(table);
  if (rows.length !== 1) return null;
  const cells = directCells(rows[0] ?? document.createElement("tr"));
  if (cells.length !== 1) return null;
  const cell = cells[0];
  if (cell === undefined || cell.children.length > 0) return null;
  if (cell.getAttribute("height") === null) return null;
  const color = safeColor(cell.getAttribute("bgcolor") ?? "");
  if (color === "") return null;
  return { height: sanitizeMargin(cell.getAttribute("height") ?? "16"), color };
}

/** Imagen suelta o enlace con una única imagen sin texto: pie de banner. */
function soleImageOf(el: Element): HTMLImageElement | null {
  if (el instanceof HTMLImageElement) return el;
  if (el.tagName !== "A") return null;
  const imgs = Array.from(el.querySelectorAll("img"));
  if (imgs.length !== 1 || !(imgs[0] instanceof HTMLImageElement)) return null;
  if (cleanText(el.textContent ?? "", 1) !== "") return null;
  return imgs[0];
}

/** Marcador de columna vacía de nuestras exportaciones (no es contenido). */
const EMPTY_COLUMN_PLACEHOLDER = "[Columna vacía]";

function formatsOf(element: Element): FormatFlags {
  let bold = element.closest("b,strong") !== null;
  let italic = element.closest("i,em") !== null;
  let underline = element.closest("u") !== null;
  let strike = element.closest("s,strike,del") !== null;
  let current: Element | null = element;
  while (current !== null && current.tagName !== "BODY") {
    if (current instanceof HTMLElement) {
      const weight = Number.parseInt(current.style.fontWeight, 10);
      if (current.style.fontWeight === "bold" || weight >= 600) bold = true;
      if (current.style.fontStyle === "italic") italic = true;
      if (current.style.textDecoration.includes("underline")) underline = true;
      if (current.style.textDecoration.includes("line-through")) strike = true;
    }
    current = current.parentElement;
  }
  return { bold, italic, underline, strike };
}

function textBlock(element: Element, content = element.textContent ?? ""): TextBlockData | undefined {
  const text = cleanText(content, 2000);
  // El marcador de columna vacía de nuestras exportaciones no es contenido.
  if (text === "" || text === EMPTY_COLUMN_PLACEHOLDER) return undefined;
  const border = blockBorder(element);
  return {
    ...createBlockAppearance(),
    id: createId(),
    type: "text",
    content: text,
    align: alignOf(element),
    bg: blockBg(element) || elementColor(element, "backgroundColor"),
    color: blockColor(element),
    marginTop: marginOf(element, "marginTop", 0),
    marginBottom: marginOf(element, "marginBottom", 0),
    ...formatsOf(element),
    fontSize: fontSizeOf(element),
    ...border,
  };
}

function directRows(table: Element): HTMLTableRowElement[] {
  return Array.from(table.querySelectorAll("tr")).filter(
    (row): row is HTMLTableRowElement => row.closest("table") === table,
  );
}

function directCells(row: Element): HTMLTableCellElement[] {
  return Array.from(row.children).filter(
    (cell): cell is HTMLTableCellElement =>
      (cell.tagName === "TD" || cell.tagName === "TH") && cell.closest("tr") === row,
  );
}

function textWithout(element: Element, selector: string): string {
  const copy = element.cloneNode(true);
  if (!(copy instanceof Element)) return "";
  copy.querySelectorAll(selector).forEach((node) => node.remove());
  return copy.textContent ?? "";
}

class HtmlBlockParser {
  readonly blocks: AnyBlockData[] = [];
  ignoredElements = 0;
  private visitedElements = 0;

  parseChildren(parent: Element, output: AnyBlockData[] = this.blocks): void {
    const kids = Array.from(parent.children);
    for (let i = 0; i < kids.length; i += 1) {
      const child = kids[i];
      if (child === undefined) continue;
      // Encabezado de nuestras exportaciones: tabla-logo + párrafos en la
      // misma celda. Sin esto se partía en un bloque de imagen y textos.
      const seq = headerSequenceAt(kids, i);
      if (seq !== null) {
        this.visitedElements += 1 + seq.texts.length;
        output.push(headerFromSequence(seq));
        i += seq.texts.length;
        continue;
      }
      // Imagen (sola o enlazada) seguida de un párrafo en la misma celda:
      // banner con pie. Antes el pie quedaba como texto aparte.
      const sole = soleImageOf(child);
      if (sole !== null) {
        const sib = kids[i + 1];
        let caption = "";
        let skip = 0;
        if (sib !== undefined && sib.tagName === "P") {
          const text = cleanText(sib.textContent ?? "", 120);
          if (text !== "") {
            caption = text;
            skip = 1;
          }
        }
        this.visitedElements += 1 + skip;
        this.parseImage(sole, output, caption);
        i += skip;
        continue;
      }
      this.parseElement(child, output);
    }
  }

  private parseElement(element: Element, output: AnyBlockData[]): void {
    if (this.visitedElements >= MAX_IMPORT_ELEMENTS) {
      this.ignoredElements += 1;
      return;
    }
    this.visitedElements += 1;
    let depth = 0;
    for (let parent = element.parentElement; parent !== null; parent = parent.parentElement) {
      depth += 1;
      if (depth > MAX_IMPORT_DEPTH) {
        this.ignoredElements += 1;
        return;
      }
    }
    const tag = element.tagName;
    if (/^H[1-6]$/.test(tag)) {
      const content = cleanText(element.textContent ?? "", 300);
      if (content === "") return;
      const level = Number(tag.slice(1)) as TitleLevel;
      const border = blockBorder(element);
      output.push({
        ...createBlockAppearance(),
        id: createId(),
        type: "title",
        content,
        level,
        align: alignOf(element),
        bg: blockBg(element) || elementColor(element, "backgroundColor"),
        color: blockColor(element),
        marginTop: marginOf(element, "marginTop", 0),
        marginBottom: marginOf(element, "marginBottom", 12),
        ...formatsOf(element),
        fontSize: fontSizeOf(element),
        ...border,
      });
      return;
    }
    if (tag === "P") {
      const block = textBlock(element);
      if (block !== undefined) output.push(block);
      return;
    }
    if (tag === "IMG") {
      this.parseImage(element as HTMLImageElement, output);
      return;
    }
    if (tag === "FIGURE") {
      const image = element.querySelector("img");
      if (image !== null) {
        this.parseImage(image, output, element.querySelector("figcaption")?.textContent ?? "");
      } else {
        this.parseChildren(element, output);
      }
      return;
    }
    if (tag === "UL" || tag === "OL") {
      const items = Array.from(element.children)
        .filter((item) => item.tagName === "LI")
        .slice(0, 20)
        .map((item) => cleanText(item.textContent ?? "", 300))
        .filter((item) => item !== "");
      if (items.length > 0) {
        const firstItem = element.querySelector("li");
        const border = blockBorder(element);
        output.push({
          ...createBlockAppearance(),
          id: createId(),
          type: "list",
          items,
          ordered: tag === "OL",
          align: alignOf(element),
          bg: blockBg(element) || elementColor(element, "backgroundColor"),
          color: firstItem === null ? blockColor(element) : blockColor(firstItem, blockColor(element)),
          marginTop: marginOf(element, "marginTop", 0),
          marginBottom: marginOf(element, "marginBottom", 0),
          fontSize: fontSizeOf(element) || (firstItem === null ? 0 : fontSizeOf(firstItem)),
          ...border,
        });
      }
      return;
    }
    if (tag === "BLOCKQUOTE") {
      const content = cleanText(textWithout(element, "cite"), 1000);
      if (content === "") return;
      const border = blockBorder(element);
      output.push({
        ...createBlockAppearance(),
        id: createId(),
        type: "quote",
        content,
        cite: cleanText(element.querySelector("cite")?.textContent ?? "", 200),
        align: alignOf(element),
        bg: blockBg(element) || elementColor(element, "backgroundColor"),
        color: blockColor(element),
        ...formatsOf(element),
        marginTop: marginOf(element, "marginTop", 0),
        marginBottom: marginOf(element, "marginBottom", 0),
        fontSize: fontSizeOf(element),
        ...border,
      });
      return;
    }
    if (tag === "HR") {
      const border = blockBorder(element);
      output.push({
        ...createBlockAppearance(),
        ...border,
        id: createId(),
        type: "divider",
        color: elementColor(element, "backgroundColor") || elementColor(element, "color"),
        marginTop: marginOf(element, "marginTop", 8),
        marginBottom: marginOf(element, "marginBottom", 8),
        thickness: element instanceof HTMLElement ? sanitizeMargin(String(pixelValue(element.style.height) ?? 2)) : 2,
        borderRadius: 2,
      });
      return;
    }
    if (tag === "TABLE") {
      this.parseTable(element, output);
      return;
    }
    if (tag === "A") {
      const image = element.querySelector("img");
      if (image !== null) this.parseImage(image, output);
      const block = this.ctaBlock(element);
      if (block !== undefined) output.push(block);
      if (image === null && block === undefined) this.parseChildren(element, output);
      return;
    }
    if (["SCRIPT", "STYLE", "HEAD", "META", "LINK", "TITLE", "NOSCRIPT", "BR"].includes(tag)) return;
    if (element.children.length > 0) {
      this.parseChildren(element, output);
      return;
    }
    const block = textBlock(element);
    if (block !== undefined) {
      output.push(block);
    } else if (!["HTML", "BODY", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH"].includes(tag)) {
      this.ignoredElements += 1;
    }
  }

  private parseImage(image: HTMLImageElement, output: AnyBlockData[], caption = ""): void {
    const src = sanitizeImageSrc(image.getAttribute("src") ?? "");
    if (src === "") {
      this.ignoredElements += 1;
      return;
    }
    const link = image.closest("a");
    const href = sanitizeHttpsUrl(link?.getAttribute("href") ?? "");
    const alt = sanitizeAlt(image.getAttribute("alt") ?? "");
    const border = blockBorder(image);
    if (href !== "" || cleanText(caption, 120) !== "") {
      const captionEl = image.closest("figure")?.querySelector("figcaption") ?? undefined;
      output.push({
        ...createBlockAppearance(),
        id: createId(),
        type: "banner",
        src,
        alt,
        href,
        caption: cleanText(caption, 120),
        marginTop: marginUp(image, "marginTop", 0),
        marginBottom: marginUp(image, "marginBottom", 0),
        fontSize: captionEl === undefined ? 0 : fontSizeOf(captionEl),
        width: imageWidthOf(image, 504),
        ...border,
        bg: blockBg(image),
        color: blockColor(image),
      });
    } else {
      output.push({
        ...createBlockAppearance(),
        id: createId(),
        type: "image",
        src,
        alt,
        marginTop: marginUp(image, "marginTop", 0),
        marginBottom: marginUp(image, "marginBottom", 0),
        width: imageWidthOf(image, 504),
        ...border,
        bg: blockBg(image),
        color: blockColor(image),
      });
    }
  }

  private ctaBlock(anchor: Element): CtaBlockData | undefined {
    const label = cleanText(anchor.textContent ?? "", 80);
    const url = sanitizeHttpsUrl(anchor.getAttribute("href") ?? "");
    if (label === "" || url === "") return undefined;
    const cell = anchor.closest("td");
    const table = anchor.closest("table");
    const cellColor = cell === null ? "" : elementColor(cell, "backgroundColor");
    const border = blockBorder(anchor);
    return {
      ...createBlockAppearance(),
      id: createId(),
      type: "cta",
      label,
      url,
      color: cellColor || "#41b6e6",
      align: table === null ? buttonAlignOf(anchor) : buttonAlignOf(table),
      marginTop: 0,
      marginBottom: 0,
      fontSize: fontSizeOf(anchor),
      ...border,
      bg: blockBg(anchor),
    };
  }

  private parseTable(table: Element, output: AnyBlockData[]): void {
    const rows = directRows(table);
    const hasHeaders = rows.some((row) => directCells(row).some((cell) => cell.tagName === "TH"));
    const isPlainDataTable = table.getAttribute("role") !== "presentation" &&
      rows.length > 1 &&
      directCells(rows[0] ?? document.createElement("tr")).length > 1 &&
      table.querySelector("table") === null;
    if (hasHeaders || isPlainDataTable) {
      const dataRows = hasHeaders ? rows.filter((row) => !directCells(row).some((cell) => cell.tagName === "TH")) : rows;
      const headers = hasHeaders
        ? directCells(rows.find((row) => directCells(row).some((cell) => cell.tagName === "TH")) ?? document.createElement("tr"))
          .slice(0, 6).map((cell) => cleanText(cell.textContent ?? "", 200))
        : [];
      const firstCell = table.querySelector("th,td");
      const block: TableBlockData = {
        ...createBlockAppearance(),
        id: createId(),
        type: "table",
        headers,
        rows: dataRows.slice(0, 20).map((row) =>
          directCells(row).slice(0, 6).map((cell) => cleanText(cell.textContent ?? "", 200))),
        headerRow: hasHeaders,
        marginTop: marginUp(table, "marginTop", 0),
        marginBottom: marginUp(table, "marginBottom", 0),
        fontSize: firstCell === null ? 0 : fontSizeOf(firstCell),
        ...blockBorder(table),
        bg: blockBg(table),
        color: firstCell === null ? blockColor(table) : blockColor(firstCell, blockColor(table)),
      };
      output.push(block);
      return;
    }

    if (rows.length === 1) {
      const cells = directCells(rows[0] ?? document.createElement("tr"));
      if (cells.length === 1) {
        // Separador exportado (celda con altura + fondo + degradado).
        const bar = dividerBarOf(table);
        if (bar !== null) {
          const border = blockBorder(table);
          const block: DividerBlockData = {
            ...createBlockAppearance(),
            ...border,
            id: createId(),
            type: "divider",
            color: bar.color,
            marginTop: marginUp(table, "marginTop", 8),
            marginBottom: marginUp(table, "marginBottom", 8),
            thickness: bar.thickness,
            borderRadius: bar.borderRadius,
            bg: blockBg(table),
          };
          output.push(block);
          return;
        }
        // Espaciador con relleno (celda con altura + fondo, sin contenido).
        const fill = spacerFillOf(table);
        if (fill !== null) {
          const border = blockBorder(table);
          const block: SpacerBlockData = {
            ...createBlockAppearance(),
            ...border,
            id: createId(),
            type: "spacer",
            height: fill.height,
            bg: blockBg(table),
            color: fill.color,
          };
          output.push(block);
          return;
        }
      }
      if (cells.length === 2) {
        // Encabezado lateral: celda-logo (ancho px = imagen) + celda de texto.
        const side = sideHeaderOf(cells);
        if (side !== null) {
          output.push(headerFromSide(table, side));
          return;
        }
      }
      if (cells.length >= 2 && cells.length <= 3) {
        const columns = cells.map((cell) => {
          const blocks: AnyBlockData[] = [];
          this.parseChildren(cell, blocks);
          if (blocks.length === 0) {
            const fallback = textBlock(cell);
            // El marcador de columna vacía no es contenido real.
            if (fallback !== undefined && fallback.content !== EMPTY_COLUMN_PLACEHOLDER) {
              blocks.push(fallback);
            }
          }
          return { blocks: blocks as readonly AnyBlockData[] };
        });
        if (columns.some((column) => column.blocks.length > 0)) {
          const border = blockBorder(table);
          output.push({
            ...createBlockAppearance(),
            ...border,
            id: createId(),
            type: "columns",
            columns,
            marginTop: marginUp(table, "marginTop", 0),
            marginBottom: marginUp(table, "marginBottom", 0),
            bg: blockBg(table),
            color: blockColor(table),
          });
          return;
        }
      }
    }
    this.parseChildren(table, output);
  }
}

/** Interpreta un documento HTML inerte y lo convierte en bloques sanitizados. */
export function importEmailHtml(html: string): ImportedTemplate {
  const document = new DOMParser().parseFromString(html, "text/html");
  const parser = new HtmlBlockParser();
  parser.parseChildren(document.body);
  const bodyColor = safeColor(document.body.style.backgroundColor || document.body.getAttribute("bgcolor") || "");
  const docTitle = (document.querySelector("title")?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  return {
    blocks: parser.blocks,
    background: bodyColor || DEFAULT_TEMPLATE_BG,
    docTitle: docTitle || "Plantilla importada",
    ignoredElements: parser.ignoredElements,
  };
}
