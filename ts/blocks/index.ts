import "./TitleBlock.js";
import "./TextBlock.js";
import "./ImageBlock.js";
import "./ListBlock.js";
import "./QuoteBlock.js";
import "./DividerBlock.js";
import "./ButtonBlock.js";
import { getRegisteredBlocks } from "../core/decorators/Block.js";
import type { AnyBlockData, BlockType } from "./types.js";

export type { AnyBlockData, BlockType };
export { getRegisteredBlocks };
export { isBlockType } from "./types.js";

let counter = 0;

export function createId(): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `b-${Date.now().toString(36)}-${counter}-${rand}`;
}

/** Fábrica de datos iniciales ya válidos (el sanitizado fino vive en cada clase). */
export function createBlockData(type: BlockType, id: string): AnyBlockData {
  switch (type) {
    case "title":
      return { id, type, content: "Título de ejemplo", level: 2 };
    case "text":
      return { id, type, content: "Texto de ejemplo. Edítalo en el lienzo." };
    case "image":
      return { id, type, src: "", alt: "", caption: "" };
    case "list":
      return { id, type, items: ["Primer punto", "Segundo punto"], ordered: false };
    case "quote":
      return { id, type, content: "Cita de ejemplo.", cite: "" };
    case "divider":
      return { id, type };
    case "button":
      return { id, type, label: "Escríbeme haciendo clic aquí", href: "", color: "green" };
  }
}
