import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import {
  sanitizeAlt,
  sanitizeColor,
  sanitizeImageSrc,
  sanitizeImageWidth,
  sanitizeMargin,
} from "../core/sanitize/sanitize.js";
import type { LogoBlockData, TextAlign } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "logo", label: "Logotipo", icon: "stamp" })
export class LogoBlock {
  readonly id: string;
  #src = "";
  #alt = "";
  #align: TextAlign = "center";
  #width = 200;
  #bg = "";
  #marginTop = 0;
  #marginBottom = 0;

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set src(value: string) {
    this.#src = sanitizeImageSrc(value);
  }

  get src(): string {
    return this.#src;
  }

  @Editable()
  set alt(value: string) {
    this.#alt = sanitizeAlt(value);
  }

  get alt(): string {
    return this.#alt;
  }

  @Editable()
  set align(value: string) {
    this.#align = isTextAlign(value) ? value : "center";
  }

  get align(): TextAlign {
    return this.#align;
  }

  @Editable()
  set width(value: string) {
    this.#width = sanitizeImageWidth(value);
  }

  get width(): number {
    return this.#width;
  }

  @Editable()
  set bg(value: string) {
    this.#bg = sanitizeColor(value);
  }

  get bg(): string {
    return this.#bg;
  }

  @Editable()
  set marginTop(value: string) {
    this.#marginTop = sanitizeMargin(value);
  }

  get marginTop(): number {
    return this.#marginTop;
  }

  @Editable()
  set marginBottom(value: string) {
    this.#marginBottom = sanitizeMargin(value);
  }

  get marginBottom(): number {
    return this.#marginBottom;
  }

  toData(): LogoBlockData {
    return {
      id: this.id,
      type: "logo",
      src: this.#src,
      alt: this.#alt,
      align: this.#align,
      width: this.#width,
      bg: this.#bg,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
    };
  }
}
