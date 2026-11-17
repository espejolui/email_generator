import { Block } from "../core/decorators/Block.js";
import { StyledBlock } from "./StyledBlock.js";
import { Editable } from "../core/decorators/Editable.js";
import { sanitizeAlt, sanitizeImageSrc, sanitizeImageWidth, sanitizeMargin } from "../core/sanitize/sanitize.js";
import type { ImageBlockData } from "./types.js";

@Block({ type: "image", label: "Imagen", icon: "image" })
export class ImageBlock extends StyledBlock {
  #src = "";
  #alt = "";
  #marginTop = 0;
  #marginBottom = 0;
  #width = 504;

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

  @Editable()
  set width(value: string) {
    this.#width = sanitizeImageWidth(value);
  }

  get width(): number {
    return this.#width;
  }

  toData(): ImageBlockData {
    return {
      ...this.appearanceData(),
      id: this.id,
      type: "image",
      src: this.#src,
      alt: this.#alt,
      marginTop: this.#marginTop,
      marginBottom: this.#marginBottom,
      width: this.#width,
    };
  }
}
