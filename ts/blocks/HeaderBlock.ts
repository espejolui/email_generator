import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeAlt, sanitizeImageSrc, sanitizeText } from "../core/sanitize/sanitize.js";
import type { HeaderBlockData, HeaderTextPosition, TextAlign } from "./types.js";
import { isHeaderTextPosition, isTextAlign } from "./types.js";

@Block({ type: "header", label: "Encabezado", icon: "panel-top" })
export class HeaderBlock extends StyledBlock {
  #logoSrc = "";
  #logoAlt = "";
  #title = "";
  #tagline = "";
  #align: TextAlign = "center";
  #textPosition: HeaderTextPosition = "bottom";

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
  set title(value: string) {
    this.#title = sanitizeText(value).slice(0, 120);
  }

  get title(): string {
    return this.#title;
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

  @Editable()
  set textPosition(value: string) {
    this.#textPosition = isHeaderTextPosition(value) ? value : "bottom";
  }

  get textPosition(): HeaderTextPosition {
    return this.#textPosition;
  }

  toData(): HeaderBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "header",
      logoSrc: this.#logoSrc,
      logoAlt: this.#logoAlt,
      title: this.#title,
      tagline: this.#tagline,
      align: this.#align,
      textPosition: this.#textPosition,
    };
  }
}
