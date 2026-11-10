import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import {
  sanitizeAlt,
  sanitizeImageSrc,
  sanitizeImageWidth,
  sanitizeMargin,
} from "../core/sanitize/sanitize.js";
import type { LogoBlockData, TextAlign } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "logo", label: "Logotipo", icon: "stamp" })
export class LogoBlock extends StyledBlock {
  #src = "";
  #alt = "";
  #align: TextAlign = "center";
  #width = 200;
  #marginTop = 0;
  #marginBottom = 0;

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
      ...this.appearanceData(),
      id: this.id,
      type: "logo",
      src: this.#src,
      alt: this.#alt,
      align: this.#align,
      width: this.#width,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
    };
  }
}
