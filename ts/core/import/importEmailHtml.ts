import { createId } from "../../blocks/index.js";
import { createBlockAppearance } from "../../blocks/types.js";
import type {
  AnyBlockData,
  ButtonAlign,
  CtaBlockData,
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
  sanitizeMargin,
  sanitizeText,
} from "../sanitize/sanitize.js";
import { DEFAULT_TEMPLATE_BG } from "../render/exportToEmailHtml.js";

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
  if (text === "") return undefined;
  return {
    ...createBlockAppearance(),
    id: createId(),
    type: "text",
    content: text,
    align: alignOf(element),
    bg: elementColor(element, "backgroundColor"),
    color: elementColor(element, "color"),
    marginTop: marginOf(element, "marginTop", 0),
    marginBottom: marginOf(element, "marginBottom", 0),
    ...formatsOf(element),
    fontSize: fontSizeOf(element),
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
    for (const child of Array.from(parent.children)) this.parseElement(child, output);
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
      output.push({
        ...createBlockAppearance(),
        id: createId(),
        type: "title",
        content,
        level,
        align: alignOf(element),
        bg: elementColor(element, "backgroundColor"),
        color: elementColor(element, "color"),
        marginTop: marginOf(element, "marginTop", 0),
        marginBottom: marginOf(element, "marginBottom", 12),
        ...formatsOf(element),
        fontSize: fontSizeOf(element),
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
        output.push({
          ...createBlockAppearance(),
          id: createId(),
          type: "list",
          items,
          ordered: tag === "OL",
          align: alignOf(element),
        });
      }
      return;
    }
    if (tag === "BLOCKQUOTE") {
      const content = cleanText(textWithout(element, "cite"), 1000);
      if (content === "") return;
      output.push({
        ...createBlockAppearance(),
        id: createId(),
        type: "quote",
        content,
        cite: cleanText(element.querySelector("cite")?.textContent ?? "", 200),
        align: alignOf(element),
        bg: elementColor(element, "backgroundColor"),
        color: elementColor(element, "color"),
        ...formatsOf(element),
        marginTop: marginOf(element, "marginTop", 0),
        marginBottom: marginOf(element, "marginBottom", 0),
        fontSize: fontSizeOf(element),
      });
      return;
    }
    if (tag === "HR") {
      output.push({
        ...createBlockAppearance(),
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
    if (href !== "" || cleanText(caption, 120) !== "") {
      output.push({
        ...createBlockAppearance(),
        id: createId(),
        type: "banner",
        src,
        alt,
        href,
        caption: cleanText(caption, 120),
      });
    } else {
      output.push({ ...createBlockAppearance(), id: createId(), type: "image", src, alt });
    }
  }

  private ctaBlock(anchor: Element): CtaBlockData | undefined {
    const label = cleanText(anchor.textContent ?? "", 80);
    const url = sanitizeHttpsUrl(anchor.getAttribute("href") ?? "");
    if (label === "" || url === "") return undefined;
    const cell = anchor.closest("td");
    const table = anchor.closest("table");
    const cellColor = cell === null ? "" : elementColor(cell, "backgroundColor");
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
      const block: TableBlockData = {
        ...createBlockAppearance(),
        id: createId(),
        type: "table",
        headers,
        rows: dataRows.slice(0, 20).map((row) =>
          directCells(row).slice(0, 6).map((cell) => cleanText(cell.textContent ?? "", 200))),
        headerRow: hasHeaders,
      };
      output.push(block);
      return;
    }

    if (rows.length === 1) {
      const cells = directCells(rows[0] ?? document.createElement("tr"));
      if (cells.length >= 2 && cells.length <= 3) {
        const columns = cells.map((cell) => {
          const blocks: AnyBlockData[] = [];
          this.parseChildren(cell, blocks);
          if (blocks.length === 0) {
            const fallback = textBlock(cell);
            if (fallback !== undefined) blocks.push(fallback);
          }
          return { blocks: blocks as readonly AnyBlockData[] };
        });
        if (columns.some((column) => column.blocks.length > 0)) {
          output.push({ ...createBlockAppearance(), id: createId(), type: "columns", columns });
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
