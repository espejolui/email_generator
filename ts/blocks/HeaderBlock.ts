import { Block } from "../core/decorators/Block.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeAlt, sanitizeImageSrc, sanitizeText } from "../core/sanitize/sanitize.js";
import type { HeaderBlockData, TextAlign } from "./types.js";
import { isTextAlign } from "./types.js";

@Block({ type: "header", label: "Encabezado", icon: "panel-top" })
export class HeaderBlock {
  readonly id: string;
  #logoSrc = "";
  #logoAlt = "";
  #tagline = "";
  #align: TextAlign = "center";

  constructor(id: string) {
    this.id = id;
  }

  @Editable()
  set logoSrc(value: string) {
    this.#logoSrc = sanitizeImageSrc(value);
  }

  get logoSrc(): string {
    return this.#logoSrc;
  }

  @Editable()
  set logoAlt(value: string) {
    this.#logoAlt = sanitizeAlt(value);
  }

  get logoAlt(): string {
    return this.#logoAlt;
  }

  @Editable()
  set tagline(value: string) {
    this.#tagline = sanitizeText(value).slice(0, 200);
  }

  get tagline(): string {
    return this.#tagline;
  }

  @Editable()
  set align(value: string) {
    this.#align = isTextAlign(value) ? value : "center";
  }

  get align(): TextAlign {
    return this.#align;
  }

  toData(): HeaderBlockData {
    return {
      id: this.id,
      type: "header",
      logoSrc: this.#logoSrc,
      logoAlt: this.#logoAlt,
      tagline: this.#tagline,
      align: this.#align,
    };
  }
}
