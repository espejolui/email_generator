import "./TitleBlock.js";
import "./TextBlock.js";
import "./ImageBlock.js";
import "./ListBlock.js";
import "./QuoteBlock.js";
import "./DividerBlock.js";
import "./ButtonBlock.js";
import "./SpacerBlock.js";
import "./HeaderBlock.js";
import "./FooterBlock.js";
import "./CtaBlock.js";
import "./ColumnsBlock.js";
import "./TableBlock.js";
import "./SocialBlock.js";
import "./BannerBlock.js";
import "./ProductBlock.js";
import "./CouponBlock.js";
import "./SignatureBlock.js";
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
      return {
        id,
        type,
        content: "Título de ejemplo",
        level: 1,
        align: "left",
        bg: "",
        color: "",
        marginTop: 0,
        marginBottom: 12,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
      };
    case "text":
      return {
        id,
        type,
        content: "Texto de ejemplo. Edítalo en el lienzo.",
        align: "left",
        bg: "",
        color: "",
        marginTop: 0,
        marginBottom: 0,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
      };
    case "image":
      return { id, type, src: "", alt: "" };
    case "list":
      return { id, type, items: ["Primer punto", "Segundo punto"], ordered: false, align: "left" };
    case "quote":
      return {
        id,
        type,
        content: "Cita de ejemplo.",
        cite: "",
        align: "left",
        bg: "",
        color: "",
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        marginTop: 0,
        marginBottom: 0,
      };
    case "divider":
      return { id, type, color: "", marginTop: 8, marginBottom: 8, thickness: 2, borderRadius: 2 };
    case "button":
      return {
        id,
        type,
        label: "Escríbeme haciendo clic aquí",
        phone: "",
        message: "Hola, quiero más información",
        color: "green",
        align: "center",
        marginTop: 0,
        marginBottom: 0,
      };
    case "spacer":
      return { id, type, height: 16 };
    case "header":
      return { id, type, logoSrc: "", logoAlt: "", tagline: "Tu tagline aquí", align: "center" };
    case "footer":
      return {
        id,
        type,
        address: "Calle 123, Ciudad",
        unsubscribeUrl: "",
        social: { instagram: "", facebook: "", x: "", linkedin: "" },
      };
    case "cta":
      return {
        id,
        type,
        label: "Ver más",
        url: "",
        color: "blue",
        align: "center",
        marginTop: 0,
        marginBottom: 0,
      };
    case "columns":
      return { id, type, columns: [{ blocks: [] }, { blocks: [] }] };
    case "table":
      return {
        id,
        type,
        headers: ["Columna 1", "Columna 2"],
        rows: [["Valor 1", "Valor 2"]],
        headerRow: true,
      };
    case "social":
      return { id, type, social: { instagram: "", facebook: "", x: "", linkedin: "" } };
    case "banner":
      return { id, type, src: "", alt: "", href: "", caption: "▶ Ver video" };
    case "product":
      return {
        id,
        type,
        src: "",
        alt: "",
        name: "Producto",
        price: "$0",
        url: "",
        buttonLabel: "Comprar",
        color: "blue",
      };
    case "coupon":
      return { id, type, code: "DESCUENTO10", description: "En tu próxima compra" };
    case "signature":
      return { id, type, name: "Tu nombre", role: "Tu cargo", photoSrc: "", photoAlt: "" };
  }
}
